import React, { createContext, useContext, useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '../services/i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Always enforce clean English
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    localStorage.setItem('amburoute_lang', 'en');
  }, []);

  const t = (key) => {
    return TRANSLATIONS.en[key] || key;
  };

  const setLanguage = (langCode) => {
    setCurrentLang('en');
  };

  return (
    <LanguageContext.Provider value={{ currentLang: 'en', setLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
