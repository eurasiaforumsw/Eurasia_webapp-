"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Initialize GSAP ScrollTrigger animations
 * Call this after DOM is ready
 */
export function initScrollAnimations() {
  // Reveal animations - fade up from bottom
  gsap.utils.toArray<HTMLElement>(".efsw-reveal").forEach((element) => {
    gsap.from(element, {
      scrollTrigger: {
        trigger: element,
        start: "top 85%",
        end: "top 65%",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: "power3.out",
    });
  });

  // Stagger card animations
  gsap.utils.toArray<HTMLElement>(".efsw-reveal-group").forEach((group) => {
    const cards = group.querySelectorAll(".efsw-home-news-card");

    gsap.from(cards, {
      scrollTrigger: {
        trigger: group,
        start: "top 80%",
        end: "top 50%",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      y: 30,
      stagger: 0.15,
      duration: 0.7,
      ease: "power2.out",
    });
  });

  // Parallax effects for hero elements
  const heroWash = document.querySelector<HTMLElement>(".efsw-hero__wash");
  const heroOrbit = document.querySelector<HTMLElement>(".efsw-hero__orbit");

  if (heroWash) {
    gsap.to(heroWash, {
      scrollTrigger: {
        trigger: ".efsw-hero",
        start: "top top",
        end: "bottom top",
        scrub: 1.5,
      },
      y: -250,
      ease: "none",
    });
  }

  if (heroOrbit) {
    gsap.to(heroOrbit, {
      scrollTrigger: {
        trigger: ".efsw-hero",
        start: "top top",
        end: "bottom top",
        scrub: 1.2,
      },
      y: 120,
      rotation: 15,
      ease: "none",
    });
  }

  // Section labels slide in from left
  gsap.utils.toArray<HTMLElement>(".efsw-section-label").forEach((label) => {
    gsap.from(label, {
      scrollTrigger: {
        trigger: label,
        start: "top 90%",
        end: "top 70%",
        toggleActions: "play none none reverse",
      },
      x: -50,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
    });
  });

  // About section - split text effect
  const aboutTitle = document.querySelector<HTMLElement>(".efsw-about-bridge h2");
  if (aboutTitle) {
    gsap.from(aboutTitle, {
      scrollTrigger: {
        trigger: aboutTitle,
        start: "top 85%",
        end: "top 60%",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      y: 30,
      duration: 1,
      ease: "power3.out",
    });
  }

  // News section heading
  const newsHeading = document.querySelector<HTMLElement>(".efsw-news__head h2");
  if (newsHeading) {
    const lines = newsHeading.querySelectorAll("br");
    gsap.from(newsHeading, {
      scrollTrigger: {
        trigger: newsHeading,
        start: "top 85%",
        end: "top 60%",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      y: 40,
      duration: 0.9,
      ease: "power3.out",
    });
  }

  // Footer fade in
  const footer = document.querySelector<HTMLElement>(".efsw-footer");
  if (footer) {
    gsap.from(footer, {
      scrollTrigger: {
        trigger: footer,
        start: "top 95%",
        end: "top 75%",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "power2.out",
    });
  }

  // Refresh ScrollTrigger after all animations are set
  ScrollTrigger.refresh();
}

/**
 * Advanced parallax effect for multiple layers
 */
export function createParallaxLayers(selector: string, speed: number = 0.5) {
  const elements = document.querySelectorAll<HTMLElement>(selector);

  elements.forEach((element) => {
    gsap.to(element, {
      scrollTrigger: {
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
      y: (i, target) => -ScrollTrigger.maxScroll(window) * speed,
      ease: "none",
    });
  });
}

/**
 * Pin section while scrolling
 */
export function pinSection(selector: string, duration: number = 1) {
  const element = document.querySelector(selector);

  if (element) {
    ScrollTrigger.create({
      trigger: element,
      pin: true,
      start: "top top",
      end: `+=${duration * 100}%`,
      pinSpacing: true,
    });
  }
}

/**
 * Horizontal scroll section
 */
export function horizontalScroll(containerSelector: string, itemsSelector: string) {
  const container = document.querySelector<HTMLElement>(containerSelector);
  const items = document.querySelectorAll<HTMLElement>(itemsSelector);

  if (container && items.length > 0) {
    const scrollWidth = items.length * (items[0].offsetWidth + 32); // 32px gap

    gsap.to(items, {
      x: () => -(scrollWidth - window.innerWidth),
      ease: "none",
      scrollTrigger: {
        trigger: container,
        pin: true,
        scrub: 1,
        end: () => `+=${scrollWidth}`,
        invalidateOnRefresh: true,
      },
    });
  }
}

/**
 * Kill all ScrollTrigger instances (cleanup)
 */
export function cleanupScrollAnimations() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}
