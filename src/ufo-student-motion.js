import { UFO_YARD } from './ufo-render-quality';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

// These positions are shared with the scene, so a hiding destination always matches a real prop.
export const UFO_REFUGES = {
  trees: [{ x: -3.2, z: -3.2 }, { x: 4.1, z: 2.2 }],
  classApproach: { x: -4.3, z: 4.85 },
  classDoor: { x: -4.3, z: 6.65 },
};

function random(motion) {
  motion.seed = (Math.imul(motion.seed, 1664525) + 1013904223) >>> 0;
  return motion.seed / 0x100000000;
}
function boundsOf(boundX) { return { left: -boundX + 0.3, right: boundX - 0.3, front: UFO_YARD.front, back: UFO_YARD.back }; }
function freeTarget(motion, boundX, ufo, fleeing) {
  const bounds = boundsOf(boundX);
  let best, bestScore = -Infinity;
  for (let i = 0; i < 12; i++) {
    const candidate = { x: bounds.left + 0.4 + random(motion) * (bounds.right - bounds.left - 0.8), z: bounds.front + 0.4 + random(motion) * (bounds.back - bounds.front - 0.8) };
    // A fresh destination must take the student somewhere else, even when already at the edge.
    const travel = distance(motion, candidate);
    const score = Math.min(travel, 5) * 1.7 + (fleeing ? distance(candidate, ufo) * 0.35 : random(motion) * 2);
    if (score > bestScore) { best = candidate; bestScore = score; }
  }
  return best;
}
function chooseRoute(motion, { boundX, panic, ufo }) {
  motion.modeTime = 0;
  motion.detour = null;
  if (!panic) {
    motion.mode = 'wander'; motion.target = freeTarget(motion, boundX, ufo, false);
    return;
  }
  const choice = motion.route++ % 4;
  if (choice < 2) {
    const tree = UFO_REFUGES.trees[choice];
    const angle = Math.atan2(tree.z - ufo.z, tree.x - ufo.x) + (random(motion) - 0.5) * 0.8;
    motion.refuge = tree;
    motion.mode = 'runToTree';
    motion.target = { x: tree.x + Math.cos(angle) * 0.6, z: tree.z + Math.sin(angle) * 0.6 };
  } else if (choice === 2) {
    motion.mode = 'runToClass';
    motion.target = { ...UFO_REFUGES.classApproach };
  } else {
    motion.mode = 'flee'; motion.target = freeTarget(motion, boundX, ufo, true);
  }
}
export function createStudentMotion(index, position) {
  return { x: position.x, z: position.z, heading: index * 2.39996, seed: (index + 1) * 7919, route: index % 4, mode: 'wander', modeTime: 0, target: null, refuge: null, wasPanic: false, hidden: false, moving: false, speed: 0, walkPhase: index * 2.1, baseSpeed: 0.95 + index % 5 * 0.08 };
}
export function resetStudentMotion(motion) {
  if (['insideClass', 'enterClass', 'exitClass'].includes(motion.mode)) Object.assign(motion, UFO_REFUGES.classApproach);
  motion.mode = 'wander'; motion.target = null; motion.detour = null; motion.hidden = false; motion.wasPanic = false; motion.modeTime = 0; motion.speed = 0;
}
export function wakeStudentForCapture(motion) {
  if (['insideClass', 'enterClass', 'exitClass'].includes(motion.mode)) Object.assign(motion, UFO_REFUGES.classApproach);
  motion.hidden = false; motion.mode = 'flee'; motion.modeTime = 0; motion.moving = false;
}
export function resizeStudentMotion(motion, previousBound, boundX) {
  motion.detour = null;
  if (['wander', 'flee'].includes(motion.mode)) {
    motion.x *= boundX / previousBound;
    if (motion.target) motion.target.x *= boundX / previousBound;
  }
  const bounds = boundsOf(boundX);
  motion.x = clamp(motion.x, bounds.left, bounds.right);
}

function nextWaypoint(motion, boundX) {
  if (motion.detour && distance(motion, motion.detour) < 0.3) motion.detour = null;
  if (motion.detour) return motion.detour;
  const dx = motion.target.x - motion.x, dz = motion.target.z - motion.z, length = Math.hypot(dx, dz);
  if (length < 0.3) return motion.target;
  for (const tree of UFO_REFUGES.trees) {
    const t = ((tree.x - motion.x) * dx + (tree.z - motion.z) * dz) / (length * length);
    if (t < 0.04 || t > 0.96 || Math.hypot(motion.x + dx * t - tree.x, motion.z + dz * t - tree.z) > 0.57) continue;
    const bounds = boundsOf(boundX);
    const candidates = [-1, 1].map(side => ({ x: tree.x - dz / length * side * 1.05, z: tree.z + dx / length * side * 1.05 }))
      .filter(point => point.x > bounds.left && point.x < bounds.right && point.z > bounds.front && point.z < bounds.back);
    candidates.sort((a, b) => distance(motion, a) + distance(a, motion.target) - distance(motion, b) - distance(b, motion.target));
    if (candidates.length) { motion.detour = candidates[0]; return motion.detour; }
  }
  return motion.target;
}

