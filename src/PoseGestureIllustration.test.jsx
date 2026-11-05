import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import PoseGestureIllustration, { gestureSamplePath } from './PoseGestureIllustration';
import { GESTURE_LIBRARY } from './pose-gesture-library';

afterEach(cleanup);

describe('body-pose gesture samples', () => {
  it('maps every playable gesture to an image in the public AR game folder', () => {
    GESTURE_LIBRARY.forEach(({ key }) => {
      expect(gestureSamplePath(key)).toMatch(/^\/ar-game\/.+\.png$/);
    });
  });

  it('mirrors the shared samples for the missing opposite-side poses', () => {
    const { container, rerender } = render(<PoseGestureIllustration gestureKey="right-hip" />);
    let image = container.querySelector('img');
    expect(image).toHaveAttribute('src', '/ar-game/Left-Hand-On-Hip.png');
    expect(image).toHaveClass('is-mirrored');

    rerender(<PoseGestureIllustration gestureKey="left-hip" />);
    image = container.querySelector('img');
    expect(image).toHaveAttribute('src', '/ar-game/Left-Hand-On-Hip.png');
    expect(image).not.toHaveClass('is-mirrored');
  });
});
