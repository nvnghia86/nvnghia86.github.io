import React from 'react';
import { KEYBOARD_ROWS, analyzeCharacter } from '../utils/keyboardMap';

interface VirtualKeyboardProps {
  targetChar?: string;
  activePressedKey?: string;
  isCapsLock?: boolean;
}

const ACTIVE_COLOR = '#42c998';

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  targetChar,
  activePressedKey,
  isCapsLock = false,
}) => {
  const analysis = analyzeCharacter(targetChar);

  return (
    <div
      id="virtual-keyboard-container"
      className="w-full max-w-4xl mx-auto select-none bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-md transition-all"
    >
      {/* Target Key Helper Hint */}
      <div className="flex items-center justify-between px-2 mb-2.5 text-xs sm:text-sm font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Next Key:</span>
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
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
