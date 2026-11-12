import React, { useEffect, useMemo, useRef, useState } from 'react';
import GeometryDiagram from './GeometryDiagram';

const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const ALL_GRADES = ['1', '2', '3', '4', '5'];
const ALL_SUBJECTS = ['Toán học', 'Tiếng Việt', 'Tiếng Anh'];
const ALL_TYPES = [
  { id: 'multiple-choice', label: 'Trắc nghiệm · 4 đáp án' },
  { id: 'comparison', label: 'So sánh · <, =, >' },
  { id: 'essay', label: 'Tự luận' },
];
const ALL_DIFFICULTIES = ['Dễ', 'Vừa', 'Khó', 'Nâng cao'];

export const DEFAULT_AI_PROVIDERS = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    defaultModel: 'openai/gpt-4o-mini',
    models: [
      'openai/gpt-4o-mini',
      'google/gemini-2.0-flash-001',
      'anthropic/claude-3.5-haiku',
      'deepseek/deepseek-chat',
      'meta-llama/llama-3.3-70b-instruct',
      'qwen/qwen-2.5-72b-instruct',
    ],
    placeholderKey: 'sk-or-v1-...',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro'],
    placeholderKey: 'AIzaSy...',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o'],
    placeholderKey: 'sk-proj-...',
  },
  {
    id: 'groq',
    label: 'Groq Cloud',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen-qwq-32b', 'gemma2-9b-it'],
    placeholderKey: 'gsk_...',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    placeholderKey: 'sk-...',
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    defaultModel: 'claude-3-5-haiku-latest',
    models: ['claude-3-5-haiku-latest', 'claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest'],
    placeholderKey: 'sk-ant-...',
  },
  {
    id: 'ninerouter',
    label: '9Router (Gateway máy chủ)',
    defaultModel: 'Chat_GPT',
    models: ['Chat_GPT', 'gpt-4o-mini', 'gemini-2.0-flash'],
    placeholderKey: 'Để trống nếu dùng cấu hình mặc định máy chủ',
  },
];

const STORAGE_KEYS_ID = 'quizzz.masterBulkAi.providerKeys';

function loadSavedProviderKeys() {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEYS_ID);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

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

function toggleItem(list, value) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}

function buildDefaultWorkers(count = 2, providers = DEFAULT_AI_PROVIDERS) {
  const openRouterModels = providers.find(p => p.id === 'openrouter')?.models || [
    'openai/gpt-4o-mini',
    'google/gemini-2.0-flash-001',
    'anthropic/claude-3.5-haiku',
    'deepseek/deepseek-chat',
  ];
  return Array.from({ length: count }, (_, index) => ({
    workerId: index + 1,
    provider: 'openrouter',
    model: openRouterModels[index % openRouterModels.length] || 'openai/gpt-4o-mini',
  }));
}

