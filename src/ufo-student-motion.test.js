import { describe, expect, it } from 'vitest';
import { createStudentMotion, stepStudentMotion, UFO_REFUGES, wakeStudentForCapture, resizeStudentMotion } from './ufo-student-motion';
import { UFO_YARD } from './ufo-render-quality';

describe('student movement in the UFO schoolyard', () => {
  it('leaves every boundary and keeps visiting new places instead of shaking at an edge', () => {
    for (const boundX of [4.928, 9.2]) {
      const students = Array.from({ length: 12 }, (_, i) => {
        const motion = createStudentMotion(i, { x: (i % 2 ? -1 : 1) * (boundX - 0.3), z: i % 3 ? UFO_YARD.back : UFO_YARD.front });
        motion.heading = i % 2 ? Math.PI : 0;
        return motion;
      });
      const visits = students.map(() => new Set()), travel = students.map(() => 0);
      for (let frame = 0; frame < 60 * 90; frame++) for (const [i, motion] of students.entries()) {
        const beforeX = motion.x, beforeZ = motion.z;
        stepStudentMotion(motion, 1 / 60, { boundX, panic: false, ufo: { x: 0, z: 0 }, neighbours: students });
        if (motion.x < -boundX + 0.3 || motion.x > boundX - 0.3 || motion.z < UFO_YARD.front || motion.z > UFO_YARD.back) throw new Error(`Student ${i} left the yard at frame ${frame}`);
        travel[i] += Math.hypot(motion.x - beforeX, motion.z - beforeZ);
        visits[i].add(`${Math.round(motion.x)},${Math.round(motion.z)}`);
      }
      travel.forEach(length => expect(length).toBeGreaterThan(45));
      visits.forEach(cells => expect(cells.size).toBeGreaterThan(18));
    }
  });
  it('reaches trees and the classroom, hides briefly, then leaves again during a long chase', () => {
    for (const boundX of [4.928, 9.2]) {
    const students = Array.from({ length: 36 }, (_, i) => createStudentMotion(i, { x: Math.cos(i * 2.4) * 4, z: Math.sin(i * 2.4) * 3 }));
    const seen = new Set(), hold = students.map(() => 0), context = { boundX, panic: true, ufo: { x: 0, z: 0 }, neighbours: students };
    for (let frame = 0; frame < 30 * 60; frame++) for (const [i, motion] of students.entries()) {
      stepStudentMotion(motion, 1 / 30, context); seen.add(motion.mode);
      hold[i] = ['hugTree', 'insideClass'].includes(motion.mode) ? hold[i] + 1 / 30 : 0;
      if (hold[i] >= 2.6) throw new Error(`Student ${i} stayed hidden too long`);
      if (!Number.isFinite(motion.x + motion.z + motion.heading)) throw new Error(`Student ${i} has invalid coordinates`);
    }
    for (const mode of ['runToTree', 'hugTree', 'runToClass', 'enterClass', 'insideClass', 'exitClass', 'flee']) expect(seen.has(mode), mode).toBe(true);
    }
  });
  it('brings hidden students to the classroom entrance when selected by the UFO', () => {
    const motion = createStudentMotion(2, UFO_REFUGES.classDoor);
    motion.mode = 'insideClass'; motion.hidden = true;
    wakeStudentForCapture(motion);
    expect(motion.hidden).toBe(false);
    expect({ x: motion.x, z: motion.z }).toEqual(UFO_REFUGES.classApproach);
  });
  it('preserves real refuge positions when resizing and returns to wandering after the UFO leaves', () => {
    const motion = createStudentMotion(1, { x: 4.1, z: 2.8 });
    motion.mode = 'hugTree'; motion.refuge = UFO_REFUGES.trees[1]; motion.target = { x: 4.1, z: 2.8 }; motion.wasPanic = true;
    resizeStudentMotion(motion, 9.2, 4.928);
    expect(motion.x).toBe(4.1);
    stepStudentMotion(motion, 0.05, { boundX: 4.928, panic: false, ufo: { x: 0, z: 0 } });
    expect(motion.mode).toBe('wander');
    expect(motion.hidden).toBe(false);
  });
});
