import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import './homework-management.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error?.message || payload.error || 'Không thể hoàn tất yêu cầu.');
  }
  return payload.success === true && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
}

const fillBlankTypes = new Set(['fill-in-blank', 'fill_in_blank', 'fill-blank', 'fill_blank', 'cloze']);

function promptOf(question) {
  return String(question?.question || question?.prompt || question?.text || '').trim();
}

function isFillBlank(question) {
  return fillBlankTypes.has(String(question?.type || '').toLowerCase())
    || (question?.type === 'essay' && (!Array.isArray(question?.options) || question.options.length === 0));
}

function answerOf(question) {
  if (question?.answerText !== undefined && question.answerText !== null) return String(question.answerText);
  if (question?.correctAnswer !== undefined && question.correctAnswer !== null) return String(question.correctAnswer);
  if (isFillBlank(question) && question?.explanation) return String(question.explanation);
  return question?.answer === undefined || question?.answer === null ? '' : String(question.answer);
}

export default function HomeworkManagement({ onError }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ title: '', quizId: '', classId: '', dueAt: '', allowRetry: false, showAnswers: true });
  const [results, setResults] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [assignmentData, quizData, classData] = await Promise.all([
        request('/assignments'),
        request('/quiz-sets'),
        request('/classes'),
      ]);
      setItems(assignmentData.items || []);
      setQuizzes(quizData.items || []);
      setClasses(classData.items || []);
    } catch (error) {
      onError(error.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await request('/assignments', {
        method: 'POST',
        body: JSON.stringify({ ...form, dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null }),
      });
      setForm(previous => ({ ...previous, title: '' }));
      await load();
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function publish(id, status) {
    try {
      await request(`/assignments/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
      await load();
    } catch (error) {
      onError(error.message);
    }
  }

  async function showResults(id) {
    try {
      setResults((await request(`/assignments/${id}/results`)).items || []);
    } catch (error) {
      onError(error.message);
    }
  }

  async function showQuestions(item) {
    setBusy(true);
    try {
      const detail = await request(`/quiz-sets/${item.quizId}`);
      setPreview({ title: item.title, questions: detail.questions || [] });
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <section className="content-page homework-page">
    <div className="dashboard-heading">
      <div><p className="eyebrow">{t('homework.eyebrow')}</p><h1>{t('homework.title')}</h1><p className="muted-copy">{t('homework.description')}</p></div>
    </div>
    <form className="panel form-grid" onSubmit={save}>
      <label className="field">{t('homework.assignmentTitle')}<input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label>
      <label className="field">{t('homework.quiz')}<select required value={form.quizId} onChange={event => setForm({ ...form, quizId: event.target.value })}><option value="">{t('homework.chooseQuiz')}</option>{quizzes.map(quiz => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}</select></label>
      <label className="field">{t('homework.class')}<select required value={form.classId} onChange={event => setForm({ ...form, classId: event.target.value })}><option value="">{t('homework.chooseClass')}</option>{classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="field">{t('homework.dueAt')}<input type="datetime-local" value={form.dueAt} onChange={event => setForm({ ...form, dueAt: event.target.value })} /></label>
      <label className="check"><input type="checkbox" checked={form.allowRetry} onChange={event => setForm({ ...form, allowRetry: event.target.checked })} />{t('quiz.allowRetry')}</label>
      <label className="check"><input type="checkbox" checked={form.showAnswers} onChange={event => setForm({ ...form, showAnswers: event.target.checked })} />{t('quiz.showAnswers')}</label>
      <div className="wide"><button className="primary-button" type="submit" disabled={busy}>{busy ? t('common.loading') : t('homework.create')}</button></div>
    </form>
    <div className="dashboard-panel homework-list-panel">
      <div className="panel-heading"><div><h2>{t('homework.list')}</h2><small>{t('homework.count', { count: items.length })}</small></div></div>
      <div className="homework-list">{items.map(item => <article className="homework-card" key={item.id}>
        <div><strong>{item.title}</strong><small>{item.quizTitle} · {item.className} · {item.submissionCount || 0} {t('homework.submissions')} · {item.computedStatus}</small></div>
        <div className="homework-actions"><button className="text-button" type="button" disabled={busy} onClick={() => showQuestions(item)}>{t('homework.viewQuestions')}</button><button className="text-button" type="button" onClick={() => publish(item.id, item.status === 'published' ? 'closed' : 'published')}>{item.status === 'published' ? t('homework.close') : t('homework.publish')}</button><button className="text-button" type="button" onClick={() => showResults(item.id)}>{t('homework.viewResults')}</button></div>
      </article>)}{!items.length && <div className="empty-state compact"><small>{t('homework.empty')}</small></div>}</div>
    </div>
    {results && <div className="dashboard-panel"><div className="panel-heading"><h2>{t('homework.results')}</h2><button className="text-button" type="button" onClick={() => setResults(null)}>{t('common.close')}</button></div>{results.map(result => <div className="member-row" key={result.id}><span>{result.nickname}</span><span>{result.score}/{result.total} · {result.percentage}%</span></div>)}</div>}
    {preview && <div className="auth-overlay" role="dialog" aria-modal="true"><div className="auth-card homework-preview-modal"><button className="close-auth" type="button" onClick={() => setPreview(null)} aria-label={t('common.close')}>×</button><p className="eyebrow">{t('homework.previewEyebrow')}</p><h2>{preview.title}</h2><div className="homework-question-list">{preview.questions.map((question, index) => <article className="homework-question" key={question.id || index}><b>{index + 1}. {promptOf(question) || t('homework.missingPrompt')}</b>{question.geometry && <small>{t('homework.hasIllustration')}</small>}{isFillBlank(question) ? <div className="homework-correct-answer"><span>{t('homework.correctAnswer')}</span><strong>{answerOf(question) || '—'}</strong></div> : <div className="homework-options">{(Array.isArray(question.options) ? question.options : []).map((option, optionIndex) => <span key={optionIndex}>{String.fromCharCode(65 + optionIndex)}. {option}</span>)}</div>}</article>)}</div></div></div>}
  </section>;
}