export default function MasterBulkAiQuiz({ onError }) {
  const [grades, setGrades] = useState(['4', '5']);
  const [subjects, setSubjects] = useState(['Toán học', 'Tiếng Việt', 'Tiếng Anh']);
  const [questionTypes, setQuestionTypes] = useState(['multiple-choice', 'essay']);
  const [difficulties, setDifficulties] = useState(['Dễ', 'Vừa', 'Khó']);
  const [comparisonOnlyMath, setComparisonOnlyMath] = useState(true);
  const [lessonScopeMode, setLessonScopeMode] = useState('all'); // 'all' | 'custom'
  const [volumes, setVolumes] = useState([1, 2]);
  const [catalogGroups, setCatalogGroups] = useState([]);
  const [selectedLessonIds, setSelectedLessonIds] = useState([]);
  const [lessonSearch, setLessonSearch] = useState('');
  const [questionsPerCombo, setQuestionsPerCombo] = useState(2);
  const [maxTotalJobs, setMaxTotalJobs] = useState(120);
  const [saveMode, setSaveMode] = useState('inactive'); // 'inactive' | 'active' | 'manual'
  const [concurrency, setConcurrency] = useState(2);
  const [providers, setProviders] = useState(DEFAULT_AI_PROVIDERS);
  const [workers, setWorkers] = useState(() => buildDefaultWorkers(2, DEFAULT_AI_PROVIDERS));
  const [providerKeys, setProviderKeys] = useState(() => loadSavedProviderKeys());
  const [rememberKeys, setRememberKeys] = useState(true);
  const [showKeys, setShowKeys] = useState(false);
  const [starting, setStarting] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [run, setRun] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const streamRef = useRef(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    let active = true;
    request('/ai/quiz/providers')
      .then(data => {
        if (!active || !Array.isArray(data?.items) || !data.items.length) return;
        const merged = data.items.map(serverItem => {
          const fallback = DEFAULT_AI_PROVIDERS.find(p => p.id === serverItem.id) || {};
          return { ...fallback, ...serverItem };
        });
        setProviders(merged);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setWorkers(prev => {
      const target = Math.min(6, Math.max(1, Number(concurrency) || 1));
      if (prev.length === target) return prev;
      if (prev.length > target) return prev.slice(0, target);
      const openRouterModels = providers.find(p => p.id === 'openrouter')?.models || [
        'openai/gpt-4o-mini',
        'google/gemini-2.0-flash-001',
        'anthropic/claude-3.5-haiku',
        'deepseek/deepseek-chat',
      ];
      const next = [...prev];
      while (next.length < target) {
        const idx = next.length;
        const baseProvider = prev[0]?.provider || 'openrouter';
        const provDef = providers.find(p => p.id === baseProvider) || providers[0];
        const modelList = provDef?.models || openRouterModels;
        next.push({
          workerId: idx + 1,
          provider: baseProvider,
          model: modelList[idx % modelList.length] || provDef?.defaultModel || 'openai/gpt-4o-mini',
        });
      }
      return next;
    });
  }, [concurrency, providers]);

  useEffect(() => {
    if (!rememberKeys) return;
    try {
      window.localStorage?.setItem(STORAGE_KEYS_ID, JSON.stringify(providerKeys));
    } catch {
      // Ignore storage quota errors
    }
  }, [providerKeys, rememberKeys]);

  useEffect(() => {
    if (lessonScopeMode !== 'custom' || !grades.length || !subjects.length) {
      return undefined;
    }
    let active = true;
    const pairs = [];
    for (const grade of grades) {
      for (const subject of subjects) {
        pairs.push({ grade, subject });
      }
    }
    Promise.all(
      pairs.map(({ grade, subject }) =>
        request(`/curriculum?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`)
          .then(data => ({ grade, subject, lessons: data.lessons || [] }))
          .catch(() => ({ grade, subject, lessons: [] })),
      ),
    ).then(groups => {
      if (!active) return;
      setCatalogGroups(groups);
    });
    return () => {
      active = false;
    };
  }, [lessonScopeMode, grades, subjects]);

  useEffect(() => {
    return () => {
      streamRef.current?.close();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const activeProviderDefs = useMemo(() => {
    const usedIds = Array.from(new Set(workers.map(w => w.provider)));
    return usedIds.map(id => providers.find(p => p.id === id) || { id, label: id, models: [], defaultModel: '' });
  }, [workers, providers]);

  const validCombosCount = useMemo(() => {
    let combos = 0;
    for (const _grade of grades) {
      for (const subject of subjects) {
        for (const qType of questionTypes) {
          if (comparisonOnlyMath && qType === 'comparison' && subject !== 'Toán học') continue;
          combos += difficulties.length;
        }
      }
    }
    return combos;
  }, [grades, subjects, questionTypes, difficulties, comparisonOnlyMath]);

  const estimatedTotalQuestions = useMemo(() => {
    const raw = validCombosCount * Math.max(1, Number(questionsPerCombo) || 1);
    return Math.min(Math.max(1, Number(maxTotalJobs) || 200), raw);
  }, [validCombosCount, questionsPerCombo, maxTotalJobs]);

  function updateWorker(index, patch) {
    setWorkers(prev =>
      prev.map((worker, idx) => {
        if (idx !== index) return worker;
        const updated = { ...worker, ...patch };
        if (patch.provider && patch.provider !== worker.provider && !patch.model) {
          const provDef = providers.find(p => p.id === patch.provider);
          const models = provDef?.models || [];
          const sameProviderPriorCount = prev
            .slice(0, idx)
            .filter(item => item.provider === patch.provider).length;
          updated.model =
            models[sameProviderPriorCount % Math.max(1, models.length)] ||
            provDef?.defaultModel ||
            '';
        }
        return updated;
      }),
    );
  }

  function distributeOpenRouterModels() {
    const orDef = providers.find(p => p.id === 'openrouter') || DEFAULT_AI_PROVIDERS[0];
    const models = orDef.models || [];
    setWorkers(prev =>
      prev.map((w, idx) => ({
        ...w,
        provider: 'openrouter',
        model: models[idx % models.length] || orDef.defaultModel,
      })),
    );
  }

  function distributeMultiProviders() {
    const rotation = ['openrouter', 'gemini', 'openai', 'groq', 'deepseek', 'anthropic'];
    setWorkers(prev =>
      prev.map((w, idx) => {
        const provId = rotation[idx % rotation.length];
        const provDef = providers.find(p => p.id === provId) || DEFAULT_AI_PROVIDERS[0];
        return {
          ...w,
          provider: provDef.id,
          model: provDef.defaultModel,
        };
      }),
    );
  }

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  function startPolling(runId) {
    stopPolling();
    pollTimerRef.current = setInterval(async () => {
      try {
        const snapshot = await request(`/ai/quiz/runs/${runId}`);
        if (snapshot && (snapshot.runId || snapshot.id)) {
          setRun(snapshot);
          if (['completed', 'failed', 'cancelled'].includes(snapshot.status)) {
            stopPolling();
            streamRef.current?.close();
          }
        }
      } catch {
        // Ignore transient network hiccups during background polling
      }
    }, 4000);
  }

  function connectStream(runId) {
    streamRef.current?.close();
    startPolling(runId);
    try {
      const source = new window.EventSource(`${API}/ai/quiz/runs/${runId}/stream`, { withCredentials: true });
      streamRef.current = source;
      const parse = event => {
        try {
          return JSON.parse(event.data);
        } catch {
          return null;
        }
      };
      const applySnapshot = event => {
        const next = parse(event);
        if (next && (next.runId || next.id)) setRun(next);
      };
      const patchJob = (jobId, patch) => {
        setRun(previous => {
          if (!previous || !Array.isArray(previous.jobs)) return previous;
          return {
            ...previous,
            jobs: previous.jobs.map(job => (job.id === jobId ? { ...job, ...patch } : job)),
          };
        });
      };
      source.addEventListener('run.snapshot', applySnapshot);
      source.addEventListener('run.started', applySnapshot);
      source.addEventListener('run.progress', applySnapshot);
      source.addEventListener('question.started', event => {
        const data = parse(event);
        if (data?.jobId) {
          patchJob(data.jobId, {
            status: 'generating',
            attempts: data.attempt,
            workerId: data.workerId ?? undefined,
            provider: data.provider ?? undefined,
            model: data.model ?? undefined,
          });
        }
      });
      source.addEventListener('question.retrying', event => {
        const data = parse(event);
        if (data?.jobId) {
          patchJob(data.jobId, {
            status: 'retrying',
            attempts: data.attempt,
            workerId: data.workerId ?? undefined,
            provider: data.provider ?? undefined,
            model: data.model ?? undefined,
            error: data.error,
          });
        }
      });
      source.addEventListener('question.completed', event => {
        const data = parse(event);
        if (data?.jobId) {
          patchJob(data.jobId, {
            status: 'completed',
            attempts: data.attempt,
            workerId: data.workerId ?? undefined,
            provider: data.provider ?? undefined,
            model: data.model ?? undefined,
            question: data.question,
            savedQuestionId: data.savedQuestionId || null,
            savedIsActive: data.savedIsActive ?? null,
            error: null,
          });
        }
      });
      source.addEventListener('question.failed', event => {
        const data = parse(event);
        if (data?.jobId) {
          patchJob(data.jobId, {
            status: 'failed',
            attempts: data.attempt,
            workerId: data.workerId ?? undefined,
            provider: data.provider ?? undefined,
            model: data.model ?? undefined,
            error: data.error,
          });
        }
      });
      source.addEventListener('run.completed', event => {
        applySnapshot(event);
        stopPolling();
        source.close();
      });
      source.addEventListener('run.failed', event => {
        applySnapshot(event);
        stopPolling();
        source.close();
      });
      source.onerror = () => {
        source.close();
      };
    } catch {
      // Polling fallback is already active
    }
  }

  async function startBulkRun(event) {
    event.preventDefault();
    if (!grades.length) return onError('Hãy chọn ít nhất 1 khối lớp.');
    if (!subjects.length) return onError('Hãy chọn ít nhất 1 môn học.');
    if (!questionTypes.length) return onError('Hãy chọn ít nhất 1 hình thức câu hỏi.');
    if (!difficulties.length) return onError('Hãy chọn ít nhất 1 mức độ khó.');
    if (lessonScopeMode === 'custom' && !selectedLessonIds.length) {
      return onError('Hãy chọn ít nhất 1 bài học hoặc chuyển sang chế độ Tất cả bài học.');
    }

    setStarting(true);
    try {
      const payload = {
        grades,
        subjects,
        questionTypes,
        difficulties,
        comparisonOnlyMath,
        volumes: lessonScopeMode === 'all' ? volumes : [],
        lessonIds: lessonScopeMode === 'custom' ? selectedLessonIds : [],
        strictLessonFilter: lessonScopeMode === 'custom',
        questionsPerCombo: Number(questionsPerCombo) || 1,
        maxTotalJobs: Number(maxTotalJobs) || 120,
        autoSave: saveMode !== 'manual',
        saveActive: saveMode === 'active',
        concurrency: Number(concurrency) || 2,
        providerKeys,
        workers: workers.map((w, idx) => ({
          workerId: idx + 1,
          provider: w.provider,
          model: w.model,
          apiKey: String(providerKeys[w.provider] || '').trim(),
        })),
      };
      const created = await request('/ai/quiz/bulk-runs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setRun(created);
      setStatusFilter('all');
      connectStream(created.runId || created.id);
    } catch (error) {
      onError(error.message);
    } finally {
      setStarting(false);
    }
  }

  async function cancelRun() {
    if (!run?.runId) return;
    setBusyAction(true);
    try {
      const updated = await request(`/ai/quiz/runs/${run.runId}/cancel`, { method: 'POST' });
      setRun(updated);
    } catch (error) {
      onError(error.message);
    } finally {
      setBusyAction(false);
    }
  }

  async function retryFailedJobs() {
    if (!run?.runId) return;
    setBusyAction(true);
    try {
      const updated = await request(`/ai/quiz/runs/${run.runId}/retry-failed`, { method: 'POST' });
      setRun(updated);
      connectStream(run.runId);
    } catch (error) {
      onError(error.message);
    } finally {
      setBusyAction(false);
    }
  }

  async function retrySingleJob(jobId) {
    if (!run?.runId) return;
    try {
      const updated = await request(`/ai/quiz/runs/${run.runId}/jobs/${jobId}/retry`, { method: 'POST' });
      setRun(updated);
      connectStream(run.runId);
    } catch (error) {
      onError(error.message);
    }
  }

  async function saveBulkQuestions(isActive) {
    if (!run?.runId) return;
    setBusyAction(true);
    try {
      const updated = await request(`/ai/quiz/runs/${run.runId}/save-bulk`, {
        method: 'POST',
        body: JSON.stringify({ isActive }),
      });
      setRun(updated);
    } catch (error) {
      onError(error.message);
    } finally {
      setBusyAction(false);
    }
  }

  const filteredJobs = useMemo(() => {
    const jobs = run?.jobs || [];
    if (statusFilter === 'all') return jobs;
    if (statusFilter === 'completed') return jobs.filter(j => j.status === 'completed');
    if (statusFilter === 'failed') return jobs.filter(j => j.status === 'failed' || j.status === 'cancelled');
    if (statusFilter === 'running') return jobs.filter(j => ['queued', 'generating', 'retrying'].includes(j.status));
    return jobs;
  }, [run?.jobs, statusFilter]);

  const progressPercent = useMemo(() => {
    if (!run?.requestedCount) return 0;
    const done = Number(run.completedCount || 0) + Number(run.failedCount || 0);
    return Math.min(100, Math.round((done / run.requestedCount) * 100));
  }, [run?.completedCount, run?.failedCount, run?.requestedCount]);

  const unsavedCompletedCount = useMemo(
    () => (run?.jobs || []).filter(j => j.status === 'completed' && j.question && !j.savedQuestionId).length,
    [run?.jobs],
  );

  const retryableCount = useMemo(
    () => (run?.jobs || []).filter(j => j.status === 'failed' || j.status === 'cancelled').length,
    [run?.jobs],
  );

  return (
    <div className="master-bulk-ai-container">
      <form className="panel form-grid master-bulk-ai-form" onSubmit={startBulkRun}>
        <div className="wide panel-heading">
          <div>
            <p className="eyebrow">MASTER BULK AI GENERATOR · MULTI-PROVIDER & MULTI-MODEL QUEUE</p>
            <h2>Tạo câu hỏi bằng AI số lượng lớn (Đa môn · Đa lớp · Đa hình thức · Đa độ khó)</h2>
            <p className="muted-copy">
              Chia nhỏ từng câu hỏi thành tiến trình độc lập, phân tải qua nhiều luồng với <b>Provider & Model riêng cho từng luồng</b>, tự động chuyển luồng khi timeout/lỗi và lưu thẳng vào kho ở trạng thái <b>Inactive (chưa cần duyệt)</b>.
            </p>
          </div>
          <span className="status-pill">♛ Master Role</span>
        </div>

        {/* 1. Multi-Grade */}
        <div className="field wide">
          <div className="bulk-section-head">
            <b>1. Chọn khối lớp ({grades.length}/5)</b>
            <div className="bulk-quick-links">
              <button type="button" className="text-button" onClick={() => setGrades([...ALL_GRADES])}>
                Chọn tất cả
              </button>
              <button type="button" className="text-button" onClick={() => setGrades([])}>
                Bỏ chọn
              </button>
            </div>
          </div>
          <div className="bulk-chip-group">
            {ALL_GRADES.map(grade => (
              <label key={grade} className={`bulk-chip ${grades.includes(grade) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={grades.includes(grade)}
                  onChange={() => setGrades(prev => toggleItem(prev, grade))}
                />
                <span>Lớp {grade}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 2. Multi-Subject */}
        <div className="field wide">
          <div className="bulk-section-head">
            <b>2. Chọn môn học ({subjects.length}/3)</b>
            <div className="bulk-quick-links">
              <button type="button" className="text-button" onClick={() => setSubjects([...ALL_SUBJECTS])}>
                Chọn tất cả
              </button>
              <button type="button" className="text-button" onClick={() => setSubjects([])}>
                Bỏ chọn
              </button>
            </div>
          </div>
          <div className="bulk-chip-group">
            {ALL_SUBJECTS.map(subject => (
              <label key={subject} className={`bulk-chip ${subjects.includes(subject) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={subjects.includes(subject)}
                  onChange={() => setSubjects(prev => toggleItem(prev, subject))}
                />
                <span>{subject}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 3. Multi-QuestionType */}
        <div className="field wide">
          <div className="bulk-section-head">
            <b>3. Chọn hình thức câu hỏi ({questionTypes.length}/3)</b>
            <div className="bulk-quick-links">
              <button
                type="button"
                className="text-button"
                onClick={() => setQuestionTypes(ALL_TYPES.map(item => item.id))}
              >
                Chọn tất cả
              </button>
            </div>
          </div>
          <div className="bulk-chip-group">
            {ALL_TYPES.map(typeItem => (
              <label key={typeItem.id} className={`bulk-chip ${questionTypes.includes(typeItem.id) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={questionTypes.includes(typeItem.id)}
                  onChange={() => setQuestionTypes(prev => toggleItem(prev, typeItem.id))}
                />
                <span>{typeItem.label}</span>
              </label>
            ))}
          </div>
          {questionTypes.includes('comparison') && (
            <label className="check bulk-inline-note">
              <input
                type="checkbox"
                checked={comparisonOnlyMath}
                onChange={event => setComparisonOnlyMath(event.target.checked)}
              />
              <span>Chỉ áp dụng dạng So sánh (&lt;, =, &gt;) cho môn Toán học (tránh lỗi cấu trúc ở môn khác)</span>
            </label>
          )}
        </div>

        {/* 4. Multi-Difficulty */}
        <div className="field wide">
          <div className="bulk-section-head">
            <b>4. Chọn mức độ khó ({difficulties.length}/4)</b>
            <div className="bulk-quick-links">
              <button type="button" className="text-button" onClick={() => setDifficulties([...ALL_DIFFICULTIES])}>
                Chọn tất cả
              </button>
              <button type="button" className="text-button" onClick={() => setDifficulties([])}>
                Bỏ chọn
              </button>
            </div>
          </div>
          <div className="bulk-chip-group">
            {ALL_DIFFICULTIES.map(diff => (
              <label key={diff} className={`bulk-chip ${difficulties.includes(diff) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={difficulties.includes(diff)}
                  onChange={() => setDifficulties(prev => toggleItem(prev, diff))}
                />
                <span>{diff}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 5. Lesson Scope */}
        <div className="field wide">
          <div className="bulk-section-head">
            <b>5. Phạm vi bài học trong mục lục</b>
          </div>
          <div className="bulk-chip-group">
            <label className={`bulk-chip ${lessonScopeMode === 'all' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="lessonScopeMode"
                checked={lessonScopeMode === 'all'}
                onChange={() => setLessonScopeMode('all')}
              />
              <span>Phân bổ tự động toàn bộ bài học của các Lớp × Môn đã chọn</span>
            </label>
            <label className={`bulk-chip ${lessonScopeMode === 'custom' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="lessonScopeMode"
                checked={lessonScopeMode === 'custom'}
                onChange={() => setLessonScopeMode('custom')}
              />
              <span>Chọn bài học cụ thể ({selectedLessonIds.length} bài)</span>
            </label>
          </div>

          {lessonScopeMode === 'all' ? (
            <div className="bulk-chip-group" style={{ marginTop: 8 }}>
              {[1, 2].map(vol => (
                <label key={vol} className={`bulk-chip ${volumes.includes(vol) ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={volumes.includes(vol)}
                    onChange={() =>
                      setVolumes(prev => {
                        const next = toggleItem(prev, vol);
                        return next.length ? next : [vol];
                      })
                    }
                  />
                  <span>Học kỳ / Tập {vol}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="bulk-custom-lessons">
              <div className="bulk-lesson-toolbar">
                <input
                  placeholder="Tìm kiếm bài học theo tên..."
                  value={lessonSearch}
                  onChange={event => setLessonSearch(event.target.value)}
                />
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setSelectedLessonIds(
                      catalogGroups.flatMap(group => group.lessons.map(lesson => lesson.id)),
                    )
                  }
                >
                  Chọn tất cả bài
                </button>
                <button type="button" className="secondary-button" onClick={() => setSelectedLessonIds([])}>
                  Bỏ chọn
                </button>
              </div>
              <div className="bulk-lesson-scroll">
                {catalogGroups.map(group => {
                  const visibleLessons = group.lessons.filter(
                    lesson =>
                      !lessonSearch.trim() ||
                      lesson.title.toLowerCase().includes(lessonSearch.trim().toLowerCase()),
                  );
                  if (!visibleLessons.length) return null;
                  return (
                    <div key={`${group.grade}-${group.subject}`} className="bulk-lesson-group">
                      <strong>
                        Lớp {group.grade} · {group.subject} ({visibleLessons.length} bài)
                      </strong>
                      <div className="bulk-lesson-grid">
                        {visibleLessons.map(lesson => (
                          <label key={lesson.id} className="check">
                            <input
                              type="checkbox"
                              checked={selectedLessonIds.includes(lesson.id)}
                              onChange={() => setSelectedLessonIds(prev => toggleItem(prev, lesson.id))}
                            />
                            <span>{lesson.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 6. Quantity, Save Status (Inactive/Active) & Concurrency */}
        <label className="field">
          Số câu mỗi tổ hợp (Lớp × Môn × Hình thức × Độ khó)
          <input
            type="number"
            min="1"
            max="30"
            value={questionsPerCombo}
            onChange={event => setQuestionsPerCombo(event.target.value)}
          />
        </label>

        <label className="field">
          Giới hạn tổng số câu tối đa / phiên
          <input
            type="number"
            min="1"
            max="300"
            value={maxTotalJobs}
            onChange={event => setMaxTotalJobs(event.target.value)}
          />
        </label>

        <label className="field">
          Chế độ lưu vào kho câu hỏi
          <select value={saveMode} onChange={event => setSaveMode(event.target.value)}>
            <option value="inactive">Tự động lưu ngay · Trạng thái Inactive (Chưa cần duyệt)</option>
            <option value="active">Tự động lưu ngay · Trạng thái Active (Đang hoạt động)</option>
            <option value="manual">Chưa tự lưu (Duyệt hoặc bấm lưu hàng loạt sau)</option>
          </select>
        </label>

        <label className="field">
          Luồng chạy song song (Anti-Timeout)
          <select value={concurrency} onChange={event => setConcurrency(Number(event.target.value))}>
            <option value={1}>1 luồng tuần tự (An toàn tuyệt đối)</option>
            <option value={2}>2 luồng song song (Khuyên dùng · Nhanh & Ổn định)</option>
            <option value={3}>3 luồng song song (Tốc độ cao)</option>
            <option value={4}>4 luồng song song (Đa Model / Đa Provider)</option>
            <option value={5}>5 luồng song song (Tối ưu băng thông lớn)</option>
            <option value={6}>6 luồng song song (Tốc độ tối đa)</option>
          </select>
        </label>

        {/* 7. Per-Thread Provider & Model Configuration + Per-Provider API Keys */}
        <div className="field wide bulk-workers-section">
          <div className="bulk-section-head">
            <div>
              <b>6. Cấu hình Provider & Model cho từng luồng ({workers.length} luồng)</b>
              <small className="muted-copy" style={{ display: 'block', marginTop: 2 }}>
                Chia nhỏ các luồng chạy các Model / Provider khác nhau để nhân bội tốc độ và tránh bị giới hạn RPM trên 1 model.
              </small>
            </div>
            <div className="bulk-quick-links">
              <button type="button" className="secondary-button" onClick={distributeOpenRouterModels}>
                ⚡ Rải đều các Model trên OpenRouter
              </button>
              <button type="button" className="secondary-button" onClick={distributeMultiProviders}>
                🌐 Rải đều đa Provider
              </button>
            </div>
          </div>

          <div className="bulk-worker-grid">
            {workers.map((worker, idx) => {
              const provDef = providers.find(p => p.id === worker.provider) || DEFAULT_AI_PROVIDERS[0];
              const suggestedModels = provDef.models || [];
              return (
                <div key={worker.workerId || idx} className="bulk-worker-card">
                  <div className="bulk-worker-card-head">
                    <strong>Luồng #{idx + 1}</strong>
                    <span className="status-pill">{provDef.label}</span>
                  </div>
                  <label className="field">
                    Provider (Luồng #{idx + 1})
                    <select
                      aria-label={`Provider Luồng ${idx + 1}`}
                      value={worker.provider}
                      onChange={event => updateWorker(idx, { provider: event.target.value })}
                    >
                      {providers.map(prov => (
                        <option key={prov.id} value={prov.id}>
                          {prov.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Model gợi ý (Luồng #{idx + 1})
                    <select
                      aria-label={`Model gợi ý Luồng ${idx + 1}`}
                      value={suggestedModels.includes(worker.model) ? worker.model : '__custom__'}
                      onChange={event => {
                        if (event.target.value !== '__custom__') {
                          updateWorker(idx, { model: event.target.value });
                        }
                      }}
                    >
                      {suggestedModels.map(modelId => (
                        <option key={modelId} value={modelId}>
                          {modelId}
                        </option>
                      ))}
                      <option value="__custom__">-- Nhập mã Model tùy chỉnh bên dưới --</option>
                    </select>
                  </label>
                  <label className="field">
                    Mã Model thực thi (Luồng #{idx + 1})
                    <input
                      aria-label={`Mã Model Luồng ${idx + 1}`}
                      value={worker.model}
                      onChange={event => updateWorker(idx, { model: event.target.value })}
                      placeholder={provDef.defaultModel || 'VD: openai/gpt-4o-mini'}
                    />
                  </label>
                </div>
              );
            })}
          </div>

          {/* Per-Provider API Key inputs */}
          <div className="bulk-provider-keys-box">
            <div className="bulk-section-head">
              <b>🔑 Nhập API Key cho từng Provider đang chọn ({activeProviderDefs.length} Provider)</b>
              <div className="bulk-quick-links">
                <label className="check" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={showKeys}
                    onChange={event => setShowKeys(event.target.checked)}
                  />
                  <span>Hiện API Key</span>
                </label>
                <label className="check" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={rememberKeys}
                    onChange={event => {
                      const checked = event.target.checked;
                      setRememberKeys(checked);
                      if (!checked) window.localStorage?.removeItem(STORAGE_KEYS_ID);
                    }}
                  />
                  <span>Lưu tạm trên trình duyệt</span>
                </label>
              </div>
            </div>
            <div className="bulk-provider-keys-grid">
              {activeProviderDefs.map(prov => (
                <label key={prov.id} className="field">
                  <span>
                    API Key cho <b>{prov.label}</b> ({prov.id})
                    {prov.hasServerKey ? ' · (Máy chủ đã có sẵn key mặc định)' : ''}
                  </span>
                  <input
                    type={showKeys ? 'text' : 'password'}
                    autoComplete="off"
                    aria-label={`API Key cho ${prov.label}`}
                    value={providerKeys[prov.id] || ''}
                    onChange={event =>
                      setProviderKeys(prev => ({
                        ...prev,
                        [prov.id]: event.target.value,
                      }))
                    }
                    placeholder={prov.placeholderKey || `Nhập API Key cho ${prov.label}...`}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="wide bulk-summary-banner">
          <div>
            <strong>
              Dự kiến khởi tạo: {estimatedTotalQuestions} câu hỏi ({validCombosCount} tổ hợp × {questionsPerCombo} câu) · Chạy trên {workers.length} luồng
            </strong>
            <small>
              Trạng thái lưu:{' '}
              {saveMode === 'inactive'
                ? 'Tự động lưu vào kho ở trạng thái Inactive (chưa cần duyệt)'
                : saveMode === 'active'
                  ? 'Tự động lưu vào kho ở trạng thái Active'
                  : 'Chờ bấm lưu sau khi tạo'}{' '}
              · Tự động chuyển sang luồng/model dự phòng nếu gặp lỗi hoặc rate-limit.
            </small>
          </div>
          <button
            className="primary-button"
            type="submit"
            disabled={starting || validCombosCount === 0}
          >
            {starting ? 'Đang khởi tạo hàng đợi...' : `🚀 Chạy tạo ${estimatedTotalQuestions} câu hỏi bằng AI`}
          </button>
        </div>
      </form>

      {run && (
        <article className="dashboard-panel ai-run-summary master-bulk-run-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">TIẾN TRÌNH TẠO CÂU HỎI SỐ LƯỢNG LỚN</p>
              <h2>
                Phiên #{String(run.runId || run.id).slice(0, 8)} · Đã hoàn thành {run.completedCount || 0}/
                {run.requestedCount || 0} câu ({progressPercent}%)
              </h2>
              <small>
                Đã lưu vào kho: <b>{run.savedCount || 0}</b> câu (
                {run.saveActive ? 'Active · Đang hoạt động' : 'Inactive · Chờ duyệt'}) · Lỗi:{' '}
                <b>{run.failedCount || 0}</b> câu
              </small>
            </div>
            <span className={`status-pill ${run.status}`}>{run.status}</span>
          </div>

          <div className="bulk-progress-bar-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="bulk-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="ai-review-actions bulk-run-actions">
            {run.status === 'generating' && (
              <button className="secondary-button" type="button" onClick={cancelRun} disabled={busyAction}>
                ⏸ Dừng phiên chạy
              </button>
            )}
            {retryableCount > 0 && (
              <button className="primary-button" type="button" onClick={retryFailedJobs} disabled={busyAction}>
                ↻ Chạy lại {retryableCount} câu lỗi / đã dừng
              </button>
            )}
            {unsavedCompletedCount > 0 && (
              <>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => saveBulkQuestions(false)}
                  disabled={busyAction}
                >
                  💾 Lưu tất cả {unsavedCompletedCount} câu chưa lưu (Inactive · Chưa cần duyệt)
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => saveBulkQuestions(true)}
                  disabled={busyAction}
                >
                  ✓ Lưu & Duyệt Active ({unsavedCompletedCount} câu)
                </button>
              </>
            )}
            <div className="bulk-filter-tabs">
              {[
                ['all', `Tất cả (${run.jobs?.length || 0})`],
                ['completed', `Hoàn thành (${run.completedCount || 0})`],
                ['running', `Đang xử lý`],
                ['failed', `Lỗi/Dừng (${retryableCount})`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`page-button ${statusFilter === key ? 'active' : ''}`}
                  onClick={() => setStatusFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="ai-job-list">
            {filteredJobs.map(job => (
              <article className={`ai-job ${job.status}`} key={job.id}>
                <span className="ai-job-index">{job.position}</span>
                <div>
                  <small className="bulk-job-meta">
                    {job.workerId ? `Luồng #${job.workerId}` : 'Luồng AI'}
                    {job.provider ? ` · ${job.provider}` : ''}
                    {job.model ? ` (${job.model})` : ''} · Lớp {String(job.grade || '').replace(/^Lớp\s*/i, '')} ·{' '}
                    {job.subject} · {job.difficulty} ·{' '}
                    {job.questionType === 'essay'
                      ? 'Tự luận'
                      : job.questionType === 'comparison'
                        ? 'So sánh (<, =, >)'
                        : 'Trắc nghiệm'}
                    {job.lessonTitle ? ` · ${job.lessonTitle}` : ''}
                  </small>
                  {job.question ? (
                    <>
                      <b>{job.question.question}</b>
                      <GeometryDiagram geometry={job.question.geometry} ariaLabel="Hình minh họa cho câu hỏi AI" />
                      {Array.isArray(job.question.options) && job.question.options.length > 0 && (
                        <small>{job.question.options.join(' · ')}</small>
                      )}
                    </>
                  ) : (
                    <>
                      <b>
                        {job.status === 'failed'
                          ? 'Tạo câu hỏi thất bại'
                          : job.status === 'cancelled'
                            ? 'Đã tạm dừng'
                            : job.status === 'retrying'
                              ? `Đang thử lại lần ${job.attempts || 1}...`
                              : job.status === 'generating'
                                ? 'Đang gọi AI tạo câu hỏi...'
                                : 'Đang chờ trong hàng đợi'}
                      </b>
                      <small>{job.error || `Lần thử ${job.attempts || 0}/4`}</small>
                    </>
                  )}
                </div>
                <div>
                  {job.savedQuestionId ? (
                    <span className="status-pill">
                      {job.savedIsActive === false ? 'Đã lưu (Inactive)' : 'Đã lưu (Active)'}
                    </span>
                  ) : job.status === 'completed' ? (
                    <span className="status-pill">Đã tạo (Chưa lưu)</span>
                  ) : job.status === 'failed' || job.status === 'cancelled' ? (
                    <button className="text-button" type="button" onClick={() => retrySingleJob(job.id)}>
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
    </div>
  );
}
