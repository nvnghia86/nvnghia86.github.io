import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from './i18n';
import { GameRoomBuilder } from './GameRoomBuilder';

const options = ['A', 'B', 'C', 'D'];
const questions = [
  { id: 'math4', question: 'Toán lớp bốn', grade: 'Lớp 4', subject: 'Toán học', type: 'multiple-choice', options, lessonId: 'bai-1', lessonTitle: 'Tên bài cũ' },
  { id: 'math5', question: 'Toán lớp năm', grade: 'Lớp 5', subject: 'Toán học', type: 'multiple-choice', options, lessonId: 'bai-1' },
  { id: 'essay', question: 'Bài toán tự luận', grade: 'Lớp 4', subject: 'Toán học', type: 'essay', options: [], lessonId: 'bai-2' },
  { id: 'vi4', question: 'Đọc hiểu tiếng Việt', grade: 'Lớp 4', subject: 'Tiếng Việt', type: 'multiple-choice', options, lessonId: 'bai-1' },
  { id: 'unmapped', question: 'Quan sát cây xanh', grade: 'Lớp 4', subject: 'Khoa học', type: 'multiple-choice', options },
  { id: 'two-options', question: 'Câu có hai lựa chọn', grade: 'Lớp 4', subject: 'Toán học', type: 'multiple-choice', options: ['A', 'B'] },
];
const catalog = path => {
  const params = new URL(path, 'https://quiz.example').searchParams;
  return { lessons: [{ id: 'bai-1', title: `${params.get('subject')} ${params.get('grade')} — Bài một` }, { id: 'bai-2', title: 'Bài hai trong mục lục' }, { id: 'unused', title: 'Bài chưa gắn câu hỏi' }] };
};
function fixture({ mode = 'card-scan', curriculum } = {}) {
  const api = vi.fn(async (path, request) => {
    if (path.startsWith('/quiz-sets')) return { items: [] };
    if (path === '/questions') return { items: questions };
    if (path === '/classes') return { items: [{ id: 'class4', name: '4A', studentCount: 33 }] };
    if (path.startsWith('/curriculum?')) return curriculum ? curriculum(path) : catalog(path);
    if (request?.method === 'POST') return { room: { id: 'created-room' } };
    throw new Error(`Unexpected request: ${path}`);
  });
  const onError = vi.fn();
  const view = render(<MemoryRouter><GameRoomBuilder api={api} onError={onError} mode={mode} /></MemoryRouter>);
  return { ...view, api, onError };
}
async function openPicker() {
  const opener = screen.getByRole('button', { name: /Chọn câu hỏi trực tiếp/ });
  opener.focus(); fireEvent.click(opener);
  const dialog = screen.getByRole('dialog', { name: 'Chọn câu hỏi cho game' });
  await within(dialog).findByText('Toán lớp bốn');
  return { dialog, opener };
}
const filter = (dialog, name, value) => fireEvent.change(within(dialog).getByRole('combobox', { name }), { target: { value } });
const checkbox = (dialog, name) => within(dialog).getByRole('checkbox', { name: new RegExp(name) });
async function openLessons(dialog) {
  fireEvent.click(within(dialog).getByRole('button', { name: /^Bài học trong mục lục/ }));
  return within(dialog).getByRole('group', { name: 'Bài học trong mục lục' });
}
function closeLessons(dialog) { fireEvent.click(within(dialog).getByRole('button', { name: 'Xong', exact: true })); }

beforeEach(async () => { await i18n.changeLanguage('vi'); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.location.hash = ''; });

