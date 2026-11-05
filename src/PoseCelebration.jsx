import React from 'react';
import { useTranslation } from 'react-i18next';

const COLORS = ['#ffd84d', '#7de3ff', '#7aebaf', '#ff7c9d', '#c69cff', '#ff9d5c'];
const CENTERS = [[18, 32], [50, 22], [82, 34], [34, 48], [68, 50]];
const SPARKS = Array.from({ length: 45 }, (_, index) => {
  const center = CENTERS[index % CENTERS.length];
  const angle = ((index * 137.5) % 360) * Math.PI / 180;
  const distance = 70 + (index % 6) * 18;
  return {
    id: index,
    x: center[0],
    y: center[1],
    tx: Math.cos(angle) * distance,
    ty: Math.sin(angle) * distance,
    color: COLORS[index % COLORS.length],
    delay: (index % 5) * 0.08,
    size: 5 + (index % 4) * 2,
  };
});

export default function PoseCelebration({ burstKey }) {
  const { t } = useTranslation();
  return <div key={burstKey} className="pose-celebration" role="status" aria-label={t('poseArena:celebrationTitle')}>
    <strong>{t('poseArena:celebrationTitle')}</strong>
    <div className="pose-fireworks" aria-hidden="true">
      {SPARKS.map(spark => <i key={spark.id} style={{
        '--spark-x': `${spark.x}%`,
        '--spark-y': `${spark.y}%`,
        '--spark-tx': `${spark.tx.toFixed(1)}px`,
        '--spark-ty': `${spark.ty.toFixed(1)}px`,
        '--spark-color': spark.color,
        '--spark-delay': `${spark.delay}s`,
        '--spark-size': `${spark.size}px`,
      }} />)}
    </div>
  </div>;
}
