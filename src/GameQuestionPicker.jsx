import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

const emptyFilters = { grade: '', subject: '', type: '', lesson: '' };
const gradeOf = question => String(question.grade || '').replace(/^Lớp\s*/i, '').trim();
const scopeOf = question => JSON.stringify([gradeOf(question), question.subject]);
const lessonOf = question => JSON.stringify([gradeOf(question), question.subject, question.lessonId]);
const typeOf = question => question.type || 'multiple-choice';
const supportsCards = question => typeOf(question) === 'multiple-choice' && question.options?.length === 4;

export default function GameQuestionPicker({ questions, selected, onToggle, onClose, api, cardScan = false, headTilt = false, loading = false }) {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState(emptyFilters);
  const [catalogs, setCatalogs] = useState({});
  const [catalogState, setCatalogState] = useState('idle');
  const [retry, setRetry] = useState(0);
  const cache = useRef(new Map());
  const modal = useRef(null), closeButton = useRef(null);
  const titleId = useId(), hintId = useId();
  const compare = (left, right) => left.localeCompare(right, i18n.language, { numeric: true });
  const grades = [...new Set(questions.map(gradeOf).filter(Boolean))].sort(compare);
  const subjects = [...new Set(questions.map(question => question.subject).filter(Boolean))].sort(compare);
  const candidates = useMemo(() => questions.filter(question =>
    (!filters.grade || gradeOf(question) === filters.grade)
    && (!filters.subject || question.subject === filters.subject)
    && (!filters.type || typeOf(question) === filters.type)), [questions, filters.grade, filters.subject, filters.type]);
  const scopes = useMemo(() => [...new Set(candidates.filter(question => question.lessonId).map(scopeOf))], [candidates]);

  useEffect(() => {
    let active = true;
    if (!scopes.length) { setCatalogState('idle'); return undefined; }
    setCatalogState('loading');
    Promise.allSettled(scopes.map(async scope => {
      if (!cache.current.has(scope)) {
        const [grade, subject] = JSON.parse(scope);
        const request = Promise.resolve().then(() => api(`/curriculum?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`, { silent: true }));
        cache.current.set(scope, request);
        request.catch(() => { cache.current.delete(scope); });
      }
      const data = await cache.current.get(scope);
      return [scope, data.lessons || []];
    })).then(results => {
      if (!active) return;
      setCatalogs(previous => ({ ...previous, ...Object.fromEntries(results.filter(result => result.status === 'fulfilled').map(result => result.value)) }));
      setCatalogState(results.some(result => result.status === 'rejected') ? 'error' : 'ready');
    });
    return () => { active = false; };
  }, [api, scopes, retry]);

  useEffect(() => {
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  const lessons = useMemo(() => {
    const options = new Map();
    for (const question of candidates) {
      if (!question.lessonId) continue;
      const title = catalogs[scopeOf(question)]?.find(lesson => lesson.id === question.lessonId)?.title || question.lessonTitle || question.lessonId;
      options.set(lessonOf(question), { value: lessonOf(question), title, grade: gradeOf(question), subject: question.subject });
    }
    return [...options.values()].sort((left, right) => left.title.localeCompare(right.title, i18n.language, { numeric: true }));
  }, [candidates, catalogs, i18n.language]);
  const visible = candidates.filter(question => !filters.lesson || lessonOf(question) === filters.lesson);
  const hiddenSelected = selected.filter(id => !visible.some(question => question.id === id)).length;
  const update = (key, value) => setFilters(previous => ({ ...previous, [key]: value, ...(key === 'lesson' ? {} : { lesson: '' }) }));
  const keyDown = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
    if (event.key !== 'Tab') return;
    const items = [...modal.current.querySelectorAll('button:not(:disabled), select:not(:disabled), input:not(:disabled), [tabindex="0"]')];
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  return createPortal(<div className="game-picker-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="game-picker-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={hintId} ref={modal} onKeyDown={keyDown}>
      <div className="modal-heading">
        <div><p className="eyebrow">{t('gameQuestionPicker.eyebrow')}</p><h2 id={titleId}>{t('gameQuestionPicker.title')}</h2><p id={hintId} className="muted-copy">{t(`gameQuestionPicker.${cardScan ? 'cardHint' : headTilt ? 'comparisonHint' : 'hint'}`)}</p></div>
        <button ref={closeButton} className="modal-close" type="button" aria-label={t('common.close')} onClick={onClose}>×</button>
      </div>
      <div className="game-picker-filters form-grid">
        <label className="field">{t('gameQuestionPicker.grade')}<select value={filters.grade} onChange={event => update('grade', event.target.value)}><option value="">{t('gameQuestionPicker.allGrades')}</option>{grades.map(grade => <option key={grade} value={grade}>{t('gameQuestionPicker.gradeName', { grade })}</option>)}</select></label>
        <label className="field">{t('gameQuestionPicker.subject')}<select value={filters.subject} onChange={event => update('subject', event.target.value)}><option value="">{t('gameQuestionPicker.allSubjects')}</option>{subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}</select></label>
        <label className="field">{t('gameQuestionPicker.type')}<select value={filters.type} onChange={event => update('type', event.target.value)}><option value="">{t('gameQuestionPicker.allTypes')}</option>{(headTilt ? ['comparison'] : ['multiple-choice', 'essay', ...(questions.some(question => question.type === 'comparison') ? ['comparison'] : [])]).map(type => <option key={type} value={type}>{t(`gameQuestionPicker.types.${type}`)}</option>)}</select></label>
        <label className="field">{t('gameQuestionPicker.lesson')}<select value={filters.lesson} disabled={!lessons.length} onChange={event => update('lesson', event.target.value)}><option value="">{t(lessons.length ? 'gameQuestionPicker.allLessons' : 'gameQuestionPicker.noMappedLessons')}</option>{lessons.map(lesson => <option key={lesson.value} value={lesson.value}>{[lesson.title, !filters.grade && t('gameQuestionPicker.gradeName', { grade: lesson.grade }), !filters.subject && lesson.subject].filter(Boolean).join(' · ')}</option>)}</select></label>
      </div>
      {catalogState === 'loading' && <p className="game-picker-catalog-note" role="status">{t('gameQuestionPicker.loadingLessons')}</p>}
      {catalogState === 'error' && <p className="game-picker-catalog-note" role="status">{t('gameQuestionPicker.catalogError')} <button className="text-button" type="button" onClick={() => setRetry(value => value + 1)}>{t('gameQuestionPicker.retry')}</button></p>}
      <div className="game-picker-summary" role="status"><div><strong>{t('gameQuestionPicker.selected', { count: selected.length })}</strong><small>{t('gameQuestionPicker.showing', { count: visible.length })}{hiddenSelected > 0 && ` · ${t('gameQuestionPicker.hiddenSelected', { count: hiddenSelected })}`}</small></div><button className="text-button" type="button" disabled={!Object.values(filters).some(Boolean)} onClick={() => setFilters(emptyFilters)}>{t('gameQuestionPicker.clearFilters')}</button></div>
      <div className="game-picker-list">
        {visible.map(question => {
          const disabled = cardScan && !supportsCards(question);
          return <label className={`game-picker-item ${selected.includes(question.id) ? 'selected' : ''} ${disabled ? 'unavailable' : ''}`} key={question.id}>
            <input type="checkbox" disabled={disabled} checked={selected.includes(question.id)} onChange={() => onToggle(question.id)} />
            <span><b>{question.question}</b><small>{[question.subject, question.grade, t(`gameQuestionPicker.types.${typeOf(question)}`)].filter(Boolean).join(' · ')}</small>{question.lessonId && <small>{catalogs[scopeOf(question)]?.find(lesson => lesson.id === question.lessonId)?.title || question.lessonTitle || question.lessonId}</small>}{disabled && <small className="game-picker-unavailable">{t('gameQuestionPicker.cardUnavailable')}</small>}</span>
          </label>;
        })}
        {loading ? <div className="empty-state compact" role="status"><small>{t('common.loading')}</small></div> : !visible.length && <div className="empty-state compact"><small>{t('gameQuestionPicker.empty')}</small></div>}
      </div>
      <div className="modal-actions"><button className="primary-button" type="button" onClick={onClose}>{t('gameQuestionPicker.done', { count: selected.length })}</button></div>
    </section>
  </div>, document.body);
}
