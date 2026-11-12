// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import QuestionFormComparison from './QuestionFormComparison';

vi.mock('./GeometryDiagram', () => ({
  default: ({ geometry, ariaLabel }) =>
    geometry?.elements?.length ? (
      <div data-testid="geometry-diagram" aria-label={ariaLabel}>
        {geometry.elements.length} elements
      </div>
    ) : null,
}));

describe('QuestionFormComparison', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { lessons: [] } }),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders geometry diagram when editing a question with geometry and decodes comparison < > labels', () => {
    const questionOne = {
      id: 'q-1',
      question: 'So sánh hai phân số 1/2 &lt; 3/4',
      subject: 'Toán học',
      grade: 'Lớp 4',
      level: 'Dễ',
      type: 'comparison',
      options: ['&lt;', '=', '&gt;'],
      answer: 0,
      explanation: 'Vì 1/2 &lt; 3/4',
      geometry: {
        boundingBox: [-5, 5, 5, -5],
        elements: [
          { type: 'point', id: 'A', coords: [0, 0], label: 'A' },
          { type: 'point', id: 'B', coords: [3, 0], label: 'B' },
          { type: 'segment', points: ['A', 'B'] },
        ],
      },
    };

    const { rerender } = render(
      <QuestionFormComparison initial={questionOne} onSaved={vi.fn()} onCancel={vi.fn()} onError={vi.fn()} />,
    );

    // 1. Shows geometry diagram inside the edit form
    expect(screen.getByTestId('geometry-diagram')).toBeTruthy();

    // 2. Displays unencoded <, =, > labels and decoded option values
    expect(screen.getByLabelText('Đáp án <').value).toBe('<');
    expect(screen.getByLabelText('Đáp án =').value).toBe('=');
    expect(screen.getByLabelText('Đáp án >').value).toBe('>');
    expect(screen.queryByText(/&lt;|&gt;/)).toBeNull();
    expect(screen.getByLabelText('Nội dung câu hỏi').value).toBe('So sánh hai phân số 1/2 < 3/4');

    // 3. Updates form immediately when clicking edit on another question
    const questionTwo = {
      id: 'q-2',
      question: 'Tính chu vi hình chữ nhật ABCD',
      subject: 'Toán học',
      grade: 'Lớp 5',
      level: 'Vừa',
      type: 'multiple-choice',
      options: ['12 cm', '16 cm', '20 cm', '24 cm'],
      answer: 2,
      explanation: 'Chu vi là (6 + 4) x 2 = 20 cm',
      geometry: null,
    };

    rerender(
      <QuestionFormComparison initial={questionTwo} onSaved={vi.fn()} onCancel={vi.fn()} onError={vi.fn()} />,
    );

    expect(screen.getByLabelText('Nội dung câu hỏi').value).toBe('Tính chu vi hình chữ nhật ABCD');
    expect(screen.getByLabelText('Đáp án A').value).toBe('12 cm');
    expect(screen.getByLabelText('Đáp án C').value).toBe('20 cm');
    expect(screen.queryByTestId('geometry-diagram')).toBeNull();
  });
});
