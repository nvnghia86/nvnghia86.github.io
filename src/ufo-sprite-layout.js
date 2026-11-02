export const SPRITES = { width: 128, height: 160, columns: 16, perPalette: 36, palettes: 6, tree: 216, door: 217, total: 221 };
export function studentSpriteCell(palette, heading, mode, walkPhase = 0) {
  const direction = ((Math.round((heading + Math.PI / 2) / (Math.PI / 2)) % 4) + 4) % 4;
  const base = (palette % SPRITES.palettes) * SPRITES.perPalette;
  if (mode === 'lift') return base + 32 + direction;
  if (mode === 'hugTree') return base + 28 + direction;
  if (mode === 'idle') return base + 24 + direction;
  return base + direction * 6 + ((Math.floor(walkPhase / (Math.PI * 2) * 6) % 6) + 6) % 6;
}
export function yardProjection(aspect) {
  const halfHeight = Math.max(10.2, 8.3 / Math.max(.2, aspect));
  return { halfHeight, halfWidth: halfHeight * aspect, portrait: aspect < 8.3 / 10.2 };
}
