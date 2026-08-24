/**
 * Google Analytics 4 (GA4) Analytics Engine for Hi Space
 * Handles initialization, page/view tracking, user engagement timing,
 * and rich domain events (typing lessons, mini-games, office hub, conversions).
 */

import { Lesson, LessonResult } from '../types';

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

let isInitialized = false;
let currentMeasurementId: string | null = null;
let sessionStartTime = Date.now();
let lastHeartbeatTime = Date.now();

/**
 * Default Google Analytics 4 Measurement ID for Hi Space
 */
export const DEFAULT_GA_MEASUREMENT_ID = 'G-9FVG9T2JC2';

/**
 * Get the active GA4 Measurement ID from environment or fallback
 */
export function getMeasurementId(): string | null {
  if (currentMeasurementId) return currentMeasurementId;
  
  const envId = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
  if (envId && envId.startsWith('G-')) {
    return envId;
  }
  
  return DEFAULT_GA_MEASUREMENT_ID;
}

/**
 * Initialize Google Tag (gtag.js) dynamically
 */
export function initGA(customMeasurementId?: string): boolean {
  if (typeof window === 'undefined') return false;

  const measurementId = customMeasurementId || getMeasurementId();

  if (!measurementId) {
    if (import.meta.env.DEV) {
      console.info(
        '[GA4] No VITE_GA_MEASUREMENT_ID found in environment. Analytics running in console-debug mode.'
      );
    }
    return false;
  }

  currentMeasurementId = measurementId;

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  // Avoid injecting script twice
  const existingScript = document.getElementById('google-analytics-script');
  if (!existingScript) {
    const script = document.createElement('script');
    script.id = 'google-analytics-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: false, // We manually send SPA page_views on view changes
      cookie_flags: 'SameSite=None;Secure',
    });
  }

  isInitialized = true;
  sessionStartTime = Date.now();
  lastHeartbeatTime = Date.now();

  if (import.meta.env.DEV) {
    console.log(`[GA4] Initialized with Measurement ID: ${measurementId}`);
  }

  return true;
}

/**
 * Generic event tracker with safety fallbacks
 */
export function trackEvent(eventName: string, params: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;

  const enrichedParams = {
    ...params,
    timestamp: new Date().toISOString(),
    session_duration_seconds: Math.floor((Date.now() - sessionStartTime) / 1000),
  };

  if (window.gtag && (isInitialized || getMeasurementId())) {
    window.gtag('event', eventName, enrichedParams);
  }

  if (import.meta.env.DEV) {
    console.log(`[GA4 Event] ${eventName}:`, enrichedParams);
  }
}

/**
 * Track SPA View / Screen changes
 */
export function trackPageView(viewName: string, pageTitle?: string): void {
  const measurementId = getMeasurementId();
  const pagePath = `/#/${viewName.replace(/^\//, '')}`;
  const title = pageTitle || `Hi Space - ${viewName}`;

  if (typeof document !== 'undefined') {
    document.title = title;
  }

  trackEvent('page_view', {
    page_path: pagePath,
    page_title: title,
    page_location: window.location.href,
    send_to: measurementId || undefined,
  });
}

/**
 * Track when a user begins a lesson or game
 */
export function trackLessonStart(lesson: Lesson): void {
  trackEvent('lesson_start', {
    lesson_id: lesson.id,
    lesson_title: lesson.title,
    lesson_type: lesson.type,
    unit_title: lesson.unitTitle,
    target_wpm: lesson.targetWpm || 20,
    is_game: lesson.type === 'game',
    game_type: lesson.gameType || 'none',
  });
}

/**
 * Track when a user completes a lesson or game
 */
export function trackLessonFinish(result: LessonResult, lesson?: Lesson | null): void {
  trackEvent('lesson_complete', {
    lesson_id: result.lessonId,
    lesson_title: lesson?.title || `Lesson ${result.lessonId}`,
    wpm: Math.round(result.wpm),
    raw_wpm: Math.round(result.rawWpm || result.wpm),
    accuracy: Math.round(result.accuracy),
    stars: result.stars,
    duration_seconds: Math.round(result.timeSeconds),
    error_count: result.errorCount,
    lesson_type: lesson?.type || 'lesson',
    game_type: lesson?.gameType || 'none',
    passed: result.stars > 0,
  });
}

/**
 * Track Mini-Game activity (Monster Battle, Speed Run, Type Racer, Falling Words, Balloons)
 */
export function trackMiniGameAction(
  gameType: string,
  action: 'start' | 'finish' | 'stage_clear' | 'game_over',
  details: Record<string, any> = {}
): void {
  trackEvent('game_activity', {
    game_type: gameType,
    action,
    ...details,
  });
}

/**
 * Track Office Hub / Shortcut & Tip interactions
 */
export function trackOfficeHubInteraction(
  action: 'open_modal' | 'view_tab' | 'search' | 'practice_formula' | 'copy_shortcut',
  tab?: string,
  itemTitle?: string
): void {
  trackEvent('office_hub_interaction', {
    action,
    tab: tab || 'word',
    item_title: itemTitle || '',
  });
}

/**
 * Track Customer Support & Lead Conversion triggers
 */
export function trackContactClick(
  channel: 'zalo' | 'hotline' | 'email' | 'form_open' | 'form_submit' | 'copy_phone',
  location: string = 'floating_widget'
): void {
  trackEvent('contact_channel_click', {
    channel,
    location,
    event_category: 'conversion',
    event_label: `Contact via ${channel} from ${location}`,
  });
}

/**
 * Track Language switch (vi <-> en)
 */
export function trackLanguageChange(newLang: string): void {
  trackEvent('language_change', {
    selected_language: newLang,
  });
}

/**
 * Track Custom Practice generator
 */
export function trackCustomPractice(
  action: 'open_modal' | 'create_custom_lesson' | 'quick_start',
  details: Record<string, any> = {}
): void {
  trackEvent('custom_practice', {
    action,
    ...details,
  });
}

/**
 * Track Badge and Achievement unlock
 */
export function trackBadgeUnlocked(badgeId: string, totalUnlocked: number): void {
  trackEvent('badge_unlocked', {
    badge_id: badgeId,
    total_unlocked: totalUnlocked,
  });
}

/**
 * Periodic Heartbeat to accurately record user engagement duration
 */
export function sendEngagementHeartbeat(): void {
  const now = Date.now();
  const activeSeconds = Math.floor((now - lastHeartbeatTime) / 1000);
  lastHeartbeatTime = now;

  if (activeSeconds >= 30) {
    trackEvent('user_engagement', {
      engagement_time_msec: activeSeconds * 1000,
    });
  }
}

