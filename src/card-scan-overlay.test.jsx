import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CardScanOverlay from './CardScanOverlay';

const seen = [{ markerId: 7, answer: 'B', corners: [{ x: 10, y: 20 }, { x: 80, y: 20 }, { x: 80, y: 90 }, { x: 10, y: 90 }], frameWidth: 640, frameHeight: 360 }];
const players = [{ markerId: 7, nickname: 'Nguyễn Minh An', answer: null }];
const labels = { 'cardScan.unknownCard': 'Thẻ chưa gán', 'cardScan.arTest': 'Đang thử', 'cardScan.arRecorded': 'Đã ghi nhận', 'cardScan.arScanning': 'Đang nhận diện', 'cardScan.arUnassigned': 'Chưa gán cho lớp' };
const t = key => labels[key];

describe('scanner camera overlay', () => {
  it('anchors a student label to the detected card and changes status only after recording', () => {
    const { container, rerender } = render(<CardScanOverlay seen={seen} players={players} recent={[]} testMode={false} t={t} />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 640 360');
    expect(container.querySelector('polygon')).toHaveAttribute('points', '10,20 80,20 80,90 10,90');
    expect(screen.getByText('#7 · Nguyễn Minh An')).toBeInTheDocument();
    expect(screen.getByText('Đang nhận diện · B')).toBeInTheDocument();
    expect(container.querySelector('.is-recorded')).toBeNull();

    rerender(<CardScanOverlay seen={seen} players={players} recent={[{ markerId: 7, answer: 'B' }]} testMode={false} t={t} />);
    expect(screen.getByText('Đã ghi nhận · B')).toBeInTheDocument();
    expect(container.querySelector('.is-recorded')).toBeInTheDocument();

    rerender(<CardScanOverlay seen={seen} players={[{ ...players[0], answer: 'B' }]} recent={[]} testMode={false} t={t} />);
    expect(screen.getByText('Đã ghi nhận · B')).toBeInTheDocument();

    rerender(<CardScanOverlay seen={seen} players={players} recent={[]} testMode t={t} />);
    expect(screen.getByText('Đang thử · B')).toBeInTheDocument();
    expect(container.querySelector('.is-recorded')).toBeNull();

    rerender(<CardScanOverlay seen={seen} players={[]} recent={[]} testMode={false} t={t} />);
    expect(screen.getByText('Chưa gán cho lớp · B')).toBeInTheDocument();
    expect(container.querySelector('.is-unassigned')).toBeInTheDocument();
  });

  it('keeps recognized student AR notification frames anchored in space when the camera pans away', () => {
    const classPlayers = [
      { markerId: 7, nickname: 'Nguyễn Minh An', answer: null },
      { markerId: 8, nickname: 'Trần Bảo Ngọc', answer: null },
    ];
    const card7 = {
      markerId: 7,
      answer: 'B',
      corners: [{ x: 40, y: 80 }, { x: 110, y: 80 }, { x: 110, y: 150 }, { x: 40, y: 150 }],
      frameWidth: 640,
      frameHeight: 360,
    };
    const card8 = {
      markerId: 8,
      answer: 'A',
      corners: [{ x: 360, y: 120 }, { x: 430, y: 120 }, { x: 430, y: 190 }, { x: 360, y: 190 }],
      frameWidth: 640,
      frameHeight: 360,
    };

    const { container, rerender } = render(
      <CardScanOverlay seen={[card7]} players={classPlayers} recent={[{ markerId: 7, answer: 'B' }]} resetKey="q1" testMode={false} t={t} />
    );
    expect(screen.getByText('#7 · Nguyễn Minh An')).toBeInTheDocument();
    expect(screen.getByText('Đã ghi nhận · B')).toBeInTheDocument();

    // Camera pans away so no card is currently in the live detector frame (seen = [])
    rerender(
      <CardScanOverlay seen={[]} players={classPlayers} recent={[{ markerId: 7, answer: 'B' }]} resetKey="q1" testMode={false} t={t} />
    );
    expect(screen.getByText('#7 · Nguyễn Minh An')).toBeInTheDocument();
    expect(screen.getByText('Đã ghi nhận · B')).toBeInTheDocument();
    expect(container.querySelector('.card-scan-marker.is-recorded.is-anchored')).toBeInTheDocument();
    expect(container.querySelector('.card-scan-tether')).toBeInTheDocument();

    // Camera now sees card #8 while card #7 is outside live detection: both #7 (anchored) and #8 (live) remain visible
    rerender(
      <CardScanOverlay seen={[card8]} players={classPlayers} recent={[{ markerId: 7, answer: 'B' }]} resetKey="q1" testMode={false} t={t} />
    );
    expect(screen.getByText('#7 · Nguyễn Minh An')).toBeInTheDocument();
    expect(screen.getByText('Đã ghi nhận · B')).toBeInTheDocument();
    expect(screen.getByText('#8 · Trần Bảo Ngọc')).toBeInTheDocument();
    expect(screen.getByText('Đang nhận diện · A')).toBeInTheDocument();

    // Advancing to next question (resetKey = 'q2') clears the previous spatial anchors
    rerender(
      <CardScanOverlay seen={[]} players={classPlayers} recent={[]} resetKey="q2" testMode={false} t={t} />
    );
    expect(container.querySelector('svg')).toBeNull();
  });
});
