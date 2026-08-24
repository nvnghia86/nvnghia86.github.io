import React, { useState } from 'react';
import { HERO_CHARACTERS, HeroCharacter, getHeroById } from '../data/characters';
import { CombatSpriteHero } from './games/CombatSpriteHero';
import { useTranslation } from '../i18n';
import { X, Check, Swords, Shield, Zap, Sparkles, User, Play, RefreshCw } from 'lucide-react';

interface HeroSelectModalProps {
  selectedHeroId?: string;
  onSelectHero: (heroId: string) => void;
  onClose: () => void;
}

export const HeroSelectModal: React.FC<HeroSelectModalProps> = ({
  selectedHeroId = 'warrior',
  onSelectHero,
  onClose,
}) => {
  const { t, language } = useTranslation();
  const [previewAction, setPreviewAction] = useState<'idle' | 'attack' | 'victory'>('idle');
  const currentHero = getHeroById(selectedHeroId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-8 max-w-4xl w-full text-slate-800 flex flex-col relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto font-sans antialiased">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer z-10"
          title={t.common.close}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
              <Swords className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
              {language === 'vi' ? 'Chọn Chiến Binh Đồng Hành (Hero Champion)' : 'Select Combat Hero (Champion)'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            {language === 'vi'
              ? 'Chọn anh hùng đồng hành cùng bạn trong các bài luyện gõ phím và Đấu Trường Quái Vật PK (Monster Battle Arena).'
              : 'Select your hero champion for typing battles and Monster Arena showdowns.'}
          </p>
        </div>

        {/* Hero Grid Selection (Wide 6-column layout on desktop, clean rows on mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {HERO_CHARACTERS.map((hero) => {
            const isSelected = hero.id === selectedHeroId;
            return (
              <button
                key={hero.id}
                onClick={() => {
                  onSelectHero(hero.id);
                  setPreviewAction('idle');
                }}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col items-center cursor-pointer group select-none overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-b from-blue-50 to-indigo-50/80 border-blue-500 shadow-md ring-2 ring-blue-400/30'
                    : 'bg-slate-50/80 border-slate-200/90 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {/* Active Selection Check Badge */}
                {isSelected && (
                  <span className="absolute top-2 right-2 p-1 bg-blue-600 text-white rounded-full shadow-xs z-10">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}

                {/* Hero Role Tag */}
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-200/70 text-slate-600 border-slate-300'
                  }`}
                >
                  {hero.role}
                </span>

                {/* Micro Hero Sprite Box (Bounded to prevent text overlap) */}
                <div className="w-full h-24 flex items-center justify-center overflow-hidden relative my-0.5">
                  <div className="transform scale-65 transition-transform group-hover:scale-75 pointer-events-none">
                    <CombatSpriteHero hero={hero} action="idle" />
                  </div>
                </div>

                {/* Hero Labels */}
                <div className="text-center w-full mt-1 pt-1.5 border-t border-slate-200/60">
                  <div className="text-xs font-heading font-bold text-slate-900 flex items-center justify-center gap-1 leading-snug">
                    <span className="text-sm leading-none">{hero.avatarEmoji}</span>
                    <span className="truncate">{hero.name.split(' ')[0]}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-blue-600 truncate mt-0.5">
                    {language === 'vi' ? hero.vietnameseTitle : hero.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Hero Preview & Detail Section */}
        {currentHero && (
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 text-white border border-slate-700/80 shadow-xl relative overflow-hidden">
            {/* Background Accent Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-10">
              {/* Left Side: Hero Live Sprite Preview Card */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-40 h-44 sm:w-48 sm:h-48 flex items-center justify-center bg-slate-950/70 rounded-2xl border border-slate-700/80 p-2 relative overflow-hidden shadow-inner group">
                  {/* Subtle Grid Pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

                  {/* Centered Bounded Sprite */}
                  <div className="transform scale-85 sm:scale-90 transition-transform pointer-events-none flex items-center justify-center">
                    <CombatSpriteHero hero={currentHero} action={previewAction} />
                  </div>
                </div>

                {/* Animation Action Selector Buttons */}
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-700/60 text-[11px] font-medium text-slate-300">
                  <button
                    onClick={() => setPreviewAction('idle')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      previewAction === 'idle'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    Đứng yên
                  </button>
                  <button
                    onClick={() => setPreviewAction('attack')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      previewAction === 'attack'
                        ? 'bg-rose-600 text-white font-bold'
                        : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    Tấn công
                  </button>
                  <button
                    onClick={() => setPreviewAction('victory')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      previewAction === 'victory'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    Chiến thắng
                  </button>
                </div>
              </div>

              {/* Right Side: Hero Details & Skills */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                {/* Header Tag & Title */}
                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                      {currentHero.badge || currentHero.role}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      {language === 'vi' ? 'Vũ khí:' : 'Weapon:'}{' '}
                      <b className="text-amber-300 font-bold">{currentHero.weaponName}</b>
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-heading font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
                    <span>{currentHero.name}</span>
                    <span className="text-sm font-normal text-slate-300">
                      ({language === 'vi' ? currentHero.vietnameseTitle : currentHero.role})
                    </span>
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-700/50">
                  {currentHero.description}
                </p>

                {/* Special Skill Box */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {language === 'vi' ? 'Tuyệt kỹ đòn gõ:' : 'Special Typing Skill:'}{' '}
                      <span className="text-white">{currentHero.skillName}</span>
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-normal pl-6">
                    {currentHero.skillDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            {language === 'vi'
              ? 'Chiến binh chọn sẽ tự động xuất hiện trong Đấu Trường Monster Battle.'
              : 'Selected hero will automatically appear in Monster Battle games.'}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t.common.confirm}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
