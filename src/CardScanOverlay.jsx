import React from 'react';

const chipWidth = 176;

export default function CardScanOverlay({ seen, players, recent, testMode, t }) {
  const first = seen[0];
  if (!first?.frameWidth || !first?.frameHeight) return null;

  return <svg className="card-scan-overlay" viewBox={`0 0 ${first.frameWidth} ${first.frameHeight}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    {seen.map(({ markerId, answer, corners }) => {
      if (corners?.length !== 4) return null;
      const player = players.find(item => item.markerId === markerId);
      const recorded = !testMode && (player?.answer || recent.find(item => item.markerId === markerId)?.answer);
      const name = player?.nickname || t('cardScan.unknownCard');
      const status = testMode ? t('cardScan.arTest') : !player ? t('cardScan.arUnassigned') : recorded ? t('cardScan.arRecorded') : t('cardScan.arScanning');
      const centerX = corners.reduce((sum, corner) => sum + corner.x, 0) / corners.length;
      const topY = Math.min(...corners.map(corner => corner.y));
      const chipX = Math.max(4, Math.min(first.frameWidth - chipWidth - 4, centerX - chipWidth / 2));
      const chipY = Math.max(4, topY - 50);
      return <g className={`card-scan-marker ${recorded ? 'is-recorded' : !player ? 'is-unassigned' : ''}`} key={markerId}>
        <polygon points={corners.map(({ x, y }) => `${x},${y}`).join(' ')} />
        <g transform={`translate(${chipX} ${chipY})`}>
          <rect width={chipWidth} height="44" rx="9" />
          <text className="card-scan-name" x="10" y="18">#{markerId} · {name.length > 19 ? `${name.slice(0, 18)}…` : name}</text>
          <text className="card-scan-status" x="10" y="35">{status} · {recorded || answer}</text>
        </g>
      </g>;
    })}
  </svg>;
}
