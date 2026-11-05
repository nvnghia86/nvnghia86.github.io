// Pose gesture library for the AR body-pose quiz game.
//
// Each gesture is detected from a single MediaPipe Pose frame (33 landmarks).
// Detection is scale-invariant: all thresholds are expressed in units of the
// player's shoulder width (`sw`) so the game works at any distance from camera.
//
// Every question draws 4 gestures from this pool via `getQuestionGestures`,
// seeded deterministically by room code + question index so that ALL players
// in the same room see the exact same gesture → answer mapping.

export const HOLD_MS = 1200; // ignore transitional poses while the player moves into the target gesture
export const POSE_DETECTION_INTERVAL_MS = 60;
export const POSE_LANDMARKER_OPTIONS = Object.freeze({
  runningMode: 'VIDEO',
  numPoses: 1,
  minPoseDetectionConfidence: 0.35,
  minPosePresenceConfidence: 0.35,
  minTrackingConfidence: 0.35,
});

export function isPoseInputReady(cameraState, modelState, bodyReady) {
  return cameraState === 'ready' && modelState === 'ready' && bodyReady === true;
}

// MediaPipe Pose landmark indices used here.
const NOSE = 0;
const L_SHOULDER = 11, R_SHOULDER = 12;
const L_ELBOW = 13, R_ELBOW = 14;
const L_WRIST = 15, R_WRIST = 16;
const L_HIP = 23, R_HIP = 24;

