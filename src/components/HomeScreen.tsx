import React from 'react';
import { Lesson, UserStats, UserSettings } from '../types';
import { LESSONS, UNITS } from '../data/lessons';
import { getLocalizedLessonTitle, getLocalizedUnitTitle } from '../utils/curriculum';
import { getHeroById } from '../data/characters';
import { useTranslation } from '../i18n';
import { LanguageSelector } from './LanguageSelector';
import { BrandLogo } from './BrandLogo';
import { ServicesBanner } from './services/ServicesBanner';
import {
  Keyboard,
  BookOpen,
  FileSpreadsheet,
  Flame,
  Swords,
  Target,
  Trophy,
  Settings as SettingsIcon,
  Play,
  Sparkles,
  Star,
  Zap,
  Award,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  Code2,
} from 'lucide-react';

interface HomeScreenProps {
  stats: UserStats;
  settings: UserSettings;
  customLessons: Lesson[];
  onOpenCourseMap: () => void;
  onSelectLesson: (lesson: Lesson) => void;
  onOpenOfficeHub: () => void;
  onOpenSpeedRun: () => void;
  onOpenMonsterBattle: () => void;
  onOpenCustomPractice: () => void;
  onOpenBadges: () => void;
  onOpenSettings: () => void;
  onOpenServices?: (defaultTab?: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  stats,
  settings,
  customLessons,
  onOpenCourseMap,
  onSelectLesson,
  onOpenOfficeHub,
  onOpenSpeedRun,
  onOpenMonsterBattle,
  onOpenCustomPractice,
  onOpenBadges,
  onOpenSettings,
  onOpenServices,
}) => {
  const { t, language } = useTranslation();
  const allLessons = [...LESSONS, ...customLessons];
  const activeHero = getHeroById(settings.characterId);

  // Find next uncompleted or current lesson
  const currentLesson =
    allLessons.find((l) => l.id === stats.currentLessonId) ||
    allLessons.find((l) => !stats.lessonResults[l.id]) ||
    allLessons[0];

  const totalPoints = stats.totalStars * 100 + stats.completedLessonCount * 50;
  const progressPercent = Math.min(
    100,
    Math.round((stats.completedLessonCount / (allLessons.length || 1)) * 100)
  );

  const currentUnit = UNITS.find((u) => u.id === currentLesson.unitId) || UNITS[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-900">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8 py-2.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 shadow-xs">
        {/* Brand */}
        <div className="flex items-center">
          <BrandLogo variant="full" size="md" />
        </div>

        {/* Quick Nav shortcuts */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {onOpenServices && (
            <button
              onClick={() => onOpenServices('all')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.nav.servicesPromo}</span>
            </button>
          )}

          <button
            onClick={onOpenCourseMap}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>{t.nav.curriculumMap}</span>
          </button>

          <LanguageSelector variant="compact" />

          {/* User Points Pill */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 transition-colors px-2.5 py-1.5 rounded-xl border border-slate-200 cursor-pointer text-left shadow-2xs"
            title={`${t.settings.studentProfile} (${settings.userName || t.nav.student})`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-slate-700 hidden sm:inline font-mono">
              {totalPoints.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
              <span className="text-sm">{activeHero.avatarEmoji}</span>
              <span className="text-xs font-semibold text-slate-800 hidden md:inline max-w-[80px] truncate">
                {settings.userName || t.nav.student}
              </span>
            </div>
          </button>

          {/* Settings Button */}
          <button
            id="home-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer shadow-2xs"
            title={t.nav.settings}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1 w-full space-y-7">
        {/* Welcome & Next Lesson Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-xs p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            {/* Left: Greeting & Description */}
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.home.heroTag}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {t.home.welcomeGreeting}{' '}
                <span className="text-sky-600 font-black">
                  {settings.userName || t.nav.student}
                </span>
                !
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                {t.home.heroDescription}
              </p>

              {/* Mini stats pills inside welcome */}
              <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-slate-900">{stats.totalStars}</span>
                  <span className="text-[11px] text-slate-400 font-normal">{t.common.stars}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="font-bold text-slate-900">{stats.averageWpm || 0}</span>
                  <span className="text-[11px] text-slate-400 font-normal">WPM</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700">
                  <Target className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-bold text-slate-900">{stats.averageAccuracy || 0}%</span>
                  <span className="text-[11px] text-slate-400 font-normal">{t.common.accuracy}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-bold text-slate-900">{stats.completedLessonCount}/{allLessons.length}</span>
                  <span className="text-[11px] text-slate-400 font-normal">{t.courseMap.completed}</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Continue Box */}
            <div className="w-full lg:w-80 bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shrink-0 shadow-2xs">
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                  <span>{t.home.currentLessonPreview}</span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-100/70 text-sky-800 font-bold text-[10px]">
                    {getLocalizedUnitTitle(currentUnit, language, t.courseMap.unitBadge).split(':')[0]}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 leading-snug truncate">
                  {getLocalizedLessonTitle(currentLesson, language)}
                </h2>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
                  <span className="text-slate-400 text-[11px]">{t.home.targetKeys}:</span>
                  <div className="flex flex-wrap gap-1">
                    {currentLesson.targetKeys.slice(0, 5).map((k) => (
                      <span
                        key={k}
                        className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[11px] font-bold text-slate-700 shadow-2xs"
                      >
                        {k === ' ' ? 'Space' : k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/70">
                <button
                  id="home-continue-btn"
                  onClick={() => onSelectLesson(currentLesson)}
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{t.home.continueLesson} ({currentLesson.id})</span>
                </button>
                <button
                  onClick={onOpenCourseMap}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t.home.viewMap}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar under Hero */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 w-full sm:w-auto">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>{t.hero.currentProgress}:</span>
              <span className="font-bold text-emerald-600">{progressPercent}%</span>
              <span className="text-slate-400 font-normal">({stats.completedLessonCount}/{allLessons.length} {t.courseMap.lessonsCount})</span>
            </div>
            <div className="w-full sm:w-64 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
              <div
                style={{ width: `${progressPercent}%` }}
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Featured Services & Digital Transformation Banner */}
        {onOpenServices && (
          <ServicesBanner onOpenServices={onOpenServices} />
        )}

        {/* 4. Simple & Intuitive Main Menu Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {t.home.mainMenuTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.home.mainMenuSubtitle}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Card 1: Curriculum Map */}
            <div
              onClick={onOpenCourseMap}
              id="menu-curriculum-map"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-2xs group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                    {t.home.menuItems.curriculumMap.tag}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 group-hover:text-sky-600 transition-colors">
                  {t.home.menuItems.curriculumMap.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {t.home.menuItems.curriculumMap.desc}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-sky-600">
                <span>{t.home.menuItems.curriculumMap.action}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Office Hub */}
            <div
              onClick={onOpenOfficeHub}
              id="menu-office-hub"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {t.home.menuItems.officeHub.tag}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 group-hover:text-emerald-600 transition-colors">
                  {t.home.menuItems.officeHub.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {t.home.menuItems.officeHub.desc}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-emerald-600">
                <span>{t.home.menuItems.officeHub.action}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Speed Run Racer */}
            <div
              onClick={onOpenSpeedRun}
              id="menu-speed-run"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-2xs group-hover:scale-105 transition-transform">
                    <Flame className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    {t.home.menuItems.speedRun.tag}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 group-hover:text-amber-600 transition-colors">
                  {t.home.menuItems.speedRun.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {t.home.menuItems.speedRun.desc}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-amber-600">
                <span>{t.home.menuItems.speedRun.action}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 4: Monster PK Battle */}
            <div
              onClick={onOpenMonsterBattle}
              id="menu-monster-pk"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-rose-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-2xs group-hover:scale-105 transition-transform">
                    <Swords className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                    {t.home.menuItems.monsterPk.tag}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 group-hover:text-rose-600 transition-colors">
                  {t.home.menuItems.monsterPk.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {t.home.menuItems.monsterPk.desc}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-rose-600">
                <span>{t.home.menuItems.monsterPk.action}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 5: Custom Drill */}
            <div
              onClick={onOpenCustomPractice}
              id="menu-custom-drill"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-2xs group-hover:scale-105 transition-transform">
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                    {t.home.menuItems.customDrill.tag}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 group-hover:text-sky-600 transition-colors">
                  {t.home.menuItems.customDrill.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {t.home.menuItems.customDrill.desc}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-sky-600">
                <span>{t.home.menuItems.customDrill.action}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 6: Trophy Room & Badges */}
            <div
              onClick={onOpenBadges}
              id="menu-trophy-room"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-2xs group-hover:scale-105 transition-transform">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                    {stats.unlockedBadges.length > 0 ? `${stats.unlockedBadges.length} ${language === 'vi' ? 'Đã Mở' : 'Unlocked'}` : t.home.menuItems.trophyRoom.tag}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">
                  {t.home.menuItems.trophyRoom.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {t.home.menuItems.trophyRoom.desc}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-purple-600">
                <span>{t.home.menuItems.trophyRoom.action}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 7: Training & Digital Services */}
            <div
              onClick={() => onOpenServices?.('all')}
              id="menu-services-promo"
              className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700/80 shadow-2xs hover:shadow-xs hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between group text-white"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/30 shadow-2xs group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {t.home.menuItems.servicesPromo.tag}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-white mb-1 group-hover:text-amber-300 transition-colors">
                  {t.home.menuItems.servicesPromo.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {t.home.menuItems.servicesPromo.desc}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-700 text-xs font-bold text-amber-400">
                <span>{t.home.menuItems.servicesPromo.action}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 8: Settings & Customization */}
            <div
              onClick={onOpenSettings}
              id="menu-settings"
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-400 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform">
                    <SettingsIcon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {t.home.menuItems.settings.tag}
                  </span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 group-hover:text-slate-800 transition-colors">
                  {t.home.menuItems.settings.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {t.home.menuItems.settings.desc}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-slate-600">
                <span>{t.home.menuItems.settings.action}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Bottom Daily Tip & Quick Insight */}
        <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-800">
                {t.home.dailyTipTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.home.dailyTipContent}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenOfficeHub}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <span>{t.hero.officeHubBtn}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </main>
    </div>
  );
};
