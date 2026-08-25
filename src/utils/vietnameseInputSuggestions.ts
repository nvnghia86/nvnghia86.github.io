/**
 * Pure helpers for displaying Vietnamese input suggestions.
 *
 * The browser/OS value is always canonical: these helpers inspect native text and
 * physical-key history, but never compose Vietnamese text or synthesize input.
 */

import type { VietnameseInputMethod } from '../types';

export type { VietnameseInputMethod } from '../types';
export type VietnameseGuideRuleKind = 'letter' | 'tone';

export interface VietnameseInputGuideRule {
  readonly kind: VietnameseGuideRuleKind;
  readonly keys: string;
  readonly result: string;
  readonly name: string;
}

const TELEX_LETTER_GUIDE_RULES = [
  { kind: 'letter', keys: 'aa', result: 'â', name: 'circumflex a' },
  { kind: 'letter', keys: 'aw', result: 'ă', name: 'breve a' },
  { kind: 'letter', keys: 'ee', result: 'ê', name: 'circumflex e' },
  { kind: 'letter', keys: 'oo', result: 'ô', name: 'circumflex o' },
  { kind: 'letter', keys: 'ow', result: 'ơ', name: 'horn o' },
  { kind: 'letter', keys: 'uw', result: 'ư', name: 'horn u' },
  { kind: 'letter', keys: 'dd', result: 'đ', name: 'crossed d' },
] as const satisfies readonly VietnameseInputGuideRule[];

const TELEX_TONE_GUIDE_RULES = [
  { kind: 'tone', keys: 's', result: 'á', name: 'acute' },
  { kind: 'tone', keys: 'f', result: 'à', name: 'grave' },
  { kind: 'tone', keys: 'r', result: 'ả', name: 'hook above' },
  { kind: 'tone', keys: 'x', result: 'ã', name: 'tilde' },
  { kind: 'tone', keys: 'j', result: 'ạ', name: 'dot below' },
] as const satisfies readonly VietnameseInputGuideRule[];

const VNI_LETTER_GUIDE_RULES = [
  { kind: 'letter', keys: 'a6/e6/o6', result: 'â/ê/ô', name: 'circumflex' },
  { kind: 'letter', keys: 'o7/u7', result: 'ơ/ư', name: 'horn' },
  { kind: 'letter', keys: 'a8', result: 'ă', name: 'breve' },
  { kind: 'letter', keys: 'd9', result: 'đ', name: 'crossed d' },
] as const satisfies readonly VietnameseInputGuideRule[];

const VNI_TONE_GUIDE_RULES = [
  { kind: 'tone', keys: '1', result: 'á', name: 'acute' },
  { kind: 'tone', keys: '2', result: 'à', name: 'grave' },
  { kind: 'tone', keys: '3', result: 'ả', name: 'hook above' },
  { kind: 'tone', keys: '4', result: 'ã', name: 'tilde' },
  { kind: 'tone', keys: '5', result: 'ạ', name: 'dot below' },
] as const satisfies readonly VietnameseInputGuideRule[];

/** Rules intended for a method picker or an on-screen typing guide. */
export const VIETNAMESE_INPUT_GUIDE_RULES = {
  telex: {
    letters: TELEX_LETTER_GUIDE_RULES,
    tones: TELEX_TONE_GUIDE_RULES,
  },
  vni: {
    letters: VNI_LETTER_GUIDE_RULES,
    tones: VNI_TONE_GUIDE_RULES,
  },
} as const;

export const TELEX_GUIDE_RULES = VIETNAMESE_INPUT_GUIDE_RULES.telex;
export const VNI_GUIDE_RULES = VIETNAMESE_INPUT_GUIDE_RULES.vni;

const BREVE = '\u0306';
const CIRCUMFLEX = '\u0302';
const HORN = '\u031b';
const ACUTE = '\u0301';
const GRAVE = '\u0300';
const HOOK_ABOVE = '\u0309';
const TILDE = '\u0303';
const DOT_BELOW = '\u0323';
const CROSSED_D = 'crossed-d';

const SHAPE_MARKS = new Set([BREVE, CIRCUMFLEX, HORN]);
const TONE_MARKS = new Set([ACUTE, GRAVE, HOOK_ABOVE, TILDE, DOT_BELOW]);

export const VIETNAMESE_TONE_KEYS: Readonly<
  Record<VietnameseInputMethod, Readonly<Record<string, string>>>
> = {
  telex: {
    [ACUTE]: 's',
    [GRAVE]: 'f',
    [HOOK_ABOVE]: 'r',
    [TILDE]: 'x',
    [DOT_BELOW]: 'j',
  },
  vni: {
    [ACUTE]: '1',
    [GRAVE]: '2',
    [HOOK_ABOVE]: '3',
    [TILDE]: '4',
    [DOT_BELOW]: '5',
  },
};

