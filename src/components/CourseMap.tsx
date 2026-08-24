import React, { useState } from 'react';
import { Lesson, Unit, UserStats, UserSettings } from '../types';
import { UNITS, LESSONS } from '../data/lessons';
import { getHeroById } from '../data/characters';
import { useTranslation } from '../i18n';
import { LanguageSelector } from './LanguageSelector';
import { BrandLogo } from './BrandLogo';
import {
  Star,
  Zap,
  Target,
  Trophy,
  Gamepad2,
  BookOpen,
  Search,
  CheckCircle2,
  Award,
  Play,
  Flame,
  ArrowRight,
  Settings as SettingsIcon,
  Sparkles,
  Lock,
  ChevronRight,
  Filter,
  Swords,
  User,
  FileSpreadsheet,
  Menu,
  X,
  Layers,
  ChevronDown,
  Home,
} from 'lucide-react';

interface CourseMapProps {
  stats: UserStats;
  settings: UserSettings;
  customLessons: Lesson[];
  onOpenHome: () => void;
  onSelectLesson: (lesson: Lesson) => void;
  onOpenBadges: () => void;
  onOpenCustomPractice: () => void;
  onOpenSettings: () => void;
  onOpenOfficeHub: () => void;
  onOpenServices?: (defaultTab?: string) => void;
}

