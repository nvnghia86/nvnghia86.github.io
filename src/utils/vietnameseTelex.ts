/**
 * Vietnamese Telex Typing Rules Engine
 * Implements specifications from VIETNAMESE_TELEX_RULES.md
 */

// Mapping of Unicode combining tone marks to Telex keys
export const TONE_KEYS: Record<string, string> = {
  '\u0301': 's', // Sắc
  '\u0300': 'f', // Huyền
  '\u0309': 'r', // Hỏi
  '\u0303': 'x', // Ngã
  '\u0323': 'j', // Nặng
};

// Aliases for standard physical keyboard mapping
export const KEYBOARD_ALIASES: Record<string, string> = {
  ':': ';',
  '"': "'",
  '?': '/',
  '_': '-',
  '+': '=',
  '*': '8',
  '<': ',',
  '>': '.',
};

/**
 * Standardize Unicode to NFC form
 */
export function normalizeNFC(value: string | undefined | null): string {
  return (value || '').normalize('NFC');
}

/**
 * Check if a character or text contains Vietnamese-specific diacritics
 */
export function isVietnameseText(text: string): boolean {
  const vietnameseRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/i;
  return vietnameseRegex.test(text);
}

/**
 * Decompose character and convert to Telex physical key sequence
 * Rules:
 * - 'ă' -> 'aw'
 * - 'â' -> 'aa'
 * - 'ê' -> 'ee'
 * - 'ô' -> 'oo'
 * - 'ơ' -> 'ow'
 * - 'ư' -> 'uw'
 * - 'đ' -> 'dd'
 * - 'đ' is handled prior to aliases
 * - Tone marks: sắc (s), huyền (f), hỏi (r), ngã (x), nặng (j)
 */
export function telexKeysForChar(char: string): string[] {
  if (!char) return [];
  if (char === ' ') return [' '];

  const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();

  // Special case: 'đ' and 'Đ' MUST be processed as 'dd' / 'DD' before any alias
  if (char.toLowerCase() === 'đ') {
    return isUpper ? ['D', 'd'] : ['d', 'd'];
  }

  // Decompose using NFD to separate base character and combining marks
  const decomposed = char.normalize('NFD');
  const baseRaw = decomposed[0] || '';
  const base = isUpper ? baseRaw.toUpperCase() : baseRaw.toLowerCase();

  if (!base) return [char];

  const marks = [...decomposed.slice(1)];
  const keys: string[] = [base];

  // Vowel modifications
  if (marks.includes('\u0306')) {
    // Breve -> ă
    keys.push(isUpper ? 'w' : 'w');
  }
  if (marks.includes('\u0302')) {
    // Circumflex -> â, ê, ô (repeat base character)
    keys.push(base.toLowerCase());
  }
  if (marks.includes('\u031B')) {
    // Horn -> ơ, ư
    keys.push('w');
  }

  // Tone marks
  for (const mark of marks) {
    if (TONE_KEYS[mark]) {
      keys.push(TONE_KEYS[mark]);
    }
  }

  // If no decomposing marks were found, return the character itself or alias
  if (keys.length === 1 && marks.length === 0) {
    return [char];
  }

  return keys;
}

/**
 * Convert full string into array of expected physical keystrokes
 */
export function textToPhysicalKeys(text: string, forceTelex: boolean = true): string[] {
  const normalized = normalizeNFC(text);
  const chars = [...normalized];
  const keys: string[] = [];

  for (const c of chars) {
    if (forceTelex || isVietnameseText(c)) {
      keys.push(...telexKeysForChar(c));
    } else {
      keys.push(c);
    }
  }

  return keys;
}

/**
 * Compare two characters ignoring case and normalized to NFC
 */
export function samePhysicalChar(a: string | undefined | null, b: string | undefined | null): boolean {
  if (a == null || b == null) return false;
  const left = normalizeNFC(a);
  const right = normalizeNFC(b);
  return left === right || left.toLowerCase() === right.toLowerCase();
}

/**
 * Telex Guide mapping table for reference in UI
 */