interface CharacterParts {
  readonly base: string;
  readonly isUpperCase: boolean;
  readonly shapeMarks: readonly string[];
  readonly toneMarks: readonly string[];
}

function normalize(value: string | null | undefined): string {
  return (value ?? '').normalize('NFC');
}

function characterParts(character: string): CharacterParts {
  const normalized = normalize(character);
  const isUpperCase = normalized === normalized.toUpperCase() && normalized !== normalized.toLowerCase();

  if (normalized.toLocaleLowerCase('vi') === 'đ') {
    return {
      base: isUpperCase ? 'D' : 'd',
      isUpperCase,
      shapeMarks: [CROSSED_D],
      toneMarks: [],
    };
  }

  const decomposed = normalized.normalize('NFD');
  const rawBase = [...decomposed][0] ?? normalized;
  const marks = [...decomposed].slice(1);

  return {
    base: isUpperCase ? rawBase.toUpperCase() : rawBase.toLowerCase(),
    isUpperCase,
    shapeMarks: marks.filter((mark) => SHAPE_MARKS.has(mark)),
    toneMarks: marks.filter((mark) => TONE_MARKS.has(mark)),
  };
}

function shapeKeys(parts: CharacterParts, method: VietnameseInputMethod): string[] {
  const keys: string[] = [];

  for (const mark of parts.shapeMarks) {
    if (mark === CROSSED_D) {
      keys.push(method === 'telex' ? 'd' : '9');
    } else if (method === 'telex') {
      keys.push(mark === CIRCUMFLEX ? parts.base.toLowerCase() : 'w');
    } else if (mark === CIRCUMFLEX) {
      keys.push('6');
    } else if (mark === HORN) {
      keys.push('7');
    } else if (mark === BREVE) {
      keys.push('8');
    }
  }

  return keys;
}

function toneKeys(parts: CharacterParts, method: VietnameseInputMethod): string[] {
  return parts.toneMarks.flatMap((mark) => {
    const key = VIETNAMESE_TONE_KEYS[method][mark];
    return key ? [key] : [];
  });
}

/** Maps one target character to its standard physical-key sequence. */
export function getVietnameseCharacterKeys(
  targetCharacter: string,
  method: VietnameseInputMethod,
): string[] {
  const normalized = normalize(targetCharacter);
  if (!normalized) return [];

  const characters = [...normalized];
  if (characters.length !== 1) {
    return characters.flatMap((character) => getVietnameseCharacterKeys(character, method));
  }

  const parts = characterParts(characters[0]);
  return [parts.base, ...shapeKeys(parts, method), ...toneKeys(parts, method)];
}

/** Maps target display text to the standard inline-tone physical-key sequence. */
export function getVietnameseTargetKeys(
  target: string,
  method: VietnameseInputMethod,
): string[] {
  return [...normalize(target)].flatMap((character) =>
    getVietnameseCharacterKeys(character, method),
  );
}

function withoutToneKeys(parts: CharacterParts, method: VietnameseInputMethod): string[] {
  return [parts.base, ...shapeKeys(parts, method)];
}

function pushUnique(sequences: string[][], sequence: string[]): void {
  const signature = JSON.stringify(sequence);
  if (!sequences.some((candidate) => JSON.stringify(candidate) === signature)) {
    sequences.push(sequence);
  }
}

function compactUoSequence(
  characters: readonly string[],
  method: VietnameseInputMethod,
  moveTonesToEnd: boolean,
): string[] | null {
  const sequence: string[] = [];
  const finalTones: string[] = [];
  let foundCompactPair = false;

  for (let index = 0; index < characters.length; index += 1) {
    const current = characterParts(characters[index]);
    const next = characters[index + 1] ? characterParts(characters[index + 1]) : null;
    const isCompactPair =
      current.base.toLowerCase() === 'u' &&
      current.shapeMarks.includes(HORN) &&
      next?.base.toLowerCase() === 'o' &&
      next.shapeMarks.includes(HORN);

    if (isCompactPair && next) {
      foundCompactPair = true;
      sequence.push(current.base, next.base, method === 'telex' ? 'w' : '7');
      const pairTones = [...toneKeys(current, method), ...toneKeys(next, method)];
      if (moveTonesToEnd) finalTones.push(...pairTones);
      else sequence.push(...pairTones);
      index += 1;
      continue;
    }

    sequence.push(...withoutToneKeys(current, method));
    const currentTones = toneKeys(current, method);
    if (moveTonesToEnd) finalTones.push(...currentTones);
    else sequence.push(...currentTones);
  }

  return foundCompactPair ? [...sequence, ...finalTones] : null;
}

