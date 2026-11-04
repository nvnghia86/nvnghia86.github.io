import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import i18n from './i18n';
import ScannerConnect from './ScannerConnect';
import { ScannerRoster } from './QuizCardSession';

const t = (key, options) => i18n.t(key, options);
beforeEach(async () => { await i18n.changeLanguage('vi'); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('scanner roster for the current question', () => {
  const players = [
    { id: 'a', markerId: 1, nickname: 'An', answer: 'A', answeredCount: 1 },
    { id: 'b', markerId: 2, nickname: 'Bình', answer: null, answeredCount: 8 },
    { id: 'c', markerId: 3, nickname: 'Chi', answer: 'D', answeredCount: 0 },
    { id: 'd', markerId: 4, nickname: 'Dũng', answeredCount: 3 },
  ];
  const names = container => [...container.querySelectorAll('.scanner-roster-list article > strong')].map(item => item.textContent);
  it('puts unscanned students first, preserves order in each group and leaves source data intact', () => {
    const { container, rerender } = render(<ScannerRoster players={players} questionId="q1" t={t} />);
    expect(names(container)).toEqual(['Bình', 'Dũng', 'An', 'Chi']);
    expect(screen.getAllByText('Chưa trả lời')).toHaveLength(2);
    expect(screen.getByText('Đã trả lời · A')).toBeInTheDocument();
    expect(screen.getByText('Đã trả lời · D')).toBeInTheDocument();
    expect(screen.getByText('2 học sinh chưa trả lời câu này')).toBeInTheDocument();
    expect(players.map(player => player.nickname)).toEqual(['An', 'Bình', 'Chi', 'Dũng']);
    const updated = players.map(player => player.id === 'b' ? { ...player, answer: 'C' } : player);
    rerender(<ScannerRoster players={updated} questionId="q1" t={t} />);
    expect(names(container)).toEqual(['Dũng', 'An', 'Bình', 'Chi']);
    expect(screen.getAllByText('Chưa trả lời')).toHaveLength(1);
    expect(screen.getByText('Đã trả lời · C')).toBeInTheDocument();
    expect(screen.getByText('1 học sinh chưa trả lời câu này')).toBeInTheDocument();
    // Historical answer totals must not mark a student as scanned in this question.
    expect(within(container.querySelector('article')).getByText('3 câu đã trả lời')).toBeInTheDocument();
  });
  it('resets ordering and scroll when opening the next question', () => {
    const { container, rerender } = render(<ScannerRoster players={players} questionId="q1" t={t} />);
    const list = container.querySelector('.scanner-roster-list'); list.scrollTop = 200;
    rerender(<ScannerRoster players={players.map(player => ({ ...player, answer: null }))} questionId="q2" t={t} />);
    expect(names(container)).toEqual(['An', 'Bình', 'Chi', 'Dũng']);
    expect(screen.getAllByText('Chưa trả lời')).toHaveLength(4);
    expect(screen.queryByText(/Đã trả lời ·/)).toBeNull();
    expect(list.scrollTop).toBe(0);
    rerender(<ScannerRoster players={[]} questionId="q2" t={t} />);
    expect(names(container)).toEqual([]);
  });
  it('uses translated current-question status and hides it while no question is open', async () => {
    await i18n.changeLanguage('en');
    const { rerender } = render(<ScannerRoster players={players} questionId="q1" t={t} />);
    expect(screen.getAllByText('Not answered')).toHaveLength(2);
    expect(screen.getByText('Answered · A')).toBeInTheDocument();
    expect(screen.getByText('2 unanswered for this question')).toBeInTheDocument();
    rerender(<ScannerRoster players={players} t={t} />);
    expect(screen.queryByText('Not answered')).toBeNull();
    expect(screen.queryByText('Answered · A')).toBeNull();
  });
});

describe('large scanner QR', () => {
  it('opens the same QR link in a closable dialog and retains card/copy actions', async () => {
    const showModal = vi.fn(function () { this.open = true; });
    const close = vi.fn(function () { this.open = false; });
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: showModal });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: close });
    const copy = vi.fn(async () => {}), toggle = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } });
    const url = 'https://quiz.example/#/quiz/session/scan?token=scanner-token';
    const { container } = render(<ScannerConnect scanUrl={url} answered={3} total={35} onToggleCards={toggle} onError={vi.fn()} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'Phóng to mã QR' }));
    expect(showModal).toHaveBeenCalledOnce();
    const dialog = screen.getByRole('dialog', { name: 'Phóng to mã QR' });
    const small = container.querySelector('.card-scanner-connect-qr svg');
    const large = dialog.querySelector('svg[role="img"], .card-scanner-qr-large svg');
    expect(large.getAttribute('viewBox')).toBe(small.getAttribute('viewBox'));
    expect([...large.querySelectorAll('path')].map(p => p.getAttribute('d'))).toEqual([...small.querySelectorAll('path')].map(p => p.getAttribute('d')));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Đóng' }));
    expect(close).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Sao chép link' }));
    expect(copy).toHaveBeenCalledWith(url);
    await screen.findByRole('button', { name: 'Đã sao chép' });
    fireEvent.click(screen.getByRole('button', { name: 'Xem và in thẻ' }));
    expect(toggle).toHaveBeenCalledOnce();
  });
});
