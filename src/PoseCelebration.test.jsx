import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import i18n from './i18n';
import PoseCelebration from './PoseCelebration';

beforeEach(async () => { await i18n.changeLanguage('vi'); });
afterEach(cleanup);

describe('body-pose correct answer celebration', () => {
  it('renders an accessible message and a bounded fireworks burst', () => {
    const { container } = render(<PoseCelebration burstKey="question-1" />);
    expect(screen.getByRole('status', { name: 'Chính xác! Tuyệt vời!' })).toBeInTheDocument();
    expect(container.querySelectorAll('.pose-fireworks i')).toHaveLength(45);
  });
});