export const TELEX_VOWEL_RULES = [
  { telex: 'aa', result: 'â', nameVi: 'a + a = â', example: 'ba + a = bâ' },
  { telex: 'aw', result: 'ă', nameVi: 'a + w = ă', example: 'ba + w = băn' },
  { telex: 'ee', result: 'ê', nameVi: 'e + e = ê', example: 'be + e = bê' },
  { telex: 'oo', result: 'ô', nameVi: 'o + o = ô', example: 'bo + o = bô' },
  { telex: 'ow', result: 'ơ', nameVi: 'o + w = ơ', example: 'bo + w = bơ' },
  { telex: 'uw', result: 'ư', nameVi: 'u + w = ư', example: 'tu + w = tư' },
  { telex: 'dd', result: 'đ', nameVi: 'd + d = đ', example: 'd + d = đi' },
];

export const TELEX_TONE_RULES = [
  { key: 's', tone: 'Dấu Sắc (´)', example: 'a + s = á' },
  { key: 'f', tone: 'Dấu Huyền (`)', example: 'a + f = à' },
  { key: 'r', tone: 'Dấu Hỏi (?)', example: 'a + r = ả' },
  { key: 'x', tone: 'Dấu Ngã (~)', example: 'a + x = ã' },
  { key: 'j', tone: 'Dấu Nặng (.)', example: 'a + j = ạ' },
  { key: 'z', tone: 'Bỏ / Xóa dấu', example: 'as + z = a' },
];

export const VOWEL_MAP: Record<string, Record<string, string>> = {
  a: { a: 'â', w: 'ă' },
  A: { a: 'Â', w: 'Ă', A: 'Â', W: 'Ă' },
  e: { e: 'ê' },
  E: { e: 'Ê', E: 'Ê' },
  o: { o: 'ô', w: 'ơ' },
  O: { o: 'Ô', w: 'Ơ', O: 'Ô', W: 'Ơ' },
  u: { w: 'ư' },
  U: { w: 'Ư', W: 'Ư' },
  d: { d: 'đ' },
  D: { d: 'Đ', D: 'Đ' },
};

export const TONES: Record<string, string> = {
  s: '\u0301', // Sắc
  f: '\u0300', // Huyền
  r: '\u0309', // Hỏi
  x: '\u0303', // Ngã
  j: '\u0323', // Nặng
  z: '',       // Xóa dấu
};

/**
 * Apply tone mark to the proper nucleus vowel in a Vietnamese syllable
 */
