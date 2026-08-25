import { UserStats, UserSettings, LessonResult, Lesson, ConsultationInquiry } from '../types';
import { LESSONS, BADGES } from '../data/lessons';
import { getCurrentCurriculumLessonId } from './curriculum';

const STATS_KEY = 'edclub_typing_jungle_stats_v1';
const PROGRESS_COOKIE_KEY = 'edclub_typing_jungle_progress_v2';
const SETTINGS_KEY = 'edclub_typing_jungle_settings_v1';
const PROFILE_COOKIE_KEY = 'edclub_player_profile_v1';
const CUSTOM_LESSONS_KEY = 'edclub_typing_custom_lessons_v1';
const CONSULTATION_INQUIRIES_KEY = 'hispace_consultation_inquiries_v1';
const PROGRESS_COOKIE_PREFIX = 'v2.';
const PROGRESS_COOKIE_KEY_MATERIAL = 'hi-space-typing-progress-2026';

interface CookieProgress {
  version: 2;
  completedLessonIds: number[];
}

function encodeProgressForCookie(progress: CookieProgress): string {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(progress));
    let binary = '';
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(
        bytes[index] ^ PROGRESS_COOKIE_KEY_MATERIAL.charCodeAt(index % PROGRESS_COOKIE_KEY_MATERIAL.length),
      );
    }
    return `${PROGRESS_COOKIE_PREFIX}${btoa(binary)}`;
  } catch {
    return JSON.stringify(progress);
  }
}

function decodeProgressFromCookie(raw: string | null): CookieProgress | null {
  if (!raw) return null;

  try {
    if (!raw.startsWith(PROGRESS_COOKIE_PREFIX)) {
      const parsed = JSON.parse(raw);
      return parsed?.version === 2 ? parsed as CookieProgress : null;
    }

    const binary = atob(raw.slice(PROGRESS_COOKIE_PREFIX.length));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index) ^
        PROGRESS_COOKIE_KEY_MATERIAL.charCodeAt(index % PROGRESS_COOKIE_KEY_MATERIAL.length);
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed?.version === 2 ? parsed as CookieProgress : null;
  } catch {
    return null;
  }
}

function getProgressPlaceholder(lessonId: number): LessonResult {
  return {
    lessonId,
    stars: 0,
    wpm: 0,
    rawWpm: 0,
    accuracy: 0,
    timeSeconds: 0,
    errorCount: 0,
    wrongKeys: {},
    completedAt: '',
  };
}

// Cookie Utility Helpers
export function setCookie(name: string, value: string, days = 365): void {
  try {
    if (typeof document === 'undefined') return;
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
  } catch (e) {
    console.error('Error writing cookie', e);
  }
}

export function getCookie(name: string): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const cname = name + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(cname) === 0) {
        return c.substring(cname.length, c.length);
      }
    }
    return null;
  } catch (e) {
    console.error('Error reading cookie', e);
    return null;
  }
}

export function deleteCookie(name: string): void {
  try {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
  } catch (e) {
    console.error('Error deleting cookie', e);
  }
}

export const DEFAULT_SETTINGS: UserSettings = {
  soundTheme: 'mechanical',
  volume: 0.6,
  showKeyboard: true,
  showHands: true,
  fontSize: 'large',
  theme: 'edclub',
  language: 'vi',
  vietnameseInputMethod: 'telex',
  userName: '',
  userAge: '',
  targetWpmGoal: 35,
  characterId: 'warrior',
  onboardingCompleted: false,
};

export const DEFAULT_STATS: UserStats = {
  totalStars: 0,
  completedLessonCount: 0,
  averageWpm: 0,
  averageAccuracy: 0,
  totalTimeSpentSeconds: 0,
  unlockedBadges: [],
  currentLessonId: 1,
  lessonResults: {},
};

