import React from 'react';
import { BADGES } from '../data/lessons';
import { UserStats } from '../types';
import { useTranslation } from '../i18n';
import { LanguageSelector } from './LanguageSelector';
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Trophy,
  Sparkles,
} from 'lucide-react';

interface BadgesViewProps {
  stats: UserStats;
  onBack: () => void;
}

export const BadgesView: React.FC<BadgesViewProps> = ({ stats, onBack }) => {
  const { t, language } = useTranslation();
  const unlockedSet = new Set(stats.unlockedBadges);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-sky-500/20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-semibold border border-slate-200 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.badges.backToCourse}</span>
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>{t.badges.trophyRoomTitle}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector variant="compact" />
          <div className="bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 text-xs font-bold text-purple-700 shadow-2xs">
            {unlockedSet.size} / {BADGES.length} {language === 'vi' ? 'Đã Mở' : 'Unlocked'}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1 w-full">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{t.badges.trophyRoomTitle}</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t.badges.trophyRoomSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {BADGES.map((badge) => {
            const isUnlocked = unlockedSet.has(badge.id);

            return (
              <div
                key={badge.id}
                id={`badge-card-${badge.id}`}
                className={`p-5 rounded-2xl border transition-all flex flex-col items-center text-center relative overflow-hidden ${
                  isUnlocked
                    ? 'bg-white border-purple-200/80 shadow-2xs hover:shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/70 opacity-60'
                }`}
              >
                {/* Badge Icon Circle */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-2xs ${
                    isUnlocked
                      ? 'bg-gradient-to-tr from-purple-500 to-indigo-500 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isUnlocked ? (
                    <Trophy className="w-7 h-7 text-amber-300 fill-amber-300" />
                  ) : (
                    <Lock className="w-6 h-6" />
                  )}
                </div>

                {/* Badge Info */}
                <h3 className="font-bold text-sm text-slate-900 mb-1">{badge.name}</h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{badge.description}</p>

                {/* Requirement pill */}
                <div className="mt-auto w-full pt-3 border-t border-slate-100">
                  <span
                    className={`text-[11px] font-semibold flex items-center justify-center gap-1 ${
                      isUnlocked ? 'text-emerald-600 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {isUnlocked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Đã Nhận Thưởng' : 'Unlocked'}</span>
                      </>
                    ) : (
                      `${t.badges.requirement} ${badge.requirement}`
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
