import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from './i18n';
import { GameRoomBuilder } from './GameRoomBuilder';
import { PoseArenaStudent, PoseArenaTeacherSetup } from './PoseArenaGame';
import { getQuestionGestures } from './pose-gesture-library';
import poseArenaTranslations from './pose-arena-i18n';

class FakeEventSource { addEventListener() {} close() {} }

beforeEach(async () => { await i18n.changeLanguage('vi'); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('body-pose teacher room', () => {
  it('opens the standalone gesture recognition test from the teacher route query', async () => {
    const { container } = render(<MemoryRouter initialEntries={['/teacher/body-pose?view=test']}><PoseArenaTeacherSetup api={vi.fn()} API="/api/v1" EventSource={FakeEventSource} onError={vi.fn()} /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: 'Kiểm tra nhận diện cử chỉ' })).toBeInTheDocument();
    expect(container.querySelectorAll('.pose-test-gesture-grid > article')).toHaveLength(15);
    expect(screen.getByRole('link', { name: '← Quay lại tạo game' })).toHaveAttribute('href', '#/teacher/body-pose');
  });

  it('creates a body-pose room from realtime quizzes and shows the shared gesture mapping', async () => {
    const room = {
      id: 'room-id', code: 'ABC123', title: 'Đấu trường cử chỉ AR', status: 'playing',
      timeRemaining: 18, players: [], leaderboard: [],
      currentQuestionData: { index: 2, question: 'Kết quả bằng bao nhiêu?', options: ['1', '2', '3', '4'] },
    };
    const api = vi.fn(async (path, request) => {
      if (path === '/quiz-sets?gameType=realtime') return { items: [{ id: 'quiz', title: 'Quiz bốn đáp án', questionCount: 4 }] };
      if (path === '/questions') return { items: [] };
      if (path === '/classes') return { items: [] };
      if (path === '/rooms' && request?.method === 'POST') return { room };
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<MemoryRouter><GameRoomBuilder api={api} API="/api/v1" EventSource={FakeEventSource} onError={vi.fn()} mode="body-pose" /></MemoryRouter>);
    const quiz = await screen.findByRole('combobox', { name: /Bộ quiz cử chỉ/ });
    expect(screen.queryByRole('combobox', { name: /Lớp tham gia/ })).not.toBeInTheDocument();
    fireEvent.change(quiz, { target: { value: 'quiz' } });
    fireEvent.click(screen.getByRole('button', { name: /Tạo phòng và vào màn điều khiển/ }));
    const map = await screen.findByLabelText('Ánh xạ đáp án và cử chỉ của câu hỏi');
    expect(screen.getByRole('group', { name: 'Âm thanh trò chơi' })).toBeInTheDocument();
    expect(screen.getByLabelText('Chọn nhạc từ máy').getAttribute('accept')).toContain('audio/mpeg');
    const gestures = getQuestionGestures(room.code, room.currentQuestionData.index, 4);
    expect(within(map).getAllByText(/^[A-D]$/).map(node => node.textContent)).toEqual(['A', 'B', 'C', 'D']);
    gestures.forEach(item => expect(map).toHaveTextContent(poseArenaTranslations.vi.gestures[item.key].cue));
    const createCall = api.mock.calls.find(([path, request]) => path === '/rooms' && request?.method === 'POST');
    const payload = JSON.parse(createCall[1].body);
    expect(payload).toMatchObject({ gameMode: 'body-pose', quizId: 'quiz' });
    expect(payload).not.toHaveProperty('classId');
    expect(api).not.toHaveBeenCalledWith('/classes');
    await waitFor(() => expect(api).toHaveBeenCalledWith('/quiz-sets?gameType=realtime'));
  });

  it('clears stale fullscreen state before creating another room', async () => {
    let fullscreenElement = null;
    const fullscreenDescriptor = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
    const requestDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'requestFullscreen');
    const exitDescriptor = Object.getOwnPropertyDescriptor(document, 'exitFullscreen');
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreenElement });
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: async function requestFullscreen() { fullscreenElement = this; document.dispatchEvent(new Event('fullscreenchange')); } });
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: async () => { fullscreenElement = null; document.dispatchEvent(new Event('fullscreenchange')); } });
    try {
      let roomNumber = 0;
      const api = vi.fn(async (path, request) => {
        if (path === '/quiz-sets?gameType=realtime') return { items: [{ id: 'quiz', title: 'Quiz', questionCount: 4 }] };
        if (path === '/questions') return { items: [] };
        if (path === '/rooms' && request?.method === 'POST') {
          roomNumber += 1;
          return { room: { id: `room-${roomNumber}`, code: `ROOM0${roomNumber}`, title: 'Game', status: 'playing', questionCount: 4, timeRemaining: 20, players: [], currentQuestionData: { index: 0, question: '2 + 2 = ?', options: ['2', '3', '4', '5'] } } };
        }
        throw new Error(`Unexpected request: ${path}`);
      });
      const { container } = render(<MemoryRouter><GameRoomBuilder api={api} API="/api/v1" EventSource={FakeEventSource} onError={vi.fn()} mode="body-pose" /></MemoryRouter>);
      fireEvent.change(await screen.findByRole('combobox', { name: /Bộ quiz cử chỉ/ }), { target: { value: 'quiz' } });
      fireEvent.click(screen.getByRole('button', { name: /Tạo phòng và vào màn điều khiển/ }));
      fireEvent.click(await screen.findByRole('button', { name: '⛶ Toàn màn hình' }));
      await waitFor(() => expect(container.querySelector('.pose-arena-page')).toHaveClass('is-fullscreen'));

      // Reproduce a browser that clears fullscreen while the event is missed.
      fullscreenElement = null;
      fireEvent.click(screen.getByRole('button', { name: 'Kết thúc' }));
      await screen.findByRole('heading', { name: 'Tạo game nhận diện cử chỉ' });
      fireEvent.click(screen.getByRole('button', { name: /Tạo phòng và vào màn điều khiển/ }));
      await screen.findByText('2 + 2 = ?');
      await waitFor(() => expect(container.querySelector('.pose-arena-page')).not.toHaveClass('is-fullscreen'));
    } finally {
      if (fullscreenDescriptor) Object.defineProperty(document, 'fullscreenElement', fullscreenDescriptor); else delete document.fullscreenElement;
      if (requestDescriptor) Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', requestDescriptor); else delete HTMLElement.prototype.requestFullscreen;
      if (exitDescriptor) Object.defineProperty(document, 'exitFullscreen', exitDescriptor); else delete document.exitFullscreen;
    }
  });
});

describe('body-pose student result', () => {
  it('shows correct answers over total questions when the game is finished', async () => {
    const player = { id: 'player-1', nickname: 'Minh', playerToken: 'token' };
    const api = vi.fn(async path => {
      if (path === '/rooms/ABC123/players') return {
        player,
        room: {
          id: 'room-id', code: 'ABC123', title: 'Đấu trường cử chỉ AR', status: 'finished',
          summary: { questionCount: 5 },
          players: [{ ...player, score: 320, correctCount: 3, answeredCount: 5 }],
        },
      };
      throw new Error(`Unexpected request: ${path}`);
    });
    render(<MemoryRouter><PoseArenaStudent api={api} API="/api/v1" EventSource={FakeEventSource} onError={vi.fn()} student={null} /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Mã phòng'), { target: { value: 'ABC123' } });
    fireEvent.change(screen.getByLabelText('Tên hiển thị'), { target: { value: 'Minh' } });
    fireEvent.click(screen.getByRole('button', { name: /Vào đấu trường/ }));
    const summary = await screen.findByLabelText('Hoàn thành thử thách!');
    expect(summary).toHaveTextContent('3/ 5');
    expect(summary).toHaveTextContent('60%');
  });
});
