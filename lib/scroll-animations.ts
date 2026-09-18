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
  // Reveal animations - add .is-visible and animate
  gsap.utils.toArray<HTMLElement>(".efsw-reveal").forEach((element) => {
    // Check if element is already in viewport on load
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      element.classList.add("is-visible");
    }

    ScrollTrigger.create({
      trigger: element,
      start: "top 88%",
      onEnter: () => element.classList.add("is-visible"),
      onEnterBack: () => element.classList.add("is-visible"),
    });

    gsap.fromTo(
      element,
      { opacity: 0, y: 40 },
      {
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          end: "top 65%",
          toggleActions: "play none none reverse",
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        immediateRender: false,
      },
    );
  });

  // Stagger card animations - ensure parent is visible
  gsap.utils.toArray<HTMLElement>(".efsw-reveal-group").forEach((group) => {
    ScrollTrigger.create({
      trigger: group,
      start: "top 85%",
      onEnter: () => {
        const parent = group.closest(".efsw-reveal");
        if (parent) parent.classList.add("is-visible");
      },
      onEnterBack: () => {
        const parent = group.closest(".efsw-reveal");
        if (parent) parent.classList.add("is-visible");
      },
    });

    const cards = group.querySelectorAll(".efsw-home-news-card");
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30 },
        {
          scrollTrigger: {
            trigger: group,
            start: "top 80%",
            end: "top 50%",
            toggleActions: "play none none reverse",
          },
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.7,
          ease: "power2.out",
          immediateRender: false,
        },
      );
    }
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
    gsap.fromTo(
      label,
      { x: -50, opacity: 0 },
      {
        scrollTrigger: {
          trigger: label,
          start: "top 90%",
          end: "top 70%",
          toggleActions: "play none none reverse",
        },
        x: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        immediateRender: false,
      },
    );
  });

  // About section - split text effect
  const aboutTitle = document.querySelector<HTMLElement>(".efsw-about-bridge h2");
  if (aboutTitle) {
    gsap.fromTo(
      aboutTitle,
      { opacity: 0, y: 30 },
      {
        scrollTrigger: {
          trigger: aboutTitle,
          start: "top 85%",
          end: "top 60%",
          toggleActions: "play none none reverse",
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        immediateRender: false,
      },
    );
  }

  // News section heading
  const newsHeading = document.querySelector<HTMLElement>(".efsw-news__head h2");
  if (newsHeading) {
    gsap.fromTo(
      newsHeading,
      { opacity: 0, y: 40 },
      {
        scrollTrigger: {
          trigger: newsHeading,
          start: "top 85%",
          end: "top 60%",
          toggleActions: "play none none reverse",
        },
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        immediateRender: false,
      },
    );
  }

  // Footer fade in. Use an explicit from/to tween so GSAP does not apply the
  // hidden start state while the trigger is being created on the first load.
  const footer = document.querySelector<HTMLElement>(".efsw-footer");
  if (footer) {
    gsap.fromTo(
      footer,
      { opacity: 0, y: 50 },
      {
        scrollTrigger: {
          trigger: footer,
          start: "top 95%",
          end: "top 75%",
          toggleActions: "play none none reverse",
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        immediateRender: false,
      },
    );
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
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill(true));
  gsap.set(
    ".efsw-reveal, .efsw-reveal-group > *, .efsw-section-label, .efsw-about-bridge h2, .efsw-news__head h2, .efsw-home-news-card",
    { clearProps: "opacity,transform" },
  );
}
