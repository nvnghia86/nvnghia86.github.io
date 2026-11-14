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
});
