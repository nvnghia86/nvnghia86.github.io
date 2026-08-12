const samples = {
  vi: {
    easy: ['Mỗi ngày một chút, đôi tay sẽ nhớ đường về.', 'Gõ chậm và đều, sự chính xác sẽ dẫn lối.', 'Kiên trì hôm nay, tự tin ngày mai.'],
    medium: ['Khi ngón tay lướt đúng nhịp, ý tưởng cũng trở nên mạch lạc hơn.', 'Một thói quen nhỏ được lặp lại sẽ tạo nên thay đổi lớn.'],
    hard: ['Công nghệ chỉ thật sự hữu ích khi giúp con người tập trung vào điều quan trọng nhất.', 'Hãy để trí nhớ cơ bắp giải phóng tâm trí cho những ý tưởng sáng tạo.']
  },
  en: {
    easy: ['Small steps every day make your fingers faster.', 'Type with care, and speed will follow naturally.', 'Practice makes progress, one key at a time.'],
    medium: ['When your fingers find the rhythm, ideas can flow more freely.', 'A focused practice session can turn effort into muscle memory.'],
    hard: ['Technology works best when it gives your attention back to the ideas that matter.', 'Let muscle memory do the work so your mind can stay curious and creative.']
  }
};

// Physical QWERTY touch-typing ownership. The left/right index fingers share G/H and T/Y columns.
const fingerMap = {
  '`':['left','pinky'], '1':['left','pinky'], 'q':['left','pinky'], 'a':['left','pinky'], 'z':['left','pinky'],
  '2':['left','ring'], 'w':['left','ring'], 's':['left','ring'], 'x':['left','ring'],
  '3':['left','middle'], 'e':['left','middle'], 'd':['left','middle'], 'c':['left','middle'],
  '4':['left','index'], '5':['left','index'], 'r':['left','index'], 't':['left','index'], 'f':['left','index'], 'g':['left','index'], 'v':['left','index'], 'b':['left','index'],
  '6':['right','index'], '7':['right','index'], 'y':['right','index'], 'u':['right','index'], 'h':['right','index'], 'j':['right','index'], 'n':['right','index'], 'm':['right','index'],
  '8':['right','middle'], 'i':['right','middle'], 'k':['right','middle'], ',':['right','middle'],
  '9':['right','ring'], 'o':['right','ring'], 'l':['right','ring'], '.':['right','ring'],
  '0':['right','pinky'], '-':['right','pinky'], '=':['right','pinky'], 'p':['right','pinky'], '[':['right','pinky'], ']':['right','pinky'], '\\':['right','pinky'], ';':['right','pinky'], "'":['right','pinky'], '/':['right','pinky'],
  space:['both','thumb']
};

const rows = [['`','1','2','3','4','5','6','7','8','9','0','-','=','⌫'], ['Tab','Q','W','E','R','T','Y','U','I','O','P','[',']','\\'], ['Caps','A','S','D','F','G','H','J','K','L',';',"'",'Enter'], ['Shift','Z','X','C','V','B','N','M',',','.','/','Shift'], ['Ctrl','Alt','⌘','Space','⌘','Alt','Ctrl']];
const keyAliases = { đ:'d', Đ:'d', ':':';', '"':"'", '?':'/', '_':'-', '+':'=', '*':'8', '<':',', '>':'.' };
const telexToneKeys = { '\u0301':'s', '\u0300':'f', '\u0309':'r', '\u0303':'x', '\u0323':'j' };

let lang = 'vi';
let level = 'medium';
let text = '';
let targetKeys = [];
let typedKeys = [];
let physicalErrors = new Set();
let started = false;
let startTime = 0;
let timer = null;
let composing = false;
let lastVisibleLength = 0;
let lastCompletedChars = 0;
let exerciseLibrary = [];
let currentExerciseId = '';
const recentExerciseIds = [];
const $ = selector => document.querySelector(selector);
const input = $('#typeInput');

