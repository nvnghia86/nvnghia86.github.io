import React, { useState, useEffect, useCallback } from 'react';
import { Lesson, LessonResult, UserStats, UserSettings } from './types';
import { LESSONS } from './data/lessons';
import {
  loadUserStats,
  loadSettings,
  saveSettings,
  recordLessonCompletion,
  resetAllProgress,
  loadCustomLessons,
  saveCustomLesson,
} from './utils/storage';
import {
  initGA,
  trackPageView,
  trackLessonStart,
  trackLessonFinish,
  trackBadgeUnlocked,
  trackLanguageChange,
  trackOfficeHubInteraction,
  trackCustomPractice,
  sendEngagementHeartbeat,
} from './utils/analytics';
import { CourseMap } from './components/CourseMap';
import { HomeScreen } from './components/HomeScreen';
import { TypingEngine } from './components/TypingEngine';
import { LessonResultModal } from './components/LessonResultModal';
import { FallingWordsGame } from './components/games/FallingWordsGame';
import { BalloonPopGame } from './components/games/BalloonPopGame';
import { TypeRacerGame } from './components/games/TypeRacerGame';
import { MonsterBattleGame } from './components/games/MonsterBattleGame';
import { DataEntrySpeedRunGame } from './components/games/DataEntrySpeedRunGame';
import { BadgesView } from './components/BadgesView';
import { CustomPracticeModal } from './components/CustomPracticeModal';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingModal } from './components/OnboardingModal';
import { OfficeHubModal } from './components/office/OfficeHubModal';
import { ServicesPromoModal } from './components/services/ServicesPromoModal';
import { FloatingContactWidget } from './components/FloatingContactWidget';
import { LanguageProvider } from './i18n';
import { Language } from './types';

