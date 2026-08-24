import React, { useState } from 'react';
import { UserSettings } from '../types';
import { HEROES, HeroCharacter } from '../data/characters';
import { CombatSpriteHero } from './games/CombatSpriteHero';
import { soundEngine } from '../utils/soundEngine';
import { useTranslation } from '../i18n';
import { LanguageSelector } from './LanguageSelector';
import {
  Sparkles,
  User,
  Calendar,
  Zap,
  Swords,
  Check,
  ChevronRight,
  Shield,
  Award,
  BookOpen,
  Globe,
} from 'lucide-react';

interface OnboardingModalProps {
  initialSettings: UserSettings;
  onSaveProfile: (profile: Partial<UserSettings>) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialSettings,
  onSaveProfile,
}) => {
  const { t, language } = useTranslation();
  const [userName, setUserName] = useState(initialSettings.userName || '');
  const [userAge, setUserAge] = useState<string>(String(initialSettings.userAge || ''));
  const [selectedHeroId, setSelectedHeroId] = useState(initialSettings.characterId || 'warrior');
  const [targetWpm, setTargetWpm] = useState(initialSettings.targetWpmGoal || 35);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedHero = HEROES.find((h) => h.id === selectedHeroId) || HEROES[0];

  const ageSuggestions = [
    { label: language === 'vi' ? '6 - 10 tuổi (Tiểu học)' : '6 - 10 yrs (Elementary)', value: '8' },
    { label: language === 'vi' ? '11 - 14 tuổi (THCS)' : '11 - 14 yrs (Middle School)', value: '12' },
    { label: language === 'vi' ? '15 - 18 tuổi (THPT)' : '15 - 18 yrs (High School)', value: '16' },
    { label: language === 'vi' ? '18+ tuổi (Đại học / Đi làm)' : '18+ yrs (College / Work)', value: '20' },
  ];

  const wpmGoals = [
    { wpm: 20, label: t.onboarding.wpmNovice, desc: t.onboarding.wpmNoviceDesc },
    { wpm: 35, label: t.onboarding.wpmStandard, desc: t.onboarding.wpmStandardDesc },
    { wpm: 50, label: t.onboarding.wpmFast, desc: t.onboarding.wpmFastDesc },
    { wpm: 75, label: t.onboarding.wpmMaster, desc: t.onboarding.wpmMasterDesc },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setErrorMsg(t.onboarding.nameRequired);
      soundEngine.playError();
      return;
    }

    soundEngine.playVictoryFanfare();
    onSaveProfile({
      userName: userName.trim(),
      userAge: userAge.trim() || undefined,
      characterId: selectedHeroId,
      targetWpmGoal: targetWpm,
      onboardingCompleted: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto font-sans antialiased">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full text-slate-800 p-5 sm:p-8 my-4 relative overflow-hidden animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        
        {/* Top Header with Language selector */}
        <div className="flex items-start justify-between gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {t.onboarding.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                  {t.onboarding.beginnerBadge}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {t.onboarding.subtitle}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <LanguageSelector variant="buttons" />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. NAME & AGE INPUTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.onboarding.nameLabel} *</span>
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder={t.onboarding.namePlaceholder}
                maxLength={30}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs"
                autoFocus
              />
            </div>

            {/* Age input / Quick picks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.onboarding.ageLabel}</span>
              </label>
              <input
                type="number"
                min="5"
                max="99"
                value={userAge}
                onChange={(e) => setUserAge(e.target.value)}
                placeholder="VD: 10, 12, 16, 22..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Quick Age Pills */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-bold text-slate-400 mr-1">{t.onboarding.quickSuggestion}:</span>
            {ageSuggestions.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setUserAge(item.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  userAge === item.value
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* 2. HERO AVATAR SELECTOR (Wider 6-Column Layout & Bounded Sprites) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.onboarding.chooseHero}</span>
              </label>
              <span className="text-[11px] text-blue-600 font-bold">
                {t.onboarding.currentlySelected}: {selectedHero.name} ({selectedHero.role})
              </span>
            </div>

            {/* Hero Cards Grid (Bounded sprite containers with no text overlap) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 p-1">
              {HEROES.map((h) => {
                const isSelected = h.id === selectedHeroId;
                return (
                  <div
                    key={h.id}
                    onClick={() => {
                      setSelectedHeroId(h.id);
                      soundEngine.playKeyClick();
                    }}
                    className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center select-none overflow-hidden group ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 shadow-md shadow-blue-500/20 ring-2 ring-blue-400/30'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100/80'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xs z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Role Tag */}
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-200/70 text-slate-600 border-slate-300'
                      }`}
                    >
                      {h.role}
                    </span>

                    {/* Bounded Animated Sprite Box */}
                    <div className="w-full h-24 flex items-center justify-center overflow-hidden relative my-0.5 pointer-events-none">
                      <div className="transform scale-65 transition-transform group-hover:scale-75">
                        <CombatSpriteHero hero={h} action="idle" />
                      </div>
                    </div>

                    {/* Hero Text Details (Separated cleanly below sprite) */}
                    <div className="w-full mt-1 pt-1.5 border-t border-slate-200/60">
                      <span className="font-extrabold text-xs text-slate-900 truncate block">
                        {h.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-blue-600 font-semibold truncate block mt-0.5">
                        {language === 'vi' ? h.vietnameseTitle : h.role}
                      </span>
                      <span className="text-[9px] text-amber-600 font-semibold mt-0.5 truncate block">
                        🗡️ {h.weaponName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. WPM SPEED TARGET GOAL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.onboarding.wpmGoalTitle}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {wpmGoals.map((g) => {
                const isSelected = targetWpm === g.wpm;
                return (
                  <button
                    key={g.wpm}
                    type="button"
                    onClick={() => {
                      setTargetWpm(g.wpm);
                      soundEngine.playKeyClick();
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-900">{g.wpm} WPM</span>
                      {isSelected && <span className="text-amber-600 font-bold text-xs">★</span>}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 block mt-0.5">
                      {g.label}
                    </span>
                    <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">
                      {g.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cookie & Persistence Info Note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
            <span className="text-base">🍪</span>
            <span>
              {t.settings.cookieSyncNote}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t.onboarding.submitButton}</span>
            <ChevronRight className="w-5 h-5" />
          </button>

        </form>
      </div>
    </div>
  );
};