export function loadSettings(): UserSettings {
  try {
    // 1. Try reading from cookie first
    const cookieRaw = getCookie(PROFILE_COOKIE_KEY) || getCookie(SETTINGS_KEY);
    // 2. Fallback to localStorage
    const localRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null;

    let parsed = {};
    if (cookieRaw) {
      try {
        parsed = JSON.parse(cookieRaw);
      } catch {
        // ignore
      }
    } else if (localRaw) {
      try {
        parsed = JSON.parse(localRaw);
      } catch {
        // ignore
      }
    }

    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    if (merged.vietnameseInputMethod !== 'telex' && merged.vietnameseInputMethod !== 'vni') {
      merged.vietnameseInputMethod = DEFAULT_SETTINGS.vietnameseInputMethod;
    }

    // If user has a name already configured previously, mark onboardingCompleted
    if (merged.userName && merged.userName !== '' && merged.onboardingCompleted === undefined) {
      merged.onboardingCompleted = true;
    }

    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    const stringified = JSON.stringify(settings);
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SETTINGS_KEY, stringified);
    }

    // Save to Cookies (365 days) for reliable session persistence
    setCookie(SETTINGS_KEY, stringified, 365);
    setCookie(
      PROFILE_COOKIE_KEY,
      JSON.stringify({
        userName: settings.userName,
        userAge: settings.userAge,
        characterId: settings.characterId,
        targetWpmGoal: settings.targetWpmGoal,
        onboardingCompleted: settings.onboardingCompleted,
      }),
      365
    );
  } catch (err) {
    console.error('Failed to save settings to localStorage & cookie', err);
  }
}

export function loadUserStats(): UserStats {
  try {
    const legacyCookieStats = getCookie(STATS_KEY);
    const cookieProgress = decodeProgressFromCookie(getCookie(PROGRESS_COOKIE_KEY));
    const localRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(STATS_KEY) : null;

    const storedStats = localRaw
      ? JSON.parse(localRaw)
      : legacyCookieStats
      ? JSON.parse(legacyCookieStats)
      : {};
    const stats = { ...DEFAULT_STATS, ...storedStats };
    const cookieResults = Object.fromEntries(
      (cookieProgress?.completedLessonIds ?? []).map((lessonId) => [
        lessonId,
        getProgressPlaceholder(lessonId),
      ]),
    );
    const lessonResults = { ...cookieResults, ...stats.lessonResults };
    const currentLessonId = getCurrentCurriculumLessonId({ lessonResults }, LESSONS);

    return {
      ...stats,
      completedLessonCount: Object.keys(lessonResults).length,
      currentLessonId,
      lessonResults,
    };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    const raw = JSON.stringify(stats);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STATS_KEY, raw);
    }
    const progress: CookieProgress = {
      version: 2,
      completedLessonIds: Object.keys(stats.lessonResults).map(Number).filter(Number.isFinite),
    };
    setCookie(PROGRESS_COOKIE_KEY, encodeProgressForCookie(progress), 365);
    // Remove the previous unencrypted, potentially oversized stats cookie.
    deleteCookie(STATS_KEY);
  } catch (err) {
    console.error('Failed to save user stats', err);
  }
}