function keyForChar(char) {
  if (!char) return '';
  if (char === ' ') return 'space';
  const aliased = keyAliases[char] || char;
  return aliased.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function normalizedInput() { return input.value.normalize('NFC'); }
function normalizedTarget() { return text.normalize('NFC'); }
function sameChar(a, b) { return (a || '').normalize('NFC') === (b || '').normalize('NFC'); }
function samePhysicalChar(a, b) { return sameChar(a, b) || (a || '').normalize('NFC').toLocaleLowerCase() === (b || '').normalize('NFC').toLocaleLowerCase(); }
function escapeHtml(value) { return value.replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]); }

// Vietnamese Telex is a physical-key sequence. For example: õ = O + X, ậ = A + A + J.
function telexKeysForChar(char) {
  if (!char) return [];
  if (char === ' ') return ['space'];
  // Unlike the visual keyboard alias (đ -> d), Telex needs two D presses.
  if (char.toLowerCase() === 'đ') return ['d', 'd'];
  const aliased = keyAliases[char] || char;
  const decomposed = aliased.toLowerCase().normalize('NFD');
  const base = decomposed.replace(/[\u0300-\u036f]/g, '');
  const keys = base ? [base[0]] : [];
  const marks = [...decomposed.slice(1)];
  if (marks.includes('\u0306')) keys.push('w'); // ă
  if (marks.includes('\u0302')) keys.push(base[0]); // â, ê, ô -> aa, ee, oo
  if (marks.includes('\u031b')) keys.push('w'); // ơ, ư
  for (const mark of marks) if (telexToneKeys[mark]) keys.push(telexToneKeys[mark]);
  return keys;
}

function buildTargetKeys() {
  targetKeys = [...normalizedTarget()].flatMap(char => lang === 'vi' ? telexKeysForChar(char) : [keyForChar(char)]);
}

function committedPhysicalKeys(completedChars) {
  return [...normalizedTarget()].slice(0, completedChars).flatMap(char => lang === 'vi' ? telexKeysForChar(char) : [keyForChar(char)]);
}

function syncPhysicalProgress() {
  const typedChars = [...normalizedInput()];
  const targetChars = [...normalizedTarget()];
  let completedChars = 0;
  while (completedChars < typedChars.length && completedChars < targetChars.length && samePhysicalChar(typedChars[completedChars], targetChars[completedChars])) completedChars += 1;
  const committedKeys = committedPhysicalKeys(completedChars);
  const visibleTextChangedBack = completedChars < lastCompletedChars || typedChars.length < lastVisibleLength;
  const typedPartial = typedChars[completedChars] ? (lang === 'vi' ? telexKeysForChar(typedChars[completedChars]) : [keyForChar(typedChars[completedChars])]) : [];
  const targetPartial = targetChars[completedChars] ? (lang === 'vi' ? telexKeysForChar(targetChars[completedChars]) : [keyForChar(targetChars[completedChars])]) : [];
  const isPartialTelex = typedPartial.length > 0 && typedPartial.length < targetPartial.length && typedPartial.every((key, index) => key === targetPartial[index]);
  const partialKeys = committedKeys.concat(isPartialTelex ? typedPartial : []);
  const progressKeys = partialKeys.length > committedKeys.length ? partialKeys : committedKeys;
  if (typedKeys.length < progressKeys.length || visibleTextChangedBack) {
    typedKeys = progressKeys;
    physicalErrors = new Set();
  }
  lastVisibleLength = typedChars.length;
  lastCompletedChars = completedChars;
}

function setExercise(nextText, exerciseId = '') {
  text = nextText.trim().replace(/\s+/g, ' ').normalize('NFC');
  currentExerciseId = exerciseId;
  buildTargetKeys();
  $('#exerciseTag').textContent = `${level === 'easy' ? 'DỄ' : level === 'medium' ? 'VỪA' : 'KHÓ'} · ${lang === 'vi' ? 'TIẾNG VIỆT' : 'ENGLISH'}`;
  reset(true);
}

