"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type FeaturedVoice = {
  number: string;
  label: string;
  attribution: string;
  quote: string;
  note: string;
  portrait: string;
  portraitAlt: string;
};

interface VoicesModernProps {
  voices: FeaturedVoice[];
}

export function VoicesModern({ voices }: VoicesModernProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Pin the section
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: `+=${voices.length * 100}%`,
        pin: true,
        pinSpacing: true,
        scrub: 0.5,
        onUpdate: (self) => {
          const progress = self.progress;
          const newIndex = Math.min(
            voices.length - 1,
            Math.floor(progress * voices.length * 1.2)
          );
          if (newIndex !== activeIndex) {
            setActiveIndex(newIndex);
          }
        },
      });

      // Animate each card
      cardsRef.current.forEach((card, index) => {
        if (!card) return;

        const isActive = index === activeIndex;

        gsap.to(card, {
          opacity: isActive ? 1 : 0,
          scale: isActive ? 1 : 0.9,
          y: isActive ? 0 : index < activeIndex ? -60 : 60,
          rotationY: isActive ? 0 : index < activeIndex ? -8 : 8,
          zIndex: isActive ? 10 : 1,
          duration: 0.8,
          ease: "power3.out",
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [voices.length, activeIndex]);

  return (
    <>
      <section
        ref={sectionRef}
        className="voices-v3"
        id="voices"
        aria-label="Featured voices"
      >
        <div className="voices-v3__container">
          {/* Cards Stack */}
          <div className="voices-v3__stack">
            {voices.map((voice, index) => (
              <div
                key={voice.number}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                className="voices-v3__card"
                data-active={index === activeIndex}
              >
                {/* Portrait */}
                <div className="voices-v3__portrait">
                  <Image
                    src={voice.portrait}
                    alt={index === activeIndex ? voice.portraitAlt : ""}
                    fill
                    sizes="(max-width: 768px) 280px, 400px"
                    priority={index === 0}
                    className="voices-v3__img"
                  />
                  <div className="voices-v3__portrait-overlay" />
                </div>

                {/* Content */}
                <div className="voices-v3__content">
                  <div className="voices-v3__header">
                    <span className="voices-v3__label">{voice.label}</span>
                    <span className="voices-v3__number">{voice.number}</span>
                  </div>

                  <blockquote className="voices-v3__quote">
                    <svg
                      className="voices-v3__quote-icon"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
                    </svg>
                    <p>{voice.quote}</p>
                  </blockquote>

                  <div className="voices-v3__footer">
                    <p className="voices-v3__attribution">{voice.attribution}</p>
                    {voice.note && (
                      <p className="voices-v3__note">{voice.note}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="voices-v3__progress">
            <div className="voices-v3__progress-track">
              <div
                className="voices-v3__progress-fill"
                style={{
                  width: `${((activeIndex + 1) / voices.length) * 100}%`,
                }}
              />
            </div>
            <span className="voices-v3__progress-text">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(voices.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </section>

      {/* Scroll spacer */}
      <div style={{ height: `${voices.length * 100}vh` }} aria-hidden="true" />
    </>
  );
}
