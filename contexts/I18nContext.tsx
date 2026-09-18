"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Locale = 'en' | 'th' | 'ko';

interface Messages {
  [key: string]: any;
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Reads a list-valued message (e.g. role names) with the same lookup rules as `t`. */
  tList: (key: string) => string[];
  messages: Messages;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
  messages: {
    en: Messages;
    th: Messages;
    ko: Messages;
  };
}

export function I18nProvider({ children, defaultLocale = 'en', messages }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Load saved locale from localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem('efsw.locale') as Locale;
    if (savedLocale && ['en', 'th', 'ko'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  // Save locale to localStorage when changed
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('efsw.locale', newLocale);
    // Update html lang attribute
    document.documentElement.lang = newLocale;
  };

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = messages[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = messages.en;
        for (const k2 of keys) {
          if (value && typeof value === 'object' && k2 in value) {
            value = value[k2];
          } else {
            return key; // Return key if not found in fallback
          }
        }
        break;
      }
    }

    // Replace parameters if provided
    if (typeof value === 'string' && params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      });
    }

    return typeof value === 'string' ? value : key;
  };

  // Resolves a dotted key against the active locale, then English.
  const lookup = (key: string): unknown => {
    const keys = key.split('.');
    for (const source of [messages[locale], messages.en]) {
      let value: any = source;
      let found = true;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          found = false;
          break;
        }
      }
      if (found) return value;
    }
    return undefined;
  };

  const tList = (key: string): string[] => {
    const value = lookup(key);
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tList, messages: messages[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
