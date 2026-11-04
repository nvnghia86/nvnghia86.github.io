import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from './i18n';
import { QuizCardScanner } from './QuizCardSession';

const scan = vi.hoisted(() => ({ update: null, detect: null, active: false, connection: 'connected', stopped: vi.fn(), send: vi.fn() }));
vi.mock('./quiz-card-hooks', async original => ({
  ...await original(),
  useQuizSocket: (_api, _id, _role, update) => { scan.update = update; return { connection: scan.connection, sendAnswer: scan.send, error: '' }; },
  useAruco: (_ref, active, detect) => { scan.active = active; scan.detect = detect; return { seen: [], error: '', diagnostics: { frames: 0 } }; },
}));
vi.mock('react-webcam', async () => {
  const React = await import('react');
  return { default: React.forwardRef((_props, ref) => {
    React.useImperativeHandle(ref, () => ({ video: {} }));
    React.useEffect(() => () => scan.stopped(), []);
    return <video data-testid="camera" />;
  }) };
});

const playing = { id: 'room', title: 'Quiz lớp 4A', className: '4A', status: 'playing', currentQuestion: 0, questionCount: 2, version: 5, timeLimitSeconds: 600, questionStartedAt: new Date().toISOString(), currentQuestionData: { id: 'q1', question: 'Question', options: ['A','B','C','D'] }, players: [{ id: 'student', nickname: 'Nguyễn Minh An', markerId: 1, score: 1 }] };
const finished = { ...playing, status: 'finished', version: 0, currentQuestionData: null };
const error = vi.fn();
const props = api => ({ api, API: 'http://localhost/api/v1', sessionId: 'room', scannerToken: 'a'.repeat(48), onError: error });
beforeEach(async () => {
  await i18n.changeLanguage('vi');
  scan.connection = 'connected'; scan.stopped.mockClear(); scan.send.mockReset().mockResolvedValue({ answer: 'A' }); error.mockClear();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('scanner game completion', () => {
  it('unmounts the camera, stops recognition/test mode and shows final results when the host finishes', async () => {
    render(<QuizCardScanner {...props(vi.fn(async () => playing))} />);
    fireEvent.click(await screen.findAllByRole('button', { name: 'Mở camera', exact: true }).then(items => items[0]));
    expect(screen.getByTestId('camera')).toBeInTheDocument(); expect(scan.active).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra máy quét' }));
    act(() => scan.update({ ...finished, currentQuestionData: playing.currentQuestionData }));
    expect(screen.getByRole('heading', { name: 'Trò chơi đã kết thúc' })).toBeInTheDocument();
    expect(screen.queryByTestId('camera')).toBeNull(); expect(scan.stopped).toHaveBeenCalledOnce();
    expect(scan.active).toBe(false);
    expect(screen.queryByRole('button', { name: 'Mở camera', exact: true })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Chuyển sang câu tiếp theo' })).toBeNull();
    expect(screen.queryByText('Chưa trả lời')).toBeNull();
    expect(screen.getByText('Nguyễn Minh An')).toBeInTheDocument();
    act(() => scan.detect({ markerId: 1, answer: 'A' }));
    expect(scan.send).not.toHaveBeenCalled();
  });

  it('ignores late scan acknowledgements and old playing snapshots after finishing', async () => {
    let resolve;
    scan.send.mockImplementation(() => new Promise(done => { resolve = done; }));
    render(<QuizCardScanner {...props(vi.fn(async () => playing))} />);
    fireEvent.click((await screen.findAllByRole('button', { name: 'Mở camera', exact: true }))[0]);
    act(() => scan.detect({ markerId: 1, answer: 'A' }));
    expect(scan.send).toHaveBeenCalledOnce();
    act(() => { scan.update(finished); scan.update({ ...playing, version: 99 }); });
    await act(async () => resolve({ answer: 'A' }));
    expect(screen.getByRole('heading', { name: 'Trò chơi đã kết thúc' })).toBeInTheDocument();
    expect(screen.queryByTestId('camera')).toBeNull(); expect(error).not.toHaveBeenCalled();
  });

  it('shows completion when opening an already finished QR link', async () => {
    render(<QuizCardScanner {...props(vi.fn(async () => finished))} />);
    expect(await screen.findByRole('heading', { name: 'Trò chơi đã kết thúc' })).toBeInTheDocument();
    expect(scan.active).toBe(false); expect(scan.stopped).not.toHaveBeenCalled();
  });

  it('does not let the first HTTP response overwrite a faster finished event', async () => {
    let resolve;
    render(<QuizCardScanner {...props(vi.fn(() => new Promise(done => { resolve = done; })))} />);
    act(() => scan.update(finished));
    await act(async () => resolve(playing));
    expect(screen.getByRole('heading', { name: 'Trò chơi đã kết thúc' })).toBeInTheDocument();
  });

  it('recovers a missed finish event through HTTP while realtime is disconnected', async () => {
    vi.useFakeTimers(); scan.connection = 'disconnected';
    const api = vi.fn().mockResolvedValueOnce(playing).mockResolvedValue(finished);
    await act(async () => render(<QuizCardScanner {...props(api)} />));
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(screen.getByRole('heading', { name: 'Trò chơi đã kết thúc' })).toBeInTheDocument();
    expect(api).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(api).toHaveBeenCalledTimes(2);
  });

  it('refreshes after returning to a visible tab and translates the final state', async () => {
    const api = vi.fn().mockResolvedValueOnce(playing).mockResolvedValue(finished);
    render(<QuizCardScanner {...props(api)} />);
    await screen.findAllByRole('button', { name: 'Mở camera', exact: true });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    await screen.findByRole('heading', { name: 'Trò chơi đã kết thúc' });
    await act(async () => i18n.changeLanguage('en'));
    expect(screen.getByRole('heading', { name: 'The game has ended' })).toBeInTheDocument();
  });
});
