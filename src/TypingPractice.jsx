import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Keyboard, LockKeyhole, RotateCcw, Star, Target, Timer, Trophy, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { typingLessons, typingUnits } from './typingLessons';
import { analyzeKey, keyboardRows } from './typingKeyboard';
import TypingHandGuide from './TypingHandGuide';
import './typing-practice.css';

const STORAGE_KEY = 'quizzz.typing.progress';

function loadProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function saveProgress(value) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}


function getStars(accuracy, wpm, lesson) {
  if (accuracy >= 98 && wpm >= lesson.targetWpm + 5) return 5;
  if (accuracy >= 95 && wpm >= lesson.targetWpm) return 4;
  if (accuracy >= 90 && wpm >= lesson.targetWpm * 0.8) return 3;
  if (accuracy >= 85) return 2;
  return 1;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatNumber(value, locale) {
  return new Intl.NumberFormat(locale).format(value);
}

function formatPercent(value, locale) {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(value / 100);
}

function keyboardLabel(key, t) {
  const labels = { Tab: 'tab', Caps: 'caps', Shift: 'shift', Enter: 'enter', Backspace: 'backspace' };
  return key.char === 'Space' ? t('typing.keyboard.space') : labels[key.char] ? t(`typing.keyboard.${labels[key.char]}`) : key.char;
}

function VirtualKeyboard({ targetChar, t }) {
  const target = analyzeKey(targetChar);
  const keyLabel = targetChar === ' ' ? t('typing.keyboard.space') : targetChar || '—';

  return <div className="typing-keyboard-panel">
    <div className="typing-finger-hint"><span>{t('typing.keyboard.next')}</span><strong>{keyLabel}</strong><small>{t(`typing.fingers.${target.finger}`)}</small></div>
    <div className="typing-keyboard" aria-label={t('typing.keyboard.label')}>
      {keyboardRows.map((row, rowIndex) => <div className="typing-keyboard-row" key={rowIndex}>
        {row.map(key => {
          const isTargetKey = key.code === target.code;
          const isShiftKey = target.needsShift && ((target.shiftSide === 'left' && key.code === 'ShiftLeft') || (target.shiftSide === 'right' && key.code === 'ShiftRight'));
          const label = keyboardLabel(key, t);
          return <span key={key.code} className={`typing-key typing-key-${key.width || 'normal'}${isTargetKey || isShiftKey ? ' active' : ''}${key.code === 'KeyF' || key.code === 'KeyJ' ? ' home' : ''}`} style={{ '--finger-color': key.color }}><small>{key.shiftChar || ''}</small>{label}</span>;
        })}
      </div>)}
    </div>
  </div>;
}

function TypingSession({ lesson, onBack, onComplete }) {
  const { t, i18n } = useTranslation();
  const [lineIndex, setLineIndex] = useState(0);
  const target = lesson.content[lineIndex] || '';
  const [typed, setTyped] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [completedCharacters, setCompletedCharacters] = useState(0);
  const [result, setResult] = useState(null);
  const [session, setSession] = useState(0);
  const inputRef = useRef(null);
  const isComposingRef = useRef(false);

  useEffect(() => { inputRef.current?.focus(); }, [session]);
  useEffect(() => {
    if (!startedAt || result) return undefined;
    const timer = window.setInterval(() => setElapsed(Math.max(1, Math.floor((Date.now() - startedAt) / 1000))), 250);
    return () => window.clearInterval(timer);
  }, [startedAt, result]);

  const typedCharacters = completedCharacters + typed.length;
  const liveWpm = elapsed ? Math.round((typedCharacters / 5) / (elapsed / 60)) : 0;
  const liveAccuracy = typedCharacters ? Math.max(0, Math.round(((typedCharacters - errors) / typedCharacters) * 100)) : 100;
  const nextChar = target[typed.length] || '';

  function restart() {
    setTyped('');
    setInputValue('');
    setStartedAt(null);
    setElapsed(0);
    setErrors(0);
    setCompletedCharacters(0);
    setLineIndex(0);
    setResult(null);
    setSession(value => value + 1);
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') onBack();
    if (event.key === 'Tab') {
      event.preventDefault();
      restart();
    }
  }

  function processValue(next) {
    if (result) return;
    if (!startedAt && next.length) setStartedAt(Date.now());

    let newErrors = 0;
    if (next.length >= typed.length) {
      for (let index = 0; index < next.length; index += 1) {
        if (next[index] !== typed[index] && next[index] !== target[index]) newErrors += 1;
      }
    }
    const totalErrors = errors + newErrors;
    setErrors(totalErrors);
    setTyped(next);

    if (next === target) {
      const seconds = Math.max(1, Math.round(((startedAt ? Date.now() - startedAt : 0) / 1000)));
      const finalCharacters = completedCharacters + target.length;
      if (lineIndex < lesson.content.length - 1) {
        setCompletedCharacters(finalCharacters);
        setLineIndex(value => value + 1);
        setTyped('');
        setInputValue('');
        setSession(value => value + 1);
        return;
      }
      const wpm = Math.max(1, Math.round((finalCharacters / 5) / (seconds / 60)));
      const accuracy = Math.max(0, Math.min(100, Math.round(((finalCharacters - totalErrors) / finalCharacters) * 100)));
      const completed = { lessonId: lesson.id, wpm, accuracy, seconds, errors: totalErrors, stars: getStars(accuracy, wpm, lesson), completedAt: new Date().toISOString() };
      setElapsed(seconds);
      setResult(completed);
      onComplete(completed);
    }
  }

  function handleChange(event) {
    const next = event.target.value.normalize('NFC').slice(0, target.length);
    setInputValue(next);
    if (!isComposingRef.current && !event.nativeEvent?.isComposing) processValue(next);
  }

  function handleCompositionEnd(event) {
    isComposingRef.current = false;
    const next = event.currentTarget.value.normalize('NFC').slice(0, target.length);
    setInputValue(next);
    processValue(next);
  }

  return <section className="content-page typing-page" onKeyDown={handleKeyDown}>
    <div className="typing-session-heading">
      <button className="secondary-button typing-back" onClick={onBack}><ArrowLeft size={17} /> {t('typing.actions.course')}</button>
      <div><p className="eyebrow">{lesson.unitTitle}</p><h1>{lesson.title}</h1></div>
      <button className="secondary-button typing-restart" onClick={restart}><RotateCcw size={17} /> {t('typing.actions.restart')}</button>
    </div>

    <div className="typing-metric-row">
      <div><Zap size={18} /><span>{t('typing.metrics.wpm')}</span><strong>{formatNumber(liveWpm, i18n.language)}</strong></div>
      <div><Target size={18} /><span>{t('typing.metrics.accuracy')}</span><strong>{formatPercent(liveAccuracy, i18n.language)}</strong></div>
      <div><Timer size={18} /><span>{t('typing.metrics.time')}</span><strong>{formatTime(elapsed)}</strong></div>
      <div><CheckCircle2 size={18} /><span>{t('typing.metrics.progress')}</span><strong>{lineIndex + 1}/{lesson.content.length}</strong></div>
    </div>

    <div className="typing-line-progress" aria-label={t('typing.lines.label', { current: lineIndex + 1, total: lesson.content.length })}>{lesson.content.map((_, index) => <span key={index} className={index < lineIndex ? 'done' : index === lineIndex ? 'current' : ''} />)}</div>
    <div className="typing-session-layout">
    <div className="typing-stage panel" onClick={() => inputRef.current?.focus()}>
      <div className="typing-target" aria-live="polite">
        {[...target].map((char, index) => {
          const state = index < typed.length ? (typed[index] === char ? 'correct' : 'wrong') : index === typed.length ? 'current' : 'pending';
          return <span className={state} key={index}>{char === ' ' ? '\u00a0' : char}</span>;
        })}
      </div>
      <label className="typing-input-label" htmlFor={`typing-input-${lesson.id}`}>{t('typing.input.label')}</label>
      <textarea
        id={`typing-input-${lesson.id}`}
        ref={inputRef}
        key={session}
        className="typing-input"
        value={inputValue}
        onChange={handleChange}
        onCompositionStart={() => { isComposingRef.current = true; }}
        onCompositionEnd={handleCompositionEnd}
        onPaste={event => event.preventDefault()}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck="false"
        rows="2"
        placeholder={t('typing.input.placeholder')}
        disabled={Boolean(result)}
      />
      <div className="typing-stage-footer"><span>{t('typing.hints.telex')}</span><span>{t('typing.hints.shortcuts')}</span></div>
    </div>
    <TypingHandGuide targetChar={nextChar} />
    </div>

    <VirtualKeyboard targetChar={nextChar} t={t} />

    {result && <div className="typing-result-overlay" role="dialog" aria-modal="true" aria-labelledby="typing-result-title">
      <article className="typing-result-card">
        <span className="typing-result-icon"><Trophy size={32} /></span>
        <p className="eyebrow">{t('typing.result.eyebrow')}</p>
        <h2 id="typing-result-title">{t('typing.result.title')}</h2>
        <div className="typing-stars" aria-label={t('typing.result.stars', { count: result.stars })}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={26} className={index < result.stars ? 'earned' : ''} />)}</div>
        <div className="typing-result-metrics">
          <div><strong>{formatNumber(result.wpm, i18n.language)}</strong><span>{t('typing.metrics.wpm')}</span></div>
          <div><strong>{formatPercent(result.accuracy, i18n.language)}</strong><span>{t('typing.metrics.accuracy')}</span></div>
          <div><strong>{formatTime(result.seconds)}</strong><span>{t('typing.metrics.time')}</span></div>
        </div>
        <p>{result.accuracy >= lesson.minAccuracy ? t('typing.result.passed') : t('typing.result.keepPracticing', { target: lesson.minAccuracy })}</p>
        <div className="typing-result-actions"><button className="secondary-button" onClick={restart}>{t('typing.actions.tryAgain')}</button><button className="primary-button" onClick={onBack}>{t('typing.actions.continue')}</button></div>
      </article>
    </div>}
  </section>;
}

