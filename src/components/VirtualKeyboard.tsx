import React from 'react';
import { KEYBOARD_ROWS, analyzeCharacter } from '../utils/keyboardMap';
import { useTranslation } from '../i18n';

// Hand SVG imports — same assets as HandGuide
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

interface VirtualKeyboardProps {
  targetChar?: string;
  activePressedKey?: string;
  isCapsLock?: boolean;
  /** When true, shows a floating tutorial card above the target key */
  showFingerOverlay?: boolean;
}

const ACTIVE_COLOR = '#42c998';

/** Returns the correct hand SVG asset for a given fingerIndex (1..10) */
function getHandSvg(fingerIndex: number, side: 'left' | 'right' | 'thumb'): { left: string; right: string } {
  if (side === 'thumb' || fingerIndex === 5 || fingerIndex === 6) {
    return { left: leftThumbSvg, right: rightThumbSvg };
  }
  const leftMap: Record<number, string> = {
    1: leftPinkySvg,
    2: leftRingSvg,
    3: leftMiddleSvg,
    4: leftIndexSvg,
    5: leftThumbSvg,
  };
  const rightMap: Record<number, string> = {
    6: rightThumbSvg,
    7: rightIndexSvg,
    8: rightMiddleSvg,
    9: rightRingSvg,
    10: rightPinkySvg,
  };
  if (fingerIndex <= 5) {
    return { left: leftMap[fingerIndex] || leftNeutralSvg, right: rightNeutralSvg };
  }
  return { left: leftNeutralSvg, right: rightMap[fingerIndex] || rightNeutralSvg };
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  targetChar,
  activePressedKey,
  isCapsLock = false,
  showFingerOverlay = false,
}) => {
  const { t, language } = useTranslation();
  const analysis = analyzeCharacter(targetChar);

  const fingerLabels: Record<number, { vi: string; en: string }> = {
    1:  { vi: 'Út trái', en: 'L. Pinky' },
    2:  { vi: 'Áp út trái', en: 'L. Ring' },
    3:  { vi: 'Giữa trái', en: 'L. Middle' },
    4:  { vi: 'Trỏ trái', en: 'L. Index' },
    5:  { vi: 'Ngón cái', en: 'L. Thumb' },
    6:  { vi: 'Ngón cái', en: 'R. Thumb' },
    7:  { vi: 'Trỏ phải', en: 'R. Index' },
    8:  { vi: 'Giữa phải', en: 'R. Middle' },
    9:  { vi: 'Áp út phải', en: 'R. Ring' },
    10: { vi: 'Út phải', en: 'R. Pinky' },
  };

  const handSvgs = getHandSvg(analysis.fingerIndex, analysis.hand);
  const isLeftHand = analysis.fingerIndex <= 5;
  const activeSvg = isLeftHand ? handSvgs.left : handSvgs.right;
  const neutralSvg = isLeftHand ? rightNeutralSvg : leftNeutralSvg;
  const fingerLabel = fingerLabels[analysis.fingerIndex]?.[language === 'vi' ? 'vi' : 'en'] || analysis.fingerLabel;

  return (
    <div
      id="virtual-keyboard-container"
      className="w-full max-w-4xl mx-auto select-none bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-md transition-all"
    >
      {/* Target Key Helper Hint */}
      <div className="flex items-center justify-between px-2 mb-2.5 text-xs sm:text-sm font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">{t.typingEngine.nextKeyLabel}:</span>
          <span
            className="px-2.5 py-0.5 rounded-lg text-slate-950 font-mono font-black border border-emerald-600/30 text-xs sm:text-sm shadow-xs"
            style={{ backgroundColor: ACTIVE_COLOR }}
          >
            {targetChar === ' ' ? 'SPACEBAR' : targetChar || 'NONE'}
          </span>
          {analysis.needsShift && (
            <span
              className="px-2 py-0.5 rounded-lg text-slate-900 border font-mono text-xs font-bold animate-pulse"
              style={{
                backgroundColor: `${ACTIVE_COLOR}25`,
                borderColor: ACTIVE_COLOR,
              }}
            >
              + Hold {analysis.shiftSide === 'left' ? 'LEFT SHIFT' : 'RIGHT SHIFT'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCapsLock && (
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs animate-bounce">
              CAPS LOCK ON
            </span>
          )}
        </div>
      </div>

      {/* Keyboard Matrix */}
      <div className="flex flex-col gap-1 sm:gap-1.5 items-center justify-center">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1 sm:gap-1.5 w-full justify-center">
            {row.map((key) => {
              const isTargetKey = analysis.primaryKey === key.code;
              const isTargetShift =
                analysis.needsShift &&
                ((analysis.shiftSide === 'left' && key.code === 'ShiftLeft') ||
                  (analysis.shiftSide === 'right' && key.code === 'ShiftRight'));

              const isPhysicallyPressed = activePressedKey === key.code;
              const isHomeBump = key.code === 'KeyF' || key.code === 'KeyJ';

              let keyStyle = 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs';
              let glowStyle = '';
              let inlineStyle: React.CSSProperties = {
                borderBottomWidth: isPhysicallyPressed ? '1px' : '3px',
              };

              if (isTargetKey || isTargetShift) {
                keyStyle = 'text-slate-950 font-black border-[#2eb986] shadow-md shadow-[#42c998]/40 scale-105 z-10';
                glowStyle = 'ring-2 ring-[#42c998] ring-offset-2 ring-offset-white';
                inlineStyle.backgroundColor = ACTIVE_COLOR;
              } else if (isPhysicallyPressed) {
                keyStyle = 'bg-slate-800 text-white font-bold border-slate-900 shadow-md scale-95';
              }

              const customWidth = key.width || 'flex-1 min-w-[24px] sm:min-w-[36px] max-w-[54px]';

              return (
                <div
                  key={key.code}
                  id={`key-${key.code}`}
                  className={`relative flex flex-col items-center justify-center h-8 sm:h-11 rounded-lg sm:rounded-xl border font-mono text-xs sm:text-sm font-semibold transition-all duration-75 select-none ${customWidth} ${keyStyle} ${glowStyle}`}
                  style={inlineStyle}
                >
                  {/* Tactile Raised Bumps on F & J */}
                  {isHomeBump && !isTargetKey && (
                    <span className="absolute bottom-1 w-3 h-0.5 bg-slate-400 rounded-full" />
                  )}

                  {/* Key labels */}
                  {key.shiftChar && key.shiftChar !== key.char && (
                    <span className="text-[10px] sm:text-[11px] leading-tight opacity-75">
                      {key.shiftChar}
                    </span>
                  )}
                  <span className="leading-tight">
                    {key.char === 'Space' ? '—' : key.char.toUpperCase()}
                  </span>

                  {/* ── PHƯƠNG ÁN B: Floating Finger Tutorial Card ── */}
                  {showFingerOverlay && isTargetKey && (
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none"
                      style={{ minWidth: '140px' }}
                    >
                      {/* Card */}
                      <div
                        className="rounded-2xl border-2 shadow-2xl bg-white flex flex-col items-center p-2 gap-1 animate-pulse-slow"
                        style={{ borderColor: ACTIVE_COLOR, boxShadow: `0 8px 32px ${ACTIVE_COLOR}55` }}
                      >
                        {/* Mini Dual Hands — left hand always on left, right hand always on right */}
                        <div className="flex gap-1 items-center justify-center w-full">
                          {/* Left hand slot */}
                          <div
                            className={`rounded-xl p-1 flex-1 transition-all ${isLeftHand ? '' : 'opacity-30'}`}
                            style={isLeftHand ? { background: `${ACTIVE_COLOR}18` } : {}}
                          >
                            <img
                              src={isLeftHand ? activeSvg : leftNeutralSvg}
                              alt="Left hand"
                              className="w-full object-contain"
                              style={{ maxHeight: '72px' }}
                            />
                          </div>
                          {/* Right hand slot */}
                          <div
                            className={`rounded-xl p-1 flex-1 transition-all ${!isLeftHand ? '' : 'opacity-30'}`}
                            style={!isLeftHand ? { background: `${ACTIVE_COLOR}18` } : {}}
                          >
                            <img
                              src={!isLeftHand ? activeSvg : rightNeutralSvg}
                              alt="Right hand"
                              className="w-full object-contain"
                              style={{ maxHeight: '72px' }}
                            />
                          </div>
                        </div>

                        {/* Finger label */}
                        <div
                          className="text-[10px] font-bold rounded-lg px-2 py-0.5 text-slate-900 font-heading w-full text-center"
                          style={{ backgroundColor: ACTIVE_COLOR }}
                        >
                          {fingerLabel}
                        </div>

                        {/* Key hint */}
                        <div className="text-[9px] text-slate-500 font-mono font-semibold">
                          {language === 'vi' ? 'nhấn' : 'press'}{' '}
                          <span className="font-black text-slate-800">
                            {key.char === 'Space' ? 'SPACE' : key.char.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Downward arrow pointing to key */}
                      <div className="flex justify-center">
                        <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                          <path d="M10 16L0 0H20L10 16Z" fill={ACTIVE_COLOR} />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
