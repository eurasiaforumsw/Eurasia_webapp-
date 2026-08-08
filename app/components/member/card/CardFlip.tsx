'use client';

import { useState } from 'react';

interface CardFlipProps {
  front: {
    title: string;
    logo?: React.ReactNode;
    content: React.ReactNode;
  };
  back: {
    title: string;
    content: React.ReactNode;
  };
}

export function CardFlip({ front, back }: CardFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFlip();
    }
  };

  return (
    <>
      <style jsx>{`
        :root {
          --surface-0: #05070C;
          --surface-1: #0A0D12;
          --surface-2: #0F131C;
          --surface-3: #161D2B;
          --surface-4: #1E2636;
          --accent: #3B6DFF;
          --accent-muted: #5A7FFF;
          --radius-full: 999px;
          --radius-card: 16px;
          --spacing-4: 1rem;
          --spacing-6: 1.5rem;
          --spacing-8: 2rem;
          --shadow-elevated: 0 8px 32px rgba(5, 7, 12, 0.4);
        }

        .card-container {
          perspective: 1000px;
          width: 100%;
          max-width: 400px;
          aspect-ratio: 1.6 / 1;
          cursor: pointer;
        }

        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 650ms cubic-bezier(0.4, 0.0, 0.2, 1);
        }

        .card-inner.flipped {
          transform: rotateY(180deg);
        }

        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: var(--radius-card);
          padding: var(--spacing-6);
          display: grid;
          grid-template-rows: auto 1fr auto;
          gap: var(--spacing-4);
          box-shadow: var(--shadow-elevated);
        }

        .card-front {
          background: linear-gradient(135deg, var(--surface-3) 0%, var(--surface-2) 100%);
          border: 1px solid rgba(59, 109, 255, 0.2);
        }

        .card-back {
          background: linear-gradient(135deg, var(--surface-2) 0%, var(--surface-1) 100%);
          border: 1px solid rgba(59, 109, 255, 0.3);
          transform: rotateY(180deg);
        }

        .card-container:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 4px;
          border-radius: var(--radius-card);
        }

        .card-header {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: var(--spacing-4);
        }

        .card-logo {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--accent);
          display: grid;
          place-items: center;
        }

        .card-title {
          font-size: clamp(1.25rem, 2vw, 1.5rem);
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #F9FAFB;
          margin: 0;
        }

        .card-body {
          display: grid;
          gap: var(--spacing-4);
          align-content: center;
        }

        .card-info-row {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: var(--spacing-4);
          align-items: center;
        }

        .card-label {
          font-size: clamp(0.75rem, 1.5vw, 0.875rem);
          color: rgba(249, 250, 251, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .card-value {
          font-size: clamp(0.875rem, 1.8vw, 1rem);
          color: #F9FAFB;
          font-weight: 500;
        }

        .card-footer {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: var(--spacing-4);
          padding-top: var(--spacing-4);
          border-top: 1px solid rgba(249, 250, 251, 0.1);
        }

        .flip-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: clamp(0.75rem, 1.5vw, 0.875rem);
          color: var(--accent-muted);
          transition: color 300ms ease;
        }

        .card-container:hover .flip-indicator {
          color: var(--accent);
        }

        .flip-icon {
          width: 20px;
          height: 20px;
          transition: transform 300ms ease;
        }

        .card-container:hover .flip-icon {
          transform: rotateY(180deg);
        }

        @media (max-width: 480px) {
          .card-container {
            max-width: 100%;
          }

          .card-face {
            padding: var(--spacing-4);
          }
        }
      `}</style>

      <div
        className="card-container"
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? "Flip to front of card" : "Flip to back of card"}
        aria-pressed={isFlipped}
      >
        <div className={`card-inner ${isFlipped ? 'flipped' : ''}`}>
          {/* Front Face */}
          <div className="card-face card-front">
            <div className="card-header">
              {front.logo && (
                <div className="card-logo" aria-hidden="true">
                  {front.logo}
                </div>
              )}
              <h3 className="card-title">{front.title}</h3>
            </div>

            <div className="card-body">
              {front.content}
            </div>

            <div className="card-footer">
              <span className="flip-indicator">
                <span>Click to flip</span>
                <svg className="flip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 12h18M3 12l6-6M3 12l6 6" />
                </svg>
              </span>
            </div>
          </div>

          {/* Back Face */}
          <div className="card-face card-back">
            <div className="card-header">
              <h3 className="card-title">{back.title}</h3>
            </div>

            <div className="card-body">
              {back.content}
            </div>

            <div className="card-footer">
              <span className="flip-indicator">
                <span>Click to flip back</span>
                <svg className="flip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 12H3M21 12l-6-6M21 12l-6 6" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
