export const UFO_ACTOR_SCALE = 0.68;
export const UFO_YARD = { maxX: 12.8, front: -7.4, back: 5.25 };

export function renderScale(width, height, quality = 'auto', pressure = 1) {
  const budget = quality === 'smooth' ? 550000 : quality === 'high' ? 1600000 : 900000 / pressure;
  return Math.max(1, Math.sqrt(Math.max(1, width * height) / budget));
}

export function createQualityMonitor() {
  let elapsed = 0, frames = 0, total = 0, pressure = 1;
  return {
    sample(frameMs, seconds) {
      elapsed += seconds; frames++; total += frameMs;
      if (elapsed < 2.5 || frames < 18) return null;
      const average = total / frames;
      elapsed = 0; frames = 0; total = 0;
      if (average > 48 && pressure < 2.5) { pressure = Math.min(2.5, pressure * 1.35); return pressure; }
      return null;
    },
    reset() { elapsed = 0; frames = 0; total = 0; pressure = 1; },
  };
}
