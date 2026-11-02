import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ClassStudentCaller from './ClassStudentCaller';

const game = vi.hoisted(() => ({ props: null }));
vi.mock('./UfoGameStage', async () => {
  const { forwardRef, useImperativeHandle } = await import('react');
  return { default: forwardRef((props, ref) => {
    game.props = props;
    useImperativeHandle(ref, () => ({ skip() { props.onComplete(props.mission?.id); }, reset() {} }));
    return <div data-testid="game" />;
  }) };
});
const students = ['An', 'Bình', 'Chi', 'Dũng'].map((nickname, i) => ({ studentId: `s${i}`, username: `user${i}`, nickname }));
const key = 'quizzz.caller.teacher.class';
const session = () => JSON.parse(sessionStorage.getItem(key));
beforeEach(() => sessionStorage.clear());
afterEach(cleanup);

describe('animated student calling', () => {
  it('only animates the chosen present students and commits each mission exactly once', () => {
    const { container } = render(<ClassStudentCaller students={students} teacherId="teacher" classId="class" onError={vi.fn()} />);
    fireEvent.click(container.querySelectorAll('.caller-presence-list input')[1]);
    fireEvent.change(screen.getByLabelText('Số học sinh cần gọi'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'UFO xuất phát', exact: true }));
    const first = game.props.mission;
    expect(first.winnerIds).toHaveLength(2);
    expect(first.winnerIds).not.toContain('s1');
    expect(session().total).toBe(0);
    act(() => { game.props.onComplete(first.id); game.props.onComplete(first.id); });
    expect(session().total).toBe(1);
    expect(session().called).toEqual(first.winnerIds);
    expect(game.props.capturedStudents.map(student => student.studentId)).toEqual(first.winnerIds);
    fireEvent.click(screen.getByRole('button', { name: 'UFO xuất phát', exact: true }));
    const next = game.props.mission;
    expect(next.winnerIds).toHaveLength(1);
    expect(first.winnerIds).not.toContain(next.winnerIds[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua hoạt cảnh', exact: true }));
    expect(session().total).toBe(2);
    expect(new Set(session().called).size).toBe(3);
    expect(game.props.capturedStudents.map(student => student.studentId)).toEqual(next.winnerIds);
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu vòng mới', exact: true }));
    expect(session().called).toEqual([]);
    expect(session().total).toBe(0);
  });
  it('ignores stale animation callbacks after leaving the class', () => {
    const { unmount } = render(<ClassStudentCaller students={students} teacherId="teacher" classId="class" onError={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'UFO xuất phát', exact: true }));
    const callback = game.props.onComplete, id = game.props.mission.id;
    unmount();
    act(() => callback(id));
    expect(session().total).toBe(0);
  });
});