export function applyToneToWord(word: string, toneMark: string): string {
  if (!word || !toneMark) return word || '';

  const decomposed = [...word].map((c) => ({
    char: c,
    nfd: c.normalize('NFD'),
  }));

  // Find all vowel indices in the word
  const allVowelIndices: number[] = [];
  decomposed.forEach((item, idx) => {
    if (/[aeiouy]/i.test(item.nfd[0])) allVowelIndices.push(idx);
  });

  if (allVowelIndices.length === 0) return word;

  // Filter out semi-vowel 'u' in initial 'qu' and 'i' in initial 'gi'
  const nucleusVowelIndices: number[] = [];
  const lowerWord = word.toLowerCase();

  for (let i = 0; i < allVowelIndices.length; i++) {
    const vIdx = allVowelIndices[i];
    // Check if 'u' is right after 'q' when other vowels follow (e.g. qua -> a is nucleus)
    if (
      lowerWord.startsWith('qu') &&
      vIdx === 1 &&
      allVowelIndices.length > 1
    ) {
      continue;
    }
    // Check if 'i' is right after 'g' when other vowels follow (e.g. gia, gio, giu -> a, o, u is nucleus)
    if (
      lowerWord.startsWith('gi') &&
      vIdx === 1 &&
      allVowelIndices.length > 1
    ) {
      continue;
    }
    nucleusVowelIndices.push(vIdx);
  }

  if (nucleusVowelIndices.length === 0) {
    nucleusVowelIndices.push(allVowelIndices[0]);
  }

  let targetIdx = nucleusVowelIndices[0];

  if (nucleusVowelIndices.length === 1) {
    targetIdx = nucleusVowelIndices[0];
  } else if (nucleusVowelIndices.length >= 2) {
    // Check for vowels with hats or horns: â, ă, ê, ô, ơ, ư
    // Priority: ê, ô, ơ, â, ă
    let specialIdx = -1;
    for (const vIdx of nucleusVowelIndices) {
      const ch = decomposed[vIdx].char.toLowerCase();
      if (ch === 'ê' || ch === 'ô' || ch === 'ơ' || ch === 'â' || ch === 'ă') {
        specialIdx = vIdx;
        break;
      }
    }

    if (specialIdx !== -1) {
      targetIdx = specialIdx;
    } else {
      const hasEndingConsonant =
        allVowelIndices[allVowelIndices.length - 1] < decomposed.length - 1;

      if (hasEndingConsonant) {
        // If there's an ending consonant (e.g., "toan", "hoang", "khuynh", "bien"), tone is on 2nd vowel
        targetIdx = nucleusVowelIndices[1] || nucleusVowelIndices[0];
      } else {
        // Open syllable (no ending consonant)
        const firstVowelChar = decomposed[nucleusVowelIndices[0]].nfd[0].toLowerCase();
        const secondVowelChar = decomposed[nucleusVowelIndices[1]].nfd[0].toLowerCase();
        const pair = firstVowelChar + secondVowelChar;

        // Diphthongs where tone stays on the 1st vowel in open syllable:
        // ia, ya, ua (when not after q), ưa
        // ai, ao, au, ay, eo, eu, oi, ui
        if (
          pair === 'ia' ||
          pair === 'ya' ||
          pair === 'ua' ||
          pair === 'ưa' ||
          pair === 'ai' ||
          pair === 'ao' ||
          pair === 'au' ||
          pair === 'ay' ||
          pair === 'eo' ||
          pair === 'eu' ||
          pair === 'oi' ||
          pair === 'ui'
        ) {
          targetIdx = nucleusVowelIndices[0];
        } else if (pair === 'oa' || pair === 'oe' || pair === 'uy') {
          // Modern standard: tone on 2nd vowel (hóa, hòe, thúy, thủy)
          targetIdx = nucleusVowelIndices[1];
        } else {
          targetIdx = nucleusVowelIndices[0];
        }
      }
    }
  }

  const target = decomposed[targetIdx];
  const baseAndMarks = target.nfd;
  const cleaned = baseAndMarks.replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '');
  decomposed[targetIdx].char = (cleaned + toneMark).normalize('NFC');
  return decomposed
    .map((d) => d.char)
    .join('')
    .normalize('NFC');
}

/**
 * Converts a series of raw keystrokes of a word into composed Vietnamese text
 */
export function telexWordToVietnamese(keys: string[]): string {
  if (!keys || keys.length === 0) return '';
  const chars: string[] = [];
  let toneMark: string | null = null;

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const kLower = k.toLowerCase();

    // Check tone mark key
    if (TONES[kLower] !== undefined && chars.length > 0) {
      const hasVowel = chars.some((c) =>
        /[aeiouyâăêôơư]/i.test(c.normalize('NFD')[0])
      );
      if (hasVowel) {
        toneMark = TONES[kLower] === '' ? null : TONES[kLower];
        continue;
      }
    }

    if (chars.length > 0) {
      const prevIdx = chars.length - 1;
      const prevChar = chars[prevIdx];

      // Transformation rule (dd / DD -> đ / Đ)
      if ((prevChar === 'd' || prevChar === 'D') && kLower === 'd') {
        chars[prevIdx] = prevChar === 'D' ? 'Đ' : 'đ';
        continue;
      }

      // Check uow -> ươ, or uw + ow -> ươ
      if (kLower === 'w' && chars.length >= 2) {
        const p2 = chars[chars.length - 2].toLowerCase();
        const p1 = chars[chars.length - 1].toLowerCase();
        if ((p2 === 'u' || p2 === 'ư') && (p1 === 'o' || p1 === 'ơ')) {
          chars[chars.length - 2] =
            chars[chars.length - 2] === 'U' || chars[chars.length - 2] === 'Ư'
              ? 'Ư'
              : 'ư';
          chars[chars.length - 1] =
            chars[chars.length - 1] === 'O' || chars[chars.length - 1] === 'Ơ'
              ? 'Ơ'
              : 'ơ';
          continue;
        }
      }

      // aa, aw, ee, oo, ow, uw
      if (VOWEL_MAP[prevChar] && VOWEL_MAP[prevChar][k]) {
        chars[prevIdx] = VOWEL_MAP[prevChar][k];
        continue;
      }
    }

    chars.push(k);
  }

  let word = chars.join('');
  if (toneMark) {
    word = applyToneToWord(word, toneMark);
  }

  return word.normalize('NFC');
}

