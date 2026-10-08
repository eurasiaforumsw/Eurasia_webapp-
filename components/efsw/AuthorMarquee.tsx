'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export interface Author {
  id: string;
  name: string;
  avatar: string;
  docCount: number;
  totalViews: number;
  latestDate: string;
}

interface AuthorMarqueeProps {
  authors: Author[];
  sortMode?: 'latest' | 'popular';
  onAuthorClick: (authorId: string) => void;
}

export default function AuthorMarquee({
  authors,
  sortMode = 'latest',
  onAuthorClick,
}: AuthorMarqueeProps) {
  const [sortedAuthors, setSortedAuthors] = useState<Author[]>([]);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sorted = [...authors].sort((a, b) => {
      if (sortMode === 'latest') {
        return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
      }
      return b.totalViews - a.totalViews;
    });
    setSortedAuthors(sorted);
  }, [authors, sortMode]);

  // Duplicate authors for seamless infinite scroll
  const duplicatedAuthors = [...sortedAuthors, ...sortedAuthors, ...sortedAuthors];

  return (
    <div
      className="relative w-full overflow-hidden py-12"
      style={{ '--surface-1': '#05070C', '--surface-2': '#0F131C', '--accent-teal': '#38BDF8' } as React.CSSProperties}
      role="region"
      aria-label="Featured authors"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface-1)] via-transparent to-[var(--surface-1)] pointer-events-none z-10" aria-hidden="true" />

      <div
        ref={marqueeRef}
        className="flex gap-8 animate-marquee-scroll"
        style={{
          width: 'max-content',
        }}
      >
        {duplicatedAuthors.map((author, index) => (
          <button
            key={`${author.id}-${index}`}
            onClick={() => onAuthorClick(author.id)}
            className="group relative flex flex-col items-center gap-3 flex-shrink-0 transition-transform duration-300 hover:scale-110 focus:scale-110 academic-focus-ring"
            aria-label={`View ${author.name}'s research documents. ${author.docCount} documents, ${author.totalViews.toLocaleString()} total views`}
            tabIndex={index % sortedAuthors.length === 0 ? 0 : -1}
          >
            {/* Avatar Container */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-full bg-[var(--accent-teal)] opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-40 group-focus:opacity-40" />

              {/* Avatar */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--surface-2)] transition-all duration-300 group-hover:border-[var(--accent-teal)] group-focus:border-[var(--accent-teal)] group-hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] group-focus:shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                <Image
                  src={author.avatar}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                  aria-hidden="true"
                />
              </div>

              {/* Document Count Badge */}
              <div
                className="absolute -bottom-1 -right-1 bg-[var(--surface-2)] border-2 border-[var(--accent-teal)] rounded-full px-2.5 py-1 shadow-lg"
                aria-hidden="true"
              >
                <span className="text-xs font-semibold text-[var(--accent-teal)] tabular-nums">
                  {author.docCount}
                </span>
              </div>
            </div>

            {/* Author Name */}
            <div className="text-center max-w-[120px]" aria-hidden="true">
              <p className="text-sm font-medium text-white/90 group-hover:text-[var(--accent-teal)] transition-colors duration-300 truncate">
                {author.name}
              </p>
              <p className="text-xs text-white/50 mt-0.5">
                {author.totalViews.toLocaleString()} views
              </p>
            </div>
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .animate-marquee-scroll {
          animation: marquee-scroll 40s linear infinite;
        }

        .animate-marquee-scroll:hover,
        .animate-marquee-scroll:focus-within {
          animation-play-state: paused;
        }

        @media (max-width: 768px) {
          .animate-marquee-scroll {
            animation: marquee-scroll 30s linear infinite;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-marquee-scroll {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
