"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DeanProfile = {
  name: string;
  title: string;
  quote: string;
  specializations: string[];
  portrait: string;
  portraitAlt: string;
  textPosition: "left" | "right" | "both"; // Admin setting: where to show text
};

interface DeanMessageProps {
  profiles: DeanProfile[];
  autoPlayInterval?: number; // milliseconds
}

export function DeanMessage({ profiles, autoPlayInterval = 5000 }: DeanMessageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const totalSlides = profiles.length;

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
    setTimeout(() => setIsAnimating(false), 800);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    setTimeout(() => setIsAnimating(false), 800);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 800);
  };

  // Auto-play
  useEffect(() => {
    if (isPaused || isAnimating) return;

    timeoutRef.current = setTimeout(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentSlide, isPaused, isAnimating, autoPlayInterval]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);
  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  const currentProfile = profiles[currentSlide];

  return (
    <section
      className="dean-message"
      aria-label="Dean's Message"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="dean-message__container">
        {/* Layout: Portrait ALWAYS in center, text adapts to textPosition */}
        <div
          className="dean-message__content"
          data-text-position={currentProfile.textPosition}
          key={`profile-${currentSlide}`}
        >
          {/* Left column - Name/Title/Specializations (for "right" or "both") */}
          {(currentProfile.textPosition === "right" || currentProfile.textPosition === "both") && (
            <div className="dean-message__text dean-message__text--left dean-message__animate-in">
              <div className="dean-message__header">
                <h2 className="dean-message__name dean-message__fade-up">{currentProfile.name}</h2>
                <p className="dean-message__title dean-message__fade-up dean-message__fade-up--delay-1">{currentProfile.title}</p>
              </div>

              <div className="dean-message__specializations dean-message__fade-up dean-message__fade-up--delay-2">
                <span className="dean-message__spec-label">(Specialization)</span>
                <div className="dean-message__tags">
                  {currentProfile.specializations.map((spec, idx) => (
                    <span
                      key={spec}
                      className="dean-message__tag"
                      style={{ animationDelay: `${0.6 + idx * 0.1}s` }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Left column - Quote only (for "left" textPosition) */}
          {currentProfile.textPosition === "left" && (
            <div className="dean-message__text dean-message__text--left dean-message__animate-in">
              <blockquote className="dean-message__quote dean-message__fade-up dean-message__fade-up--delay-2">
                <p>{currentProfile.quote}</p>
              </blockquote>
            </div>
          )}

          {/* Center column - Portrait ALWAYS here */}
          <div className="dean-message__portrait dean-message__portrait-animate">
            <div className="dean-message__portrait-frame">
              <Image
                src={currentProfile.portrait}
                alt={currentProfile.portraitAlt}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                priority
                className="dean-message__img"
              />
            </div>
          </div>

          {/* Right column - Quote (for "both") or Name/Title/Spec (for "left") */}
          {currentProfile.textPosition === "both" && (
            <div className="dean-message__text dean-message__text--right dean-message__animate-in">
              <blockquote className="dean-message__quote dean-message__fade-up dean-message__fade-up--delay-2">
                <p>{currentProfile.quote}</p>
              </blockquote>
            </div>
          )}

          {currentProfile.textPosition === "left" && (
            <div className="dean-message__text dean-message__text--right dean-message__animate-in">
              <div className="dean-message__header">
                <h2 className="dean-message__name dean-message__fade-up">{currentProfile.name}</h2>
                <p className="dean-message__title dean-message__fade-up dean-message__fade-up--delay-1">{currentProfile.title}</p>
              </div>

              <div className="dean-message__specializations dean-message__fade-up dean-message__fade-up--delay-2">
                <span className="dean-message__spec-label">(Specialization)</span>
                <div className="dean-message__tags">
                  {currentProfile.specializations.map((spec, idx) => (
                    <span
                      key={spec}
                      className="dean-message__tag"
                      style={{ animationDelay: `${0.6 + idx * 0.1}s` }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty div for "right" textPosition */}
          {currentProfile.textPosition === "right" && (
            <div className="dean-message__text dean-message__text--right"></div>
          )}
        </div>

        {/* Navigation */}
        <div className="dean-message__nav">
          <div className="dean-message__counter">
            {currentSlide + 1}/{totalSlides}
          </div>

          {/* Dots indicator */}
          <div className="dean-message__dots">
            {profiles.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`dean-message__dot ${index === currentSlide ? 'dean-message__dot--active' : ''}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="dean-message__arrows">
            <button
              onClick={prevSlide}
              className="dean-message__arrow"
              aria-label="Previous slide"
              disabled={isAnimating}
            >
              <ChevronLeft />
            </button>
            <button
              onClick={nextSlide}
              className="dean-message__arrow"
              aria-label="Next slide"
              disabled={isAnimating}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
