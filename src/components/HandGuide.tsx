import React from 'react';
import { analyzeCharacter } from '../utils/keyboardMap';
import { useTranslation } from '../i18n';

// Import SVG hand assets
import leftPinkySvg from '../assets/typing_hands/left_pinky_active.svg';
import leftRingSvg from '../assets/typing_hands/left_ring_finger_active.svg';
import leftMiddleSvg from '../assets/typing_hands/left_middle_finger_active.svg';
import leftIndexSvg from '../assets/typing_hands/left_index_finger_active.svg';
import leftThumbSvg from '../assets/typing_hands/left_thumb_active.svg';
import leftNeutralSvg from '../assets/typing_hands/left_neutral.svg';

import rightThumbSvg from '../assets/typing_hands/right_thumb_active.svg';
import rightIndexSvg from '../assets/typing_hands/right_index_finger_active.svg';
import rightMiddleSvg from '../assets/typing_hands/right_middle_finger_active.svg';
import rightRingSvg from '../assets/typing_hands/right_ring_finger_active.svg';
import rightPinkySvg from '../assets/typing_hands/right_pinky_active.svg';
import rightNeutralSvg from '../assets/typing_hands/right_neutral.svg';

interface HandGuideProps {
  targetChar?: string;
  compact?: boolean;
  className?: string;
}

const ACTIVE_COLOR = '#42c998';

