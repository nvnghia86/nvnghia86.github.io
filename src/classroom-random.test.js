import { describe, expect, it } from 'vitest';
import { groupStudents, pickStudents } from './classroom-random';
import { classWorkspaceTranslations } from './class-workspace-i18n';

const students = Array.from({ length: 11 }, (_, i) => ({ studentId: String(i), nickname: `Student ${i}` }));
describe('classroom activities', () => {
  it('selects only present students without duplicates and respects the no-repeat cycle', () => {
    const present = students.slice(2);
    const winners = pickStudents(present, 4, ['2', '3'], true, () => 0);
    expect(winners).toHaveLength(4);
    expect(new Set(winners.map(s => s.studentId)).size).toBe(4);
    expect(winners.every(s => Number(s.studentId) >= 4)).toBe(true);
    expect(students).toHaveLength(11);
  });
  it('handles exhausted cycles, overlarge selections and repetition disabled', () => {
    const called = students.map(s => s.studentId);
    expect(pickStudents(students, 3, called)).toEqual([]);
    expect(pickStudents(students, 100, called, false)).toHaveLength(11);
    expect(pickStudents([], 3)).toEqual([]);
  });
  it('makes balanced groups with every present student exactly once', () => {
    const groups = groupStudents(students, 4, () => 0);
    expect(groups.map(g => g.length)).toEqual([3, 3, 3, 2]);
    expect(new Set(groups.flat().map(s => s.studentId)).size).toBe(11);
    expect(groupStudents([], 4)).toEqual([]);
    expect(groupStudents(students, 100)).toHaveLength(11);
  });
  it('provides matching Vietnamese/English keys and interpolation variables', () => {
    expect(Object.keys(classWorkspaceTranslations.en).sort()).toEqual(Object.keys(classWorkspaceTranslations.vi).sort());
    for (const key of Object.keys(classWorkspaceTranslations.vi)) {
      expect(classWorkspaceTranslations.en[key].match(/{{\w+}}/g) || []).toEqual(classWorkspaceTranslations.vi[key].match(/{{\w+}}/g) || []);
    }
  });
});