export default function App() {
  const [stats, setStats] = useState<UserStats>(() => loadUserStats());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [customLessons, setCustomLessons] = useState<Lesson[]>(() => loadCustomLessons());

  // Views & Active States
  const [view, setView] = useState<'home' | 'course_map' | 'lesson' | 'badges'>('home');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeResult, setActiveResult] = useState<LessonResult | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [isNewBest, setIsNewBest] = useState(false);

  // Modals
  const [showCustomPractice, setShowCustomPractice] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOfficeHub, setShowOfficeHub] = useState(false);
  const [showServicesPromo, setShowServicesPromo] = useState(false);
  const [servicesPromoTab, setServicesPromoTab] = useState<string>('all');

  // Initialize Google Analytics on mount & start engagement heartbeat timer
  useEffect(() => {
    initGA();

    const heartbeatTimer = setInterval(() => {
      sendEngagementHeartbeat();
    }, 60000);

    return () => clearInterval(heartbeatTimer);
  }, []);

  // Track SPA View & Page navigation changes
  useEffect(() => {
    const titles: Record<string, string> = {
      home: 'Hi Space - Trang Chủ & Lộ Trình Gõ 10 Ngón',
      course_map: 'Hi Space - Bản Đồ Bài Học Luyện Gõ',
      lesson: activeLesson ? `Hi Space - ${activeLesson.title}` : 'Hi Space - Luyện Gõ',
      badges: 'Hi Space - Phòng Truyền Thống & Huy Hiệu',
    };
    trackPageView(view, titles[view] || `Hi Space - ${view}`);
  }, [view, activeLesson]);

  const handleOpenServices = useCallback((tab: string = 'all') => {
    setServicesPromoTab(tab);
    setShowServicesPromo(true);
  }, []);

  // First-time user onboarding modal trigger
  const showOnboarding = !settings.onboardingCompleted;

  // Save settings when modified
  const handleUpdateSettings = useCallback((updated: Partial<UserSettings>) => {
    setSettings((prev) => {
      if (updated.language && updated.language !== prev.language) {
        trackLanguageChange(updated.language);
      }
      const next = { ...prev, ...updated };
      saveSettings(next);
      return next;
    });
  }, []);

  // Launch a lesson
  const handleSelectLesson = useCallback((lesson: Lesson) => {
    setActiveLesson(lesson);
    setActiveResult(null);
    setView('lesson');
    trackLessonStart(lesson);
  }, []);

  // Complete a lesson or game
  const handleLessonFinish = useCallback((result: LessonResult) => {
    const { updatedStats, newBadges: earnedBadges, isNewBest: best } = recordLessonCompletion(result);
    setStats(updatedStats);
    setActiveResult(result);
    setNewBadges(earnedBadges);
    setIsNewBest(best);

    trackLessonFinish(result, activeLesson);
    if (earnedBadges && earnedBadges.length > 0) {
      earnedBadges.forEach((badgeId) => {
        trackBadgeUnlocked(badgeId, updatedStats.unlockedBadges.length);
      });
    }
  }, [activeLesson]);

  // Next lesson trigger
  const handleNextLesson = useCallback(() => {
    if (!activeLesson) return;
    const all = [...LESSONS, ...customLessons];
    const currentIndex = all.findIndex((l) => l.id === activeLesson.id);
    if (currentIndex !== -1 && currentIndex + 1 < all.length) {
      const next = all[currentIndex + 1];
      setActiveLesson(next);
      setActiveResult(null);
      trackLessonStart(next);
    } else {
      setView('course_map');
      setActiveLesson(null);
      setActiveResult(null);
    }
  }, [activeLesson, customLessons]);

  const handleRetryLesson = useCallback(() => {
    setActiveResult(null);
    if (activeLesson) {
      trackLessonStart(activeLesson);
    }
  }, [activeLesson]);

  const handleBackToCourse = useCallback(() => {
    setView('course_map');
    setActiveLesson(null);
    setActiveResult(null);
  }, []);

  const handleResetProgress = useCallback(() => {
    resetAllProgress();
    setStats(loadUserStats());
  }, []);

  const handleStartCustomLesson = useCallback((lesson: Lesson) => {
    const updated = saveCustomLesson(lesson);
    setCustomLessons(updated);
    setShowCustomPractice(false);
    trackCustomPractice('create_custom_lesson', {
      charCount: lesson.content?.join(' ').length || 0,
      title: lesson.title,
    });
    handleSelectLesson(lesson);
  }, [handleSelectLesson]);



  // Determine if next lesson exists
  const allLessons = [...LESSONS, ...customLessons];
  const activeLessonIndex = activeLesson ? allLessons.findIndex((l) => l.id === activeLesson.id) : -1;
  const hasNextLesson = activeLessonIndex !== -1 && activeLessonIndex + 1 < allLessons.length;

  return (
    <LanguageProvider
      language={settings.language || 'vi'}
      onLanguageChange={(lang: Language) => handleUpdateSettings({ language: lang })}
    >
      <div className="min-h-screen bg-[#f0f4f8] text-slate-800 font-sans antialiased selection:bg-blue-500/20 selection:text-blue-900">
        {/* 1. Home Dashboard View */}
        {view === 'home' && (
          <HomeScreen
            stats={stats}
            settings={settings}
            customLessons={customLessons}
            onOpenCourseMap={() => setView('course_map')}
            onSelectLesson={handleSelectLesson}
            onOpenOfficeHub={() => setShowOfficeHub(true)}
            onOpenSpeedRun={() => {
              const speedRunLesson =
                allLessons.find((l) => l.gameType === 'data_entry_speed_run') ||
                allLessons[allLessons.length - 1];
              handleSelectLesson(speedRunLesson);
            }}
            onOpenMonsterBattle={() => {
              const monsterLesson =
                allLessons.find((l) => l.gameType === 'monster_battle') ||
                allLessons[allLessons.length - 1];
              handleSelectLesson(monsterLesson);
            }}
            onOpenCustomPractice={() => setShowCustomPractice(true)}
            onOpenBadges={() => setView('badges')}
            onOpenSettings={() => setShowSettings(true)}
            onOpenServices={handleOpenServices}
          />
        )}

        {/* 2. Main Course Map View */}
        {view === 'course_map' && (
          <CourseMap
            stats={stats}
            settings={settings}
            customLessons={customLessons}
            onOpenHome={() => setView('home')}
            onSelectLesson={handleSelectLesson}
            onOpenBadges={() => setView('badges')}
            onOpenCustomPractice={() => setShowCustomPractice(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenOfficeHub={() => setShowOfficeHub(true)}
            onOpenServices={handleOpenServices}
          />
        )}

        {/* 3. Badges & Trophy Room View */}
        {view === 'badges' && (
          <BadgesView stats={stats} onBack={() => setView('home')} />
        )}

        {/* 4. Interactive Lesson / Game View */}
        {view === 'lesson' && activeLesson && (
          <>
            {activeLesson.type === 'game' ? (
              activeLesson.gameType === 'monster_battle' ? (
                <MonsterBattleGame
                  lesson={activeLesson}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onFinish={handleLessonFinish}
                  onBack={handleBackToCourse}
                />
              ) : activeLesson.gameType === 'balloons' ? (
                <BalloonPopGame
                  lesson={activeLesson}
                  onFinish={handleLessonFinish}
                  onBack={handleBackToCourse}
                />
              ) : activeLesson.gameType === 'data_entry_speed_run' ? (
                <DataEntrySpeedRunGame
                  lesson={activeLesson}
                  settings={settings}
                  onFinish={handleLessonFinish}
                  onBack={handleBackToCourse}
                />
              ) : activeLesson.gameType === 'racer' ? (
                <TypeRacerGame
                  lesson={activeLesson}
                  onFinish={handleLessonFinish}
                  onBack={handleBackToCourse}
                />
              ) : (
                <FallingWordsGame
                  lesson={activeLesson}
                  onFinish={handleLessonFinish}
                  onBack={handleBackToCourse}
                />
              )
            ) : (
              <TypingEngine
                key={activeLesson.id + (activeResult ? '_res' : '_run')}
                lesson={activeLesson}
                settings={settings}
                onFinish={handleLessonFinish}
                onBack={handleBackToCourse}
                onUpdateSettings={handleUpdateSettings}
              />
            )}

            {/* Lesson Result Performance Modal */}
            {activeResult && (
              <LessonResultModal
                lesson={activeLesson}
                result={activeResult}
                newBadges={newBadges}
                isNewBest={isNewBest}
                hasNextLesson={hasNextLesson}
                onNextLesson={handleNextLesson}
                onRetry={handleRetryLesson}
                onBackToCourse={handleBackToCourse}
              />
            )}
          </>
        )}

        {/* Custom Practice Drill Maker */}
        {showCustomPractice && (
          <CustomPracticeModal
            onStartCustomLesson={handleStartCustomLesson}
            onClose={() => setShowCustomPractice(false)}
          />
        )}

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetProgress={handleResetProgress}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Office Hub Modal */}
        {showOfficeHub && (
          <OfficeHubModal
            onClose={() => setShowOfficeHub(false)}
            onStartDrill={(drillLesson) => {
              setShowOfficeHub(false);
              handleSelectLesson(drillLesson);
            }}
          />
        )}

        {/* New User Onboarding Setup Modal */}
        {showOnboarding && (
          <OnboardingModal
            initialSettings={settings}
            onSaveProfile={(profile) => {
              handleUpdateSettings(profile);
            }}
          />
        )}

        {/* Services & Digital Transformation Promo Modal */}
        {showServicesPromo && (
          <ServicesPromoModal
            initialTab={servicesPromoTab}
            onClose={() => setShowServicesPromo(false)}
          />
        )}

        {/* Floating Zalo Chat & Hotline Call Contact Widget */}
        <FloatingContactWidget onOpenServices={handleOpenServices} />
      </div>
    </LanguageProvider>
  );
}