/**
 * Returns accepted physical histories for a target word. Variants include tone
 * keys beside the toned vowel, tone keys at word end, and compact uow/uo7 for ươ.
 */
export function getVietnameseWordKeySequences(
  targetWord: string,
  method: VietnameseInputMethod,
): string[][] {
  const characters = [...normalize(targetWord)];
  if (characters.length === 0) return [[]];

  const parts = characters.map(characterParts);
  const inline = parts.flatMap((part) => [
    ...withoutToneKeys(part, method),
    ...toneKeys(part, method),
  ]);
  const tonesAtEnd = parts.flatMap((part) => toneKeys(part, method));
  const wordFinal = [
    ...parts.flatMap((part) => withoutToneKeys(part, method)),
    ...tonesAtEnd,
  ];
  const sequences: string[][] = [];

  pushUnique(sequences, inline);
  if (tonesAtEnd.length > 0) pushUnique(sequences, wordFinal);

  const compactInline = compactUoSequence(characters, method, false);
  const compactWordFinal = compactUoSequence(characters, method, true);
  if (compactInline) pushUnique(sequences, compactInline);
  if (compactWordFinal && tonesAtEnd.length > 0) pushUnique(sequences, compactWordFinal);

  return sequences;
}

export type NativeVietnameseTextStatus = 'prefix' | 'partial' | 'complete' | 'mismatch';

export interface NativeVietnameseTextEvaluation {
  readonly status: NativeVietnameseTextStatus;
  readonly isValid: boolean;
  readonly isComplete: boolean;
  /** Number of exact target characters before the first partial or missing character. */
  readonly canonicalPrefixLength: number;
  /** Target indices whose native characters are valid, not-yet-final IME forms. */
  readonly partialTargetIndices: readonly number[];
  readonly nextTargetIndex: number;
  readonly mismatchIndex: number | null;
  readonly target: string;
  readonly nativeText: string;
}

function sameCharacter(left: string, right: string): boolean {
  return normalize(left).toLocaleLowerCase('vi') === normalize(right).toLocaleLowerCase('vi');
}

function isPartialCharacter(nativeCharacter: string, targetCharacter: string): boolean {
  const nativeParts = characterParts(nativeCharacter);
  const targetParts = characterParts(targetCharacter);
  if (nativeParts.base.toLocaleLowerCase('vi') !== targetParts.base.toLocaleLowerCase('vi')) {
    return false;
  }

  const targetShapes = new Set(targetParts.shapeMarks);
  const targetTones = new Set(targetParts.toneMarks);
  const nativeShapesAreValid = nativeParts.shapeMarks.every((mark) => targetShapes.has(mark));
  const nativeTonesAreValid = nativeParts.toneMarks.every((mark) => targetTones.has(mark));
  const isActuallyPartial =
    nativeParts.shapeMarks.length < targetParts.shapeMarks.length ||
    nativeParts.toneMarks.length < targetParts.toneMarks.length;

  return nativeShapesAreValid && nativeTonesAreValid && isActuallyPartial;
}

/**
 * Compares the canonical native input value with the target. Missing target
 * marks are valid IME progress (for example a -> â -> ấ, or chao -> chào).
 */
export function evaluateNativeVietnameseText(
  target: string,
  nativeText: string,
): NativeVietnameseTextEvaluation {
  const normalizedTarget = normalize(target);
  const normalizedNativeText = normalize(nativeText);
  const targetCharacters = [...normalizedTarget];
  const nativeCharacters = [...normalizedNativeText];
  const partialTargetIndices: number[] = [];
  let canonicalPrefixLength = 0;
  let prefixIsCanonical = true;

  for (let index = 0; index < nativeCharacters.length; index += 1) {
    if (index >= targetCharacters.length) {
      return {
        status: 'mismatch',
        isValid: false,
        isComplete: false,
        canonicalPrefixLength,
        partialTargetIndices,
        nextTargetIndex: index,
        mismatchIndex: index,
        target: normalizedTarget,
        nativeText: normalizedNativeText,
      };
    }

    if (sameCharacter(nativeCharacters[index], targetCharacters[index])) {
      if (prefixIsCanonical) canonicalPrefixLength += 1;
      continue;
    }

    if (isPartialCharacter(nativeCharacters[index], targetCharacters[index])) {
      partialTargetIndices.push(index);
      prefixIsCanonical = false;
      continue;
    }

    return {
      status: 'mismatch',
      isValid: false,
      isComplete: false,
      canonicalPrefixLength,
      partialTargetIndices,
      nextTargetIndex: index,
      mismatchIndex: index,
      target: normalizedTarget,
      nativeText: normalizedNativeText,
    };
  }

  const isComplete =
    nativeCharacters.length === targetCharacters.length && partialTargetIndices.length === 0;
  const nextTargetIndex = partialTargetIndices[0] ?? nativeCharacters.length;

  return {
    status: isComplete ? 'complete' : partialTargetIndices.length > 0 ? 'partial' : 'prefix',
    isValid: true,
    isComplete,
    canonicalPrefixLength,
    partialTargetIndices,
    nextTargetIndex,
    mismatchIndex: null,
    target: normalizedTarget,
    nativeText: normalizedNativeText,
  };
}

