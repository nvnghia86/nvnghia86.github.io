import React, { createContext, useContext, useMemo } from 'react';
import { Language } from '../types';
import { TranslationSchema } from './types';
import { vi } from './locales/vi';
import { en } from './locales/en';

export const translations: Record<Language, TranslationSchema> = {
  vi,
  en,
};

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationSchema;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  language,
  onLanguageChange,
  children,
}) => {
  const currentTranslation = useMemo(() => {
    return translations[language] || translations.vi;
  }, [language]);

  const toggleLanguage = () => {
    const nextLang: Language = language === 'vi' ? 'en' : 'vi';
    onLanguageChange(nextLang);
  };

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage: onLanguageChange,
      t: currentTranslation,
      toggleLanguage,
    }),
    [language, onLanguageChange, currentTranslation]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useTranslation(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if accessed outside provider
    return {
      language: 'vi',
      setLanguage: () => {},
      t: translations.vi,
      toggleLanguage: () => {},
    };
  }
  return context;
}

export function getTranslation(lang: Language): TranslationSchema {
  return translations[lang] || translations.vi;
}

export * from './types';
