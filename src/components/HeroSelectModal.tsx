import React from 'react';
import { HERO_CHARACTERS, HeroCharacter, getHeroById } from '../data/characters';
import { CombatSpriteHero } from './games/CombatSpriteHero';
import { useTranslation } from '../i18n';
import { X, Check, Swords, Shield, Zap, Sparkles, User } from 'lucide-react';

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
  const currentHero = getHeroById(selectedHeroId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-2xl w-full text-slate-800 flex flex-col relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Swords className="w-5 h-5 text-rose-600" />
          <h2 className="text-xl font-bold text-slate-900">
            {language === 'vi' ? 'Chọn Chiến Binh PK (Hero Champion)' : 'Select Combat Hero (Champion)'}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          {language === 'vi'
            ? 'Chọn chiến binh đại diện cho bạn khi tham gia Đấu Trường PK Quái Vật (Monster Battle Arena).'
            : 'Select your hero avatar for typing battles and Monster Arena showdowns.'}
        </p>

        {/* Hero Grid Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {HERO_CHARACTERS.map((hero) => {
            const isSelected = hero.id === selectedHeroId;
            return (
              <button
                key={hero.id}
                onClick={() => onSelectHero(hero.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col items-center cursor-pointer group ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-400/30'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 p-1 bg-blue-600 text-white rounded-full shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}

                {/* Mini Hero Sprite */}
                <div className="w-20 h-24 mb-1 flex items-center justify-center transition-transform group-hover:scale-105">
                  <CombatSpriteHero hero={hero} action="idle" className="scale-75" />
                </div>

                <div className="text-center w-full">
                  <div className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1">
                    <span>{hero.avatarEmoji}</span>
                    <span className="truncate">{hero.name}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-blue-600 mt-0.5">
                    {language === 'vi' ? hero.vietnameseTitle : hero.role}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Hero Preview & Skill Detail Card */}
        {currentHero && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 shadow-lg">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-28 h-32 flex-shrink-0 flex items-center justify-center bg-slate-800/80 rounded-2xl border border-slate-700 p-2">
                <CombatSpriteHero hero={currentHero} action="attack" className="scale-90" />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider">
                    {currentHero.role}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {language === 'vi' ? 'Vũ khí:' : 'Weapon:'} <b className="text-amber-300">{currentHero.weaponName}</b>
                  </span>
                </div>

                <h3 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <span>{currentHero.name}</span>
                  <span className="text-sm text-slate-300 font-normal">
                    ({language === 'vi' ? currentHero.vietnameseTitle : currentHero.role})
                  </span>
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentHero.description}
                </p>

                <div className="pt-2 border-t border-slate-700/60 flex items-start gap-2 text-xs">
                  <Zap className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300">
                      {language === 'vi' ? 'Tuyệt kỹ:' : 'Special Skill:'} {currentHero.skillName}
                    </span>
                    <p className="text-[11px] text-slate-300 mt-0.5">{currentHero.skillDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            {t.common.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};
