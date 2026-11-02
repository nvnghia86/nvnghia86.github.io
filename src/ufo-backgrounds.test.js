import { describe, expect, it } from 'vitest';
import { nextUfoBackground, backgroundUrl, UFO_BACKGROUNDS } from './ufo-backgrounds';

describe('UFO random backgrounds', () => {
  it('never repeats the previous theme, including random boundaries', () => {
    for (const previous of ['', ...UFO_BACKGROUNDS]) for (const sample of [0, .2, .5, .999999]) {
      const next = nextUfoBackground(previous, () => sample);
      expect(UFO_BACKGROUNDS).toContain(next);
      expect(next).not.toBe(previous);
    }
  });
  it('supports project base paths and keeps unknown theme values inside the asset whitelist', () => {
    expect(backgroundUrl('forest', '/quiz/')).toBe('/quiz/ufo/background-forest.webp');
    expect(backgroundUrl('../bad', '/')).toBe('/ufo/background-sunset.webp');
  });
});
