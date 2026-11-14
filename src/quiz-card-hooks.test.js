import { describe, expect, it } from 'vitest';
import { AR, answerFromCorners, cardDictionary, estimateCameraMotion, mergeCardSession, shiftCornersInFrame } from './quiz-card-hooks';

function renderCard(id, turns = 0) {
  const cells = 11;
  const size = 14;
  const width = cells * size;
  const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
  const svg = cardDictionary.generateSVG(id);
  for (const match of svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="(white|black)"\/>/g)) {
    const [, x, y, rectWidth, rectHeight, fill] = match;
    for (let cy = Number(y); cy < Number(y) + Number(rectHeight); cy++) for (let cx = Number(x); cx < Number(x) + Number(rectWidth); cx++) {
      for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
        let rx = (cx + 1) * size + px;
        let ry = (cy + 1) * size + py;
        for (let turn = 0; turn < turns; turn++) [rx, ry] = [width - 1 - ry, rx];
        const offset = (ry * width + rx) * 4;
        pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = fill === 'black' ? 0 : 255;
      }
    }
  }
  return { width, height: width, data: pixels };
}

describe('printed ARUCO cards and scanner orientation', () => {
  it('detects cards 1 through 40 with the same dictionary used for printing', () => {
    const detector = new AR.Detector({ dictionaryName: 'ARUCO' });
    for (const id of Array.from({ length: 40 }, (_, index) => index + 1)) {
      const markers = detector.detect(renderCard(id));
      expect(markers.some(marker => marker.id === id)).toBe(true);
    }
  });

  it('maps four physical card rotations to A, B, C, and D', () => {
    const detector = new AR.Detector({ dictionaryName: 'ARUCO' });
    for (let turns = 0; turns < 4; turns++) {
      const marker = detector.detect(renderCard(5, turns)).find(item => item.id === 5);
      expect(marker).toBeDefined();
      expect(answerFromCorners(marker.corners)).toBe('ADCB'[turns]);
    }
  });
});

describe('room snapshot ordering', () => {
  it('keeps completion terminal even though the final backend snapshot resets its version to zero', () => {
    const playing = { id: 'room', status: 'playing', currentQuestion: 2, version: 9 };
    const finished = { ...playing, status: 'finished', version: 0 };
    expect(mergeCardSession(playing, finished)).toBe(finished);
    expect(mergeCardSession(finished, { ...playing, version: 99 })).toBe(finished);
    expect(mergeCardSession(playing, { ...playing, currentQuestion: 1, version: 100 })).toBe(playing);
    expect(mergeCardSession(playing, { ...playing, version: 8 })).toBe(playing);
    expect(mergeCardSession(finished, { id: 'other', status: 'lobby' }).id).toBe('other');
  });

  it('tracks spatial displacement across camera frames and clamps off-screen anchors inside the viewport', () => {
    const prevObs = [{ markerId: 3, corners: [{ x: 200, y: 120 }, { x: 260, y: 120 }, { x: 260, y: 180 }, { x: 200, y: 180 }] }];
    const currObs = [{ markerId: 3, corners: [{ x: 140, y: 135 }, { x: 200, y: 135 }, { x: 200, y: 195 }, { x: 140, y: 195 }] }];
    const motion = estimateCameraMotion(prevObs, currObs, null, null, 640, 360);
    expect(motion).toEqual({ dx: -60, dy: 15 });

    const shifted = shiftCornersInFrame(
      [{ x: 30, y: 80 }, { x: 90, y: 80 }, { x: 90, y: 140 }, { x: 30, y: 140 }],
      -60,
      15,
      640,
      360
    );
    expect(shifted.edgePinned).toBe(true);
    expect(Math.min(...shifted.corners.map(c => c.x))).toBeGreaterThanOrEqual(12);
  });
});