export default function TypingPractice() {
  const { t, i18n } = useTranslation();
  const [progress, setProgress] = useState(loadProgress);
  const [activeLesson, setActiveLesson] = useState(null);

  function complete(result) {
    setProgress(previous => {
      const current = previous[result.lessonId];
      const best = !current || result.stars > current.stars || (result.stars === current.stars && result.wpm > current.wpm) ? result : current;
      const next = { ...previous, [result.lessonId]: best };
      saveProgress(next);
      return next;
    });
  }

  if (activeLesson) return <TypingSession lesson={activeLesson} onBack={() => setActiveLesson(null)} onComplete={complete} />;

  const results = Object.values(progress);
  const completed = typingLessons.filter(lesson => progress[lesson.id]).length;
  const bestWpm = results.length ? Math.max(...results.map(item => item.wpm || 0)) : 0;
  const averageAccuracy = results.length ? Math.round(results.reduce((total, item) => total + (item.accuracy || 0), 0) / results.length) : 0;
  const totalStars = results.reduce((total, item) => total + (item.stars || 0), 0);

  return <section className="content-page typing-page typing-course">
    <div className="typing-course-hero">
      <div><p className="eyebrow">{t('typing.eyebrow')}</p><h1>{t('typing.title')}</h1><p>{t('typing.subtitle')}</p></div>
      <span className="typing-hero-icon"><Keyboard size={40} /></span>
    </div>
    <div className="typing-summary-grid">
      <article><CheckCircle2 size={20} /><span>{t('typing.summary.completed')}</span><strong>{t('typing.summary.completedValue', { completed: formatNumber(completed, i18n.language), total: formatNumber(typingLessons.length, i18n.language) })}</strong></article>
      <article><Zap size={20} /><span>{t('typing.summary.bestWpm')}</span><strong>{formatNumber(bestWpm, i18n.language)}</strong></article>
      <article><Target size={20} /><span>{t('typing.summary.averageAccuracy')}</span><strong>{formatPercent(averageAccuracy, i18n.language)}</strong></article>
      <article><Star size={20} /><span>{t('typing.summary.stars')}</span><strong>{formatNumber(totalStars, i18n.language)}</strong></article>
    </div>
    <div className="typing-course-heading"><div><h2>{t('typing.course.title')}</h2><p>{t('typing.course.description')}</p></div></div>
    <div className="typing-unit-list">
      {typingUnits.map(unit => <section className="typing-unit" key={unit.id}>
        <header><div><span>{t('typing.course.unit', { number: formatNumber(unit.id, i18n.language) })}</span><h3>{unit.title.replace(/^Unit \d+: \d+\. /, '')}</h3><p>{unit.description}</p></div><b>{t('typing.course.lessonCount', { count: formatNumber(unit.lessonIds.length, i18n.language) })}</b></header>
        <div className="typing-lesson-list">
          {typingLessons.filter(lesson => lesson.unitId === unit.id).map(lesson => {
            const lessonIndex = typingLessons.findIndex(item => item.id === lesson.id);
            const previousLesson = typingLessons[lessonIndex - 1];
            const unlocked = lessonIndex === 0 || Boolean(progress[previousLesson.id]);
            const result = progress[lesson.id];
            return <article className={`typing-lesson-card${unlocked ? '' : ' locked'}`} key={lesson.id}>
              <span className="typing-lesson-number">{result ? <CheckCircle2 size={20} /> : unlocked ? lesson.id : <LockKeyhole size={17} />}</span>
              <div className="typing-lesson-copy"><small>{lesson.type === 'test' ? t('typing.course.test') : lesson.type === 'game' ? t('typing.course.challenge') : t('typing.course.practice')}</small><h3>{lesson.title}</h3><div className="typing-target-keys">{lesson.targetKeys.slice(0, 8).map(key => <kbd key={key}>{key}</kbd>)}</div></div>
              <div className="typing-lesson-goal"><span>{t('typing.course.wpmGoal', { wpm: formatNumber(lesson.targetWpm, i18n.language) })}</span><span>{t('typing.course.accuracyGoal', { accuracy: formatNumber(lesson.minAccuracy, i18n.language) })}</span>{result && <span className="typing-best">{t('typing.course.best', { stars: formatNumber(result.stars, i18n.language), wpm: formatNumber(result.wpm, i18n.language) })}</span>}</div>
              <button className={result ? 'secondary-button' : 'primary-button'} disabled={!unlocked} onClick={() => setActiveLesson(lesson)}>{result ? t('typing.actions.practiceAgain') : unlocked ? t('typing.actions.start') : t('typing.actions.locked')}</button>
            </article>;
          })}
        </div>
      </section>)}
    </div>
  </section>;
}
