import React from 'react';

const SAMPLE_IMAGES = {
  'salute-left': { file: 'Right-Hand-On-Shoulder.png', mirror: true },
  'salute-right': { file: 'Right-Hand-On-Shoulder.png' },
  'cross-arms': { file: 'Arms-Crossed-On-Chest.png' },
  'clap-hands': { file: 'Palms-Together.png' },
  'diamond-overhead': { file: 'Hands-Above-Head.png' },
  'hands-on-head': { file: 'Both-Hands-On-Head.png' },
  'both-hands-up': { file: 'Both-Hands-Raised.png' },
  'spread-arms': { file: 'Both-Arms-Outstretched.png' },
  'left-arm-out': { file: 'Pointing-Left.png' },
  'right-arm-out': { file: 'Pointing-Right.png' },
  'hands-on-hips': { file: 'Both-Hands-On-Hips.png' },
  'left-hip': { file: 'Left-Hand-On-Hip.png' },
  'right-hip': { file: 'Left-Hand-On-Hip.png', mirror: true },
  'left-hand': { file: 'Left-Hand-Raised.png' },
  'right-hand': { file: 'Right-Hand-Raised.png' },
};

export function gestureSamplePath(gestureKey) {
  const sample = SAMPLE_IMAGES[gestureKey];
  return sample ? `/ar-game/${sample.file}` : null;
}

export default function PoseGestureIllustration({ gestureKey, className = '' }) {
  const sample = SAMPLE_IMAGES[gestureKey];
  if (!sample) return null;
  return <img
    className={`pose-gesture-illustration ${sample.mirror ? 'is-mirrored' : ''} ${className}`.trim()}
    src={`/ar-game/${sample.file}`}
    alt=""
    aria-hidden="true"
    draggable="false"
    decoding="async"
  />;
}

