const color = {
  leftPinky: '#fb7185', leftRing: '#fb923c', leftMiddle: '#facc15', leftIndex: '#4ade80', thumb: '#38bdf8', rightIndex: '#2dd4bf', rightMiddle: '#818cf8', rightRing: '#c084fc', rightPinky: '#f472b6',
};

const key = (code, char, finger, options = {}) => ({ code, char, finger, color: color[finger] || '#94a3b8', ...options });

export const keyboardRows = [
  [key('Backquote', '`', 'leftPinky', { shiftChar: '~' }), key('Digit1', '1', 'leftPinky', { shiftChar: '!' }), key('Digit2', '2', 'leftRing', { shiftChar: '@' }), key('Digit3', '3', 'leftMiddle', { shiftChar: '#' }), key('Digit4', '4', 'leftIndex', { shiftChar: '$' }), key('Digit5', '5', 'leftIndex', { shiftChar: '%' }), key('Digit6', '6', 'rightIndex', { shiftChar: '^' }), key('Digit7', '7', 'rightIndex', { shiftChar: '&' }), key('Digit8', '8', 'rightMiddle', { shiftChar: '*' }), key('Digit9', '9', 'rightRing', { shiftChar: '(' }), key('Digit0', '0', 'rightPinky', { shiftChar: ')' }), key('Minus', '-', 'rightPinky', { shiftChar: '_' }), key('Equal', '=', 'rightPinky', { shiftChar: '+' }), key('Backspace', 'Backspace', 'rightPinky', { width: 'wide' })],
  [key('Tab', 'Tab', 'leftPinky', { width: 'medium' }), key('KeyQ', 'q', 'leftPinky', { shiftChar: 'Q' }), key('KeyW', 'w', 'leftRing', { shiftChar: 'W' }), key('KeyE', 'e', 'leftMiddle', { shiftChar: 'E' }), key('KeyR', 'r', 'leftIndex', { shiftChar: 'R' }), key('KeyT', 't', 'leftIndex', { shiftChar: 'T' }), key('KeyY', 'y', 'rightIndex', { shiftChar: 'Y' }), key('KeyU', 'u', 'rightIndex', { shiftChar: 'U' }), key('KeyI', 'i', 'rightMiddle', { shiftChar: 'I' }), key('KeyO', 'o', 'rightRing', { shiftChar: 'O' }), key('KeyP', 'p', 'rightPinky', { shiftChar: 'P' }), key('BracketLeft', '[', 'rightPinky', { shiftChar: '{' }), key('BracketRight', ']', 'rightPinky', { shiftChar: '}' }), key('Backslash', '\\', 'rightPinky', { shiftChar: '|', width: 'small' })],
  [key('CapsLock', 'Caps', 'leftPinky', { width: 'medium' }), key('KeyA', 'a', 'leftPinky', { shiftChar: 'A' }), key('KeyS', 's', 'leftRing', { shiftChar: 'S' }), key('KeyD', 'd', 'leftMiddle', { shiftChar: 'D' }), key('KeyF', 'f', 'leftIndex', { shiftChar: 'F' }), key('KeyG', 'g', 'leftIndex', { shiftChar: 'G' }), key('KeyH', 'h', 'rightIndex', { shiftChar: 'H' }), key('KeyJ', 'j', 'rightIndex', { shiftChar: 'J' }), key('KeyK', 'k', 'rightMiddle', { shiftChar: 'K' }), key('KeyL', 'l', 'rightRing', { shiftChar: 'L' }), key('Semicolon', ';', 'rightPinky', { shiftChar: ':' }), key('Quote', "'", 'rightPinky', { shiftChar: '"' }), key('Enter', 'Enter', 'rightPinky', { width: 'wide' })],
  [key('ShiftLeft', 'Shift', 'leftPinky', { width: 'wide' }), key('KeyZ', 'z', 'leftPinky', { shiftChar: 'Z' }), key('KeyX', 'x', 'leftRing', { shiftChar: 'X' }), key('KeyC', 'c', 'leftMiddle', { shiftChar: 'C' }), key('KeyV', 'v', 'leftIndex', { shiftChar: 'V' }), key('KeyB', 'b', 'leftIndex', { shiftChar: 'B' }), key('KeyN', 'n', 'rightIndex', { shiftChar: 'N' }), key('KeyM', 'm', 'rightIndex', { shiftChar: 'M' }), key('Comma', ',', 'rightMiddle', { shiftChar: '<' }), key('Period', '.', 'rightRing', { shiftChar: '>' }), key('Slash', '/', 'rightPinky', { shiftChar: '?' }), key('ShiftRight', 'Shift', 'rightPinky', { width: 'wide' })],
  [key('Space', 'Space', 'thumb', { width: 'space' })],
];

const shiftedKeys = { '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', _: '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/' };
const fingerIndex = { leftPinky: 1, leftRing: 2, leftMiddle: 3, leftIndex: 4, thumb: 5, rightIndex: 7, rightMiddle: 8, rightRing: 9, rightPinky: 10 };

export function baseCharacter(char = '') {
  if (char === ' ') return ' ';
  if (shiftedKeys[char]) return shiftedKeys[char];
  const normalized = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, value => value === 'Đ' ? 'D' : 'd');
  return normalized[0] || char;
}

export function analyzeKey(char = '') {
  if (char === ' ') return { code: 'Space', char: ' ', finger: 'thumb', fingerIndex: 5, needsShift: false, shiftSide: null };
  const base = baseCharacter(char);
  const found = keyboardRows.flat().find(item => item.char === base.toLowerCase() || item.char === base || item.shiftChar === base);
  const needsShift = Boolean(found && (found.shiftChar === char || (base !== base.toLowerCase() && base !== base.toUpperCase())));
  const finger = found?.finger || 'leftIndex';
  const isLeft = finger.startsWith('left');
  return { code: found?.code || `Key${base.toUpperCase()}`, char: base, finger, fingerIndex: fingerIndex[finger] || 4, needsShift, shiftSide: needsShift ? (isLeft ? 'right' : 'left') : null };
}
