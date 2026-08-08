"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      // A longer, calmer curve gives the homepage's pinned sections time to read.
      duration: 1.45,
      easing: (t) => 1 - Math.pow(1 - t, 4),
      orientation: "vertical",
      gestureOrientation: "vertical",
      // Lenis checks the media query on every scrollTo call, so this remains
      // correct when the OS motion preference changes without a page reload.
      smoothWheel: true,
      touchMultiplier: 1.25,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    // Lenis' built-in anchor listener does not cancel the browser's default
    // hash jump in every browser. Intercept only same-document hash links so
    // the URL still updates while the visual scroll remains eased.
    const handleAnchorClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = event.composedPath().find(
        (node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement,
      );
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      // Let buttons/links that own their own interaction keep control.
      if (anchor.dataset.lenisIgnore !== undefined) return;

      const targetUrl = new URL(anchor.href, window.location.href);
      if (
        targetUrl.origin !== window.location.origin
        || targetUrl.pathname !== window.location.pathname
        || targetUrl.search !== window.location.search
        || !targetUrl.hash
      ) return;

      let hash = targetUrl.hash;
      try {
        hash = decodeURIComponent(hash);
      } catch {
        // Keep the raw hash when it contains malformed escape sequences.
      }
      const target = hash.startsWith("#")
        ? document.getElementById(hash.slice(1))
        : null;
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target, {
        duration: 1.1,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      });
      window.history.pushState(null, "", targetUrl.hash);
    };

    window.addEventListener("click", handleAnchorClick);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.removeEventListener("click", handleAnchorClick);
      lenis.destroy();
      gsap.ticker.remove(updateLenis);
    };
  }, []);

  return <>{children}</>;
}
