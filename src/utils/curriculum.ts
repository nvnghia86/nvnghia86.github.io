import { Language, Lesson, Unit, UserStats } from '../types';

const ENGLISH_UNIT_TITLES: Record<number, string> = {
  1: 'Home Row',
  2: 'Top Row',
  3: 'Bottom Row',
  4: 'Unaccented Vietnamese Combinations',
  5: 'Vietnamese Vowels',
  6: 'Vietnamese Tone Marks',
  7: 'Shift and Capital Letters',
  8: 'Number Row',
  9: 'Basic Symbols and Punctuation',
  10: 'Advanced Symbols and Programming',
  11: 'Commonly Confused Words',
  12: 'Common Phrases and Idioms',
  13: 'Advanced Typing Practice',
};

export function getLocalizedUnitTitle(
  unit: Unit,
  language: Language,
  unitLabel: string,
): string {
  if (language === 'en') {
    return `${unitLabel} ${unit.id}: ${ENGLISH_UNIT_TITLES[unit.id] ?? unit.title}`;
  }

  const vietnameseTitle = unit.title
    .replace(/^Unit\s+\d+:\s*/i, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/\s+\((?:Home Row|Top Row|Bottom Row|Numbers 0 - 9)\)\s*$/i, '');

  return `${unitLabel} ${unit.id}: ${vietnameseTitle}`;
}

export function getLocalizedLessonTitle(lesson: Lesson, language: Language): string {
  if (language === 'vi') return lesson.title;
  return lesson.title.replace(/^Bài\s+(\d+):/i, 'Lesson $1:');
}

export function isCurriculumLessonUnlocked(
  lesson: Lesson,
  stats: UserStats,
  curriculumLessons: Lesson[],
): boolean {
  // Dev mode: unlock all lessons when running on localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return true;
  }
  const lessonIndex = curriculumLessons.findIndex((item) => item.id === lesson.id);
  if (lessonIndex <= 0) return true;
  return Boolean(stats.lessonResults[curriculumLessons[lessonIndex - 1].id]);
}

export function getCurrentCurriculumLessonId(
  stats: Pick<UserStats, 'lessonResults'>,
  curriculumLessons: Lesson[],
): number {
  return curriculumLessons.find((lesson) => !stats.lessonResults[lesson.id])?.id
    ?? curriculumLessons.at(-1)?.id
    ?? 1;
}
