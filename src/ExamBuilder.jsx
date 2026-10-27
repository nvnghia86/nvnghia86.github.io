import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LessonPicker from './LessonPicker';
import './exam-builder.css';

const STRANDS = ['numbers', 'geometry', 'statistics'];
const LEVELS = [1, 2, 3];
const TYPES = ['multiple-choice', 'essay'];
const initialCells = () => STRANDS.flatMap(strand => LEVELS.flatMap(level => TYPES.map(type => ({ strand, level, type, count: 0 }))));
function key(strand, level, type) { return `${strand}:${level}:${type}`; }
function currentAcademicYear() { const year = new Date().getFullYear(); return `${year}–${year + 1}`; }

export default function ExamBuilder({ api, apiBase, onError }) {
  const { t, i18n } = useTranslation();
  const formatNumber = value => new Intl.NumberFormat(i18n.language?.startsWith('en') ? 'en' : 'vi-VN', { maximumFractionDigits: 2 }).format(value);
  const [form, setForm] = useState({ semester: 'Giữa học kỳ I', grade: '4', subject: 'Toán học', academic_year: currentAcademicYear() });
  const [lessons, setLessons] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [mapping, setMapping] = useState({ numbers: [], geometry: [], statistics: [] });
  const [cells, setCells] = useState(initialCells);
  const [typeTotals, setTypeTotals] = useState({ 'multiple-choice': 0, essay: 0 });
  const [questions, setQuestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    api(`/curriculum?grade=${form.grade}&subject=${encodeURIComponent(form.subject)}`)
      .then(data => { if (active) setLessons(data.lessons || []); })
      .catch(error => onError(error.message));
    return () => { active = false; };
  }, [api, form.grade, form.subject, onError]);

  const selectedLessonRows = useMemo(() => lessons.filter(item => selectedLessons.includes(item.id)), [lessons, selectedLessons]);
  const totalCount = cells.reduce((sum, cell) => sum + Number(cell.count || 0), 0);
  const typeCounts = Object.fromEntries(TYPES.map(type => [type, cells.reduce((sum, cell) => sum + (cell.type === type ? Number(cell.count || 0) : 0), 0)]));
  const totalPoints = TYPES.reduce((sum, type) => sum + Number(typeTotals[type] || 0), 0);
  const essayLevel2Count = cells.reduce((sum, cell) => sum + (cell.type === 'essay' && cell.level === 2 ? Number(cell.count || 0) : 0), 0);
  const fixedEssayCents = cells.reduce((sum, cell) => sum + (cell.type === 'essay' ? Number(cell.count || 0) * (cell.level === 1 ? 200 : cell.level === 3 ? 100 : 0) : 0), 0);
  const mcCents = Math.round(Number(typeTotals['multiple-choice']) * 100);
  const essayCents = Math.round(Number(typeTotals.essay) * 100);
  const typeScoreError = TYPES.some(type => { const value = Number(typeTotals[type]); const cents = Math.round(value * 100); return typeTotals[type] === '' || !Number.isFinite(value) || value < 0 || value > 100 || Math.abs(value * 100 - cents) > 1e-7; })
    || mcCents !== typeCounts['multiple-choice'] * 50
    || essayCents - fixedEssayCents < essayLevel2Count
    || (!essayLevel2Count && essayCents !== fixedEssayCents);
  const payload = () => ({ ...form, lessonIds: selectedLessons, lessonMapping: mapping, cells, typeTotals });
  function updateForm(field, value) { setForm(previous => ({ ...previous, [field]: value })); setQuestions([]); setNotice(''); }
  function updateSelected(ids) { setSelectedLessons(ids); setMapping(previous => Object.fromEntries(STRANDS.map(strand => [strand, previous[strand].filter(id => ids.includes(id))]))); setQuestions([]); setNotice(''); }
  function toggleMapped(strand, id) { setMapping(previous => ({ ...previous, [strand]: previous[strand].includes(id) ? previous[strand].filter(value => value !== id) : [...previous[strand], id] })); setQuestions([]); setNotice(''); }
  function updateCell(strand, level, type, field, value) { setCells(previous => previous.map(cell => key(cell.strand, cell.level, cell.type) === key(strand, level, type) ? { ...cell, [field]: value === '' ? '' : Number(value) } : cell)); setQuestions([]); setNotice(''); }
  function updateTypeTotal(type, value) { setTypeTotals(previous => ({ ...previous, [type]: value === '' ? '' : Number(value) })); setQuestions([]); setNotice(''); }
  function updateQuestion(slotId, field, value) { setQuestions(previous => previous.map(item => item.slotId === slotId ? { ...item, [field]: value } : item)); }
  function updateOption(slotId, index, value) { setQuestions(previous => previous.map(item => item.slotId === slotId ? { ...item, options: item.options.map((option, optionIndex) => optionIndex === index ? value : option) } : item)); }

  async function generate(event) {
    event.preventDefault();
    setNotice(''); setBusy(true); setQuestions([]);
    try {
      const result = await api('/exams/generate', { method: 'POST', body: JSON.stringify(payload()) });
      setQuestions(result.questions || []);
      setNotice(t('exam.generated', { count: result.questions?.length || 0 }));
    } catch (error) { onError(error.message); } finally { setBusy(false); }
  }

  async function exportDocx() {
    setExporting(true); setNotice('');
    try {
      const response = await fetch(`${apiBase}/exams/export`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload(), questions }) });
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error?.message || result.error || t('exam.exportError')); }
      const blob = await response.blob();
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = `de-kiem-tra-toan-lop-4-${form.academic_year.replace(/\s+/g, '')}.docx`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      setNotice(t('exam.exported'));
    } catch (error) { onError(error.message); } finally { setExporting(false); }
  }

  const mcCount = cells.filter(cell => cell.type === 'multiple-choice').reduce((sum, item) => sum + Number(item.count || 0), 0);
  return <section className="content-page exam-builder-page">
    <div className="dashboard-heading"><div><p className="eyebrow">{t('exam.eyebrow')}</p><h1>{t('exam.title')}</h1><p className="muted-copy">{t('exam.description')}</p></div></div>
    <form onSubmit={generate}>
      <div className="panel form-grid exam-setup">
        <label className="field">{t('exam.semester')}<select value={form.semester} onChange={event => updateForm('semester', event.target.value)}>{['Giữa học kỳ I', 'Cuối học kỳ I', 'Giữa học kỳ II', 'Cuối học kỳ II'].map((value, index) => <option key={value} value={value}>{t(`exam.semesters.${index}`)}</option>)}</select></label>
        <label className="field">{t('exam.grade')}<select value={form.grade} onChange={event => updateForm('grade', event.target.value)}><option value="4">{t('exam.gradeFour')}</option></select></label>
        <label className="field">{t('exam.subject')}<select value={form.subject} onChange={event => updateForm('subject', event.target.value)}><option value="Toán học">{t('exam.math')}</option></select></label>
        <label className="field">{t('exam.academicYear')}<input required value={form.academic_year} onChange={event => updateForm('academic_year', event.target.value)} placeholder="2026–2027" /></label>
        <p className="muted-copy wide exam-scope">{t('exam.scope')}</p>
      </div>
      <div className="panel exam-lesson-panel"><h2>{t('exam.selectLessons')}</h2><LessonPicker lessons={lessons} selected={selectedLessons} onChange={updateSelected} label={t('exam.lessonPicker')} /></div>
      <div className="panel exam-map-panel"><h2>{t('exam.mapLessons')}</h2><p className="muted-copy">{t('exam.mapHint')}</p><div className="exam-strand-list">{STRANDS.map(strand => <div className="exam-strand" key={strand}><strong>{t(`exam.strands.${strand}`)}</strong><div className="exam-lesson-tags">{selectedLessonRows.map(lesson => <label className="check" key={lesson.id}><input type="checkbox" checked={mapping[strand].includes(lesson.id)} onChange={() => toggleMapped(strand, lesson.id)} />{lesson.title}</label>)}{!selectedLessonRows.length && <small>{t('exam.noLessons')}</small>}</div></div>)}</div></div>
      <div className="panel exam-matrix-panel"><div className="panel-heading"><div><h2>{t('exam.matrix')}</h2><p className="muted-copy">{t('exam.matrixHint')}</p></div><span className="setup-badge">{t('exam.summary', { count: totalCount, points: formatNumber(totalPoints) })}</span></div><div className="exam-type-totals">{TYPES.map(type => <label className="field" key={type}>{t('exam.typeTotal', { type: t(`exam.types.${type}`) })}<input type="number" min="0" max="100" step="0.01" value={typeTotals[type]} onChange={event => updateTypeTotal(type, event.target.value)} /><small>{t('exam.typeCount', { count: typeCounts[type] })}</small></label>)}</div>{typeScoreError && <p className="exam-score-error" role="alert">{t('exam.scoreError', { mcPoints: formatNumber(typeCounts['multiple-choice'] * 0.5) })}</p>}<p className="muted-copy exam-score-guide">{t('exam.scoreGuide')}</p><div className="exam-matrix-scroll"><table className="exam-matrix"><thead><tr><th rowSpan="2">{t('exam.strand')}</th>{LEVELS.map(level => <th key={level} colSpan="2">{t('exam.level', { level })}</th>)}</tr><tr>{LEVELS.flatMap(level => TYPES.map(type => <th key={`${level}:${type}`}>{t(`exam.types.${type}`)}</th>))}</tr></thead><tbody>{STRANDS.map(strand => <tr key={strand}><th>{t(`exam.strands.${strand}`)}</th>{LEVELS.flatMap(level => TYPES.map(type => { const item = cells.find(cell => key(cell.strand, cell.level, cell.type) === key(strand, level, type)); return <td key={`${strand}:${level}:${type}`}><label>{t('exam.count')}<input type="number" min="0" max="10" value={item.count} onChange={event => updateCell(strand, level, type, 'count', event.target.value)} /></label></td>; }))}</tr>)}</tbody></table></div><p className="muted-copy">{t('exam.countHint', { count: mcCount, total: totalCount })}</p></div>
      <div className="actions"><button className="primary-button" type="submit" disabled={busy || !totalCount || totalCount > 20 || !selectedLessons.length || typeScoreError}>{busy ? t('exam.generating') : t('exam.generate')}</button></div>
    </form>
    {notice && <p className="exam-notice" role="status">{notice}</p>}
    {!!questions.length && <div className="panel exam-review"><div className="panel-heading"><div><h2>{t('exam.review')}</h2><p className="muted-copy">{t('exam.reviewHint')}</p></div><button type="button" className="primary-button" onClick={exportDocx} disabled={exporting}>{exporting ? t('exam.exporting') : t('exam.export')}</button></div><div className="exam-question-list">{questions.map((item, index) => <article className="exam-question" key={item.slotId}><div className="exam-question-head"><strong>{t('exam.mcNumber', { number: index + 1 })}</strong><small>{t(`exam.strands.${item.strand}`)} · {t('exam.level', { level: item.level })} · {formatNumber(item.points)} {t('exam.points')} · {lessons.find(lesson => lesson.id === item.lessonId)?.title}</small></div><label className="field">{t('exam.question')}<textarea rows="3" value={item.question} onChange={event => updateQuestion(item.slotId, 'question', event.target.value)} /></label>{item.type === 'multiple-choice' && <div className="exam-options">{item.options.map((option, optionIndex) => <label className="field" key={optionIndex}>{'ABCD'[optionIndex]}<input value={option} onChange={event => updateOption(item.slotId, optionIndex, event.target.value)} /></label>)}<label className="field">{t('exam.correctAnswer')}<select value={item.answer} onChange={event => updateQuestion(item.slotId, 'answer', Number(event.target.value))}>{item.options.map((_, optionIndex) => <option key={optionIndex} value={optionIndex}>{'ABCD'[optionIndex]}</option>)}</select></label></div>}<label className="field">{t('exam.explanation')}<textarea rows="2" value={item.explanation || ''} onChange={event => updateQuestion(item.slotId, 'explanation', event.target.value)} /></label></article>)}</div></div>}
  </section>;
}
