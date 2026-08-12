"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Quote } from "lucide-react";

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

interface VoicesGSAPProps {
  voices: FeaturedVoice[];
}

export function VoicesGSAP({ voices }: VoicesGSAPProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrollingFast, setIsScrollingFast] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Track scroll velocity for fast/slow detection
      let lastScrollY = 0;
      let velocity = 0;
      const FAST_THRESHOLD = 5;

      // Main scroll-driven animation
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          const progress = self.progress;
          const newIndex = Math.min(
            voices.length - 1,
            Math.floor(progress * voices.length)
          );

          // Smooth velocity tracking
          const currentScrollY = self.scroll();
          const delta = Math.abs(currentScrollY - lastScrollY);
          velocity = velocity * 0.85 + delta * 0.15;
          lastScrollY = currentScrollY;

          // Fast scroll detection
          const isFast = velocity > FAST_THRESHOLD;
          setIsScrollingFast(isFast);

          if (newIndex !== activeIndex) {
            setActiveIndex(newIndex);
          }
        },
      });

      // Parallax effect on portraits
      voices.forEach((_, index) => {
        const portrait = document.querySelector(
          `[data-portrait-index="${index}"]`
        );
        if (!portrait) return;

        gsap.to(portrait, {
          scale: index === activeIndex ? 1 : 1.05,
          y: index < activeIndex ? "-3%" : index > activeIndex ? "3%" : "0%",
          opacity: index === activeIndex ? 1 : 0,
          ease: "power2.out",
          duration: 0.8,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });
      });

      // Smooth text transitions
      if (copyRef.current) {
        gsap.to(copyRef.current, {
          opacity: isScrollingFast ? 0.7 : 1,
          scale: isScrollingFast ? 0.96 : 1,
          ease: "power2.out",
          duration: 0.4,
        });
      }

      // Visual card subtle rotation based on scroll
      if (visualRef.current) {
        gsap.to(visualRef.current, {
          rotateY: 0,
          rotateX: 0,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 2,
            onUpdate: (self) => {
              const progress = self.progress;
              const rotation = (progress - 0.5) * 2; // -1 to 1
              gsap.to(visualRef.current, {
                rotateY: rotation * 2,
                rotateX: rotation * -1,
                duration: 0.5,
                ease: "power1.out",
              });
            },
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [voices, activeIndex, isScrollingFast]);

  const activeVoice = voices[activeIndex];

  return (
    <section
      ref={sectionRef}
      className="efsw-voices"
      id="voices"
      aria-label="Featured voices"
    >
      <div className="efsw-voices__sticky">
        <div
          ref={visualRef}
          className={`efsw-voices__visual${
            isScrollingFast ? " is-folding" : ""
          }`}
          style={{ perspective: "1000px" }}
        >
          {voices.map((voice, index) => (
            <div
              key={voice.number}
              className="efsw-voices__portrait"
              data-portrait-index={index}
              data-state={
                index === activeIndex
                  ? "active"
                  : index < activeIndex
                  ? "past"
                  : "upcoming"
              }
              aria-hidden={index !== activeIndex}
            >
              <Image
                src={voice.portrait}
                alt={index === activeIndex ? voice.portraitAlt : ""}
                sizes="(max-width: 64rem) 90vw, 34rem"
                priority={index === 0}
                fill
              />
            </div>
          ))}
          <div className="efsw-voices__scrim" aria-hidden="true" />
          <Quote
            className="efsw-voices__quote-mark"
            size={34}
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <div className="efsw-voices__number" aria-hidden="true">
            {activeVoice.number}
          </div>
          <p aria-hidden="true">EFSW / FEATURED VOICE</p>
        </div>

        <div ref={copyRef} className="efsw-voices__copy" aria-live="polite">
          {isScrollingFast ? (
            <div className="efsw-voices__folded">
              <p className="efsw-kicker">{activeVoice.label}</p>
              <p className="efsw-voices__attribution">
                {activeVoice.attribution}
              </p>
            </div>
          ) : (
            <div>
              <p className="efsw-kicker">{activeVoice.label}</p>
              <h2>"{activeVoice.quote}"</h2>
              <p className="efsw-voices__attribution">
                {activeVoice.attribution}
              </p>
              <div className="efsw-voices__note">{activeVoice.note}</div>
            </div>
          )}

          <div
            className="efsw-voices__progress"
            aria-label={`Featured voice ${activeIndex + 1} of ${voices.length}`}
          >
            {voices.map((voice, index) => (
              <button
                key={voice.number}
                type="button"
                onClick={() => {
                  const section = sectionRef.current;
                  if (section) {
                    const stepHeight =
                      (section.offsetHeight - window.innerHeight) /
                      (voices.length - 1);
                    window.scrollTo({
                      top: section.offsetTop + stepHeight * index,
                      behavior: "smooth",
                    });
                  }
                }}
                className={index <= activeIndex ? "is-active" : ""}
                aria-label={`Go to voice ${voice.number}`}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="efsw-voices__steps" aria-hidden="true">
        {voices.map((voice) => (
          <div key={voice.number} />
        ))}
      </div>
    </section>
  );
}
