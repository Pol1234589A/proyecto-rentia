"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { translations } from '../data/translations';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  // Load language from localStorage if available
  useEffect(() => {
    const savedLang = localStorage.getItem('rentia-lang') as Language;
    if (savedLang === 'es' || savedLang === 'en') {
      setLanguage(savedLang);
    } else {
      // Auto-detect
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'en') setLanguage('en');
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    if (lang !== 'es' && lang !== 'en') return; // Safety check
    setLanguage(lang);
    localStorage.setItem('rentia-lang', lang);
  };

  // Helper function to get nested translation keys (e.g., "home.hero.title")
  const t = (path: string) => {
    const keys = path.split('.');

    // CRITICAL FIX: Fallback to 'es' if the current language (e.g. 'en') is missing in translations
    const trans: any = translations;
    let current = trans[language] || trans['es'];

    for (const key of keys) {
      // If path is broken in current language
      if (current === undefined || current[key] === undefined) {

        // If we are on a different language than 'es', try to find the key in 'es'
        if (language !== 'es') {
          let fallbackCurrent = trans['es'];
          let validFallback = true;
          for (const fallbackKey of keys) {
            if (fallbackCurrent && fallbackCurrent[fallbackKey] !== undefined) {
              fallbackCurrent = fallbackCurrent[fallbackKey];
            } else {
              validFallback = false;
              break;
            }
          }
          if (validFallback) return fallbackCurrent;
        }

        // If even fallback fails, return the key itself
        return path;
      }
      current = current[key];
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
