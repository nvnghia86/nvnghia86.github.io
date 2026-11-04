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
  it('starts a prepared game only after the teacher presses Start on the connected phone', async () => {
    const lobby = { ...playing, status: 'lobby', version: 0, currentQuestionData: null };
    const api = vi.fn(async (_path, options) => options?.method === 'POST' ? playing : lobby);
    render(<QuizCardScanner {...props(api)} allowStart />);
    const start = await screen.findByRole('button', { name: 'Bắt đầu', exact: true });
    expect(api.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
    expect(scan.active).toBe(false);
    fireEvent.click(start);
    await screen.findByRole('button', { name: 'Kết thúc câu' });
    expect(api.mock.calls.filter(([, options]) => options?.method === 'POST').map(([path]) => path)).toEqual([`/quiz-sessions/room/scanner/start?token=${'a'.repeat(48)}`]);
    expect(screen.queryByRole('button', { name: 'Bắt đầu', exact: true })).toBeNull();
  });

  it('keeps the legacy scanner lobby under web host control by default', async () => {
    render(<QuizCardScanner {...props(vi.fn(async () => ({ ...playing, status:'lobby', currentQuestionData:null })))} />);
    await screen.findByText('Quiz lớp 4A');
    expect(screen.queryByRole('button', { name: 'Bắt đầu', exact: true })).toBeNull();
  });
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
    await act(async () => { await Promise.resolve(); document.dispatchEvent(new Event('visibilitychange')); });
    await screen.findByRole('heading', { name: 'Trò chơi đã kết thúc' });
    await act(async () => i18n.changeLanguage('en'));
    expect(screen.getByRole('heading', { name: 'The game has ended' })).toBeInTheDocument();
  });

  it('ends a question from the phone, shows the correct answer counts and waits for an explicit next action', async () => {
    const closed = { ...playing, questionStatus: 'closed', version: 6, questionSummary: {questionId:'q1',position:0,correctAnswer:'B',counts:{A:0,B:1,C:0,D:0},answeredCount:1}, players: [{...playing.players[0],answer:'B',score:2,correctCount:2}] };
    const next = {...playing,currentQuestion:1,questionStatus:'open',version:7,questionStartedAt:new Date().toISOString(),currentQuestionData:{...playing.currentQuestionData,id:'q2'}};
    const api=vi.fn(async path=>path.includes('/scanner/close?')?closed:path.includes('/scanner/next?')?next:playing);
    const {container}=render(<QuizCardScanner {...props(api)} />);
    fireEvent.click((await screen.findAllByRole('button',{name:'Mở camera',exact:true}))[0]);
    const end=screen.getByRole('button',{name:'Kết thúc câu'}), advance=screen.getByRole('button',{name:'Chuyển sang câu tiếp theo'});
    expect(end).toBeEnabled();expect(advance).toBeDisabled();expect(scan.active).toBe(true);
    fireEvent.click(end);
    await screen.findByRole('heading',{name:'Kết quả câu 1'});
    expect(api).toHaveBeenCalledWith('/quiz-sessions/room/scanner/close?token='+ 'a'.repeat(48),{method:'POST',body:JSON.stringify({questionId:'q1'})});
    expect(end).toBeDisabled();expect(advance).toBeEnabled();expect(scan.active).toBe(false);
    expect(container.querySelector('.scanner-answer-counts .is-correct')).toHaveTextContent('B1');
    expect(screen.getByTestId('camera')).toBeInTheDocument();
    act(()=>scan.detect({markerId:1,answer:'A'}));expect(scan.send).not.toHaveBeenCalled();
    act(()=>scan.update({...playing,version:99}));expect(end).toBeDisabled();
    fireEvent.click(advance);
    await waitFor(()=>expect(end).toBeEnabled());
    expect(api).toHaveBeenCalledWith('/quiz-sessions/room/scanner/next?token='+ 'a'.repeat(48),{method:'POST',body:JSON.stringify({questionId:'q1'})});
    expect(advance).toBeDisabled();await waitFor(()=>expect(scan.active).toBe(true));expect(container.querySelector('.scanner-answer-counts .is-correct')).toBeNull();
  });

  it('stops accepting scanned answers after the deadline without advancing the question', async () => {
    vi.useFakeTimers();const now=Date.now();
    const api=vi.fn(async()=>({...playing,timeLimitSeconds:1,questionStartedAt:new Date(now).toISOString()}));
    await act(async()=>render(<QuizCardScanner {...props(api)} />));
    fireEvent.click(screen.getAllByRole('button',{name:'Mở camera',exact:true})[0]);
    expect(scan.active).toBe(true);
    await act(async()=>vi.advanceTimersByTimeAsync(1500));
    expect(scan.active).toBe(false);
    act(()=>scan.detect({markerId:1,answer:'A'}));expect(scan.send).not.toHaveBeenCalled();
    expect(api.mock.calls.some(([path])=>path.includes('/next'))).toBe(false);
    expect(screen.getByRole('button',{name:'Chuyển sang câu tiếp theo'})).toBeDisabled();
  });
});
