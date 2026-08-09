"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Global scroll-reveal observer — mounts once in the layout, watches every
 * element that carries a `data-reveal` attribute, and adds `.is-visible`
 * when the element enters the viewport.
 *
 * Supported values for data-reveal:
 *   fade   opacity only
 *   slide  slide up + fade (default)
 *   scale  scale from 0.94 + fade
 *   clip   clip-path left-to-right wipe (headings)
 *
 * Add data-reveal-delay="N" (ms) for per-element delay offsets.
 * Add data-reveal-group to a parent and each child staggers automatically.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
        el.classList.add("is-visible");
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const delay = el.dataset.revealDelay ? Number(el.dataset.revealDelay) : 0;
          setTimeout(() => el.classList.add("is-visible"), delay);
          io.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    );

    const stagger = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const group = entry.target as HTMLElement;
          const children = Array.from(group.querySelectorAll<HTMLElement>(":scope > [data-reveal]"));
          children.forEach((child, i) => {
            const base = Number(child.dataset.revealDelay ?? 0);
            setTimeout(() => child.classList.add("is-visible"), base + i * 80);
          });
          stagger.unobserve(group);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6%" },
    );

    // Standalone reveals (not inside a data-reveal-group)
    document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal-group] [data-reveal])").forEach((el) => {
      io.observe(el);
    });

    // Group reveals (children stagger off the group trigger)
    document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
      stagger.observe(group);
    });

    return () => {
      io.disconnect();
      stagger.disconnect();
    };
  }, [pathname]);

  return null;
}
