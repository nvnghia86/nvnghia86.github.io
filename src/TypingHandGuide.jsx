import React from 'react';
import { Hand } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { analyzeKey } from './typingKeyboard';
import leftPinky from './assets/typing_hands/left_pinky_active.svg';
import leftRing from './assets/typing_hands/left_ring_finger_active.svg';
import leftMiddle from './assets/typing_hands/left_middle_finger_active.svg';
import leftIndex from './assets/typing_hands/left_index_finger_active.svg';
import leftThumb from './assets/typing_hands/left_thumb_active.svg';
import leftNeutral from './assets/typing_hands/left_neutral.svg';
import rightPinky from './assets/typing_hands/right_pinky_active.svg';
import rightRing from './assets/typing_hands/right_ring_finger_active.svg';
import rightMiddle from './assets/typing_hands/right_middle_finger_active.svg';
import rightIndex from './assets/typing_hands/right_index_finger_active.svg';
import rightThumb from './assets/typing_hands/right_thumb_active.svg';
import rightNeutral from './assets/typing_hands/right_neutral.svg';

const leftAssets = { leftPinky, leftRing, leftMiddle, leftIndex, thumb: leftThumb };
const rightAssets = { rightPinky, rightRing, rightMiddle, rightIndex, thumb: rightThumb };

export default function TypingHandGuide({ targetChar }) {
  const { t } = useTranslation();
  const target = analyzeKey(targetChar);
  const leftActive = target.finger.startsWith('left') || target.finger === 'thumb' || target.shiftSide === 'left';
  const rightActive = target.finger.startsWith('right') || target.finger === 'thumb' || target.shiftSide === 'right';
  const leftFinger = target.shiftSide === 'left' ? 'leftPinky' : target.finger;
  const rightFinger = target.shiftSide === 'right' ? 'rightPinky' : target.finger;
  const leftImage = leftActive ? (leftAssets[leftFinger] || leftNeutral) : leftNeutral;
  const rightImage = rightActive ? (rightAssets[rightFinger] || rightNeutral) : rightNeutral;
  const label = targetChar === ' ' ? t('typing.keyboard.space') : targetChar || '—';

  return <aside className="typing-hand-guide" aria-label={t('typing.hands.label')}>
    <div className="typing-hand-guide-header"><span><Hand size={15} /> {t('typing.hands.title')}</span><b>{label}</b></div>
    <div className="typing-hand-images">
      <div className={`typing-hand-image${leftActive ? ' active' : ''}`}><img src={leftImage} alt={t('typing.hands.left')} />{leftActive && <em>{label}</em>}</div>
      <div className={`typing-hand-image${rightActive ? ' active' : ''}`}><img src={rightImage} alt={t('typing.hands.right')} />{rightActive && <em>{label}</em>}</div>
    </div>
    <p>{t(`typing.fingers.${target.finger}`)}{target.needsShift ? ` + ${t('typing.hands.shift')}` : ''}</p>
  </aside>;
}