export const HandGuide: React.FC<HandGuideProps> = ({
  targetChar,
  compact = false,
  className = '',
}) => {
  const { language } = useTranslation();
  const analysis = analyzeCharacter(targetChar);

  const isSpaceKey =
    targetChar === ' ' ||
    analysis.primaryKey === 'Space' ||
    targetChar === 'Space' ||
    targetChar === '␣';

  // Active fingers mapping (Active color is always #42c998)
  const activeFingers = new Set<number>();

  if (isSpaceKey) {
    // Both thumbs are active for Space key
    activeFingers.add(5); // Left thumb
    activeFingers.add(6); // Right thumb
  } else {
    if (analysis.fingerIndex) {
      activeFingers.add(analysis.fingerIndex);
    }
  }

  // If Shift is needed, add shift pinky
  if (analysis.needsShift) {
    if (analysis.shiftSide === 'left') {
      activeFingers.add(1); // Left pinky
    } else {
      activeFingers.add(10); // Right pinky
    }
  }

  // Left hand asset selection
  let leftHandSvg = leftNeutralSvg;
  let isLeftActive = false;

  if (activeFingers.has(1)) {
    leftHandSvg = leftPinkySvg;
    isLeftActive = true;
  } else if (activeFingers.has(2)) {
    leftHandSvg = leftRingSvg;
    isLeftActive = true;
  } else if (activeFingers.has(3)) {
    leftHandSvg = leftMiddleSvg;
    isLeftActive = true;
  } else if (activeFingers.has(4)) {
    leftHandSvg = leftIndexSvg;
    isLeftActive = true;
  } else if (activeFingers.has(5)) {
    leftHandSvg = leftThumbSvg;
    isLeftActive = true;
  }

  // Right hand asset selection
  let rightHandSvg = rightNeutralSvg;
  let isRightActive = false;

  if (activeFingers.has(6)) {
    rightHandSvg = rightThumbSvg;
    isRightActive = true;
  } else if (activeFingers.has(7)) {
    rightHandSvg = rightIndexSvg;
    isRightActive = true;
  } else if (activeFingers.has(8)) {
    rightHandSvg = rightMiddleSvg;
    isRightActive = true;
  } else if (activeFingers.has(9)) {
    rightHandSvg = rightRingSvg;
    isRightActive = true;
  } else if (activeFingers.has(10)) {
    rightHandSvg = rightPinkySvg;
    isRightActive = true;
  }

  return (
    <div
      id="hand-guide-container"
      className={`w-full bg-white rounded-2xl border border-slate-200 shadow-xs transition-all select-none flex flex-col justify-between ${
        compact ? 'p-2.5 sm:p-3 h-full' : 'max-w-4xl mx-auto p-3 sm:p-4'
      } ${className}`}
    >
      {/* Top Header Information */}
      <div className="flex items-center justify-between px-1 pb-1.5 mb-1.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: ACTIVE_COLOR }}
          />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-heading truncate">
            {language === 'vi' ? 'Tư thế ngón tay' : 'Finger Posture'}
          </span>
        </div>

        {/* Live Target Key Display */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium shrink-0">
          <span className="text-slate-400 hidden xl:inline">
            {language === 'vi' ? 'Phím:' : 'Key:'}
          </span>
          <span
            className="px-2 py-0.5 rounded-md font-black text-[11px] text-slate-900 shadow-xs font-mono"
            style={{
              backgroundColor: ACTIVE_COLOR,
            }}
          >
            {isSpaceKey ? 'SPACE' : targetChar || '—'}
          </span>

          {analysis.needsShift && (
            <span
              className="px-1.5 py-0.5 rounded-md font-bold text-[9px] text-slate-900 border animate-pulse"
              style={{
                backgroundColor: `${ACTIVE_COLOR}25`,
                borderColor: ACTIVE_COLOR,
              }}
            >
              +Shift ({analysis.shiftSide === 'left' ? (language === 'vi' ? 'Út L' : 'L-Pinky') : (language === 'vi' ? 'Út R' : 'R-Pinky')})
            </span>
          )}
        </div>
      </div>

      {/* Side-by-side Dual Vector Hands Display */}
      <div
        className={`grid grid-cols-2 gap-2 sm:gap-3 items-center justify-items-center flex-1 ${
          compact ? 'py-1' : 'py-2 px-4 max-w-2xl mx-auto'
        }`}
      >
        {/* Left Hand Container */}
        <div
          id="left-hand-display"
          className={`relative w-full aspect-[130/165] flex items-center justify-center rounded-xl p-1.5 transition-all ${
            compact ? 'max-h-28 sm:max-h-32' : 'max-h-48 sm:max-h-56'
          } ${
            isLeftActive
              ? 'bg-slate-50/90 ring-2 ring-[#42c998]/40 border border-[#42c998]/30 shadow-xs'
              : 'bg-slate-50/40 border border-slate-100'
          }`}
        >
          <img
            src={leftHandSvg}
            alt="Left Hand"
            className="w-full h-full object-contain filter drop-shadow-xs transition-all duration-150"
            referrerPolicy="no-referrer"
          />

          {/* Active Key Badge */}
          {isLeftActive && (
            <div
              className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-black text-slate-950 shadow-md animate-bounce"
              style={{ backgroundColor: ACTIVE_COLOR }}
            >
              {isSpaceKey ? '␣' : analysis.keyLabel || targetChar || ''}
            </div>
          )}
        </div>

        {/* Right Hand Container */}
        <div
          id="right-hand-display"
          className={`relative w-full aspect-[130/165] flex items-center justify-center rounded-xl p-1.5 transition-all ${
            compact ? 'max-h-28 sm:max-h-32' : 'max-h-48 sm:max-h-56'
          } ${
            isRightActive
              ? 'bg-slate-50/90 ring-2 ring-[#42c998]/40 border border-[#42c998]/30 shadow-xs'
              : 'bg-slate-50/40 border border-slate-100'
          }`}
        >
          <img
            src={rightHandSvg}
            alt="Right Hand"
            className="w-full h-full object-contain filter drop-shadow-xs transition-all duration-150"
            referrerPolicy="no-referrer"
          />

          {/* Active Key Badge */}
          {isRightActive && (
            <div
              className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-black text-slate-950 shadow-md animate-bounce"
              style={{ backgroundColor: ACTIVE_COLOR }}
            >
              {isSpaceKey ? '␣' : analysis.keyLabel || targetChar || ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