describe('game question picker', () => {
  it('combines grade, subject, type and scoped curriculum lessons, retaining hidden selections in the submitted room', async () => {
    const { api, onError, container } = fixture();
    let { dialog } = await openPicker();
    let lessonOptions = await openLessons(dialog);
    await within(lessonOptions).findByRole('checkbox', { name: 'Toán học 4 — Bài một · Lớp 4 · Toán học' });
    expect(within(lessonOptions).queryByRole('checkbox', { name: /Bài chưa gắn/ })).toBeNull();
    closeLessons(dialog);
    fireEvent.click(checkbox(dialog, 'Toán lớp bốn'));
    filter(dialog, 'Lọc theo khối lớp', '5');
    expect(within(dialog).queryByText('Toán lớp bốn')).toBeNull();
    expect(within(dialog).getByText(/1 câu đã chọn nằm ngoài bộ lọc/)).toBeInTheDocument();
    fireEvent.click(checkbox(dialog, 'Toán lớp năm'));
    filter(dialog, 'Lọc theo khối lớp', '4');
    filter(dialog, 'Lọc theo môn học', 'Toán học');
    filter(dialog, 'Loại câu hỏi', 'multiple-choice');
    lessonOptions = await openLessons(dialog);
    fireEvent.click(await within(lessonOptions).findByRole('checkbox', { name: 'Toán học 4 — Bài một' }));
    closeLessons(dialog);
    expect(within(dialog).getAllByRole('checkbox')).toHaveLength(1);
    expect(checkbox(dialog, 'Toán lớp bốn')).toBeChecked();
    expect(within(dialog).getByText('Đã chọn 2 câu')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(checkbox(dialog, 'Toán lớp bốn')).toBeChecked();
    expect(checkbox(dialog, 'Toán lớp năm')).toBeChecked();
    fireEvent.click(dialog.parentElement);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container.querySelectorAll('.selected-question-preview span')).toHaveLength(2);
    ({ dialog } = await openPicker());
    expect(checkbox(dialog, 'Toán lớp bốn')).toBeChecked();
    expect(checkbox(dialog, 'Toán lớp năm')).toBeChecked();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xong · 2 câu' }));
    fireEvent.change(screen.getByRole('combobox', { name: /^Lớp tham gia/ }), { target: { value: 'class4' } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(api).toHaveBeenCalledWith('/rooms?source=questions', expect.objectContaining({ method: 'POST' })));
    const payload = JSON.parse(api.mock.calls.find(([path]) => path.startsWith('/rooms'))[1].body);
    expect(payload.questionIds).toEqual(['math4', 'math5']);
    expect(payload.classId).toBe('class4');
    expect(onError).not.toHaveBeenCalled();
  });

  it('keeps separate lesson options for matching IDs across grades and subjects', async () => {
    fixture(); const { dialog } = await openPicker();
    const lesson = within(dialog).getByRole('button', { name: /^Bài học trong mục lục/ });
    const lessonOptions = await openLessons(dialog);
    fireEvent.click(await within(lessonOptions).findByRole('checkbox', { name: 'Tiếng Việt 4 — Bài một · Lớp 4 · Tiếng Việt' }));
    closeLessons(dialog);
    expect(within(dialog).getAllByRole('checkbox')).toHaveLength(1);
    expect(checkbox(dialog, 'Đọc hiểu tiếng Việt')).toBeInTheDocument();
    filter(dialog, 'Lọc theo môn học', 'Khoa học');
    expect(lesson).toBeDisabled();
    expect(lesson).toHaveTextContent('Chưa có câu hỏi gắn với bài học');
    expect(checkbox(dialog, 'Quan sát cây xanh')).toBeInTheDocument();
  });

  it('shows essays and invalid card questions without allowing them into a card-scan room', async () => {
    fixture(); const { dialog } = await openPicker();
    expect(checkbox(dialog, 'Câu có hai lựa chọn')).toBeDisabled();
    filter(dialog, 'Loại câu hỏi', 'essay');
    expect(within(dialog).getAllByRole('checkbox')).toHaveLength(1);
    expect(checkbox(dialog, 'Bài toán tự luận')).toBeDisabled();
    expect(within(dialog).getByText(/Không dùng được cho quét thẻ/)).toBeInTheDocument();
  });

  it('closes only on the backdrop, close action or Escape, traps focus and restores the opener', async () => {
    fixture(); const { dialog, opener } = await openPicker();
    const close = within(dialog).getByRole('button', { name: 'Đóng' });
    const done = within(dialog).getByRole('button', { name: 'Xong · 0 câu' });
    expect(close).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true }); expect(done).toHaveFocus();
    fireEvent.keyDown(done, { key: 'Tab' }); expect(close).toHaveFocus();
    fireEvent.click(within(dialog).getByText('Chọn câu hỏi cho game'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });

  it('retains selections when the catalog fails, and can retry and switch locale without reopening', async () => {
    let fail = true;
    fixture({ curriculum: path => { if (fail) throw new Error('Unavailable'); return catalog(path); } });
    const { dialog } = await openPicker();
    fireEvent.click(checkbox(dialog, 'Toán lớp bốn'));
    await within(dialog).findByText(/Chưa tải được mục lục/);
    let lessonOptions = await openLessons(dialog);
    expect(within(lessonOptions).getByRole('checkbox', { name: /Tên bài cũ/ })).toBeInTheDocument();
    closeLessons(dialog);
    fail = false;
    fireEvent.click(within(dialog).getByRole('button', { name: 'Thử lại' }));
    lessonOptions = await openLessons(dialog);
    await within(lessonOptions).findByRole('checkbox', { name: /Toán học 4 — Bài một/ });
    closeLessons(dialog);
    expect(checkbox(dialog, 'Toán lớp bốn')).toBeChecked();
    await act(async () => { await i18n.changeLanguage('en'); });
    expect(screen.getByRole('dialog', { name: 'Choose game questions' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'Filter by grade' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Done · 1 question' })).toBeInTheDocument();
  });

  it('allows essay selection in the shared realtime picker', async () => {
    fixture({ mode: 'realtime' }); const { dialog } = await openPicker();
    filter(dialog, 'Loại câu hỏi', 'essay');
    const essay = checkbox(dialog, 'Bài toán tự luận');
    expect(essay).toBeEnabled(); fireEvent.click(essay); expect(essay).toBeChecked();
    filter(dialog, 'Lọc theo khối lớp', '5');
    expect(within(dialog).getByText('Không có câu hỏi phù hợp với bộ lọc.')).toBeInTheDocument();
    expect(within(dialog).getByText('Đã chọn 1 câu')).toBeInTheDocument();
  });

  it('combines multiple lessons with OR, keeps hidden question selections and preserves selected lessons during search', async () => {
    fixture(); const { dialog } = await openPicker();
    let group = await openLessons(dialog);
    fireEvent.click(await within(group).findByRole('checkbox', { name: 'Toán học 4 — Bài một · Lớp 4 · Toán học' }));
    fireEvent.click(within(group).getByRole('checkbox', { name: 'Toán học 5 — Bài một · Lớp 5 · Toán học' }));
    closeLessons(dialog);
    expect(within(dialog).getByRole('button', { name: 'Bài học trong mục lục Đã chọn 2 bài học' })).toBeInTheDocument();
    expect(within(dialog).getAllByRole('checkbox')).toHaveLength(2);
    expect(within(dialog).queryByText('Đọc hiểu tiếng Việt')).toBeNull();
    fireEvent.click(checkbox(dialog, 'Toán lớp bốn'));
    group = await openLessons(dialog);
    const search = within(dialog).getByRole('searchbox', { name: 'Tìm bài học' });
    fireEvent.change(search, { target: { value: 'Tiếng Việt' } });
    expect(within(group).getAllByRole('checkbox')).toHaveLength(1);
    fireEvent.click(within(group).getByRole('checkbox', { name: /Tiếng Việt 4/ }));
    fireEvent.change(search, { target: { value: '' } });
    expect(within(group).getAllByRole('checkbox').filter(item => item.checked)).toHaveLength(3);
    fireEvent.click(within(group).getByRole('checkbox', { name: 'Toán học 4 — Bài một · Lớp 4 · Toán học' }));
    fireEvent.keyDown(search, { key: 'Escape' });
    expect(within(dialog).queryByRole('group')).toBeNull();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(within(dialog).queryByText('Toán lớp bốn')).toBeNull();
    expect(within(dialog).getByText(/1 câu đã chọn nằm ngoài bộ lọc/)).toBeInTheDocument();
    group = await openLessons(dialog);
    fireEvent.pointerDown(within(dialog).getByRole('heading'));
    expect(within(dialog).queryByRole('group')).toBeNull();
    group = await openLessons(dialog);
    expect(within(group).getAllByRole('checkbox').filter(item => item.checked)).toHaveLength(2);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Bỏ lọc bài học' }));
    closeLessons(dialog);
    expect(checkbox(dialog, 'Toán lớp bốn')).toBeChecked();
    expect(within(dialog).getByRole('button', { name: 'Xóa bộ lọc' })).toBeDisabled();
  });

  it('selects and deselects by clicking lesson text or row space without closing during the native label focus transfer', async () => {
    fixture(); const { dialog } = await openPicker();
    const group = await openLessons(dialog);
    const option = await within(group).findByRole('checkbox', { name: 'Toán học 4 — Bài một · Lớp 4 · Toán học' });
    const row = option.closest('label'), text = row.querySelector('span');
    const search = within(dialog).getByRole('searchbox', { name: 'Tìm bài học' });
    // A non-focusable label loses search focus before the browser forwards its click to the checkbox.
    fireEvent.blur(search, { relatedTarget: null });
    fireEvent.click(text);
    expect(option).toBeChecked();
    expect(group).toBeInTheDocument();
    fireEvent.click(text);
    expect(option).not.toBeChecked();
    expect(group).toBeInTheDocument();
    fireEvent.click(row);
    expect(option).toBeChecked();
    fireEvent.click(option);
    expect(option).not.toBeChecked();
    fireEvent.blur(search, { relatedTarget: within(dialog).getByRole('button', { name: 'Đóng', exact: true }) });
    expect(within(dialog).queryByRole('group')).toBeNull();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