/**
 * Converts full array of typed keystrokes (including spaces, punctuation) to actual composed Vietnamese text
 */
export function convertPhysicalKeysToComposedText(keys: string[]): string {
  if (!keys || keys.length === 0) return '';
  let result = '';
  let currentWordKeys: string[] = [];

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k === ' ' || k === '\n' || /^[.,/#!$%^&*;:{}=\-_`~()?"']$/.test(k)) {
      if (currentWordKeys.length > 0) {
        result += telexWordToVietnamese(currentWordKeys);
        currentWordKeys = [];
      }
      result += k;
    } else {
      currentWordKeys.push(k);
    }
  }

  if (currentWordKeys.length > 0) {
    result += telexWordToVietnamese(currentWordKeys);
  }

  return result.normalize('NFC');
}

/**
 * Applies Backspace keys in a raw physical key stream.
 * Backspace removes the last non-Backspace key from the effective key list.
 * Returns the effective key array (no Backspace entries remain).
 *
 * Example: ['b','a','w','s','t','Backspace','Backspace'] → ['b','a','w','s']
 *          ['b','a','t','.','Backspace','Backspace','Backspace'] → ['b']
 */
export function applyBackspaceToKeys(keys: string[]): string[] {
  const result: string[] = [];
  for (const k of keys) {
    if (k === 'Backspace') {
      result.pop();
    } else {
      result.push(k);
    }
  }
  return result;
}

export interface WordToken {
  type: 'word' | 'space' | 'punct';
  text: string;
  charStartIndex: number;
  charEndIndex: number;
  sequences: string[][];
}

/**
 * Generates all valid Telex physical keystroke sequences for a single Vietnamese word/syllable.
 * Supports:
 * - Tone on vowel (e.g. u o o s n g)
 * - Tone at end of word (e.g. u o o n g s)
 * - Tone before consonant (e.g. n g u w o w i f)
 * - Simplified ươ shortcuts (e.g. n u o w c s)
 */
