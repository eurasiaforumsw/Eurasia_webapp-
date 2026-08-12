"use client";

import { useEffect, RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface GSAPScrollOptions {
  triggerElement: RefObject<HTMLElement>;
  onUpdate?: (progress: number) => void;
  onEnter?: () => void;
  onLeave?: () => void;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  markers?: boolean;
}

/**
 * Custom hook for GSAP ScrollTrigger animations
 * Provides smooth, performant scroll-based animations
 */
export function useGSAPScroll({
  triggerElement,
  onUpdate,
  onEnter,
  onLeave,
  start = "top center",
  end = "bottom center",
  scrub = 1,
  markers = false,
}: GSAPScrollOptions) {
  useEffect(() => {
    if (!triggerElement.current) return;

    const trigger = ScrollTrigger.create({
      trigger: triggerElement.current,
      start,
      end,
      scrub,
      markers,
      onUpdate: (self) => {
        if (onUpdate) {
          onUpdate(self.progress);
        }
      },
      onEnter: () => {
        if (onEnter) onEnter();
      },
      onLeave: () => {
        if (onLeave) onLeave();
      },
    });

    return () => {
      trigger.kill();
    };
  }, [triggerElement, onUpdate, onEnter, onLeave, start, end, scrub, markers]);
}

/**
 * Create smooth parallax effect on an element
 */
export function useGSAPParallax(
  elementRef: RefObject<HTMLElement>,
  yPercent: number = 20,
  options?: { start?: string; end?: string }
) {
  useEffect(() => {
    if (!elementRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(elementRef.current, {
        yPercent,
        ease: "none",
        scrollTrigger: {
          trigger: elementRef.current,
          start: options?.start || "top bottom",
          end: options?.end || "bottom top",
          scrub: 1.5,
        },
      });
    });

    return () => ctx.revert();
  }, [elementRef, yPercent, options]);
}

/**
 * Create staggered reveal animation for multiple elements
 */
export function useGSAPReveal(
  containerRef: RefObject<HTMLElement>,
  selector: string,
  options?: {
    stagger?: number;
    y?: number;
    duration?: number;
  }
) {
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const elements = containerRef.current?.querySelectorAll(selector);
      if (!elements || elements.length === 0) return;

      gsap.fromTo(
        elements,
        {
          opacity: 0,
          y: options?.y || 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: options?.duration || 0.8,
          stagger: options?.stagger || 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [containerRef, selector, options]);
}
