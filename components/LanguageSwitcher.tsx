"use client";

import React, { useState, useRef } from 'react';
import { Languages } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useClickOutside } from '@/hooks/useClickOutside';

const languages = [
  { code: 'en' as const, name: 'English', nativeName: 'English' },
  { code: 'th' as const, name: 'Thai', nativeName: 'ไทย' },
  { code: 'ko' as const, name: 'Korean', nativeName: '한국어' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  const currentLanguage = languages.find(lang => lang.code === locale);

  const handleLanguageChange = (code: 'en' | 'th' | 'ko') => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button
        className="language-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Languages size={20} strokeWidth={2} />
        <span className="current-lang">{currentLanguage?.nativeName}</span>
      </button>

      {isOpen && (
        <div className="language-dropdown" role="listbox">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-option ${locale === lang.code ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
              role="option"
              aria-selected={locale === lang.code}
            >
              <span className="lang-native">{lang.nativeName}</span>
              <span className="lang-name">{lang.name}</span>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .language-switcher {
          position: relative;
        }

        .language-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--surface-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .language-button:hover {
          background: var(--surface-overlay);
          border-color: var(--accent-primary);
        }

        .language-button:focus-visible {
          outline: 2px solid var(--accent-primary);
          outline-offset: 2px;
        }

        .current-lang {
          min-width: 60px;
          text-align: left;
        }

        .language-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          min-width: 180px;
          background: var(--surface-elevated);
          border: 1px solid var(--border-base);
          border-radius: 12px;
          padding: 0.5rem;
          box-shadow: 0 10px 40px var(--shadow), 0 2px 8px var(--shadow-soft);
          z-index: 1000;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .language-option {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .language-option:hover {
          background: var(--surface-overlay);
        }

        .language-option.active {
          background: var(--accent-primary);
          color: var(--surface-deep);
        }

        .language-option.active .lang-name {
          color: var(--surface-deep);
        }

        .lang-native {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.125rem;
        }

        .lang-name {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .current-lang {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
