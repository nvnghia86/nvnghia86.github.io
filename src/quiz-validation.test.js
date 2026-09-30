import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const questionSchema = z.object({
  question: z.string().trim().min(1),
  subject: z.string().min(1),
  grade: z.string().min(1),
  level: z.string().min(1),
  options: z.array(z.string().trim().min(1)).length(4),
  answer: z.coerce.number().min(0).max(3),
  lessonId: z.string().min(1),
});

describe('question form validation', () => {
  it('accepts a complete question', () => {
    expect(questionSchema.safeParse({ question: '2 + 2 bằng bao nhiêu?', subject: 'Toán học', grade: 'Lớp 4', level: 'Dễ', options: ['3', '4', '5', '6'], answer: '1', lessonId: 'bai-1' }).success).toBe(true);
  });

  it('rejects empty lesson and answer options', () => {
    expect(questionSchema.safeParse({ question: 'Câu hỏi', subject: 'Toán học', grade: 'Lớp 4', level: 'Dễ', options: ['A', '', 'C', 'D'], answer: 0, lessonId: '' }).success).toBe(false);
  });
});
