'use client';

import { useRef, useEffect, ReactNode } from 'react';

export interface StickySection {
  id: string;
  title: string;
  content: ReactNode;
}

export interface StickyDocumentLayoutProps {
  sections: StickySection[];
}

export default function StickyDocumentLayout({ sections }: StickyDocumentLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '-10% 0px -10% 0px',
      }
    );

    const sections = containerRef.current?.querySelectorAll('.sticky-section');
    sections?.forEach((section) => observer.observe(section));

    return () => {
      sections?.forEach((section) => observer.unobserve(section));
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      role="main"
      style={{
        '--surface-2': '#0A0D12',
        '--surface-3': '#0F131C',
      } as React.CSSProperties}
    >
      {sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          className="sticky-section min-h-screen flex items-center py-20"
          style={{
            top: `${index * 10}px`,
          }}
          aria-labelledby={`section-title-${section.id}`}
        >
          <div className="w-full max-w-7xl mx-auto px-6">
            {/* Section Title */}
            <div className="mb-8">
              <h2
                id={`section-title-${section.id}`}
                className="font-bold text-white opacity-0 translate-y-8 transition-all duration-700 delay-100"
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                  letterSpacing: '-0.01em',
                }}
              >
                {section.title}
              </h2>
            </div>

            {/* Section Content */}
            <div className="opacity-0 translate-y-8 transition-all duration-700 delay-300">
              {section.content}
            </div>
          </div>
        </section>
      ))}

      <style jsx>{`
        .sticky-section.in-view > div > div > h2,
        .sticky-section.in-view > div > div > div {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
