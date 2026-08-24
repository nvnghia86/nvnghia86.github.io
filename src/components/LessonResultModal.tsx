import React, { useEffect } from 'react';
import { Lesson, LessonResult } from '../types';
import { triggerConfetti } from '../utils/confetti';
import { soundEngine } from '../utils/soundEngine';
import { useTranslation } from '../i18n';
import {
  Star,
  Zap,
  Target,
  Timer,
  RotateCcw,
  ArrowRight,
  List,
  Award,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface LessonResultModalProps {
  lesson: Lesson;
  result: LessonResult;
  newBadges: string[];
  isNewBest: boolean;
  hasNextLesson: boolean;
  onNextLesson: () => void;
  onRetry: () => void;
  onBackToCourse: () => void;
}

export const LessonResultModal: React.FC<LessonResultModalProps> = ({
  lesson,
  result,
  newBadges,
  isNewBest,
  hasNextLesson,
  onNextLesson,
  onRetry,
  onBackToCourse,
}) => {
  const { t, language } = useTranslation();

  useEffect(() => {
    // Play celebratory sounds
    soundEngine.playVictoryFanfare();

    if (result.stars >= 3) {
      triggerConfetti();
    }

    // Play individual star chime for each star earned
    for (let i = 0; i < result.stars; i++) {
      setTimeout(() => {
        soundEngine.playStarEarned(i);
      }, 350 + i * 200);
    }
  }, [result.stars]);

  // Global key listener for Enter / R / Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (hasNextLesson) {
          onNextLesson();
        } else {
          onBackToCourse();
        }
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onRetry();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBackToCourse();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNextLesson, onNextLesson, onRetry, onBackToCourse]);

  const wrongKeysEntries = Object.entries(result.wrongKeys || {}).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  );

  const lessonDisplayTitle = (language === 'vi' && lesson.vietnameseTitle) ? lesson.vietnameseTitle : lesson.title;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="lesson-result-card"
        className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 text-slate-800 flex flex-col items-center animate-in zoom-in-95 duration-200 relative overflow-hidden"
      >
        {/* Top Status Header */}
        <div className="text-center mb-4 relative z-10">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200 inline-block mb-2">
            {language === 'vi' ? `Hoàn Thành Bài ${lesson.id}!` : `Lesson ${lesson.id} Completed!`}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {lessonDisplayTitle}
          </h2>
          {isNewBest && (
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-amber-600">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {t.resultModal.newBestRecord}
            </span>
          )}
        </div>

        {/* 5-Star Rating Display */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 relative z-10">
          {[1, 2, 3, 4, 5].map((starNum) => {
            const isEarned = starNum <= result.stars;
            return (
              <div
                key={starNum}
                className={`transition-all duration-300 transform ${
                  isEarned
                    ? 'scale-110 text-amber-400'
                    : 'scale-90 text-slate-200'
                }`}
              >
                <Star
                  className={`w-8 h-8 sm:w-10 sm:h-10 ${
                    isEarned ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full mb-5 relative z-10">
          {/* Speed Card */}
          <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-amber-600 text-xs font-bold uppercase mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.resultModal.yourSpeed}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {result.wpm}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              WPM ({t.courseMap.targetWpmReq}: {lesson.targetWpm})
            </span>
          </div>

          {/* Accuracy Card */}
          <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold uppercase mb-1">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.resultModal.yourAccuracy}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {result.accuracy}%
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {t.resultModal.minAccuracy}: {lesson.minAccuracy}%
            </span>
          </div>

          {/* Time Card */}
          <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 text-sky-600 text-xs font-bold uppercase mb-1">
              <Timer className="w-3.5 h-3.5 text-sky-600" />
              <span>{t.resultModal.timeElapsed}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {result.timeSeconds}s
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {result.errorCount} {t.resultModal.mistakes}
            </span>
          </div>
        </div>

        {/* New Badges Unlocked Alert */}
        {newBadges.length > 0 && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 flex items-center gap-3">
            <Award className="w-6 h-6 text-amber-500 shrink-0" />
            <div className="text-xs">
              <div className="font-bold text-amber-900">{t.resultModal.earnedBadge}</div>
              <div className="text-amber-700">{language === 'vi' ? 'Bạn đã nhận thêm huy hiệu mới vào bộ sưu tập!' : 'You earned a new badge in your collection!'}</div>
            </div>
          </div>
        )}

        {/* Diagnostics & Problem Keys */}
        {wrongKeysEntries.length > 0 ? (
          <div className="w-full bg-slate-50/80 rounded-2xl p-3 mb-5 border border-slate-200/80 text-xs">
            <div className="flex items-center gap-1.5 text-amber-700 font-bold mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>{language === 'vi' ? 'Phím cần chú ý luyện thêm:' : 'Keys to practice:'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {wrongKeysEntries.slice(0, 5).map(([char, count]) => (
                <span
                  key={char}
                  className="px-2 py-0.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-mono font-semibold text-[11px]"
                >
                  '{char === ' ' ? 'Space' : char}': {count} {count === 1 ? (language === 'vi' ? 'lỗi' : 'error') : (language === 'vi' ? 'lỗi' : 'errors')}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full bg-emerald-50 border border-emerald-200/80 rounded-2xl p-2.5 mb-5 text-xs text-emerald-800 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{t.resultModal.flawlessTitle}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
          {/* Retry Button */}
          <button
            id="retry-lesson-btn"
            onClick={onRetry}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-colors border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> {t.resultModal.retryLesson} (R)
          </button>

          {/* Next Lesson or Map Button */}
          {hasNextLesson ? (
            <button
              id="next-lesson-btn"
              onClick={onNextLesson}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.resultModal.nextLesson}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="course-map-btn"
              onClick={onBackToCourse}
              className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <List className="w-4 h-4" /> {t.resultModal.backToMap}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
