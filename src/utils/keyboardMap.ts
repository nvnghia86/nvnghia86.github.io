import { telexKeysForChar, normalizeNFC } from './vietnameseTelex';

export interface KeyInfo {
  code: string;
  char: string;
  shiftChar?: string;
  hand: 'left' | 'right' | 'thumb';
  finger: 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
  fingerIndex: number; // 1..10
  color: string;
  width?: string;
}

export const FINGER_COLORS: Record<string, string> = {
  left_pinky: '#fb7185',   // Pink/Rose
  left_ring: '#fb923c',    // Orange
  left_middle: '#facc15',  // Yellow
  left_index: '#4ade80',   // Green
  thumb: '#38bdf8',        // Cyan/Sky
  right_index: '#2dd4bf',  // Teal
  right_middle: '#818cf8', // Indigo
  right_ring: '#c084fc',   // Purple
  right_pinky: '#f472b6',  // Hot Pink
};

// Keyboard layout rows
export const KEYBOARD_ROWS: KeyInfo[][] = [
  // Row 1 (Number row)
  [
    { code: 'Backquote', char: '`', shiftChar: '~', hand: 'left', finger: 'pinky', fingerIndex: 1, color: FINGER_COLORS.left_pinky },
    { code: 'Digit1', char: '1', shiftChar: '!', hand: 'left', finger: 'pinky', fingerIndex: 1, color: FINGER_COLORS.left_pinky },
    { code: 'Digit2', char: '2', shiftChar: '@', hand: 'left', finger: 'ring', fingerIndex: 2, color: FINGER_COLORS.left_ring },
    { code: 'Digit3', char: '3', shiftChar: '#', hand: 'left', finger: 'middle', fingerIndex: 3, color: FINGER_COLORS.left_middle },
    { code: 'Digit4', char: '4', shiftChar: '$', hand: 'left', finger: 'index', fingerIndex: 4, color: FINGER_COLORS.left_index },
    { code: 'Digit5', char: '5', shiftChar: '%', hand: 'left', finger: 'index', fingerIndex: 4, color: FINGER_COLORS.left_index },
    { code: 'Digit6', char: '6', shiftChar: '^', hand: 'right', finger: 'index', fingerIndex: 7, color: FINGER_COLORS.right_index },
    { code: 'Digit7', char: '7', shiftChar: '&', hand: 'right', finger: 'index', fingerIndex: 7, color: FINGER_COLORS.right_index },
    { code: 'Digit8', char: '8', shiftChar: '*', hand: 'right', finger: 'middle', fingerIndex: 8, color: FINGER_COLORS.right_middle },
    { code: 'Digit9', char: '9', shiftChar: '(', hand: 'right', finger: 'ring', fingerIndex: 9, color: FINGER_COLORS.right_ring },
    { code: 'Digit0', char: '0', shiftChar: ')', hand: 'right', finger: 'pinky', fingerIndex: 10, color: FINGER_COLORS.right_pinky },
    { code: 'Minus', char: '-', shiftChar: '_', hand: 'right', finger: 'pinky', fingerIndex: 10, color: FINGER_COLORS.right_pinky },
    { code: 'Equal', char: '=', shiftChar: '+', hand: 'right', finger: 'pinky', fingerIndex: 10, color: FINGER_COLORS.right_pinky },
    { code: 'Backspace', char: 'Backspace', hand: 'right', finger: 'pinky', fingerIndex: 10, color: '#94a3b8', width: 'w-16 sm:w-20' },
  ],
  // Row 2 (QWERTY)
  [
    { code: 'Tab', char: 'Tab', hand: 'left', finger: 'pinky', fingerIndex: 1, color: '#94a3b8', width: 'w-12 sm:w-16' },
    { code: 'KeyQ', char: 'q', shiftChar: 'Q', hand: 'left', finger: 'pinky', fingerIndex: 1, color: FINGER_COLORS.left_pinky },
    { code: 'KeyW', char: 'w', shiftChar: 'W', hand: 'left', finger: 'ring', fingerIndex: 2, color: FINGER_COLORS.left_ring },
    { code: 'KeyE', char: 'e', shiftChar: 'E', hand: 'left', finger: 'middle', fingerIndex: 3, color: FINGER_COLORS.left_middle },
    { code: 'KeyR', char: 'r', shiftChar: 'R', hand: 'left', finger: 'index', fingerIndex: 4, color: FINGER_COLORS.left_index },
    { code: 'KeyT', char: 't', shiftChar: 'T', hand: 'left', finger: 'index', fingerIndex: 4, color: FINGER_COLORS.left_index },
    { code: 'KeyY', char: 'y', shiftChar: 'Y', hand: 'right', finger: 'index', fingerIndex: 7, color: FINGER_COLORS.right_index },
    { code: 'KeyU', char: 'u', shiftChar: 'U', hand: 'right', finger: 'index', fingerIndex: 7, color: FINGER_COLORS.right_index },
    { code: 'KeyI', char: 'i', shiftChar: 'I', hand: 'right', finger: 'middle', fingerIndex: 8, color: FINGER_COLORS.right_middle },
    { code: 'KeyO', char: 'o', shiftChar: 'O', hand: 'right', finger: 'ring', fingerIndex: 9, color: FINGER_COLORS.right_ring },
    { code: 'KeyP', char: 'p', shiftChar: 'P', hand: 'right', finger: 'pinky', fingerIndex: 10, color: FINGER_COLORS.right_pinky },
    { code: 'BracketLeft', char: '[', shiftChar: '{', hand: 'right', finger: 'pinky', fingerIndex: 10, color: FINGER_COLORS.right_pinky },
    { code: 'BracketRight', char: ']', shiftChar: '}', hand: 'right', finger: 'pinky', fingerIndex: 10, color: FINGER_COLORS.right_pinky },
    { code: 'Backslash', char: '\\', shiftChar: '|', hand: 'right', finger: 'pinky', fingerIndex: 10, color: FINGER_COLORS.right_pinky, width: 'w-10 sm:w-14' },
  ],
  // Row 3 (Home Row)
  [
    { code: 'CapsLock', char: 'Caps', hand: 'left', finger: 'pinky', fingerIndex: 1, color: '#94a3b8', width: 'w-14 sm:w-18' },
    { code: 'KeyA', char: 'a', shiftChar: 'A', hand: 'left', finger: 'pinky', fingerIndex: 1, color: FINGER_COLORS.left_pinky },
    { code: 'KeyS', char: 's', shiftChar: 'S', hand: 'left', finger: 'ring', fingerIndex: 2, color: FINGER_COLORS.left_ring },
    { code: 'KeyD', char: 'd', shiftChar: 'D', hand: 'left', finger: 'middle', fingerIndex: 3, color: FINGER_COLORS.left_middle },
    { code: 'KeyF', char: 'f', shiftChar: 'F', hand: 'left', finger: 'index', fingerIndex: 4, color: FINGER_COLORS.left_index },
    { code: 'KeyG', char: 'g', shiftChar: 'G', hand: 'left', finger: 'index', fingerIndex: 4, color: FINGER_COLORS.left_index },
    { code: 'KeyH', char: 'h', shiftChar: 'H', hand: 'right', finger: 'index', fingerIndex: 7, color: FINGER_COLORS.right_index },
    { code: 'KeyJ', char: 'j', shiftChar: 'J', hand: 'right', finger: 'index', fingerIndex: 7, color: FINGER_COLORS.right_index },
    { code: 'KeyK', char: 'k', shiftChar: 'K', hand: 'right', finger: 'middle', fingerIndex: 8, color: FINGER_COLORS.right_middle },
    { code: 'KeyL', char: 'l', shiftChar: 'L', hand: 'right', finger: 'ring', fingerIndex: 9, color: FINGER_COLORS.right_ring },
    { code: 'Semicolon', char: ';', shiftChar: ':', hand: 'right', finger: 'pinky', fingerIndex: 10, color: FINGER_COLORS.right_pinky },
    { code: 'Quote', char: "'", shiftChar: '"', hand: 'right', finger: 'pinky', fingerIndex: 10, color: FINGER_COLORS.right_pinky },
    { code: 'Enter', char: 'Enter', hand: 'right', finger: 'pinky', fingerIndex: 10, color: '#94a3b8', width: 'w-16 sm:w-22' },
  ],
  // Row 4 (Bottom Row)
  [
    { code: 'ShiftLeft', char: 'Shift', hand: 'left', finger: 'pinky', fingerIndex: 1, color: '#94a3b8', width: 'w-16 sm:w-24' },
    { code: 'KeyZ', char: 'z', shiftChar: 'Z', hand: 'left', finger: 'pinky', fingerIndex: 1, color: FINGER_COLORS.left_pinky },
    { code: 'KeyX', char: 'x', shiftChar: 'X', hand: 'left', finger: 'ring', fingerIndex: 2, color: FINGER_COLORS.left_ring },
    { code: 'KeyC', char: 'c', shiftChar: 'C', hand: 'left', finger: 'middle', fingerIndex: 3, color: FINGER_COLORS.left_middle },
    { code: 'KeyV', char: 'v', shiftChar: 'V', hand: 'left', finger: 'index', fingerIndex: 4, color: FINGER_COLORS.left_index },
    { code: 'KeyB', char: 'b', shiftChar: 'B', hand: 'left', finger: 'index', fingerIndex: 4, color: FINGER_COLORS.left_index },
    { code: 'KeyN', char: 'n', shiftChar: 'N', hand: 'right', finger: 'index', fingerIndex: 7, color: FINGER_COLORS.right_index },
    { code: 'KeyM', char: 'm', shiftChar: 'M', hand: 'right', finger: 'index', fingerIndex: 7, color: FINGER_COLORS.right_index },
    { code: 'Comma', char: ',', shiftChar: '<', hand: 'right', finger: 'middle', fingerIndex: 8, color: FINGER_COLORS.right_middle },
    { code: 'Period', char: '.', shiftChar: '>', hand: 'right', finger: 'ring', fingerIndex: 9, color: FINGER_COLORS.right_ring },
    { code: 'Slash', char: '/', shiftChar: '?', hand: 'right', finger: 'pinky', fingerIndex: 10, color: FINGER_COLORS.right_pinky },
    { code: 'ShiftRight', char: 'Shift', hand: 'right', finger: 'pinky', fingerIndex: 10, color: '#94a3b8', width: 'w-16 sm:w-24' },
  ],
  // Row 5 (Space Row)
  [
    { code: 'Space', char: 'Space', hand: 'thumb', finger: 'thumb', fingerIndex: 5, color: FINGER_COLORS.thumb, width: 'w-64 sm:w-80' },
  ],
];