export const CourseMap: React.FC<CourseMapProps> = ({
  stats,
  settings,
  customLessons,
  onOpenHome,
  onSelectLesson,
  onOpenBadges,
  onOpenCustomPractice,
  onOpenSettings,
  onOpenOfficeHub,
  onOpenServices,
}) => {
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<number | 'all'>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileUnitDrawerOpen, setIsMobileUnitDrawerOpen] = useState(false);

  const allLessons = [...LESSONS, ...customLessons];
  const maxPossibleStars = allLessons.length * 5;
  const progressPercent = Math.min(
    100,
    Math.round((stats.completedLessonCount / (allLessons.length || 1)) * 100)
  );

  // Find next uncompleted or current lesson to continue
  const currentLesson =
    allLessons.find((l) => l.id === stats.currentLessonId) ||
    allLessons.find((l) => !stats.lessonResults[l.id]) ||
    allLessons[0];

  const totalPoints = stats.totalStars * 100 + stats.completedLessonCount * 50;

  // Filter lessons
  const filteredLessons = allLessons.filter((lesson) => {
    if (selectedUnitFilter !== 'all' && lesson.unitId !== selectedUnitFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = lesson.id.toString().includes(q);
      const matchTitle = lesson.title.toLowerCase().includes(q);
      const matchKeys = lesson.targetKeys.some((k) => k.toLowerCase().includes(q));
      const matchDesc = lesson.description.toLowerCase().includes(q);
      return matchNumber || matchTitle || matchKeys || matchDesc;
    }
    return true;
  });

  const getLessonResult = (id: number) => stats.lessonResults[id];

  const selectedUnitObj = UNITS.find((u) => u.id === selectedUnitFilter);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-900">
      {/* 1. Sleek, Minimalist Top Navigation Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 shadow-xs">
        {/* Left: Brand Logo & Title */}
        <button
          onClick={onOpenHome}
          className="flex items-center text-left cursor-pointer group hover:opacity-90 transition-opacity"
          title={t.nav.home}
        >
          <BrandLogo variant="full" size="md" />
        </button>

        {/* Center / Desktop Nav */}
        <nav className="hidden xl:flex items-center space-x-1 lg:space-x-2 text-xs font-semibold">
          <button
            onClick={onOpenHome}
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.nav.home}</span>
          </button>
          <button
            onClick={() => setSelectedUnitFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedUnitFilter === 'all'
                ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {t.nav.curriculumMap}
          </button>
          <button
            onClick={onOpenOfficeHub}
            className="text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/70"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.nav.learnOffice}</span>
          </button>
          <button
            onClick={() => {
              const speedRunLesson = allLessons.find((l) => l.gameType === 'data_entry_speed_run') || allLessons[allLessons.length - 1];
              onSelectLesson(speedRunLesson);
            }}
            className="text-amber-700 hover:text-amber-800 transition-colors cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/70"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.nav.speedRun}</span>
          </button>
          <button
            onClick={() => {
              const monsterLesson = allLessons.find((l) => l.gameType === 'monster_battle') || allLessons[allLessons.length - 1];
              onSelectLesson(monsterLesson);
            }}
            className="text-rose-700 hover:text-rose-800 transition-colors cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200/70"
          >
            <Swords className="w-3.5 h-3.5 text-rose-600" />
            <span>{t.nav.monsterPk}</span>
          </button>
          <button
            onClick={onOpenCustomPractice}
            className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {t.nav.customDrill}
          </button>
          <button
            onClick={onOpenBadges}
            className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>{t.nav.trophyRoom}</span>
            {stats.unlockedBadges.length > 0 && (
              <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-bold">
                {stats.unlockedBadges.length}
              </span>
            )}
          </button>
          {onOpenServices && (
            <button
              onClick={() => onOpenServices('all')}
              className="text-amber-900 hover:text-amber-950 transition-colors cursor-pointer flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50/90 hover:bg-amber-100 border border-amber-300/80 font-bold"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.nav.servicesPromo}</span>
            </button>
          )}
        </nav>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Language Switcher */}
          <LanguageSelector variant="compact" />

          {/* User Points Pill */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 transition-colors px-2.5 py-1.5 rounded-xl border border-slate-200 cursor-pointer text-left"
            title={`${t.settings.studentProfile} (${settings.userName || t.nav.student})`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-slate-700 hidden sm:inline font-mono">
              {totalPoints.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
              <span className="text-sm">{getHeroById(settings.characterId).avatarEmoji}</span>
              <span className="text-xs font-semibold text-slate-800 hidden md:inline max-w-[80px] truncate">
                {settings.userName || t.nav.student}
              </span>
            </div>
          </button>

          {/* Settings Button */}
          <button
            id="settings-nav-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 cursor-pointer"
            title={t.nav.settings}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200 cursor-pointer xl:hidden"
            title="Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 py-3 shadow-md animate-in slide-in-from-top-2 z-30">
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenHome();
              }}
              className="p-2 rounded-lg bg-sky-50 text-sky-800 text-left border border-sky-200 flex items-center gap-2"
            >
              <Home className="w-4 h-4 text-sky-600" />
              <span>{t.nav.home}</span>
            </button>
            <button
              onClick={() => {
                setSelectedUnitFilter('all');
                setIsMobileMenuOpen(false);
              }}
              className="p-2 rounded-lg bg-slate-50 text-slate-700 text-left border border-slate-200 flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-sky-600" />
              <span>{t.nav.curriculumMap}</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenOfficeHub();
              }}
              className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-left border border-emerald-200 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{t.nav.learnOffice}</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                const speedRunLesson = allLessons.find((l) => l.gameType === 'data_entry_speed_run') || allLessons[allLessons.length - 1];
                onSelectLesson(speedRunLesson);
              }}
              className="p-2 rounded-lg bg-amber-50 text-amber-800 text-left border border-amber-200 flex items-center gap-2"
            >
              <Flame className="w-4 h-4 text-amber-600" />
              <span>{t.nav.speedRun}</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                const monsterLesson = allLessons.find((l) => l.gameType === 'monster_battle') || allLessons[allLessons.length - 1];
                onSelectLesson(monsterLesson);
              }}
              className="p-2 rounded-lg bg-rose-50 text-rose-800 text-left border border-rose-200 flex items-center gap-2"
            >
              <Swords className="w-4 h-4 text-rose-600" />
              <span>{t.nav.monsterPk}</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenBadges();
              }}
              className="p-2 rounded-lg bg-slate-50 text-slate-700 text-left border border-slate-200 flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-purple-600" />
              <span>{t.nav.trophyRoom}</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenCustomPractice();
              }}
              className="p-2 rounded-lg bg-slate-50 text-slate-700 text-left border border-slate-200 flex items-center gap-2"
            >
              <Target className="w-4 h-4 text-sky-600" />
              <span>{t.nav.customDrill}</span>
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenSettings();
              }}
              className="p-2 rounded-lg bg-slate-50 text-slate-700 text-left border border-slate-200 flex items-center gap-2"
            >
              <SettingsIcon className="w-4 h-4 text-slate-600" />
              <span>{t.nav.settings}</span>
            </button>
            {onOpenServices && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenServices('all');
                }}
                className="col-span-2 p-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-left flex items-center gap-2 shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{t.nav.servicesPromo} (Lập trình, Word/Excel, Chuyển đổi số)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Body Container with Sidebar + Course Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Soft, Clean Curriculum Sidebar (Desktop) */}
        <aside className="w-64 sm:w-72 bg-slate-50/80 border-r border-slate-200/80 flex flex-col shrink-0 hidden lg:flex">
          <div className="p-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                {t.nav.curriculumMap}
              </h2>
              <span className="text-[10px] font-semibold text-slate-600">
                {UNITS.length} {t.courseMap.allUnits}
              </span>
            </div>

            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setSelectedUnitFilter('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex justify-between items-center transition-all cursor-pointer ${
                    selectedUnitFilter === 'all'
                      ? 'bg-sky-100/70 text-sky-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  <span>{t.courseMap.filterAll}</span>
                  <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded-md font-bold">
                    {allLessons.length}
                  </span>
                </button>
              </li>

              {UNITS.map((unit) => {
                const isSelected = selectedUnitFilter === unit.id;
                const unitLessons = LESSONS.filter((l) => l.unitId === unit.id);
                const unitCompleted = unitLessons.filter((l) => !!stats.lessonResults[l.id]).length;
                const isCurrentUnit = unitLessons.some((l) => l.id === stats.currentLessonId);

                return (
                  <li key={unit.id}>
                    <button
                      onClick={() => setSelectedUnitFilter(unit.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex justify-between items-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-100/70 text-sky-900 font-bold shadow-2xs'
                          : isCurrentUnit
                          ? 'bg-sky-50/60 text-sky-900 font-semibold'
                          : 'text-slate-600 hover:bg-slate-200/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: unit.color }}
                        />
                        <span className="truncate">{unit.title}</span>
                      </div>

                      {isCurrentUnit ? (
                        <span className="text-[10px] bg-sky-600 text-white px-1.5 py-0.5 rounded font-bold shrink-0">
                          {t.courseMap.inProgress}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-medium shrink-0">
                          {unitCompleted}/{unitLessons.length}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sidebar Bottom Completion Widget */}
          <div className="p-4 bg-white border-t border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
              <span className="font-semibold text-slate-700">{t.hero.currentProgress}</span>
              <span className="font-bold text-emerald-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
              <div
                style={{ width: `${progressPercent}%` }}
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-medium text-slate-600">
              <span>{stats.completedLessonCount} / {allLessons.length} {t.courseMap.lessonsCount}</span>
              <span>{stats.totalStars} {t.common.stars}</span>
            </div>
          </div>
        </aside>

        {/* 3. Main Center Course Surface */}
        <main className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto relative">
          {/* Section Hero Banner */}
          <div className="px-4 sm:px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/70 bg-white gap-4 sticky top-0 z-20 backdrop-blur-md bg-white/95">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-700 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {t.hero.schoolEdition}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Program 3: Typing Jungle
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                {t.hero.heroSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  const monsterLesson = allLessons.find((l) => l.gameType === 'monster_battle') || allLessons[allLessons.length - 1];
                  onSelectLesson(monsterLesson);
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer shadow-2xs"
              >
                <Swords className="w-4 h-4 text-rose-600" />
                <span>{t.nav.monsterPk}</span>
              </button>

              {/* Quick continue button */}
              {currentLesson && (
                <button
                  id="continue-typing-btn"
                  onClick={() => onSelectLesson(currentLesson)}
                  className="px-4.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{t.hero.resumeLesson} ({currentLesson.id})</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics & Filter Controls */}
          <div className="px-4 sm:px-8 py-3 bg-white/70 border-b border-slate-200/70 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="lesson-search-input"
                type="text"
                placeholder={t.courseMap.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-800 pl-9 pr-4 py-1.5 rounded-xl text-xs sm:text-sm border border-slate-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all placeholder:text-slate-400 shadow-2xs"
              />
            </div>

            {/* Metrics Chips */}
            <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end overflow-x-auto">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-slate-800 font-mono">{stats.totalStars}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{t.common.stars}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-slate-800 font-mono">{stats.averageWpm || 0}</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{t.stats.averageSpeed}</span>
              </div>

              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <Target className="w-3.5 h-3.5 text-sky-500" />
                <span className="text-xs font-bold text-slate-800 font-mono">{stats.averageAccuracy || 0}%</span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{t.common.accuracy}</span>
              </div>
            </div>
          </div>

          {/* Unit Filter Horizontal Pills (Mobile / Tablet) */}
          <div className="px-4 sm:px-8 py-2.5 bg-white border-b border-slate-200/70 flex items-center gap-1.5 overflow-x-auto scrollbar-none lg:hidden">
            <button
              onClick={() => setSelectedUnitFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedUnitFilter === 'all'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.common.all}
            </button>
            {UNITS.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUnitFilter(u.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedUnitFilter === u.id
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Unit {u.id}
              </button>
            ))}
          </div>

          {/* Main Course Content Grid */}
          <div className="p-4 sm:p-8 flex-1 space-y-8 max-w-7xl mx-auto w-full">
            {/* Featured Office Learning Hub Banner (Soft & Clean) */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 sm:p-6 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {t.common.newBadge}
                  </span>
                  <span className="text-xs text-indigo-200 font-medium">
                    {t.officeHub.badgeLevel}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {t.officeHub.modalTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {t.officeHub.modalSubtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  onClick={() => {
                    const speedRunLesson = allLessons.find((l) => l.gameType === 'data_entry_speed_run') || allLessons[allLessons.length - 1];
                    onSelectLesson(speedRunLesson);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Flame className="w-4 h-4 fill-current text-slate-950" />
                  <span>{t.nav.speedRun}</span>
                </button>
                <button
                  onClick={onOpenOfficeHub}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{t.officeHub.modalTitle}</span>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* List of Units */}
            {UNITS.filter(
              (unit) => selectedUnitFilter === 'all' || selectedUnitFilter === unit.id
            ).map((unit) => {
              const unitLessons = filteredLessons.filter((l) => l.unitId === unit.id);
              if (unitLessons.length === 0) return null;

              const unitCompletedCount = unitLessons.filter(
                (l) => !!stats.lessonResults[l.id]
              ).length;

              return (
                <section key={unit.id} id={`unit-${unit.id}`} className="space-y-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/70 shadow-2xs">
                  {/* Unit Title Header Bar */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0"
                        style={{ backgroundColor: unit.color }}
                      >
                        {unit.id}
                      </div>
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-slate-900">
                          {unit.title}
                        </h2>
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          {unit.subtitle} • {unit.description}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-400 shrink-0">
                      {unitCompletedCount} / {unitLessons.length} {t.courseMap.completed}
                    </div>
                  </div>

                  {/* Soft Circular Lesson Nodes */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-y-5 gap-x-3 sm:gap-x-4 pt-2">
                    {unitLessons.map((lesson) => {
                      const res = getLessonResult(lesson.id);
                      const isCompleted = !!res;
                      const isCurrent = stats.currentLessonId === lesson.id;

                      // Gentle, soft colors for nodes
                      let nodeStyle =
                        'bg-slate-50 border-2 border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-sky-50/40';
                      let labelColor = 'text-slate-500';

                      if (isCurrent) {
                        nodeStyle =
                          'bg-sky-50 border-2 border-sky-500 text-sky-700 ring-4 ring-sky-100/90 shadow-2xs font-bold scale-105';
                        labelColor = 'text-sky-700 font-bold';
                      } else if (isCompleted) {
                        nodeStyle =
                          'bg-emerald-50/70 border-2 border-emerald-400 text-emerald-800 hover:bg-emerald-100/70 shadow-2xs';
                        labelColor = 'text-slate-700 font-medium';
                      } else if (lesson.type === 'game') {
                        nodeStyle =
                          'bg-indigo-50/70 border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-100/70 shadow-2xs';
                      } else if (lesson.type === 'test') {
                        nodeStyle =
                          'bg-amber-50/70 border-2 border-amber-300 text-amber-800 hover:bg-amber-100/70 shadow-2xs';
                      } else if (lesson.type === 'story') {
                        nodeStyle =
                          'bg-teal-50/70 border-2 border-teal-300 text-teal-800 hover:bg-teal-100/70 shadow-2xs';
                      }

                      return (
                        <div
                          key={lesson.id}
                          className="flex flex-col items-center space-y-1 text-center group"
                        >
                          <button
                            id={`lesson-node-${lesson.id}`}
                            onClick={() => onSelectLesson(lesson)}
                            className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full flex flex-col items-center justify-center font-bold text-base sm:text-lg relative transition-all duration-150 cursor-pointer ${nodeStyle}`}
                            title={`${lesson.title} - ${lesson.description}`}
                          >
                            {/* Icon or Lesson ID */}
                            {lesson.type === 'game' ? (
                              <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
                            ) : lesson.type === 'test' ? (
                              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                            ) : lesson.type === 'story' ? (
                              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                            ) : (
                              <span>{lesson.id}</span>
                            )}

                            {/* Stars Underneath Completed Nodes */}
                            {isCompleted && (
                              <div className="absolute -bottom-1.5 flex space-x-0.5 bg-white px-1.5 py-0.2 rounded-full border border-slate-200 shadow-2xs">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <span
                                    key={s}
                                    className={`text-[9px] sm:text-[10px] ${
                                      s <= res.stars ? 'text-amber-400' : 'text-slate-200'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>

                          {/* Lesson Title / Status Label */}
                          <div className="max-w-[85px] truncate pt-0.5">
                            {isCurrent ? (
                              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-tight block">
                                {t.courseMap.inProgress}
                              </span>
                            ) : (
                              <span
                                className={`text-[11px] ${labelColor} truncate block group-hover:text-sky-700 transition-colors`}
                              >
                                {lesson.title}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {/* 4. Status Legend Footer */}
          <footer className="p-3 sm:p-4 bg-white border-t border-slate-200/70 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 font-medium">
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
              <span>{t.courseMap.completed}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 bg-sky-500 rounded-full ring-2 ring-sky-100"></div>
              <span>{t.courseMap.inProgress}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
              <span>{t.games.arcadeGames}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
              <span>{t.officeHub.shortcuts.title}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>
              <span>{t.courseMap.locked}</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