function lm(landmarks, index) {
  const point = landmarks?.[index];
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  if (typeof point.visibility === 'number' && point.visibility < 0.2) return null;
  return point;
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

// The game only becomes playable after the camera sees the upper body and
// hips clearly. This prevents an accidental answer while the player is still
// walking into frame or only one arm is visible.
export function hasPlayableBodyPose(landmarks) {
  return [NOSE, L_SHOULDER, R_SHOULDER, L_ELBOW, R_ELBOW, L_WRIST, R_WRIST, L_HIP, R_HIP]
    .every(index => Boolean(lm(landmarks, index)));
}

// Build a normalized feature set from the landmarks, mirrored on X so the
// player's own left hand maps to the left of the (mirrored) screen.
function features(landmarks) {
  const nose = lm(landmarks, NOSE);
  const ls = lm(landmarks, L_SHOULDER);
  const rs = lm(landmarks, R_SHOULDER);
  const le = lm(landmarks, L_ELBOW);
  const re = lm(landmarks, R_ELBOW);
  const lw = lm(landmarks, L_WRIST);
  const rw = lm(landmarks, R_WRIST);
  const lh = lm(landmarks, L_HIP);
  const rh = lm(landmarks, R_HIP);
  if (!ls || !rs || !lw || !rw) return null;

  const mx = point => 1 - point.x; // mirror
  const lsx = mx(ls), rsx = mx(rs);
  const sw = Math.max(0.08, Math.abs(lsx - rsx));
  const shY = (ls.y + rs.y) / 2;
  const headY = nose ? nose.y : shY - sw * 0.55;
  const hipY = lh && rh ? (lh.y + rh.y) / 2 : shY + sw * 1.6;
  const chestY = (shY + hipY) / 2;

  return {
    sw, shY, headY, hipY, chestY,
    centerX: (lsx + rsx) / 2,
    hipCenterX: lh && rh ? (mx(lh) + mx(rh)) / 2 : (lsx + rsx) / 2,
    lsx, rsx,
    lwx: mx(lw), lwy: lw.y,
    rwx: mx(rw), rwy: rw.y,
    lex: le ? mx(le) : null, ley: le ? le.y : null,
    rex: re ? mx(re) : null, rey: re ? re.y : null,
    lhx: lh ? mx(lh) : lsx, rhx: rh ? mx(rh) : rsx,
    hasHips: Boolean(lh && rh),
  };
}

// Convenience predicates shared across detectors.
const armDown = (f, side) => (side === 'l' ? f.lwy : f.rwy) > f.chestY;
const aboveHead = (f, side) => (side === 'l' ? f.lwy : f.rwy) < f.headY - f.sw * 0.1;
const handOnHip = (f, side) => {
  if (!f.hasHips) return false;
  const left = side === 'l';
  const wristX = left ? f.lwx : f.rwx;
  const wristY = left ? f.lwy : f.rwy;
  const elbowX = left ? f.lex : f.rex;
  const shoulderX = left ? f.lsx : f.rsx;
  const hipX = left ? f.lhx : f.rhx;
  if (elbowX === null) return false;
  const elbowOpen = left ? elbowX < shoulderX - f.sw * 0.12 : elbowX > shoulderX + f.sw * 0.12;
  const armBentBack = left ? wristX > elbowX + f.sw * 0.18 : wristX < elbowX - f.sw * 0.18;
  return elbowOpen && armBentBack
    && Math.abs(wristY - f.hipY) < f.sw * 0.45
    && dist(wristX, wristY, hipX, f.hipY) < f.sw * 0.55;
};

// The gesture pool. Order matters: `classifyGesture` returns the first match,
// so more specific poses are listed before more general ones.
export const GESTURE_LIBRARY = [
  {
    key: 'salute-left', emoji: '🫡', color: '#f6c344',
    // Left hand reaches across to the right shoulder; right hand stays low.
    detect: f => dist(f.lwx, f.lwy, f.rsx, f.shY) < f.sw * 0.5 && armDown(f, 'r') && f.lwy < f.chestY,
  },
  {
    key: 'salute-right', emoji: '🫡', color: '#7ec8ff',
    detect: f => dist(f.rwx, f.rwy, f.lsx, f.shY) < f.sw * 0.5 && armDown(f, 'l') && f.rwy < f.chestY,
  },
  {
    key: 'cross-arms', emoji: '❎', color: '#ff8f8f',
    // Wrists crossed over the chest (left wrist ends up on the right, vice versa).
    detect: f => f.lwx > f.rwx + f.sw * 0.1
      && f.lwy > f.shY - f.sw * 0.2 && f.lwy < f.chestY + f.sw * 0.5
      && f.rwy > f.shY - f.sw * 0.2 && f.rwy < f.chestY + f.sw * 0.5,
  },
  {
    key: 'clap-hands', emoji: '👏', color: '#9be6a2',
    // Hands together in front of the chest, not crossed.
    detect: f => Math.abs(f.lwx - f.rwx) < f.sw * 0.5 && Math.abs(f.lwy - f.rwy) < f.sw * 0.45
      && f.lwy > f.shY - f.sw * 0.3 && f.lwy < f.chestY + f.sw * 0.3
      && Math.abs((f.lwx + f.rwx) / 2 - f.centerX) < f.sw * 0.5
      && f.lwx <= f.rwx + f.sw * 0.1,
  },
  {
    key: 'diamond-overhead', emoji: '🔺', color: '#ef9cff',
    // Wrists meet above the head while the elbows stay wide.
    detect: f => f.lex !== null && f.rex !== null
      && aboveHead(f, 'l') && aboveHead(f, 'r')
      && dist(f.lwx, f.lwy, f.rwx, f.rwy) < f.sw * 0.45
      && Math.abs(f.lex - f.rex) > f.sw * 1.15,
  },
  {
    key: 'hands-on-head', emoji: '🙆', color: '#c6a8ff',
    // Both hands near the top of the head (close to centre, around head height).
    detect: f => Math.abs(f.lwy - f.headY) < f.sw * 0.45 && Math.abs(f.rwy - f.headY) < f.sw * 0.45
      && Math.abs(f.lwx - f.centerX) < f.sw * 0.7 && Math.abs(f.rwx - f.centerX) < f.sw * 0.7,
  },
  {
    key: 'both-hands-up', emoji: '🙌', color: '#ffd166',
    // Both hands clearly above the head, apart.
    detect: f => aboveHead(f, 'l') && aboveHead(f, 'r') && Math.abs(f.lwx - f.rwx) > f.sw * 0.8,
  },
  {
    key: 'spread-arms', emoji: '🤟', color: '#5ad1c5',
    // Arms out to the sides at shoulder height (T-pose).
    detect: f => Math.abs(f.lwy - f.shY) < f.sw * 0.6 && Math.abs(f.rwy - f.shY) < f.sw * 0.6
      && f.lwx < f.lsx - f.sw * 0.35 && f.rwx > f.rsx + f.sw * 0.35,
  },
  {
    key: 'left-arm-out', emoji: '⬅️', color: '#72d7ff',
    detect: f => f.lex !== null && Math.abs(f.lwy - f.shY) < f.sw * 0.5
      && Math.abs(f.ley - f.shY) < f.sw * 0.5
      && f.lwx < f.lsx - f.sw * 0.65 && armDown(f, 'r'),
  },
  {
    key: 'right-arm-out', emoji: '➡️', color: '#8bd8a0',
    detect: f => f.rex !== null && Math.abs(f.rwy - f.shY) < f.sw * 0.5
      && Math.abs(f.rey - f.shY) < f.sw * 0.5
      && f.rwx > f.rsx + f.sw * 0.65 && armDown(f, 'l'),
  },
  {
    key: 'hands-on-hips', emoji: '🦸', color: '#ff9f7a',
    // Both elbows must open out and both arms must bend back toward the hips.
    // This deliberately rejects the common neutral pose with both arms hanging down.
    detect: f => handOnHip(f, 'l') && handOnHip(f, 'r'),
  },
  {
    key: 'left-hip', emoji: '🧍', color: '#f4a261',
    // Left hand on the left hip (akimbo), right hand not raised.
    detect: f => handOnHip(f, 'l') && f.lwy > f.chestY && !aboveHead(f, 'r'),
  },
  {
    key: 'right-hip', emoji: '🧍', color: '#e9c46a',
    detect: f => handOnHip(f, 'r') && f.rwy > f.chestY && !aboveHead(f, 'l'),
  },
  {
    key: 'left-hand', emoji: '👈', color: '#ffb84d',
    // Left hand raised above the head, right hand down.
    detect: f => aboveHead(f, 'l') && armDown(f, 'r'),
  },
  {
    key: 'right-hand', emoji: '👉', color: '#66b2ff',
    // Right hand raised above the head, left hand down.
    detect: f => aboveHead(f, 'r') && armDown(f, 'l'),
  },
];

export const GESTURE_BY_KEY = GESTURE_LIBRARY.reduce((map, item) => ({ ...map, [item.key]: item }), {});

// Return the key of the first gesture whose detector matches, or null.
export function classifyGesture(landmarks) {
  const f = features(landmarks);
  if (!f) return null;
  for (const gesture of GESTURE_LIBRARY) {
    try {
      if (gesture.detect(f)) return gesture.key;
    } catch {
      /* ignore a detector that hit a missing landmark */
    }
  }
  return null;
}

// --- Deterministic per-question gesture assignment ---------------------

function hashString(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick `count` distinct gestures for a question. Seeded by room code + index
// so every player and the host compute the identical mapping.
export function getQuestionGestures(roomCode, questionIndex, count = 4) {
  const rand = mulberry32(hashString(`${roomCode || 'ROOM'}#${questionIndex ?? 0}`));
  const pool = [...GESTURE_LIBRARY];
  // Fisher–Yates shuffle with the seeded PRNG.
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
