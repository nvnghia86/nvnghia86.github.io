import React, { useRef } from 'react';
import { cornerCenter, shiftCornersInFrame } from './quiz-card-hooks';

const chipWidth = 196;
const chipHeight = 44;

function buildFallbackCorners(index, frameWidth, frameHeight) {
  const cols = Math.max(1, Math.floor((frameWidth - 24) / (chipWidth + 10)));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const cx = Math.min(frameWidth - 48, 60 + col * (chipWidth + 10));
  const cy = Math.min(frameHeight - 40, 84 + row * 68);
  const half = 22;
  return [
    { x: cx - half, y: cy - half },
    { x: cx + half, y: cy - half },
    { x: cx + half, y: cy + half },
    { x: cx - half, y: cy + half },
  ];
}

function resolveChipPosition(desiredX, desiredY, placedChips, frameWidth, frameHeight) {
  let x = Math.max(4, Math.min(frameWidth - chipWidth - 4, desiredX));
  let y = Math.max(4, Math.min(frameHeight - chipHeight - 4, desiredY));
  const overlaps = (cx, cy) => placedChips.some(
    item => Math.abs(cx - item.x) < chipWidth - 8 && Math.abs(cy - item.y) < chipHeight + 4
  );
  if (!overlaps(x, y)) return { x, y };
  for (let step = 1; step <= 8; step++) {
    const downY = Math.min(frameHeight - chipHeight - 4, y + step * (chipHeight + 6));
    if (!overlaps(x, downY)) return { x, y: downY };
    const upY = Math.max(4, y - step * (chipHeight + 6));
    if (!overlaps(x, upY)) return { x, y: upY };
  }
  return { x, y };
}

