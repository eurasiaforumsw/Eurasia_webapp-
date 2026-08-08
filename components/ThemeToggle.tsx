"use client";

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-pressed={theme === 'dark'}
    >
      <Sun
        className="sun-icon"
        size={20}
        strokeWidth={2}
        aria-hidden="true"
      />
      <Moon
        className="moon-icon"
        size={20}
        strokeWidth={2}
        aria-hidden="true"
      />

      <style jsx>{`
        .theme-toggle {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: var(--surface-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: 50%;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .theme-toggle:hover {
          background: var(--surface-overlay);
          border-color: var(--accent-primary);
          transform: scale(1.05);
        }

        .theme-toggle:focus-visible {
          outline: 2px solid var(--accent-primary);
          outline-offset: 2px;
        }

        .theme-toggle:active {
          transform: scale(0.98);
        }

        .theme-toggle :global(.sun-icon),
        .theme-toggle :global(.moon-icon) {
          position: absolute;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Dark mode: show moon, hide sun */
        :global(html[data-theme="dark"]) .theme-toggle :global(.moon-icon) {
          opacity: 1;
          transform: rotate(0deg) scale(1);
        }

        :global(html[data-theme="dark"]) .theme-toggle :global(.sun-icon) {
          opacity: 0;
          transform: rotate(90deg) scale(0);
        }

        /* Light mode: show sun, hide moon */
        :global(html[data-theme="light"]) .theme-toggle :global(.sun-icon) {
          opacity: 1;
          transform: rotate(0deg) scale(1);
        }

        :global(html[data-theme="light"]) .theme-toggle :global(.moon-icon) {
          opacity: 0;
          transform: rotate(-90deg) scale(0);
        }
      `}</style>
    </button>
  );
}
