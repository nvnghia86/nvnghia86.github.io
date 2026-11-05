import { describe, expect, it } from 'vitest';
import { HOLD_MS, POSE_DETECTION_INTERVAL_MS, POSE_LANDMARKER_OPTIONS, GESTURE_LIBRARY, classifyGesture, getQuestionGestures, hasPlayableBodyPose, isPoseInputReady } from './pose-gesture-library';

function pose({ leftWrist, rightWrist }) {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 1 }));
  landmarks[0] = { x: 0.5, y: 0.2, visibility: 1 };
  landmarks[11] = { x: 0.6, y: 0.4, visibility: 1 };
  landmarks[12] = { x: 0.4, y: 0.4, visibility: 1 };
  landmarks[15] = { ...leftWrist, visibility: 1 };
  landmarks[16] = { ...rightWrist, visibility: 1 };
  landmarks[23] = { x: 0.58, y: 0.75, visibility: 1 };
  landmarks[24] = { x: 0.42, y: 0.75, visibility: 1 };
  return landmarks;
}

describe('body-pose gesture library', () => {
  it('uses a stable detection profile that ignores transitional poses', () => {
    expect(HOLD_MS).toBeGreaterThanOrEqual(1100);
    expect(HOLD_MS).toBeLessThanOrEqual(1300);
    expect(POSE_DETECTION_INTERVAL_MS).toBeLessThanOrEqual(60);
    expect(POSE_LANDMARKER_OPTIONS.minPoseDetectionConfidence).toBeLessThan(0.5);
    expect(POSE_LANDMARKER_OPTIONS.minPosePresenceConfidence).toBeLessThan(0.5);
    expect(POSE_LANDMARKER_OPTIONS.minTrackingConfidence).toBeLessThan(0.5);
  });

  it('uses one deterministic, distinct mapping for every device in a room', () => {
    const teacher = getQuestionGestures('ABC123', 2, 4);
    const student = getQuestionGestures('ABC123', 2, 4);
    expect(student.map(item => item.key)).toEqual(teacher.map(item => item.key));
    expect(new Set(teacher.map(item => item.key))).toHaveProperty('size', 4);
    expect(getQuestionGestures('ABC123', 3, 4).map(item => item.key)).not.toEqual(teacher.map(item => item.key));
    expect(getQuestionGestures('ABC123', 2, 99)).toHaveLength(GESTURE_LIBRARY.length);
  });

  it('recognizes a raised left hand and both hands raised from pose landmarks', () => {
    expect(classifyGesture(pose({ leftWrist: { x: 0.6, y: 0.05 }, rightWrist: { x: 0.4, y: 0.8 } }))).toBe('left-hand');
    expect(classifyGesture(pose({ leftWrist: { x: 0.85, y: 0.05 }, rightWrist: { x: 0.15, y: 0.05 } }))).toBe('both-hands-up');
  });

  it('recognizes additional sideways and overhead sample poses', () => {
    const leftOut = pose({ leftWrist: { x: 0.9, y: 0.4 }, rightWrist: { x: 0.4, y: 0.8 } });
    leftOut[13] = { x: 0.75, y: 0.4, visibility: 1 };
    expect(classifyGesture(leftOut)).toBe('left-arm-out');

    const diamond = pose({ leftWrist: { x: 0.5, y: 0.05 }, rightWrist: { x: 0.5, y: 0.05 } });
    diamond[13] = { x: 0.8, y: 0.25, visibility: 1 };
    diamond[14] = { x: 0.2, y: 0.25, visibility: 1 };
    expect(classifyGesture(diamond)).toBe('diamond-overhead');
  });

  it('requires bent, outward elbows for hands on hips and rejects relaxed arms', () => {
    const relaxed = pose({ leftWrist: { x: 0.58, y: 0.75 }, rightWrist: { x: 0.42, y: 0.75 } });
    relaxed[13] = { x: 0.6, y: 0.58, visibility: 1 };
    relaxed[14] = { x: 0.4, y: 0.58, visibility: 1 };
    expect(classifyGesture(relaxed)).not.toBe('hands-on-hips');
    expect(classifyGesture(relaxed)).not.toBe('left-hip');
    expect(classifyGesture(relaxed)).not.toBe('right-hip');

    const akimbo = pose({ leftWrist: { x: 0.58, y: 0.75 }, rightWrist: { x: 0.42, y: 0.75 } });
    akimbo[13] = { x: 0.75, y: 0.58, visibility: 1 };
    akimbo[14] = { x: 0.25, y: 0.58, visibility: 1 };
    expect(classifyGesture(akimbo)).toBe('hands-on-hips');
  });

  it('requires a connected model and a complete visible body before pose input is enabled', () => {
    const complete = pose({ leftWrist: { x: 0.6, y: 0.05 }, rightWrist: { x: 0.4, y: 0.8 } });
    expect(hasPlayableBodyPose(complete)).toBe(true);
    complete[23].visibility = 0.1;
    expect(hasPlayableBodyPose(complete)).toBe(false);
    expect(isPoseInputReady('ready', 'ready', true)).toBe(true);
    expect(isPoseInputReady('ready', 'ready', false)).toBe(false);
    expect(isPoseInputReady('denied', 'ready', true)).toBe(false);
  });

  it('ignores incomplete or hidden landmarks', () => {
    expect(classifyGesture([])).toBeNull();
    const hidden = pose({ leftWrist: { x: 0.6, y: 0.05 }, rightWrist: { x: 0.4, y: 0.8 } });
    hidden[15].visibility = 0.1;
    expect(classifyGesture(hidden)).toBeNull();
  });
});
