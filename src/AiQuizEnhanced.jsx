import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LessonPicker from './LessonPicker';
import GeometryDiagram from './GeometryDiagram';
import MasterBulkAiQuiz from './MasterBulkAiQuiz';

const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const levels = ['Dễ', 'Vừa', 'Khó', 'Nâng cao'];

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

function safeGeometry(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.elements)) return null;
  const box = Array.isArray(value.boundingBox) && value.boundingBox.length === 4 ? value.boundingBox.map(Number) : [-6, 6, 6, -6];
  if (!box.every(Number.isFinite) || box[0] >= box[2] || box[1] <= box[3]) return null;
  return { ...value, boundingBox: box, elements: value.elements.filter(element => element && typeof element === 'object') };
}

function normalizeJob(job, index) {
  const question =
    job?.question && typeof job.question === 'object'
      ? {
          ...job.question,
          question: String(job.question.question || ''),
          options: Array.isArray(job.question.options) ? job.question.options.map(option => String(option)) : [],
          geometry: safeGeometry(job.question.geometry),
        }
      : null;
  return {
    ...(job && typeof job === 'object' ? job : {}),
    id: job?.id || `job-${index + 1}`,
    position: Number(job?.position) || index + 1,
    status: String(job?.status || 'queued'),
    attempts: Number(job?.attempts) || 0,
    question,
    error: job?.error ? String(job.error) : null,
  };
}

export function normalizeAiRun(payload) {
  if (!payload || typeof payload !== 'object' || !(payload.runId || payload.id)) return null;
  return {
    ...payload,
    runId: payload.runId || payload.id,
    jobs: Array.isArray(payload.jobs) ? payload.jobs.map(normalizeJob) : [],
  };
}

function isMasterAccount(teacher) {
  if (!teacher) return false;
  if (['master', 'system_admin'].includes(teacher.role)) return true;
  if (Array.isArray(teacher.roles) && teacher.roles.some(r => ['master', 'system_admin'].includes(r))) return true;
  return Array.isArray(teacher.permissions) && teacher.permissions.includes('system.admin');
}

