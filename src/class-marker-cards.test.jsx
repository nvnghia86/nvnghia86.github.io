import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18n from './i18n';
import ClassMarkerCards from './ClassMarkerCards';

afterEach(cleanup);
beforeEach(async () => { await i18n.changeLanguage('vi'); });

it('generates class cards and paginates the A4 preview', async () => {
  const items = Array.from({ length: 9 }, (_, index) => ({ studentId: `student-${index + 1}`, nickname: `Học sinh ${index + 1}`, markerId: index + 1 }));
  const request = vi.fn(async (_path, options) => ({ classId: 'class-1', className: '4A', studentCount: 9, items: options?.method === 'POST' ? items : [] }));
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  const { container } = render(<ClassMarkerCards classItem={{ id: 'class-1', name: '4A' }} request={request} onError={vi.fn()} onClose={vi.fn()} />);
  expect(await screen.findByText('Chọn “Tạo bộ thẻ” để gán mã cho học sinh trong lớp.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'In A4' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Tạo bộ thẻ' }));
  await waitFor(() => expect(container.querySelectorAll('.class-marker-card')).toHaveLength(9));
  expect(container.querySelectorAll('.class-card-page')).toHaveLength(2);
  expect(container.querySelectorAll('.class-marker-svg svg')).toHaveLength(9);
  fireEvent.change(screen.getByLabelText('Bố cục A4'), { target: { value: '4' } });
  expect(container.querySelectorAll('.class-card-page')).toHaveLength(3);
  fireEvent.change(screen.getByLabelText('Bố cục A4'), { target: { value: '1' } });
  expect(screen.getByRole('option', { name: '1 thẻ / trang' })).toBeInTheDocument();
  expect(container.querySelectorAll('.class-card-page')).toHaveLength(9);
  expect(container.querySelector('.class-card-layout-1')).toBeInTheDocument();
  expect(container.querySelector('.marker-right')).toHaveTextContent('B');
  expect(container.querySelector('.marker-bottom')).toHaveTextContent('C');
  expect(container.querySelector('.marker-left')).toHaveTextContent('D');
  fireEvent.click(screen.getByRole('button', { name: 'In A4' }));
  expect(print).toHaveBeenCalledOnce();
  expect(request).toHaveBeenCalledWith('/classes/class-1/markers', { method: 'POST' });
  print.mockRestore();
});
