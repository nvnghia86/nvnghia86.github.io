import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from './i18n';
import PoseArenaSummary from './PoseArenaSummary';

beforeEach(async () => { await i18n.changeLanguage('vi'); });
afterEach(cleanup);

describe('body-pose final summary', () => {
  it('shows correct answers over the total question count and player details', () => {
    render(<PoseArenaSummary correctCount={7} questionCount={10} score={720} players={[{ id: '1', nickname: 'Minh', correctCount: 7 }]} />);
    expect(screen.getByLabelText('Hoàn thành thử thách!')).toHaveTextContent('7/ 10');
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('7/10 câu đúng')).toBeInTheDocument();
  });
});
