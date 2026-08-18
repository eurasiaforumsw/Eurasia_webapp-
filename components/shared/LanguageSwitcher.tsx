"use client";

import { Globe2, Check } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { useState, useRef, useEffect } from "react";

const languages = [
  { code: "en" as const, label: "English", flag: "🇬🇧" },
  { code: "th" as const, label: "ไทย", flag: "🇹🇭" },
  { code: "ko" as const, label: "한국어", flag: "🇰🇷" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const currentLang = languages.find((lang) => lang.code === locale) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-surface-raised hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-all duration-200"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <Globe2 size={16} />
        <span className="text-sm font-medium">{currentLang.flag} {currentLang.label}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-surface-raised border border-border-subtle rounded-2xl shadow-lg overflow-hidden z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setLocale(lang.code);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.label}</span>
              </span>
              {locale === lang.code && (
                <Check size={16} className="text-accent-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