export default function CardScanOverlay({
  seen = [],
  anchored = [],
  players = [],
  recent = [],
  testResults = [],
  testMode = false,
  resetKey = '',
  t,
}) {
  const spatialMemoryRef = useRef(new Map());
  const frameSizeRef = useRef({ frameWidth: 640, frameHeight: 360 });
  const lastResetKeyRef = useRef(resetKey);

  if (resetKey !== lastResetKeyRef.current) {
    spatialMemoryRef.current.clear();
    lastResetKeyRef.current = resetKey;
  }

  const liveSource = seen.find(item => item?.frameWidth && item?.frameHeight)
    || anchored.find(item => item?.frameWidth && item?.frameHeight);
  if (liveSource) {
    frameSizeRef.current = {
      frameWidth: liveSource.frameWidth,
      frameHeight: liveSource.frameHeight,
    };
  }
  const { frameWidth, frameHeight } = frameSizeRef.current;

  const memory = spatialMemoryRef.current;
  const visibleIds = new Set();

  if (!anchored.length && seen.length && memory.size) {
    const deltas = [];
    for (const item of seen) {
      if (item?.corners?.length !== 4) continue;
      const prev = memory.get(item.markerId);
      if (!prev?.isLive || prev?.corners?.length !== 4) continue;
      const prevCenter = cornerCenter(prev.corners);
      const currCenter = cornerCenter(item.corners);
      deltas.push({ dx: currCenter.x - prevCenter.x, dy: currCenter.y - prevCenter.y });
    }
    if (deltas.length) {
      const dx = deltas.reduce((sum, item) => sum + item.dx, 0) / deltas.length;
      const dy = deltas.reduce((sum, item) => sum + item.dy, 0) / deltas.length;
      const liveSet = new Set(seen.map(item => item.markerId));
      for (const [id, entry] of memory.entries()) {
        if (liveSet.has(id)) continue;
        const shifted = shiftCornersInFrame(entry.corners, dx, dy, frameWidth, frameHeight);
        memory.set(id, {
          ...entry,
          corners: shifted.corners,
          edgePinned: shifted.edgePinned,
          isLive: false,
          isAnchored: true,
        });
      }
    }
  }

  for (const item of anchored) {
    if (item?.corners?.length !== 4) continue;
    memory.set(item.markerId, {
      markerId: item.markerId,
      answer: item.lockedAnswer || item.answer,
      corners: item.corners.map(({ x, y }) => ({ x, y })),
      frameWidth: item.frameWidth || frameWidth,
      frameHeight: item.frameHeight || frameHeight,
      isLive: Boolean(item.isLive),
      isAnchored: !item.isLive,
      edgePinned: Boolean(item.edgePinned),
    });
  }

  for (const item of seen) {
    if (item?.corners?.length !== 4) continue;
    visibleIds.add(item.markerId);
    const player = players.find(entry => entry.markerId === item.markerId);
    const recordedAnswer = !testMode && (player?.answer || recent.find(entry => entry.markerId === item.markerId)?.answer);
    const testAnswer = testMode && testResults.find(entry => entry.markerId === item.markerId)?.answer;
    memory.set(item.markerId, {
      markerId: item.markerId,
      answer: recordedAnswer || testAnswer || item.answer,
      corners: item.corners.map(({ x, y }) => ({ x, y })),
      frameWidth: item.frameWidth || frameWidth,
      frameHeight: item.frameHeight || frameHeight,
      isLive: true,
      isAnchored: false,
      edgePinned: false,
    });
  }

  for (const [id, entry] of Array.from(memory.entries())) {
    if (visibleIds.has(id)) continue;
    const player = players.find(item => item.markerId === id);
    if (!testMode && !player) {
      memory.delete(id);
      continue;
    }
    const recordedAnswer = !testMode && (player?.answer || recent.find(item => item.markerId === id)?.answer);
    const testAnswer = testMode && testResults.find(item => item.markerId === id)?.answer;
    memory.set(id, {
      ...entry,
      answer: recordedAnswer || testAnswer || entry.answer,
      isLive: false,
      isAnchored: true,
    });
  }

  if (!testMode) {
    let fallbackIndex = 0;
    for (const player of players) {
      if (!player?.markerId) continue;
      const recordedAnswer = player.answer || recent.find(item => item.markerId === player.markerId)?.answer;
      if (!recordedAnswer || memory.has(player.markerId)) continue;
      memory.set(player.markerId, {
        markerId: player.markerId,
        answer: recordedAnswer,
        corners: buildFallbackCorners(fallbackIndex++, frameWidth, frameHeight),
        frameWidth,
        frameHeight,
        isLive: false,
        isAnchored: true,
        edgePinned: true,
      });
    }
  }

  const displayItems = Array.from(memory.values());
  if (!displayItems.length) return null;

  const placedChips = [];

  return (
    <svg
      className="card-scan-overlay"
      viewBox={`0 0 ${frameWidth} ${frameHeight}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {displayItems.map(({ markerId, answer, corners, isLive, isAnchored, edgePinned }) => {
        if (corners?.length !== 4) return null;
        const player = players.find(item => item.markerId === markerId);
        const explicitRecorded = !testMode && (player?.answer || recent.find(item => item.markerId === markerId)?.answer);
        const recorded = explicitRecorded || (!testMode && isAnchored && player ? answer : null);
        const displayAnswer = recorded || answer;
        const name = player?.nickname || t('cardScan.unknownCard');
        const status = testMode
          ? t('cardScan.arTest')
          : !player
            ? t('cardScan.arUnassigned')
            : recorded
              ? t('cardScan.arRecorded')
              : t('cardScan.arScanning');
        const centerX = corners.reduce((sum, corner) => sum + corner.x, 0) / corners.length;
        const centerY = corners.reduce((sum, corner) => sum + corner.y, 0) / corners.length;
        const topY = Math.min(...corners.map(corner => corner.y));
        const desiredX = Math.max(4, Math.min(frameWidth - chipWidth - 4, centerX - chipWidth / 2));
        const desiredY = Math.max(4, topY - 50);
        const { x: chipX, y: chipY } = resolveChipPosition(desiredX, desiredY, placedChips, frameWidth, frameHeight);
        placedChips.push({ x: chipX, y: chipY });

        const classes = [
          'card-scan-marker',
          recorded ? 'is-recorded' : !player ? 'is-unassigned' : '',
          isLive ? 'is-live' : 'is-anchored',
          edgePinned ? 'is-edge-pinned' : '',
        ].filter(Boolean).join(' ');

        return (
          <g className={classes} key={markerId} data-marker-id={markerId}>
            <polygon points={corners.map(({ x, y }) => `${x},${y}`).join(' ')} />
            {isAnchored && (
              <>
                <line
                  className="card-scan-tether"
                  x1={centerX}
                  y1={centerY}
                  x2={chipX + chipWidth / 2}
                  y2={chipY + chipHeight / 2}
                />
                <circle className="card-scan-anchor-dot" cx={centerX} cy={centerY} r="5" />
              </>
            )}
            <g className="card-scan-chip" transform={`translate(${chipX} ${chipY})`}>
              <rect width={chipWidth} height={chipHeight} rx="9" />
              <g className="card-scan-answer-pill" transform={`translate(${chipWidth - 36} 6)`}>
                <rect width="30" height="32" rx="7" />
                <text className="card-scan-answer-badge" x="15" y="21" textAnchor="middle">
                  {recorded ? `✓${displayAnswer}` : displayAnswer}
                </text>
              </g>
              <text className="card-scan-name" x="10" y="18">
                #{markerId} · {name.length > 19 ? `${name.slice(0, 18)}…` : name}
              </text>
              <text className="card-scan-status" x="10" y="35">
                {status} · {displayAnswer}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