export function recordLessonCompletion(result: LessonResult): {
  updatedStats: UserStats;
  newBadges: string[];
  isNewBest: boolean;
} {
  const currentStats = loadUserStats();
  const existingResult = currentStats.lessonResults[result.lessonId];
  
  const isNewBest = !existingResult || result.stars > existingResult.stars || (result.stars === existingResult.stars && result.wpm > existingResult.wpm);
  
  const updatedLessonResults = {
    ...currentStats.lessonResults,
    [result.lessonId]: isNewBest ? result : existingResult,
  };

  // Recalculate aggregates
  const completedKeys = Object.keys(updatedLessonResults);
  const totalStars = Object.values(updatedLessonResults).reduce((sum, r) => sum + r.stars, 0);
  const avgWpm = Math.round(Object.values(updatedLessonResults).reduce((sum, r) => sum + r.wpm, 0) / (completedKeys.length || 1));
  const avgAccuracy = Math.round(Object.values(updatedLessonResults).reduce((sum, r) => sum + r.accuracy, 0) / (completedKeys.length || 1));
  const totalTimeSpent = currentStats.totalTimeSpentSeconds + result.timeSeconds;

  // Check badges
  const newBadges: string[] = [];
  const existingBadges = new Set(currentStats.unlockedBadges);

  if (!existingBadges.has('first_lesson')) {
    newBadges.push('first_lesson');
  }

  if (result.lessonId === 1 && result.stars >= 3 && !existingBadges.has('home_starter')) {
    newBadges.push('home_starter');
  }

  if (result.lessonId >= 10 && !existingBadges.has('home_words_master')) {
    newBadges.push('home_words_master');
  }

  if (result.lessonId >= 20 && !existingBadges.has('top_row_master')) {
    newBadges.push('top_row_master');
  }

  if (result.lessonId >= 30 && !existingBadges.has('bottom_row_master')) {
    newBadges.push('bottom_row_master');
  }

  if (result.lessonId >= 36 && result.lessonId <= 44 && !existingBadges.has('telex_vowels_master')) {
    newBadges.push('telex_vowels_master');
  }

  if (result.lessonId >= 45 && result.lessonId <= 53 && !existingBadges.has('telex_tones_master')) {
    newBadges.push('telex_tones_master');
  }

  if (result.lessonId >= 59 && !existingBadges.has('shift_master')) {
    newBadges.push('shift_master');
  }

  if (result.lessonId >= 65 && !existingBadges.has('number_master')) {
    newBadges.push('number_master');
  }

  if (result.lessonId >= 77 && !existingBadges.has('code_wizard')) {
    newBadges.push('code_wizard');
  }

  if (result.wpm >= 40 && !existingBadges.has('speed_demon_40')) {
    newBadges.push('speed_demon_40');
  }

  if (result.lessonId >= 89 && !existingBadges.has('literature_master')) {
    newBadges.push('literature_master');
  }

  if (result.lessonId >= 94 && !existingBadges.has('grand_master_710')) {
    newBadges.push('grand_master_710');
  }

  if (result.wpm >= 30 && result.stars >= 5 && !existingBadges.has('test_30_wpm')) {
    newBadges.push('test_30_wpm');
  }

  if (result.wpm >= 50 && !existingBadges.has('test_50_wpm')) {
    newBadges.push('test_50_wpm');
  }

  if (result.accuracy === 100 && !existingBadges.has('perfectionist_100')) {
    newBadges.push('perfectionist_100');
  }

  const updatedStats: UserStats = {
    totalStars,
    completedLessonCount: completedKeys.length,
    averageWpm: avgWpm,
    averageAccuracy: avgAccuracy,
    totalTimeSpentSeconds: totalTimeSpent,
    unlockedBadges: Array.from(new Set([...currentStats.unlockedBadges, ...newBadges])),
    currentLessonId: getCurrentCurriculumLessonId(
      { lessonResults: updatedLessonResults },
      LESSONS,
    ),
    lessonResults: updatedLessonResults,
  };

  saveUserStats(updatedStats);
  return { updatedStats, newBadges, isNewBest };
}

export function loadCustomLessons(): Lesson[] {
  try {
    const raw = localStorage.getItem(CUSTOM_LESSONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomLesson(lesson: Lesson): Lesson[] {
  const existing = loadCustomLessons();
  const updated = [lesson, ...existing.filter(l => l.id !== lesson.id)];
  try {
    localStorage.setItem(CUSTOM_LESSONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom lesson', err);
  }
  return updated;
}

export function resetAllProgress(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  }
  deleteCookie(STATS_KEY);
  deleteCookie(PROGRESS_COOKIE_KEY);
  deleteCookie(SETTINGS_KEY);
  deleteCookie(PROFILE_COOKIE_KEY);
}

export function loadConsultationInquiries(): ConsultationInquiry[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(CONSULTATION_INQUIRIES_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveConsultationInquiry(inquiry: ConsultationInquiry): ConsultationInquiry[] {
  try {
    const list = loadConsultationInquiries();
    const updated = [inquiry, ...list];
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONSULTATION_INQUIRIES_KEY, JSON.stringify(updated));
    }
    return updated;
  } catch (err) {
    console.error('Failed to save consultation inquiry', err);
    return [];
  }
}
