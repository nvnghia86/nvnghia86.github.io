import { describe, expect, it } from 'vitest';
import { AR, answerFromCorners, cardDictionary } from './quiz-card-hooks';

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
      expect(answerFromCorners(marker.corners)).toBe('ABCD'[turns]);
    }
  });
});
