import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from './i18n';
import TypingPractice from './TypingPractice';
import { typingLessons } from './typingLessons';

describe('typing practice', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('vi');
  });

  it('completes a lesson, stores the result, and unlocks the next lesson', () => {
    render(<TypingPractice />);

    expect(screen.getByRole('heading', { name: 'Luyện gõ phím' })).toBeInTheDocument();
    expect(typingLessons).toHaveLength(94);
    expect(screen.getAllByRole('button', { name: 'Đang khóa' })[0]).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu' }));
    expect(screen.getByRole('complementary', { name: 'Hướng dẫn tư thế tay' })).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
    typingLessons[0].content.forEach(line => {
      fireEvent.change(screen.getByLabelText('Gõ nội dung bên dưới'), { target: { value: line } });
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('quizzz.typing.progress'))['1']).toMatchObject({ lessonId: 1, accuracy: 100 });

    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }));
    expect(screen.getAllByRole('button', { name: 'Bắt đầu' })[0]).toBeEnabled();
  });

  it('updates course labels and typing controls when switching to English', async () => {
    await i18n.changeLanguage('en');
    render(<TypingPractice />);

    expect(screen.getByRole('heading', { name: 'Typing practice' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByLabelText('Hand posture guide')).toBeInTheDocument();
    expect(screen.getByLabelText('Type the text below')).toBeInTheDocument();
    expect(screen.getByText('Backspace')).toBeInTheDocument();
  });
});
