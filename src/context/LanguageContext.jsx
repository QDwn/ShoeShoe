'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLanguage, getTranslation, resolveLanguage } from '../i18n/translations';

const STORAGE_KEY = 'shoeshoe-language';

const LanguageContext = createContext(null);

export function LanguageProvider({ children, initialLanguage = defaultLanguage }) {
  const [language, setLanguageState] = useState(resolveLanguage(initialLanguage));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.cookie = `shoeshoe-language=${language}; path=/; max-age=31536000`;
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (nextLanguage) => {
    setLanguageState(resolveLanguage(nextLanguage));
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      isVietnamese: language === 'vi',
      t: (path) => getTranslation(language, path),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  return context;
}
