import { describe, expect, it } from 'vitest';
import { renderScale, createQualityMonitor } from './ufo-render-quality';

describe('UFO rendering budget', () => {
  it('bounds fullscreen GPU pixel work while preserving full CSS size and readable HTML names', () => {
    for (const [width, height] of [[1440, 900], [3840, 2160], [390, 900]]) {
      const scale = renderScale(width, height);
      expect(width * height / scale ** 2).toBeLessThanOrEqual(900001);
      expect(scale).toBeGreaterThanOrEqual(1);
      expect(renderScale(width, height, 'smooth')).toBeGreaterThanOrEqual(scale);
    }
  });
  it('lowers automatic resolution only after sustained slow rendering and can reset for a manual choice', () => {
    const monitor = createQualityMonitor();
    for (let i = 0; i < 18; i++) expect(monitor.sample(65, 0.065)).toBeNull();
    let pressure = null;
    for (let i = 0; i < 30; i++) pressure = monitor.sample(65, 0.065) || pressure;
    expect(pressure).toBeGreaterThan(1);
    expect(renderScale(1440, 900, 'auto', pressure)).toBeGreaterThan(renderScale(1440, 900));
    monitor.reset();
    for (let i = 0; i < 100; i++) expect(monitor.sample(33, 0.033)).toBeNull();
  });
});
