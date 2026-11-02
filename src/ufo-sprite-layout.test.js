import { describe, expect, it } from 'vitest';
import { SPRITES, studentSpriteCell, yardProjection, studentDisplayName } from './ufo-sprite-layout';

describe('baked UFO sprite assets', () => {
  it('uses only the last name word on actors without mutating the full name used by results', () => {
    const student = { nickname: '  Nguyễn Hoàng Phương Anh Minh Châu  ' };
    expect(studentDisplayName(student.nickname)).toBe('Châu');
    expect(student.nickname).toBe('  Nguyễn Hoàng Phương Anh Minh Châu  ');
    expect(studentDisplayName('An')).toBe('An');
    expect(studentDisplayName('Trần\tGia\nBảo')).toBe('Bảo');
    expect(studentDisplayName('')).toBe('');
  });
  it('keeps all movement poses inside the correct student palette, away from scenery cells', () => {
    for (let palette = 0; palette < 6; palette++) for (let direction = 0; direction < 4; direction++) {
      const heading = direction * Math.PI / 2 - Math.PI / 2;
      for (const mode of ['walk', 'idle', 'hugTree', 'lift']) for (let frame = 0; frame < 12; frame++) {
        const cell = studentSpriteCell(palette, heading, mode, frame);
        expect(Math.floor(cell / SPRITES.perPalette)).toBe(palette);
        expect(cell).toBeLessThan(SPRITES.tree);
      }
    }
    expect(SPRITES.door + 3).toBeLessThan(SPRITES.total);
    expect(SPRITES.toilet).toBeGreaterThan(SPRITES.door + 3);
    expect(SPRITES.toilet + 3).toBeLessThan(SPRITES.total);
  });
  it('aligns the camera with the cropped static background in portrait and landscape', () => {
    for (const aspect of [.35, .43, .8, 1, 16 / 9, 2.4]) {
      const projection = yardProjection(aspect);
      expect(projection.halfWidth / projection.halfHeight).toBeCloseTo(aspect);
      if (projection.portrait) expect(projection.halfWidth).toBeCloseTo(8.3);
      else expect(projection.halfHeight).toBeCloseTo(10.2);
    }
  });
});
