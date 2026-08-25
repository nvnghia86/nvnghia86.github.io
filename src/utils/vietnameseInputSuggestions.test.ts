import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateNativeVietnameseText,
  getNextVietnameseKeySuggestion,
  getVietnameseCharacterKeys,
  getVietnameseTargetKeys,
  getVietnameseWordKeySequences,
  TELEX_GUIDE_RULES,
  VNI_GUIDE_RULES,
} from './vietnameseInputSuggestions.ts';
import {
  applyBackspaceToKeys,
  convertPhysicalKeysToComposedText,
  tokenizeLine,
} from './vietnameseTelex.ts';
import { analyzeCharacter } from './keyboardMap.ts';

test('maps Vietnamese target characters to Telex physical keys', () => {
  assert.deepEqual(getVietnameseTargetKeys('â ă ê ô ơ ư đ', 'telex'), [
    'a', 'a', ' ', 'a', 'w', ' ', 'e', 'e', ' ', 'o', 'o', ' ',
    'o', 'w', ' ', 'u', 'w', ' ', 'd', 'd',
  ]);
  assert.deepEqual(getVietnameseCharacterKeys('ấ', 'telex'), ['a', 'a', 's']);
  assert.deepEqual(getVietnameseCharacterKeys('ừ', 'telex'), ['u', 'w', 'f']);
  assert.deepEqual(getVietnameseCharacterKeys('ộ', 'telex'), ['o', 'o', 'j']);
  assert.deepEqual(
    TELEX_GUIDE_RULES.tones.map((rule) => rule.keys),
    ['s', 'f', 'r', 'x', 'j'],
  );
});

test('maps Vietnamese target characters to VNI physical keys', () => {
  assert.deepEqual(getVietnameseTargetKeys('â ă ê ô ơ ư đ', 'vni'), [
    'a', '6', ' ', 'a', '8', ' ', 'e', '6', ' ', 'o', '6', ' ',
    'o', '7', ' ', 'u', '7', ' ', 'd', '9',
  ]);
  assert.deepEqual(getVietnameseCharacterKeys('ấ', 'vni'), ['a', '6', '1']);
  assert.deepEqual(getVietnameseCharacterKeys('ừ', 'vni'), ['u', '7', '2']);
  assert.deepEqual(getVietnameseCharacterKeys('ộ', 'vni'), ['o', '6', '5']);
  assert.deepEqual(
    VNI_GUIDE_RULES.tones.map((rule) => rule.keys),
    ['1', '2', '3', '4', '5'],
  );
});

test('generates inline and word-final tone variants', () => {
  const telex = getVietnameseWordKeySequences('uống', 'telex').map((keys) => keys.join(''));
  assert.ok(telex.includes('uoosng'));
  assert.ok(telex.includes('uoongs'));

  const vni = getVietnameseWordKeySequences('uống', 'vni').map((keys) => keys.join(''));
  assert.ok(vni.includes('uo61ng'));
  assert.ok(vni.includes('uo6ng1'));
});

test('generates the compact ươ variant for Telex and VNI', () => {
  const telex = getVietnameseWordKeySequences('nước', 'telex').map((keys) => keys.join(''));
  assert.ok(telex.includes('nuowsc'));
  assert.ok(telex.includes('nuowcs'));

  const vni = getVietnameseWordKeySequences('nước', 'vni').map((keys) => keys.join(''));
  assert.ok(vni.includes('nuo71c'));
  assert.ok(vni.includes('nuo7c1'));
});

test('evaluates canonical, intermediate, and wrong native text for xin chào', () => {
  const complete = evaluateNativeVietnameseText('xin chào', 'xin chào');
  assert.equal(complete.status, 'complete');
  assert.equal(complete.isComplete, true);

  const baseIntermediate = evaluateNativeVietnameseText('xin chào', 'xin chao');
  assert.equal(baseIntermediate.status, 'partial');
  assert.equal(baseIntermediate.isValid, true);
  assert.deepEqual(baseIntermediate.partialTargetIndices, [6]);
  assert.equal(baseIntermediate.nextTargetIndex, 6);

  const shortIntermediate = evaluateNativeVietnameseText('xin chào', 'xin ch');
  assert.equal(shortIntermediate.status, 'prefix');
  assert.equal(shortIntermediate.nextTargetIndex, 6);

  const wrong = evaluateNativeVietnameseText('xin chào', 'xin cháo');
  assert.equal(wrong.status, 'mismatch');
  assert.equal(wrong.isValid, false);
  assert.equal(wrong.mismatchIndex, 6);
});

