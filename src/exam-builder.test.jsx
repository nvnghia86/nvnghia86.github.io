import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from './i18n';
import ExamBuilder from './ExamBuilder';

afterEach(cleanup);
beforeEach(async () => { await i18n.changeLanguage('vi'); });

it('switches the exam matrix and source lessons to Vietnamese', async () => {
  const api = vi.fn(async path => ({ lessons: path.includes('Ti%E1%BA%BFng%20Vi%E1%BB%87t') ? [{ id: 'bai-1', title: 'Bài 1: Thanh âm trong trẻo' }] : [] }));
  render(<ExamBuilder api={api} apiBase="/api" onError={vi.fn()} />);
  expect(screen.getAllByText('Số và phép tính')).toHaveLength(2);
  fireEvent.change(screen.getByLabelText('Môn học'), { target: { value: 'Tiếng Việt' } });
  expect(await screen.findAllByText('Đọc hiểu văn bản')).toHaveLength(2);
  expect(screen.getByLabelText('Bài học định hướng đoạn đọc')).toBeInTheDocument();
  expect(screen.getByLabelText('Bài học định hướng tập làm văn')).toBeInTheDocument();
  expect(screen.getByText(/Đọc hiểu 7 điểm/)).toBeInTheDocument();
  expect(screen.queryAllByText('Số và phép tính')).toHaveLength(0);
});
