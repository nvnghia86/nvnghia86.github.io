import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import UfoGameStage from './UfoGameStage';
import './class-workspace-i18n';

const qualityCalls = vi.hoisted(() => ({ setQuality: vi.fn() }));
vi.mock('./ufo-scene', () => ({ createUfoScene: () => ({ setStudents() {}, setReducedMotion() {}, setQuality: qualityCalls.setQuality, cancel() {}, dispose() {}, start() {} }) }));
const students = [{ studentId: 'a', nickname: 'Nguyễn Hoàng Phương Anh Minh Châu', username: 'anh' }, { studentId: 'b', nickname: 'Trần Gia Bảo', username: 'bao' }];
const props = { students, mission: null, reducedMotion: true, progress: {}, onProgress: vi.fn(), onComplete: vi.fn() };
afterEach(() => { cleanup(); vi.restoreAllMocks(); Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null }); });

describe('UFO game presentation', () => {
  it('changes the rendering budget without clearing captured students', async () => {
    render(<UfoGameStage {...props} capturedStudents={students} />);
    await waitFor(() => expect(qualityCalls.setQuality).toHaveBeenLastCalledWith('auto'));
    fireEvent.change(screen.getByLabelText('Chất lượng hình ảnh'), { target: { value: 'smooth' } });
    await waitFor(() => expect(qualityCalls.setQuality).toHaveBeenLastCalledWith('smooth'));
    expect(screen.getByRole('region', { name: '2 học sinh bị bắt' })).toHaveTextContent(students[0].nickname);
  });
  it('uses names instead of numbered badges and shows captured names in the game', () => {
    const { container, rerender } = render(<UfoGameStage {...props} capturedStudents={students} onDismissResults={vi.fn()} />);
    expect([...container.querySelectorAll('.ufo-game-roster-accessible li')].map(label => label.textContent)).toEqual(students.map(student => student.nickname));
    expect(container.querySelector('.ufo-actor-label')).toBeNull();
    const panel = screen.getByRole('region', { name: '2 học sinh bị bắt' });
    expect(container.querySelector('.ufo-game').contains(panel)).toBe(true);
    expect(panel.textContent).toContain(students[0].nickname);
    expect(panel.textContent).toContain(students[1].nickname);
    const show = vi.fn();
    rerender(<UfoGameStage {...props} capturedStudents={students} showResults={false} onShowResults={show} />);
    fireEvent.click(screen.getByRole('button', { name: '2 học sinh bị bắt' }));
    expect(show).toHaveBeenCalledOnce();
  });
  it('requests fullscreen on the arena and puts game controls inside it', async () => {
    const onFullscreenChange = vi.fn();
    const { container } = render(<UfoGameStage {...props} onFullscreenChange={onFullscreenChange} controls={<button>Game control</button>} />);
    const arena = container.querySelector('.ufo-game');
    const request = vi.fn(async () => {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: arena });
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    arena.requestFullscreen = request;
    const exit = vi.fn(async () => {
      Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null });
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    document.exitFullscreen = exit;
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Toàn màn hình', exact: true })));
    expect(request).toHaveBeenCalledOnce();
    expect(document.fullscreenElement).toBe(arena);
    expect(onFullscreenChange).toHaveBeenCalledWith(true);
    expect(arena.contains(screen.getByRole('button', { name: 'Game control' }))).toBe(true);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Thoát toàn màn hình', exact: true })));
    await waitFor(() => expect(exit).toHaveBeenCalledOnce());
    expect(onFullscreenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('button', { name: 'Game control' })).toBeNull();
  });
});
