import React, { useEffect, useState } from 'react';
import QuestionMedia from './QuestionMedia';

const grades = Array.from({ length: 12 }, (_, index) => `Lớp ${index + 1}`);
const levels = ['Dễ', 'Vừa', 'Khó', 'Nâng cao'];
const initialForm = {
  question: '',
  subject: 'Toán học',
  grade: 'Lớp 4',
  level: 'Dễ',
  type: 'multiple-choice',
  options: ['', '', '', ''],
  answer: 0,
  explanation: '',
  lessonId: '',
  lessonTitle: '',
  geometry: null,
  imageUrl: '',
};
const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export function decodeQuestionText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function buildFormState(initial) {
  const source = initial || {};
  const type = source.type || initialForm.type;
  const rawOptions = Array.isArray(source.options)
    ? source.options.map(option => decodeQuestionText(String(option ?? '')))
    : type === 'comparison'
      ? ['<', '=', '>']
      : initialForm.options;
  const options =
    type === 'comparison'
      ? [...rawOptions, '<', '=', '>'].slice(0, 3)
      : type === 'essay'
        ? []
        : [...rawOptions, '', '', '', ''].slice(0, 4);
  const parsedAnswer = Number(source.answer);
  return {
    ...initialForm,
    ...source,
    question: decodeQuestionText(String(source.question ?? initialForm.question)),
    type,
    options,
    answer: Number.isInteger(parsedAnswer) && parsedAnswer >= 0 ? parsedAnswer : 0,
    explanation: decodeQuestionText(String(source.explanation ?? '')),
    lessonId: source.lessonId || '',
    lessonTitle: source.lessonTitle || '',
    geometry: source.geometry || null,
    imageUrl: source.imageUrl || source.geometry?.imageUrl || '',
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || payload.error || 'Không thể lưu câu hỏi.');
  return payload.data || payload;
}

export default function QuestionFormComparison({ initial, onSaved, onCancel, onError }) {
  const [form, setForm] = useState(() => buildFormState(initial));
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    setForm(buildFormState(initial));
  }, [initial]);

  useEffect(() => {
    request(`/curriculum?grade=${encodeURIComponent(String(form.grade || 'Lớp 4').replace('Lớp ', ''))}&subject=${encodeURIComponent(form.subject)}`)
      .then(result => setLessons(result.lessons || []))
      .catch(() => {});
  }, [form.grade, form.subject]);

  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const setType = type =>
    setForm(previous => ({
      ...previous,
      type,
      options: type === 'comparison' ? ['<', '=', '>'] : type === 'essay' ? [] : ['', '', '', ''],
      answer: 0,
    }));

  async function save(event) {
    event.preventDefault();
    try {
      const options = form.type === 'essay' ? [] : form.options.map(item => decodeQuestionText(String(item ?? '')).trim());
      if (form.type !== 'essay' && options.some(item => !item)) return onError('Hãy nhập đủ các lựa chọn.');
      const lesson = lessons.find(item => item.id === form.lessonId);
      const saved = await request(initial?.id ? `/questions/${initial.id}` : '/questions', {
        method: initial?.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...form,
          question: decodeQuestionText(form.question),
          options,
          explanation: decodeQuestionText(form.explanation || ''),
          lessonTitle: lesson?.title || form.lessonTitle || '',
        }),
      });
      onSaved(saved);
    } catch (error) {
      onError(error.message);
    }
  }

  const hasMedia = Boolean(form.imageUrl || form.geometry?.imageUrl || form.geometry?.elements?.length);

  return (
    <form className="panel form-grid comparison-question-form" onSubmit={save}>
      <div className="wide form-heading">
        <div>
          <p className="eyebrow">QUESTION EDITOR</p>
          <h2>{initial ? 'Sửa câu hỏi' : 'Thêm câu hỏi vào kho'}</h2>
        </div>
      </div>
      <label className="field wide">
        Nội dung câu hỏi
        <textarea
          required
          value={form.question}
          onChange={event => update('question', event.target.value)}
          placeholder={form.type === 'comparison' ? 'Ví dụ: 3 482 … 3 428' : 'Nhập nội dung câu hỏi'}
        />
      </label>
      {hasMedia && (
        <div className="field wide question-form-media">
          <span>Hình vẽ minh họa của câu hỏi</span>
          <QuestionMedia question={form} />
        </div>
      )}
      <label className="field">
        Môn học
        <select value={form.subject} onChange={event => update('subject', event.target.value)}>
          <option>Toán học</option>
          <option>Tiếng Việt</option>
          <option>Tiếng Anh</option>
        </select>
      </label>
      <label className="field">
        Khối lớp
        <select value={form.grade} onChange={event => update('grade', event.target.value)}>
          {grades.map(item => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Cấp độ
        <select value={form.level} onChange={event => update('level', event.target.value)}>
          {levels.map(item => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="field wide">
        Hình thức câu hỏi
        <select value={form.type} onChange={event => setType(event.target.value)}>
          <option value="multiple-choice">Trắc nghiệm</option>
          <option value="comparison">{'So sánh · <, >, ='}</option>
          <option value="essay">Tự luận</option>
        </select>
      </label>
      <label className="field wide">
        Bài trong mục lục
        <select
          value={form.lessonId || ''}
          onChange={event => {
            const lesson = lessons.find(item => item.id === event.target.value);
            setForm(previous => ({ ...previous, lessonId: event.target.value, lessonTitle: lesson?.title || '' }));
          }}
        >
          <option value="">Chưa chọn bài</option>
          {lessons.map(item => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      {form.type !== 'essay' &&
        form.options.map((option, index) => (
          <label className="field" key={index}>
            {form.type === 'comparison' ? ['Đáp án <', 'Đáp án =', 'Đáp án >'][index] : `Đáp án ${String.fromCharCode(65 + index)}`}
            <input
              required
              value={option}
              onChange={event =>
                setForm(previous => ({
                  ...previous,
                  options: previous.options.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                }))
              }
            />
          </label>
        ))}
      {form.type !== 'essay' && (
        <label className="field">
          Đáp án đúng
          <select value={form.answer} onChange={event => update('answer', Number(event.target.value))}>
            {form.options.map((_, index) => (
              <option key={index} value={index}>
                {form.type === 'comparison' ? ['<', '=', '>'][index] : `Đáp án ${String.fromCharCode(65 + index)}`}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="field wide">
        Giải thích
        <textarea value={form.explanation || ''} onChange={event => update('explanation', event.target.value)} />
      </label>
      <div className="actions wide">
        <button className="primary-button" type="submit">
          Lưu câu hỏi
        </button>
        {onCancel && (
          <button className="secondary-button" type="button" onClick={onCancel}>
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}
