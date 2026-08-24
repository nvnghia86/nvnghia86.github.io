import React from 'react';
import { useTranslation } from '../i18n';
import { Globe, Check } from 'lucide-react';
import { Language } from '../types';

interface LanguageSelectorProps {
  variant?: 'pill' | 'dropdown' | 'buttons';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'pill',
  className = '',
}) => {
  const { language, setLanguage, t } = useTranslation();

  if (variant === 'buttons') {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage('vi')}
          className={`px-3 py-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
            language === 'vi'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">🇻🇳</span>
            <span>{t.common.vietnamese}</span>
          </div>
          {language === 'vi' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-3 py-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">🇬🇧</span>
            <span>{t.common.english}</span>
          </div>
          {language === 'en' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>
      </div>
    );
  }

  // Default compact pill switcher for header
  return (
    <div
      className={`inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 shadow-2xs ${className}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('vi')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          language === 'vi'
            ? 'bg-white text-blue-700 shadow-2xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="Chuyển sang Tiếng Việt"
      >
        <span className="text-xs">🇻🇳</span>
        <span className="hidden sm:inline">VIE</span>
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          language === 'en'
            ? 'bg-white text-blue-700 shadow-2xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="Switch to English"
      >
        <span className="text-xs">🇬🇧</span>
        <span className="hidden sm:inline">ENG</span>
      </button>
    </div>
  );
};