export function getAllTelexSequencesForWord(word: string): string[][] {
  if (!word) return [[]];
  if (word === ' ') return [[' ']];

  // If simple ASCII with no Vietnamese diacritics
  if (
    !/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/i.test(
      word
    )
  ) {
    return [[...word]];
  }

  const chars = [...word.normalize('NFC')];
  let toneKey: string | null = null;

  for (let i = 0; i < chars.length; i++) {
    const nfd = chars[i].normalize('NFD');
    for (const m of nfd.slice(1)) {
      if (TONE_KEYS[m]) {
        toneKey = TONE_KEYS[m];
        break;
      }
    }
    if (toneKey) break;
  }

  const charKeysWithTone: string[][] = [];
  const charKeysWithoutTone: string[][] = [];

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const isUpper = c === c.toUpperCase() && c !== c.toLowerCase();
    if (c.toLowerCase() === 'đ') {
      const dKey = isUpper ? ['D', 'd'] : ['d', 'd'];
      charKeysWithTone.push(dKey);
      charKeysWithoutTone.push(dKey);
      continue;
    }

    const nfd = c.normalize('NFD');
    const baseRaw = nfd[0];
    const base = isUpper ? baseRaw.toUpperCase() : baseRaw.toLowerCase();
    const marks = [...nfd.slice(1)];
    const noToneKeys: string[] = [base];
    const withToneKeys: string[] = [base];

    if (marks.includes('\u0306')) {
      // ă
      noToneKeys.push('w');
      withToneKeys.push('w');
    }
    if (marks.includes('\u0302')) {
      // â, ê, ô
      noToneKeys.push(base.toLowerCase());
      withToneKeys.push(base.toLowerCase());
    }
    if (marks.includes('\u031B')) {
      // ơ, ư
      noToneKeys.push('w');
      withToneKeys.push('w');
    }

    for (const m of marks) {
      if (TONE_KEYS[m]) {
        withToneKeys.push(TONE_KEYS[m]);
      }
    }

    charKeysWithTone.push(withToneKeys);
    charKeysWithoutTone.push(noToneKeys);
  }

  const sequences: string[][] = [];

  // 1. Standard tone-on-vowel sequence (e.g. u o o s n g, m a f i, b i e e s t)
  const seqToneOnVowel = charKeysWithTone.flat();
  sequences.push(seqToneOnVowel);

  // 2. Word-end tone sequence (e.g. u o o n g s, m a i f, b i e e t s)
  if (toneKey) {
    const seqToneAtEnd = [...charKeysWithoutTone.flat(), toneKey];
    if (seqToneAtEnd.join('') !== seqToneOnVowel.join('')) {
      sequences.push(seqToneAtEnd);
    }
  }

  // 3. Simplified ươ (e.g. nước -> n u o w c s, được -> d d u o w c j)
  if (word.includes('ươ') || word.includes('Ươ') || word.includes('ƯƠ')) {
    const simplifiedUO: string[] = [];
    for (let i = 0; i < chars.length; i++) {
      if (
        (chars[i].toLowerCase() === 'ư' &&
          chars[i + 1]?.toLowerCase() === 'ơ') ||
        (chars[i].toLowerCase() === 'ư' &&
          chars[i + 1]?.normalize('NFD')[0]?.toLowerCase() === 'o')
      ) {
        simplifiedUO.push(chars[i] === 'Ư' ? 'U' : 'u');
        simplifiedUO.push(chars[i + 1]?.toUpperCase() === chars[i + 1] ? 'O' : 'o');
        simplifiedUO.push('w');
        i++;
      } else {
        simplifiedUO.push(...charKeysWithoutTone[i]);
      }
    }
    if (toneKey) {
      const s1 = [...simplifiedUO, toneKey];
      if (!sequences.some((s) => s.join('') === s1.join(''))) {
        sequences.push(s1);
      }
    } else {
      if (!sequences.some((s) => s.join('') === simplifiedUO.join(''))) {
        sequences.push(simplifiedUO);
      }
    }
  }

  return sequences;
}

/**
 * Tokenizes a sentence into words, punctuation, and spaces
 */
export function tokenizeLine(line: string): WordToken[] {
  const tokens: WordToken[] = [];
  let currentWord = '';
  let currentWordStart = 0;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === ' ') {
      if (currentWord) {
        tokens.push({
          type: 'word',
          text: currentWord,
          charStartIndex: currentWordStart,
          charEndIndex: i,
          sequences: getAllTelexSequencesForWord(currentWord),
        });
        currentWord = '';
      }
      tokens.push({
        type: 'space',
        text: ' ',
        charStartIndex: i,
        charEndIndex: i + 1,
        sequences: [[' ']],
      });
    } else if (/^[.,/#!$%^&*;:{}=\-_`~()?"']$/.test(char)) {
      if (currentWord) {
        tokens.push({
          type: 'word',
          text: currentWord,
          charStartIndex: currentWordStart,
          charEndIndex: i,
          sequences: getAllTelexSequencesForWord(currentWord),
        });
        currentWord = '';
      }
      tokens.push({
        type: 'punct',
        text: char,
        charStartIndex: i,
        charEndIndex: i + 1,
        sequences: [[char]],
      });
    } else {
      if (!currentWord) currentWordStart = i;
      currentWord += char;
    }
  }

  if (currentWord) {
    tokens.push({
      type: 'word',
      text: currentWord,
      charStartIndex: currentWordStart,
      charEndIndex: line.length,
      sequences: getAllTelexSequencesForWord(currentWord),
    });
  }

  return tokens;
}

export interface LineProgressState {
  currentTokenIndex: number;
  tokenStartKeyPtr: number;
  activeTokenKeyIndex: number;
  nextExpectedKey: string;
  currentCharIndex: number;
  activeToken: WordToken | null;
  activeSequence: string[];
  isLineFinished: boolean;
  charStatus: Array<'pending' | 'current' | 'correct' | 'error'>;
}