export interface TargetKeyAnalysis {
  primaryKey: string;
  needsShift: boolean;
  shiftSide: 'left' | 'right' | null;
  hand: 'left' | 'right' | 'thumb';
  finger: 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
  fingerIndex: number;
  fingerLabel: string;
  keyLabel: string;
}

export function analyzeCharacter(char: string | undefined): TargetKeyAnalysis {
  if (!char) {
    return {
      primaryKey: 'Space',
      needsShift: false,
      shiftSide: null,
      hand: 'thumb',
      finger: 'thumb',
      fingerIndex: 5,
      fingerLabel: 'Right Thumb',
      keyLabel: 'Space',
    };
  }

  if (char === ' ') {
    return {
      primaryKey: 'Space',
      needsShift: false,
      shiftSide: null,
      hand: 'thumb',
      finger: 'thumb',
      fingerIndex: 5,
      fingerLabel: 'Thumb',
      keyLabel: 'Space',
    };
  }

  // Control-key labels are multi-character strings, not text to convert via
  // Telex. Handle them before examining their first letter (`Backspace` must
  // highlight Backspace, never the B key).
  const controlKey = KEYBOARD_ROWS.flat().find((key) => key.char === char);
  if (controlKey && ['Backspace', 'Tab', 'Enter', 'Space', 'Caps'].includes(char)) {
    const fingerNames = {
      1: 'Left Pinky',
      2: 'Left Ring',
      3: 'Left Middle',
      4: 'Left Index',
      5: 'Left Thumb',
      6: 'Right Thumb',
      7: 'Right Index',
      8: 'Right Middle',
      9: 'Right Ring',
      10: 'Right Pinky',
    };
    return {
      primaryKey: controlKey.code,
      needsShift: false,
      shiftSide: null,
      hand: controlKey.hand,
      finger: controlKey.finger,
      fingerIndex: controlKey.fingerIndex,
      fingerLabel: fingerNames[controlKey.fingerIndex as keyof typeof fingerNames] || 'Finger',
      keyLabel: controlKey.char.toUpperCase(),
    };
  }

  const normalized = normalizeNFC(char);
  let searchChar = normalized;

  // If character is a composite Vietnamese char and not in keyboard rows, look up its first Telex physical key
  const telexKeys = telexKeysForChar(normalized);
  if (telexKeys.length > 0 && telexKeys[0] !== normalized) {
    searchChar = telexKeys[0];
  }

  for (const row of KEYBOARD_ROWS) {
    for (const key of row) {
      if (key.char === searchChar) {
        const fingerNames = {
          1: 'Left Pinky',
          2: 'Left Ring',
          3: 'Left Middle',
          4: 'Left Index',
          5: 'Left Thumb',
          6: 'Right Thumb',
          7: 'Right Index',
          8: 'Right Middle',
          9: 'Right Ring',
          10: 'Right Pinky',
        };
        return {
          primaryKey: key.code,
          needsShift: false,
          shiftSide: null,
          hand: key.hand,
          finger: key.finger,
          fingerIndex: key.fingerIndex,
          fingerLabel: fingerNames[key.fingerIndex as keyof typeof fingerNames] || 'Finger',
          keyLabel: key.char.toUpperCase(),
        };
      }
      if (key.shiftChar === searchChar) {
        // If key is typed by left hand, use Right Shift; if typed by right hand, use Left Shift
        const isLeft = key.hand === 'left';
        const shiftSide: 'left' | 'right' = isLeft ? 'right' : 'left';
        const fingerNames = {
          1: 'Left Pinky',
          2: 'Left Ring',
          3: 'Left Middle',
          4: 'Left Index',
          5: 'Left Thumb',
          6: 'Right Thumb',
          7: 'Right Index',
          8: 'Right Middle',
          9: 'Right Ring',
          10: 'Right Pinky',
        };
        return {
          primaryKey: key.code,
          needsShift: true,
          shiftSide,
          hand: key.hand,
          finger: key.finger,
          fingerIndex: key.fingerIndex,
          fingerLabel: `${isLeft ? 'Right Pinky (Shift) + ' : 'Left Pinky (Shift) + '}${fingerNames[key.fingerIndex as keyof typeof fingerNames]}`,
          keyLabel: key.shiftChar,
        };
      }
    }
  }

  // Fallback
  return {
    primaryKey: 'Key' + searchChar.toUpperCase(),
    needsShift: searchChar === searchChar.toUpperCase() && searchChar !== searchChar.toLowerCase(),
    shiftSide: 'left',
    hand: 'left',
    finger: 'index',
    fingerIndex: 4,
    fingerLabel: 'Index Finger',
    keyLabel: searchChar,
  };
}