test('accepts base and partially marked characters as native IME prefixes', () => {
  assert.equal(evaluateNativeVietnameseText('ấ', 'a').status, 'partial');
  assert.equal(evaluateNativeVietnameseText('ấ', 'â').status, 'partial');
  assert.equal(evaluateNativeVietnameseText('ấ', 'á').status, 'partial');
  assert.equal(evaluateNativeVietnameseText('ấ', 'ầ').status, 'mismatch');
});

test('uses the operating system text as-is for Vietnamese typing', () => {
  const composing = evaluateNativeVietnameseText('nắng', 'nă');
  assert.equal(composing.status, 'partial');
  assert.deepEqual(composing.partialTargetIndices, [1]);

  // A raw Telex sequence is not rewritten by this native-text evaluator.
  const rawTelex = evaluateNativeVietnameseText('nắng', 'naw');
  assert.equal(rawTelex.status, 'mismatch');
  assert.equal(rawTelex.nativeText, 'naw');
});

test('keeps Telex progress deterministic when an IME returns raw ASCII', () => {
  assert.equal(
    convertPhysicalKeysToComposedText(['n', 'a', 'w', 's', 'n', 'g']),
    'nắng',
  );
  assert.equal(
    convertPhysicalKeysToComposedText(['s', 'a', 'w', 's', 'c']),
    'sắc',
  );
  assert.equal(
    convertPhysicalKeysToComposedText(
      applyBackspaceToKeys(['s', 'a', 'w', 's', 'Backspace', 'c']),
    ),
    'săc',
  );
});

test('uses the canonical Telex guide sequence for sắc bén', () => {
  assert.deepEqual(getVietnameseTargetKeys('sắc bén', 'telex'), [
    's', 'a', 'w', 's', 'c', ' ', 'b', 'e', 's', 'n',
  ]);
});

test('maps the Backspace suggestion to the Backspace layout key', () => {
  assert.equal(analyzeCharacter('Backspace').primaryKey, 'Backspace');
});

test('treats Enter as a boundary between combined lesson lines', () => {
  assert.deepEqual(
    tokenizeLine('ăn\nmặc').map((token) => ({ type: token.type, text: token.text })),
    [
      { type: 'word', text: 'ăn' },
      { type: 'newline', text: '\n' },
      { type: 'word', text: 'mặc' },
    ],
  );
  assert.equal(getNextVietnameseKeySuggestion({
    target: 'ăn\nmặc',
    nativeText: 'ăn',
    method: 'telex',
  }), '\n');
});

test('derives suggestions from native progress, physical history, and method', () => {
  assert.equal(getNextVietnameseKeySuggestion({
    target: 'xin chào',
    nativeText: 'xin cha',
    activeTokenKeys: ['c', 'h', 'a'],
    method: 'telex',
  }), 'f');

  assert.equal(getNextVietnameseKeySuggestion({
    target: 'xin chào',
    nativeText: 'xin chao',
    activeTokenKeys: ['c', 'h', 'a', 'o'],
    method: 'telex',
  }), 'f');

  assert.equal(getNextVietnameseKeySuggestion({
    target: 'xin chào',
    nativeText: 'xin cha',
    activeTokenKeys: ['c', 'h', 'a'],
    method: 'vni',
  }), '2');

  // Paste/speech/macOS IME can update native text without useful physical events.
  assert.equal(getNextVietnameseKeySuggestion({
    target: 'xin chào',
    nativeText: 'xin cha',
    method: 'telex',
  }), 'f');

  assert.equal(getNextVietnameseKeySuggestion({
    target: 'xin chào',
    nativeText: 'xin chào',
    activeTokenKeys: ['c', 'h', 'a', 'f', 'o'],
    method: 'telex',
  }), null);
});

test('suggests Backspace only for a genuine native mismatch', () => {
  assert.equal(getNextVietnameseKeySuggestion({
    target: 'xin chào',
    nativeText: 'xin cháo',
    activeTokenKeys: ['c', 'h', 'a', 's'],
    method: 'telex',
  }), 'Backspace');

  assert.notEqual(getNextVietnameseKeySuggestion({
    target: 'xin chào',
    nativeText: 'xin chao',
    activeTokenKeys: ['c', 'h', 'a', 'o'],
    method: 'telex',
  }), 'Backspace');
});
