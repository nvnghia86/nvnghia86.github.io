import { describe, expect, it } from 'vitest';
import { createUfoMission, missionFrame } from './ufo-mission';

describe('UFO abduction timeline', () => {
  it('captures each chosen student once and never introduces another student', () => {
    const winners = Array.from({ length: 40 }, (_, i) => `student${i}`);
    const plan = createUfoMission([...winners, winners[0]]);
    expect(plan.batches.flat()).toEqual(winners);
    const captured = new Set();
    for (let i = 0; i < plan.batches.length; i++) {
      const frame = missionFrame(plan, plan.approach + (i + 0.5) * plan.wave);
      expect(frame.phase).toBe('capture');
      expect(frame.captured).toEqual([...captured]);
      frame.targets.forEach(id => { expect(captured.has(id)).toBe(false); captured.add(id); });
    }
    expect([...captured]).toEqual(winners);
    expect(missionFrame(plan, plan.duration + 1)).toMatchObject({ phase: 'complete', captured: winners });
  });
  it('runs approach, lift and departure in order, with a shorter accessible version of the same result', () => {
    const ids = ['a', 'b', 'c'];
    const normal = createUfoMission(ids), reduced = createUfoMission(ids, true);
    expect(missionFrame(normal, 0).phase).toBe('approach');
    expect(missionFrame(normal, normal.approach + 0.1).targets).toEqual(['a']);
    expect(missionFrame(normal, normal.duration - normal.departure / 2).phase).toBe('departure');
    expect(reduced.duration).toBeLessThan(normal.duration / 4);
    expect(missionFrame(reduced, reduced.duration + 0.01).captured).toEqual(ids);
  });
});