function pick() {
  const matchingExercises = exerciseLibrary.filter(item => item.language === lang && item.level === level);
  if (matchingExercises.length) {
    const freshExercises = matchingExercises.filter(item => item.id !== currentExerciseId && !recentExerciseIds.includes(item.id));
    const choices = freshExercises.length ? freshExercises : matchingExercises.filter(item => item.id !== currentExerciseId);
    const exercise = choices[Math.floor(Math.random() * choices.length)] || matchingExercises[0];
    recentExerciseIds.push(exercise.id);
    if (recentExerciseIds.length > 24) recentExerciseIds.shift();
    setExercise(exercise.text, exercise.id);
    return;
  }

  const list = samples[lang][level];
  const alternatives = list.length > 1 ? list.filter(item => item !== text) : list;
  setExercise(alternatives[Math.floor(Math.random() * alternatives.length)]);
}

async function loadExerciseLibrary() {
  const button = $('#generateBtn');
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  $('#inputHint').textContent = 'Đang tải kho bài luyện tập';

  try {
    const response = await fetch('./data/exercises.json');
    if (!response.ok) throw new Error('Không thể tải kho bài luyện tập.');
    const payload = await response.json();
    if (!Array.isArray(payload.exercises) || payload.exercises.length !== 1000) {
      throw new Error('Kho bài luyện tập không đúng định dạng.');
    }
    exerciseLibrary = payload.exercises;
    pick();
  } catch (error) {
    console.error(error);
    $('#inputHint').textContent = 'Đang dùng các bài mẫu có sẵn';
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    revealPracticeArea();
  }
}

function renderPrompt() {
  const value = [...normalizedInput()];
  const target = [...normalizedTarget()];
  $('#prompt').innerHTML = target.map((char, index) => {
    const typed = value[index];
    const state = index < value.length ? (sameChar(typed, char) ? 'correct' : 'incorrect') : index === value.length ? 'current' : '';
    return `<span class="${state}${char === ' ' ? ' space-char' : ''}">${escapeHtml(char)}</span>`;
  }).join('');
}

function buildKeyboard() {
  $('#keyboard').innerHTML = rows.map(row => `<div class="key-row">${row.map(key => {
    const className = key === 'Space' ? 'space' : key === 'Tab' ? 'wide-1' : ['Caps','Enter'].includes(key) ? 'wide-2' : key === 'Shift' ? 'wide-3' : '';
    return `<div class="key ${className}" data-key="${key.toLowerCase()}">${key}</div>`;
  }).join('')}</div>`).join('');
}

function expectedKey() { return targetKeys[typedKeys.length] || ''; }

function keyNode(key) {
  return key ? document.querySelector(`[data-key="${CSS.escape(key)}"]`) : null;
}

function paintKeyboard() {
  document.querySelectorAll('.key').forEach(key => key.classList.remove('next', 'typed', 'wrong'));
  const wrong = new Set();
  typedKeys.forEach((key, index) => { if (physicalErrors.has(index)) wrong.add(key); });
  wrong.forEach(key => keyNode(key)?.classList.add('wrong'));
  keyNode(expectedKey())?.classList.add('next');
}

function paintHands() {
  document.querySelectorAll('.finger, .thumb').forEach(finger => finger.classList.remove('active'));
  const mapping = fingerMap[expectedKey()];
  if (!mapping) { $('#fingerLabel').textContent = 'ĐẶT TAY LÊN HÀNG CƠ SỞ'; return; }
  const [hand, finger] = mapping;
  document.querySelectorAll(`.${hand === 'both' ? 'hand' : `hand.${hand}`} .${finger}`).forEach(node => node.classList.add('active'));
  $('#fingerLabel').textContent = hand === 'both' ? 'DÙNG HAI NGÓN CÁI' : `DÙNG NGÓN ${finger.toUpperCase()} · TAY ${hand === 'left' ? 'TRÁI' : 'PHẢI'}`;
}

function updateGuide() { paintKeyboard(); paintHands(); }

function reset(clearInput = true) {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
  startTime = 0;
  typedKeys = [];
  physicalErrors = new Set();
  lastVisibleLength = 0;
  lastCompletedChars = 0;
  if (clearInput) input.value = '';
  $('#time').textContent = '00:00';
  $('#wpm').textContent = '0';
  $('#accuracy').textContent = '100%';
  $('#progressBar').style.width = '0%';
  $('#inputHint').textContent = 'Nhấn phím bất kỳ để bắt đầu';
  input.disabled = false;
  renderPrompt();
  updateGuide();
  input.focus({ preventScroll: true });
}

