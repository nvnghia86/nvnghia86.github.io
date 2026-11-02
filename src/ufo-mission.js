export function createUfoMission(ids, reducedMotion = false) {
  const winners = [...new Set(ids)];
  const batchSize = winners.length > 18 ? 6 : winners.length > 6 ? 3 : 1;
  const batches = [];
  for (let i = 0; i < winners.length; i += batchSize) batches.push(winners.slice(i, i + batchSize));
  const approach = reducedMotion ? 0.1 : 1.1;
  const wave = reducedMotion ? 0.15 : winners.length <= 3 ? 2.1 : 1.7;
  const departure = reducedMotion ? 0.1 : 0.9;
  return { winners, batches, approach, wave, departure, duration: approach + batches.length * wave + departure, reducedMotion };
}

export function missionFrame(plan, elapsed) {
  const time = Math.max(0, elapsed);
  if (time < plan.approach) return { phase: 'approach', progress: time / plan.approach, captured: [], targets: [] };
  const index = Math.floor((time - plan.approach) / plan.wave);
  if (index < plan.batches.length) return { phase: 'capture', index, progress: ((time - plan.approach) % plan.wave) / plan.wave, targets: plan.batches[index], captured: plan.batches.slice(0, index).flat() };
  const progress = Math.min(1, (time - plan.approach - plan.batches.length * plan.wave) / plan.departure);
  return { phase: progress >= 1 ? 'complete' : 'departure', progress, targets: [], captured: plan.winners };
}
