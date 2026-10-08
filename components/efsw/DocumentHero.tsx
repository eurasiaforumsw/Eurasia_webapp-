'use client';

import { ChevronDown } from 'lucide-react';

export interface DocumentHeroProps {
  title: string;
  subtitle: string;
  stats: {
    label: string;
    value: number | string;
  }[];
  onScrollClick?: () => void;
}

export default function DocumentHero({
  title,
  subtitle,
  stats,
  onScrollClick,
}: DocumentHeroProps) {
  return (
    <section
      className="relative flex items-center justify-center min-h-screen px-6 py-20"
      style={{
        '--surface-1': '#05070C',
        '--surface-2': '#0A0D12',
        '--accent-teal': '#38BDF8',
        background: 'linear-gradient(180deg, var(--surface-1) 0%, var(--surface-2) 100%)',
      } as React.CSSProperties}
    >
      {/* Ambient Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: 'var(--accent-teal)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: '#6EE7B7' }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
          <span className="text-sm font-medium text-white/70 tracking-wide uppercase">
            Knowledge Hub
          </span>
        </div>

        {/* Main Title */}
        <h1
          className="font-bold text-white mb-6 leading-tight"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p
          className="text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed"
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            lineHeight: '1.6',
          }}
        >
          {subtitle}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-[var(--accent-teal)]/30"
            >
              <strong
                className="font-bold text-[var(--accent-teal)] tabular-nums"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
              >
                {stat.value}
              </strong>
              <span className="text-sm text-white/60 font-medium tracking-wide uppercase">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      {onScrollClick && (
        <button
          type="button"
          onClick={onScrollClick}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 transition-all duration-300 hover:text-[var(--accent-teal)] group"
          aria-label="Scroll to content"
        >
          <span className="text-xs font-medium tracking-wider uppercase">Explore</span>
          <div className="w-8 h-12 rounded-full border-2 border-current flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-current animate-scroll-bounce" />
          </div>
          <ChevronDown size={20} className="animate-bounce" />
        </button>
      )}

      <style jsx>{`
        @keyframes scroll-bounce {
          0%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          50% {
            transform: translateY(8px);
            opacity: 0.5;
          }
        }
        .animate-scroll-bounce {
          animation: scroll-bounce 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
