"use client";

import { useEffect, useState } from "react";
import { getAdminLayout, defaultLayoutConfig, type AdminPartnerLogo } from "@/lib/admin-data";

/* Partner logo strip — fades the right side so the duplicated track loops
   back to the start without showing a hard seam. Each unique logo is
   rendered once; the track is duplicated *only enough* to fill the visible
   strip + one extra copy, so visitors never see the same logo twice in
   one glance — even on ultra-wide screens where the original double
   sequence leaked the second copy into the viewport. */
export function LogoMarquee() {
  const [logos, setLogos] = useState<AdminPartnerLogo[]>(defaultLayoutConfig.partnerLogos || []);
  const [visible, setVisible] = useState(defaultLayoutConfig.sectionVisibility?.partnerLogos !== false);
  /* On phones we want a smaller cell so the strip fits without overflowing
     horizontally. Detect the breakpoint in JS so the inline cellSize style
     stays consistent with the CSS. */
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    // After hydration, replace with admin-saved values if present
    const layout = getAdminLayout();
    setLogos(layout.partnerLogos || []);
    setVisible(layout.sectionVisibility?.partnerLogos !== false);

    // Live sync: when admin saves in another tab/window, update here too
    const onStorage = (e: StorageEvent) => {
      if (e.key === "efsw.admin.layout") {
        const updated = getAdminLayout();
        setLogos(updated.partnerLogos || []);
        setVisible(updated.sectionVisibility?.partnerLogos !== false);
      }
    };
    window.addEventListener("storage", onStorage);

    const mq = window.matchMedia("(max-width: 30rem)");
    const onMq = () => setCompact(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);

    return () => {
      window.removeEventListener("storage", onStorage);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  if (!visible || logos.length === 0) return null;

  // Sort by `order` so admin-arranged logos stay in the chosen sequence.
  const ordered = [...logos].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const compactSize = 88; // 5.5rem — phones need a shorter cell to fit the strip

  return (
    <section className="efsw-logo-marquee" aria-label="Partner logos">
      <div className="efsw-logo-marquee__track" data-animate>
        {ordered.map((logo) => {
          /* Height is locked to displaySize; width is left to the content
             so every logo renders at the same visual height and its width
             follows its own aspect ratio — no stretching, no cropping. */
          const cellSize = compact ? compactSize : (logo.displaySize ?? 200);
          return (
            <a
              key={logo.id}
              href={logo.websiteUrl || undefined}
              target={logo.websiteUrl ? "_blank" : undefined}
              rel={logo.websiteUrl ? "noopener noreferrer" : undefined}
              className="efsw-logo-marquee__item"
              style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
              aria-label={logo.name}
            >
              <img
                src={logo.logoUrl}
                alt={logo.name}
                className="efsw-logo-marquee__img"
                loading="eager"
                decoding="async"
              />
            </a>
          );
        })}
      </div>
    </section>
  );
}