export type VietnameseKeySuggestion = string | 'Backspace' | null;

export interface VietnameseSuggestionRequest {
  readonly target: string;
  /** The native input/textarea value; this is the canonical typing result. */
  readonly nativeText: string;
  /** Physical KeyboardEvent.key history for the currently active target token. */
  readonly activeTokenKeys?: string | readonly string[];
  readonly method: VietnameseInputMethod;
}


function isWordCharacter(character: string): boolean {
  return /^[\p{L}\p{M}\p{N}]$/u.test(character);
}

function keysMatch(left: string, right: string): boolean {
  return left === right || left.toLocaleLowerCase('vi') === right.toLocaleLowerCase('vi');
}

function startsWithKeys(sequence: readonly string[], prefix: readonly string[]): boolean {
  return prefix.length <= sequence.length && prefix.every((key, index) => keysMatch(key, sequence[index]));
}

function activeWordAt(targetCharacters: readonly string[], index: number): {
  start: number;
  end: number;
  text: string;
} | null {
  if (!isWordCharacter(targetCharacters[index] ?? '')) return null;

  let start = index;
  let end = index + 1;
  while (start > 0 && isWordCharacter(targetCharacters[start - 1])) start -= 1;
  while (end < targetCharacters.length && isWordCharacter(targetCharacters[end])) end += 1;
  return { start, end, text: targetCharacters.slice(start, end).join('') };
}

/**
 * Derives one guide key without changing native text. A genuine native-text
 * mismatch suggests Backspace; completed input or an input-event lag returns null.
 */
export function getNextVietnameseKeySuggestion(
  request: VietnameseSuggestionRequest,
): VietnameseKeySuggestion {
  const evaluation = evaluateNativeVietnameseText(request.target, request.nativeText);
  if (evaluation.status === 'mismatch') return 'Backspace';
  if (evaluation.isComplete) return null;

  const targetCharacters = [...evaluation.target];
  const targetIndex = evaluation.nextTargetIndex;
  const activeWord = activeWordAt(targetCharacters, targetIndex);
  if (!activeWord) {
    return targetCharacters[targetIndex]
      ? getVietnameseCharacterKeys(targetCharacters[targetIndex], request.method)[0] ?? null
      : null;
  }

  const suppliedHistory = typeof request.activeTokenKeys === 'string'
    ? [...request.activeTokenKeys]
    : [...(request.activeTokenKeys ?? [])];
  const wordTargetPrefix = targetCharacters
    .slice(activeWord.start, targetIndex)
    .flatMap((character) => getVietnameseCharacterKeys(character, request.method));
  // The UI resets history at separators, but keydown can precede the native space event.
  // Trim any stale keys so every sequence comparison is local to the active target word.
  let relevantHistory = suppliedHistory;
  if (wordTargetPrefix.length > 0) {
    for (let start = suppliedHistory.length - wordTargetPrefix.length; start >= 0; start -= 1) {
      if (startsWithKeys(wordTargetPrefix, suppliedHistory.slice(start))) {
        relevantHistory = suppliedHistory.slice(start);
        break;
      }
    }
  }
  const nativeCharacters = [...evaluation.nativeText];
  const nativeWordPrefix = nativeCharacters
    .slice(activeWord.start, Math.min(activeWord.end, nativeCharacters.length))
    .flatMap((character) => getVietnameseCharacterKeys(character, request.method));
  // Paste, speech input, and some macOS IMEs have no useful keydown history.
  // In that case native text still gives us a safe suggestion cursor.
  const history = relevantHistory.length > 0 ? relevantHistory : nativeWordPrefix;
  const sequences = getVietnameseWordKeySequences(activeWord.text, request.method);
  const candidates = sequences.filter((sequence) => startsWithKeys(sequence, history));

  if (candidates.length === 0) {
    // Native text remains authoritative; physical event history can briefly lag or be incomplete.
    return null;
  }

  return candidates.find((sequence) => sequence.length > history.length)?.[history.length] ?? null;
}