export function stepStudentMotion(motion, seconds, context) {
  const dt = clamp(seconds, 0, 0.1), { panic, boundX, ufo, neighbours = [] } = context;
  motion.modeTime += dt;
  motion.hidden = false;
  if (motion.wasPanic !== panic) {
    motion.wasPanic = panic;
    if (!panic && ['insideClass', 'enterClass'].includes(motion.mode)) {
      motion.mode = 'exitClass'; motion.target = { ...UFO_REFUGES.classApproach }; motion.modeTime = 0;
    } else if (!['enterClass', 'insideClass', 'exitClass'].includes(motion.mode)) chooseRoute(motion, context);
  }
  if (!motion.target) chooseRoute(motion, context);
  if (motion.mode === 'hugTree') {
    motion.moving = false; motion.speed = 0;
    motion.heading = Math.atan2(motion.refuge.z - motion.z, motion.refuge.x - motion.x);
    if (motion.modeTime < motion.holdTime && panic) return motion;
    chooseRoute(motion, context);
  }
  if (motion.mode === 'insideClass') {
    motion.hidden = true; motion.moving = false; motion.speed = 0;
    if (motion.modeTime < motion.holdTime && panic) return motion;
    motion.hidden = false; motion.mode = 'exitClass'; motion.target = { ...UFO_REFUGES.classApproach }; motion.modeTime = 0;
  }
  if (distance(motion, motion.target) < 0.23) {
    if (motion.mode === 'runToTree') {
      motion.mode = 'hugTree'; motion.modeTime = 0; motion.holdTime = 1 + random(motion) * 1.3; motion.speed = 0; motion.moving = false;
      return motion;
    }
    if (motion.mode === 'runToClass') { motion.mode = 'enterClass'; motion.target = { ...UFO_REFUGES.classDoor }; motion.modeTime = 0; }
    else if (motion.mode === 'enterClass') { motion.mode = 'insideClass'; motion.modeTime = 0; motion.holdTime = 0.9 + random(motion) * 1.1; motion.hidden = true; motion.speed = 0; motion.moving = false; return motion; }
    else chooseRoute(motion, context);
  }
  const throughDoor = ['enterClass', 'exitClass'].includes(motion.mode);
  const waypoint = throughDoor ? motion.target : nextWaypoint(motion, boundX);
  const targetAngle = Math.atan2(waypoint.z - motion.z, waypoint.x - motion.x);
  let vx = Math.cos(targetAngle), vz = Math.sin(targetAngle);
  if (!throughDoor) {
    for (const other of neighbours) {
      if (other === motion || other.hidden || other.captured) continue;
      const dx = motion.x - other.x, dz = motion.z - other.z, d = Math.hypot(dx, dz);
      if (d > 0.001 && d < 0.65) { const force = (0.65 - d) * 1.4; vx += dx / d * force; vz += dz / d * force; }
    }
    for (const tree of UFO_REFUGES.trees) {
      const dx = motion.x - tree.x, dz = motion.z - tree.z, d = Math.hypot(dx, dz);
      if (d > 0.001 && d < 0.52) { vx += dx / d * 2; vz += dz / d * 2; }
    }
  }
  const desiredHeading = Math.hypot(vx, vz) < 0.05 ? targetAngle : Math.atan2(vz, vx);
  motion.heading += clamp(angleDelta(motion.heading, desiredHeading), -dt * 5.5, dt * 5.5);
  motion.speed = motion.baseSpeed * (panic || throughDoor ? 2.55 : 1) * clamp(distance(motion, waypoint) / 1.2, 0.25, 1);
  // Slow down near a destination so one large frame cannot overshoot it forever.
  const travel = Math.min(motion.speed * dt, distance(motion, waypoint));
  const nextX = motion.x + Math.cos(motion.heading) * travel, nextZ = motion.z + Math.sin(motion.heading) * travel;
  const bounds = boundsOf(boundX), back = throughDoor ? 6.8 : bounds.back;
  motion.x = clamp(nextX, bounds.left, bounds.right); motion.z = clamp(nextZ, bounds.front, back);
  if (nextX !== motion.x || nextZ !== motion.z) {
    // Change the persistent goal and direction once on contact, rather than flipping a force each frame.
    if (throughDoor) motion.heading = targetAngle;
    else {
      motion.target = freeTarget(motion, boundX, ufo, panic);
      motion.detour = null;
      if (motion.mode === 'runToTree' || motion.mode === 'runToClass') motion.mode = panic ? 'flee' : 'wander';
      motion.heading = Math.atan2(motion.target.z - motion.z, motion.target.x - motion.x);
    }
  }
  motion.moving = travel > 0.001;
  motion.walkPhase += travel * (panic ? 10 : 8);
  return motion;
}