function revealPracticeArea() {
  const practiceArea = $('#practice');
  if (practiceArea && !window.location.hash) {
    practiceArea.scrollIntoView({ behavior: 'auto', block: 'start' });
  }
  input.focus({ preventScroll: true });
}

function tick() {
  const seconds = Math.floor((Date.now() - startTime) / 1000);
  $('#time').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  $('#wpm').textContent = seconds ? Math.round((normalizedInput().length / 5) / (seconds / 60)) : '0';
}

function showResults() {
  const elapsed = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
  const wpm = Number($('#wpm').textContent) || Math.round((normalizedInput().length / 5) / (elapsed / 60));
  const accuracy = Number.parseInt($('#accuracy').textContent, 10) || 100;
  const speedScore = Math.min(100, Math.round(wpm / 60 * 100));
  const score = Math.round(accuracy * .7 + speedScore * .3);
  $('#resultScore').textContent = score;
  $('#resultWpm').textContent = wpm;
  $('#resultAccuracy').textContent = `${accuracy}%`;
  $('#resultTime').textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  $('#resultModal').hidden = false;
  document.body.classList.add('modal-open');
  $('#playAgainBtn').focus();
}

function hideResults() {
  $('#resultModal').hidden = true;
  document.body.classList.remove('modal-open');
}

input.addEventListener('input', () => {
  if (!started) { started = true; startTime = Date.now(); timer = setInterval(tick, 1000); }
  syncPhysicalProgress();
  const typed = [...normalizedInput()];
  const target = [...normalizedTarget()];
  // Supports paste/mobile input; normal desktop typing is tracked by keydown below.
  if (!typedKeys.length && typed.length) typedKeys = typed.flatMap(char => lang === 'vi' ? telexKeysForChar(char) : [keyForChar(char)]);
  const correct = typedKeys.length - physicalErrors.size;
  $('#accuracy').textContent = `${typedKeys.length ? Math.max(0, Math.round(correct / typedKeys.length * 100)) : 100}%`;
  $('#progressBar').style.width = `${Math.min(100, typed.length / target.length * 100)}%`;
  renderPrompt();
  updateGuide();
  if (normalizedInput() === normalizedTarget() && typedKeys.length >= targetKeys.length) {
    clearInterval(timer);
    tick();
    input.disabled = true;
    input.blur();
    $('#inputHint').textContent = 'Hoàn thành! Tuyệt vời';
    showResults();
  }
});

input.addEventListener('compositionstart', () => { composing = true; });
input.addEventListener('compositionend', () => {
  composing = false;
  // The IME commits the final accented glyph immediately after compositionend.
  // Wait one task so the input value contains "gõ" before recalculating the next key.
  setTimeout(() => input.dispatchEvent(new Event('input', { bubbles: true })), 0);
});
input.addEventListener('keydown', event => {
  if (event.key === 'Tab') { event.preventDefault(); return; }
  if (event.key === 'Backspace') {
    typedKeys.pop();
    physicalErrors.delete(typedKeys.length);
    updateGuide();
    return;
  }
  if (event.key.length !== 1) return;
  const actualKey = keyForChar(event.key);
  if (!actualKey) return;
  const position = typedKeys.length;
  const expected = expectedKey();
  typedKeys.push(actualKey);
  if (actualKey !== expected) physicalErrors.add(position);
  updateGuide();
});

document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-lang]').forEach(item => item.classList.remove('selected')); button.classList.add('selected'); lang = button.dataset.lang; pick(); }));
document.querySelectorAll('.diff').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.diff').forEach(item => item.classList.remove('active')); button.classList.add('active'); level = button.dataset.level; pick(); }));
$('#generateBtn').addEventListener('click', pick);
$('#resetBtn').addEventListener('click', () => pick());
$('#playAgainBtn').addEventListener('click', () => { hideResults(); pick(); });
buildKeyboard();
pick();
loadExerciseLibrary();