export default function AiQuizEnhanced({ onError, teacher: initialTeacher }) {
  const { t } = useTranslation();
  const [currentTeacher, setCurrentTeacher] = useState(initialTeacher || null);
  const [mode, setMode] = useState('standard'); // 'standard' | 'bulk'
  const [form, setForm] = useState({
    grade: '4',
    subject: 'Toán học',
    count: 10,
    difficulty: 'Dễ',
    questionType: 'multiple-choice',
    autoSaveInactive: false,
  });
  const [lessons, setLessons] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [run, setRun] = useState(null);
  const [approved, setApproved] = useState([]);
  const [saved, setSaved] = useState([]);
  const [starting, setStarting] = useState(false);
  const streamRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (initialTeacher) {
      setCurrentTeacher(initialTeacher);
      return;
    }
    request('/auth/me')
      .then(data => {
        if (data?.teacher) setCurrentTeacher(data.teacher);
      })
      .catch(() => {});
  }, [initialTeacher]);

  const canUseBulk = isMasterAccount(currentTeacher);

  useEffect(() => {
    request(`/curriculum?grade=${form.grade}&subject=${encodeURIComponent(form.subject)}`)
      .then(data => {
        setLessons(data.lessons || []);
        setSelectedLessons([]);
      })
      .catch(error => onError(error.message));
  }, [form.grade, form.subject]);

  useEffect(() => {
    return () => {
      streamRef.current?.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling(runId) {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const latest = normalizeAiRun(await request(`/ai/quiz/runs/${runId}`));
        if (latest) {
          setRun(latest);
          if (['completed', 'failed', 'cancelled'].includes(latest.status)) {
            stopPolling();
            streamRef.current?.close();
          }
        }
      } catch {
        // Ignore transient network errors while polling
      }
    }, 4500);
  }

  function updateRun(updater) {
    setRun(previous => {
      const normalized = normalizeAiRun(previous);
      return normalized ? updater(normalized) : previous;
    });
  }

  function updateJob(jobId, patch) {
    updateRun(previous => ({
      ...previous,
      jobs: previous.jobs.map(job => (job.id === jobId ? normalizeJob({ ...job, ...patch }, job.position - 1) : job)),
    }));
  }

  function connect(runId) {
    streamRef.current?.close();
    startPolling(runId);
    const source = new window.EventSource(`${API}/ai/quiz/runs/${runId}/stream`, { withCredentials: true });
    streamRef.current = source;
    const parse = event => {
      try {
        return JSON.parse(event.data);
      } catch {
        return null;
      }
    };
    const snapshot = event => {
      const next = normalizeAiRun(parse(event));
      if (next) setRun(next);
    };
    source.addEventListener('run.snapshot', snapshot);
    source.addEventListener('run.started', snapshot);
    source.addEventListener('question.started', event => {
      const data = parse(event);
      if (data?.jobId) updateJob(data.jobId, { status: 'generating', attempts: data.attempt });
    });
    source.addEventListener('question.retrying', event => {
      const data = parse(event);
      if (data?.jobId) updateJob(data.jobId, { status: 'retrying', attempts: data.attempt, error: data.error });
    });
    source.addEventListener('question.completed', event => {
      const data = parse(event);
      if (data?.jobId) {
        updateJob(data.jobId, {
          status: 'completed',
          attempts: data.attempt,
          question: data.question,
          savedQuestionId: data.savedQuestionId || null,
          savedIsActive: data.savedIsActive ?? null,
          error: null,
        });
      }
    });
    source.addEventListener('question.failed', event => {
      const data = parse(event);
      if (data?.jobId) updateJob(data.jobId, { status: 'failed', attempts: data.attempt, error: data.error });
    });
    source.addEventListener('run.progress', snapshot);
    source.addEventListener('run.completed', event => {
      snapshot(event);
      stopPolling();
      source.close();
    });
    source.addEventListener('run.failed', event => {
      snapshot(event);
      stopPolling();
      source.close();
    });
    source.onerror = () => {
      source.close();
    };
  }

  async function start(event) {
    event.preventDefault();
    if (!selectedLessons.length) return onError(t('ai.selectLesson'));
    setStarting(true);
    setRun(null);
    setApproved([]);
    setSaved([]);
    try {
      const created = normalizeAiRun(
        await request('/ai/quiz/runs', {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            count: Number(form.count),
            lessonIds: selectedLessons,
            autoSave: Boolean(form.autoSaveInactive),
            saveActive: false,
          }),
        }),
      );
      if (!created) throw new Error('Máy chủ trả về tiến trình tạo câu hỏi không hợp lệ.');
      setRun(created);
      connect(created.runId);
    } catch (error) {
      onError(error.message);
    } finally {
      setStarting(false);
    }
  }

  async function retry(jobId) {
    if (!run?.runId) return;
    try {
      const next = normalizeAiRun(await request(`/ai/quiz/runs/${run.runId}/jobs/${jobId}/retry`, { method: 'POST' }));
      if (next) setRun(next);
      else updateJob(jobId, { status: 'generating', error: null });
      connect(run.runId);
    } catch (error) {
      onError(error.message);
    }
  }

  function approveAll() {
    setApproved((run?.jobs || []).filter(job => job.status === 'completed' && job.question).map(job => job.id));
  }

  function editQuestion(jobId, value) {
    const question = run?.jobs?.find(job => job.id === jobId)?.question;
    if (question) updateJob(jobId, { question: { ...question, question: value } });
  }

  async function saveJob(job, isActive = true) {
    if (!job.question || saved.includes(job.id) || job.savedQuestionId) return;
    try {
      await request('/questions', {
        method: 'POST',
        body: JSON.stringify({
          ...job.question,
          subject: job.question.subject || run.subject,
          grade: job.question.grade || `Lớp ${run.grade}`,
          level: job.question.level || run.difficulty,
          lessonId: job.lessonId || selectedLessons[0],
          lessonTitle: job.lessonTitle || job.question.lesson || '',
          isActive,
        }),
      });
      setSaved(previous => [...previous, job.id]);
    } catch (error) {
      onError(error.message);
    }
  }

  async function saveAll() {
    const pending = (run?.jobs || []).filter(
      job => job.question && approved.includes(job.id) && !saved.includes(job.id) && !job.savedQuestionId,
    );
    await Promise.all(pending.map(job => saveJob(job, true)));
  }

  async function saveAllInactiveWithoutApproval() {
    const pending = (run?.jobs || []).filter(
      job => job.status === 'completed' && job.question && !saved.includes(job.id) && !job.savedQuestionId,
    );
    await Promise.all(pending.map(job => saveJob(job, false)));
  }

  return (
    <section className="content-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">AI ASSISTANT · STREAM RUN</p>
          <h1>{t('ai.title')}</h1>
        </div>
        {canUseBulk && (
          <div className="ai-mode-switcher" role="tablist" aria-label="Chế độ tạo câu hỏi AI">
            <button
              type="button"
              className={mode === 'standard' ? 'primary-button' : 'secondary-button'}
              onClick={() => setMode('standard')}
            >
              Tạo theo bài học
            </button>
            <button
              type="button"
              className={mode === 'bulk' ? 'primary-button' : 'secondary-button'}
              onClick={() => setMode('bulk')}
            >
              ⚡ Master: Tạo số lượng lớn (Đa môn · Đa lớp)
            </button>
          </div>
        )}
      </div>

      {canUseBulk && mode === 'bulk' ? (
        <MasterBulkAiQuiz onError={onError} />
      ) : (
        <>
          <form className="panel form-grid" onSubmit={start}>
            <label className="field">
              Khối lớp
              <select value={form.grade} onChange={event => setForm({ ...form, grade: event.target.value })}>
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index}>{index + 1}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Môn học
              <select value={form.subject} onChange={event => setForm({ ...form, subject: event.target.value })}>
                <option>Toán học</option>
                <option>Tiếng Việt</option>
                <option>Tiếng Anh</option>
              </select>
            </label>
            <label className="field">
              Hình thức
              <select value={form.questionType} onChange={event => setForm({ ...form, questionType: event.target.value })}>
                <option value="multiple-choice">Trắc nghiệm · 4 đáp án</option>
                <option value="comparison">{'So sánh · <, =, >'}</option>
                <option value="essay">Tự luận</option>
              </select>
            </label>
            <label className="field">
              Độ khó
              <select value={form.difficulty} onChange={event => setForm({ ...form, difficulty: event.target.value })}>
                {levels.map(level => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Số câu
              <input
                type="number"
                min="1"
                max="50"
                value={form.count}
                onChange={event => setForm({ ...form, count: event.target.value })}
              />
            </label>
            <LessonPicker
              lessons={lessons}
              selected={selectedLessons}
              onChange={setSelectedLessons}
              label={t('ai.selectLesson')}
            />
            <label className="check wide">
              <input
                type="checkbox"
                checked={form.autoSaveInactive}
                onChange={event => setForm({ ...form, autoSaveInactive: event.target.checked })}
              />
              <span>Tự động lưu ngay vào kho ở trạng thái Inactive (Chưa cần duyệt)</span>
            </label>
            <div className="wide ai-comparison-hint">
              {form.questionType === 'comparison'
                ? 'AI sẽ tạo bài Toán so sánh và 3 lựa chọn tương ứng với dấu <, =, >.'
                : 'Chọn hình thức để AI tạo đúng cấu trúc câu hỏi.'}
            </div>
            <button className="primary-button" type="submit" disabled={starting}>
              {starting ? t('ai.generating') : `✨ ${t('ai.generate')}`}
            </button>
          </form>

          {run && (
            <article className="dashboard-panel ai-run-summary">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">AI GENERATION RUN</p>
                  <h2>{t('ai.editGenerated')}</h2>
                </div>
                <span className="panel-kicker">{run.status}</span>
              </div>
              <div className="ai-review-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={approveAll}
                  disabled={!run.jobs?.some(job => job.status === 'completed' && job.question)}
                >
                  {t('ai.approveAll')}
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={saveAll}
                  disabled={!approved.length || approved.every(id => saved.includes(id))}
                >
                  {t('ai.saveApproved')}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={saveAllInactiveWithoutApproval}
                  disabled={
                    !run.jobs?.some(
                      job => job.status === 'completed' && job.question && !saved.includes(job.id) && !job.savedQuestionId,
                    )
                  }
                >
                  💾 Lưu tất cả ở trạng thái Inactive (Chưa cần duyệt)
                </button>
              </div>
              <div className="ai-job-list">
                {run.jobs?.map(job => (
                  <article className={`ai-job ${job.status}`} key={job.id}>
                    <span className="ai-job-index">{job.position}</span>
                    <div>
                      {job.question ? (
                        <>
                          <textarea
                            className="ai-question-editor"
                            value={job.question.question}
                            onChange={event => editQuestion(job.id, event.target.value)}
                            aria-label={`${t('ai.editGenerated')} ${job.position}`}
                          />
                          <GeometryDiagram geometry={job.question.geometry} ariaLabel="Hình minh họa cho câu hỏi AI" />
                          <small>{job.question.options?.join(' · ')}</small>
                        </>
                      ) : (
                        <>
                          <b>{job.status === 'failed' ? 'Tạo câu hỏi thất bại' : 'Đang tạo câu hỏi…'}</b>
                          <small>{job.error || `Lần thử ${job.attempts || 0}`}</small>
                        </>
                      )}
                    </div>
                    <div>
                      {job.status === 'completed' ? (
                        saved.includes(job.id) || job.savedQuestionId ? (
                          <span className="status-pill">
                            {job.savedIsActive === false ? 'Đã lưu (Inactive)' : t('ai.saved')}
                          </span>
                        ) : approved.includes(job.id) ? (
                          <>
                            <span className="status-pill">{t('ai.approved')}</span>
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => setApproved(previous => previous.filter(id => id !== job.id))}
                            >
                              {t('ai.unapprove')}
                            </button>
                          </>
                        ) : (
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => setApproved(previous => [...previous, job.id])}
                          >
                            {t('ai.approve')}
                          </button>
                        )
                      ) : job.status === 'failed' ? (
                        <button className="text-button" type="button" onClick={() => retry(job.id)}>
                          Tạo lại
                        </button>
                      ) : (
                        <span className="ai-job-spinner" />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </article>
          )}
        </>
      )}
    </section>
  );
}
