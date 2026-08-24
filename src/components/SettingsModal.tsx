import React, { useState } from 'react';
import { UserSettings, SoundTheme } from '../types';
import { HERO_CHARACTERS, getHeroById } from '../data/characters';
import { CombatSpriteHero } from './games/CombatSpriteHero';
import { useTranslation } from '../i18n';
import { LanguageSelector } from './LanguageSelector';
import {
  Settings as SettingsIcon,
  X,
  Volume2,
  Keyboard,
  Hand,
  Type,
  Trash2,
  Check,
  User,
  Swords,
  Sparkles,
  Globe,
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface SettingsModalProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetProgress,
  onClose,
}) => {
  const { t } = useTranslation();
  const [confirmReset, setConfirmReset] = useState(false);
  const activeHero = getHeroById(settings.characterId);

  const soundThemes: { id: SoundTheme; label: string; desc: string }[] = [
    { id: 'mechanical', label: t.settings.soundThemes.mechanical, desc: t.settings.soundThemes.mechanicalDesc },
    { id: 'typewriter', label: t.settings.soundThemes.typewriter, desc: t.settings.soundThemes.typewriterDesc },
    { id: 'modern', label: t.settings.soundThemes.modern, desc: t.settings.soundThemes.modernDesc },
    { id: 'pop', label: t.settings.soundThemes.pop, desc: t.settings.soundThemes.popDesc },
    { id: 'mute', label: t.settings.soundThemes.mute, desc: t.settings.soundThemes.muteDesc },
  ];

  const handleSoundChange = (theme: SoundTheme) => {
    onUpdateSettings({ soundTheme: theme });
    soundEngine.setSoundTheme(theme);
    soundEngine.playKeyClick(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm animate-in fade-in font-sans antialiased">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-5 sm:p-7 max-w-2xl w-full text-slate-800 flex flex-col relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border border-slate-200/60"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">{t.settings.modalTitle}</h2>
        </div>

        <div className="space-y-5">
          {/* Language Selection */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200/70 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-sky-600" /> {t.settings.languageTitle}
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">{t.settings.languageDesc}</p>
              </div>
              <LanguageSelector variant="buttons" />
            </div>
          </div>

          {/* Sound Theme */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-emerald-600" /> {t.settings.typingSoundEffects}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {soundThemes.map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleSoundChange(st.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.soundTheme === st.id
                      ? 'bg-sky-50/80 border-sky-400 text-sky-900 font-semibold'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{st.label}</span>
                    {settings.soundTheme === st.id && <Check className="w-3.5 h-3.5 text-sky-600 stroke-[3]" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{st.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Visual Aids Toggles */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              {t.settings.visualGuides}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onUpdateSettings({ showKeyboard: !settings.showKeyboard })}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                  settings.showKeyboard
                    ? 'bg-sky-50/90 border-sky-400 text-sky-900 font-bold'
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-sky-600" />
                  <span>{t.settings.virtualKeyboard}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  settings.showKeyboard ? 'bg-sky-200/70 text-sky-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {settings.showKeyboard ? t.settings.on : t.settings.off}
                </span>
              </button>

              <button
                onClick={() => onUpdateSettings({ showHands: !settings.showHands })}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                  settings.showHands
                    ? 'bg-sky-50/90 border-sky-400 text-sky-900 font-bold'
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hand className="w-4 h-4 text-sky-600" />
                  <span>{t.settings.handGuides}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  settings.showHands ? 'bg-sky-200/70 text-sky-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {settings.showHands ? t.settings.on : t.settings.off}
                </span>
              </button>
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-sky-600" /> {t.settings.promptTextSize}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['small', 'medium', 'large', 'huge'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ fontSize: size })}
                  className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all border cursor-pointer ${
                    settings.fontSize === size
                      ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-2xs'
                      : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.settings.fontSizes[size]}
                </button>
              ))}
            </div>
          </div>

          {/* Student Profile Name, Age & PK Character */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-sky-600" /> {t.settings.studentName}
                </label>
                <input
                  type="text"
                  value={settings.userName}
                  onChange={(e) => onUpdateSettings({ userName: e.target.value })}
                  placeholder="VD: Alex, Nam..."
                  className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-sky-600" /> {t.settings.studentAge}
                </label>
                <input
                  type="number"
                  min="5"
                  max="99"
                  value={settings.userAge || ''}
                  onChange={(e) => onUpdateSettings({ userAge: e.target.value })}
                  placeholder="VD: 10, 14, 18..."
                  className="w-full bg-slate-50 text-slate-900 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-rose-600" /> {t.settings.heroAvatar}
                </span>
                <span className="text-[11px] text-sky-600 font-bold">
                  {activeHero.name} ({activeHero.role})
                </span>
              </label>

              {/* Character Avatars Selection Grid (Clean 6 Columns & Bounded Sprites) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {HERO_CHARACTERS.map((hero) => {
                  const isSelected = settings.characterId === hero.id || (!settings.characterId && hero.id === 'warrior');
                  return (
                    <button
                      key={hero.id}
                      onClick={() => onUpdateSettings({ characterId: hero.id })}
                      className={`p-2 rounded-2xl border text-center transition-all cursor-pointer relative flex flex-col items-center group overflow-hidden ${
                        isSelected
                          ? 'bg-sky-50/90 border-sky-500 ring-2 ring-sky-300/50 shadow-sm'
                          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 p-0.5 bg-sky-600 text-white rounded-full z-10">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}

                      {/* Bounded Mini Sprite */}
                      <div className="w-full h-20 flex items-center justify-center overflow-hidden relative pointer-events-none my-0.5">
                        <div className="transform scale-55 transition-transform group-hover:scale-65">
                          <CombatSpriteHero hero={hero} action="idle" />
                        </div>
                      </div>

                      <div className="text-[11px] font-extrabold text-slate-900 truncate w-full mt-1 pt-1 border-t border-slate-200/60">
                        {hero.name.split(' ')[0]}
                      </div>
                      <div className="text-[9px] text-sky-600 font-semibold truncate w-full">
                        {hero.role}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cookie & Sync Note */}
            <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
              <span>🍪</span>
              <span>{t.settings.cookieSyncNote}</span>
            </div>
          </div>

          {/* Reset Course Progress */}
          <div className="pt-3 border-t border-slate-100">
            {confirmReset ? (
              <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-center">
                <p className="text-xs text-rose-800 mb-2.5 font-semibold">
                  {t.settings.resetConfirm}
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      onResetProgress();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    {t.settings.resetYes}
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 font-medium text-xs border border-slate-200/80 hover:border-rose-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t.settings.resetProgress}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
