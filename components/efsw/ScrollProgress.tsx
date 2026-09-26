"use client";

import { useEffect, useState } from "react";

type Section = { id: string; label: string };

/**
 * Vertical section-progress indicator (right side of viewport).
 * Pass the sections you want to track; it highlights the one in view.
 */
export function ScrollProgress({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });

    // Show the indicator only once the hero has left the viewport. A sentinel
    // element plus IntersectionObserver replaces the scroll listener so the
    // browser does the work off the main thread (no scroll handler, no rAF).
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText =
      "position:absolute;top:240px;left:0;width:1px;height:1px;pointer-events:none;";
    document.body.appendChild(sentinel);

    const revealObserver = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    revealObserver.observe(sentinel);

    return () => {
      io.disconnect();
      revealObserver.disconnect();
      sentinel.remove();
    };
  }, [sections]);

  return (
    <nav
      className="efsw-scroll-progress"
      aria-label="Page sections"
      data-visible={visible}
    >
      {sections.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className="efsw-scroll-progress__dot"
          data-active={active === id}
          aria-label={label}
          aria-current={active === id ? "location" : undefined}
          title={label}
        />
      ))}
    </nav>
  );
}
