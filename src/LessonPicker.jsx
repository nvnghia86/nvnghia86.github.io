import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './lesson-picker.css';

const PAGE_SIZE = 20;

/**
 * Curriculum lesson selector with a stable selection across pages.
 * `selected` contains ids from every page; changing the visible page never
 * drops ids selected on another page.
 */
export default function LessonPicker({ lessons = [], selected = [], onChange, label = 'Chọn bài trong mục lục' }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(lessons.length / PAGE_SIZE));

  useEffect(() => {
    setPage(current => Math.min(current, pageCount));
  }, [lessons, pageCount]);

  const currentLessons = useMemo(
    () => lessons.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [lessons, page],
  );
  const groupedLessons = useMemo(() => {
    if (!currentLessons.some(lesson => lesson.volume)) return [{ key: 'all', lessons: currentLessons }];
    const groups = [];
    for (const lesson of currentLessons) {
      const key = `${lesson.volume}:${lesson.topicTitle}:${lesson.week}`;
      if (groups.at(-1)?.key !== key) groups.push({ key, volume: lesson.volume, topicTitle: lesson.topicTitle, week: lesson.week, lessons: [] });
      groups.at(-1).lessons.push(lesson);
    }
    return groups;
  }, [currentLessons]);
  const currentIds = currentLessons.map(lesson => lesson.id);
  const allCurrentSelected = currentIds.length > 0 && currentIds.every(id => selected.includes(id));

  function toggleLesson(id) {
    if (selected.includes(id)) {
      onChange(selected.filter(item => item !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  function toggleCurrentPage() {
    if (allCurrentSelected) {
      onChange(selected.filter(id => !currentIds.includes(id)));
    } else {
      onChange(Array.from(new Set([...selected, ...currentIds])));
    }
  }

  return (
    <div className="lesson-picker wide">
      <div className="lesson-picker-head">
        <strong>{label} ({selected.length}/{lessons.length})</strong>
        <div className="lesson-actions">
          <label className="check lesson-select-page">
            <input type="checkbox" checked={allCurrentSelected} onChange={toggleCurrentPage} />
            {t('lessonPicker.selectAllPage')}
          </label>
          <span className="page-meta">{t('lessonPicker.page', { current: page, total: pageCount })}</span>
        </div>
      </div>
      <div className="lesson-picker-items">
        {groupedLessons.map(group => <div key={group.key} className="lesson-group">
          {group.volume && <div className="lesson-group-heading"><strong>{t('lessonPicker.volume', { number: group.volume })} · {group.topicTitle}</strong><small>{t('lessonPicker.week', { number: group.week })}</small></div>}
          {group.lessons.map(lesson => <label key={lesson.id} className="check inline-check lesson-entry">
            <input type="checkbox" checked={selected.includes(lesson.id)} onChange={() => toggleLesson(lesson.id)} />
            <span>{lesson.title}{lesson.isReview && <small className="lesson-review">{t('lessonPicker.review')}</small>}</span>
          </label>)}
        </div>)}
      </div>
      {!currentLessons.length && <small>{t('lessonPicker.empty')}</small>}
      {pageCount > 1 && (
        <div className="lesson-pagination">
          <button type="button" className="secondary-button" disabled={page === 1} onClick={() => setPage(current => current - 1)}>
            ← {t('lessonPicker.previousPage')}
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map(number => (
            <button type="button" key={number} className={number === page ? 'page-button active' : 'page-button'} onClick={() => setPage(number)}>
              {number}
            </button>
          ))}
          <button type="button" className="secondary-button" disabled={page === pageCount} onClick={() => setPage(current => current + 1)}>
            {t('lessonPicker.nextPage')} →
          </button>
        </div>
      )}
    </div>
  );
}