/**
 * Evaluates real-time typing progress across all tokens in a line
 */
export function evaluateLineProgress(
  currentLine: string,
  tokens: WordToken[],
  typedKeys: string[],
  _physicalErrors: Set<number>
): LineProgressState {
  const chars = [...currentLine];
  const composedText = convertPhysicalKeysToComposedText(typedKeys);
  const typedChars = [...normalizeNFC(composedText)];

  const charStatus: Array<'pending' | 'current' | 'correct' | 'error'> = chars.map(
    () => 'pending'
  );

  for (let i = 0; i < chars.length; i++) {
    if (i < typedChars.length) {
      if (samePhysicalChar(typedChars[i], chars[i])) {
        charStatus[i] = 'correct';
      } else {
        charStatus[i] = 'error';
      }
    } else if (i === typedChars.length) {
      charStatus[i] = 'current';
    } else {
      charStatus[i] = 'pending';
    }
  }

  // Find token index and active token corresponding to typedChars length
  let currentCharIndex = Math.min(chars.length, typedChars.length);
  let tokenIdx = 0;

  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    if (currentCharIndex >= tok.charStartIndex && currentCharIndex < tok.charEndIndex) {
      tokenIdx = t;
      break;
    }
    if (currentCharIndex >= tok.charEndIndex) {
      tokenIdx = Math.min(tokens.length - 1, t + 1);
    }
  }

  const isLineFinished = typedChars.length >= chars.length &&
    chars.every((c, idx) => samePhysicalChar(typedChars[idx] || '', c));

  const activeToken = tokenIdx < tokens.length ? tokens[tokenIdx] : null;
  const activeSeq = activeToken?.sequences[0] || [];
  const tokenStartPtr = activeToken ? activeToken.charStartIndex : 0;
  const tokenKeyIdx = activeToken ? Math.max(0, currentCharIndex - activeToken.charStartIndex) : 0;
  const nextExpectedKey = activeToken && tokenKeyIdx < activeSeq.length ? activeSeq[tokenKeyIdx] : '';

  return {
    currentTokenIndex: tokenIdx,
    tokenStartKeyPtr: tokenStartPtr,
    activeTokenKeyIndex: tokenKeyIdx,
    nextExpectedKey,
    currentCharIndex: Math.min(chars.length - 1, currentCharIndex),
    activeToken,
    activeSequence: activeSeq,
    isLineFinished,
    charStatus,
  };
}

export function resolveActualKeys(
  actualKey: string,
  keysInCurrentToken: string[]
): string[] {
  if (!actualKey) return [];

  // Single ASCII keypress (e.g. 'a', 'w', 'n', 'd', 'm', 'j', 'c')
  if (actualKey.length === 1 && /^[a-zA-Z0-9\s.,/#!$%^&*;:{}=\-_`~()?"']$/.test(actualKey)) {
    return [actualKey];
  }

  // Handle composed single Vietnamese character emitted by Unikey / OS IME (e.g. 'ă', 'â', 'ê', 'ô', 'ơ', 'ư', 'đ', 'ắ', 'ặ', etc.)
  const physicalKeys = textToPhysicalKeys(actualKey);
  if (physicalKeys.length <= 1 && physicalKeys[0] === actualKey) {
    return [actualKey];
  }

  // Strip prefix already present in keysInCurrentToken (e.g. keysInCurrentToken has ['a'], actualKey is 'ă' -> physicalKeys ['a', 'w'] -> returns ['w'])
  for (let prefixLen = physicalKeys.length - 1; prefixLen >= 1; prefixLen--) {
    const prefix = physicalKeys.slice(0, prefixLen);
    const tokenSuffix = keysInCurrentToken.slice(-prefixLen);
    if (
      tokenSuffix.length === prefixLen &&
      tokenSuffix.every((k, i) => samePhysicalChar(k, prefix[i]))
    ) {
      return physicalKeys.slice(prefixLen);
    }
  }

  return physicalKeys;
}


