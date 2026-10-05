"use client";

import { ArrowUpRight, CalendarDays, MapPin, Sparkles, Ticket } from "lucide-react";
import PublicContentFeed, { type PublicContentItem } from "@/components/efsw/PublicContentFeed";
import { SiteNav } from "@/components/efsw/SiteNav";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";

/* Events hub: summit / conference / webinar / workshop gatherings.
   Reuses the news-feed layout engine (masthead + featured + stream) but reads
   kind="event" items and surfaces event-only fields (date range, venue,
   format, registration URL) meta-first — readers care about "when & where"
   before anything else. */
export default function EventsPage({ initialItems }: { initialItems: PublicContentItem[] }) {
  const { t } = useI18n();

  return (
    <>
      <SiteNav />
      <main className="efsw-events-page efsw-newsroom-page">

        {/* ── Masthead ── */}
        <header className="efsw-newsroom-masthead efsw-events-masthead" id="events-top">
          <div className="efsw-newsroom-masthead__meta">
            <CalendarDays size={12} aria-hidden />
            <span>{t("events.eyebrow")}</span>
          </div>

          <div className="efsw-newsroom-masthead__body">
            <h1>
              {t("events.headline")}<br /><span>{t("events.headlineAccent")}</span>
            </h1>
            <p>{t("events.intro")}</p>
          </div>

          {/* Decorative orbit motif — calendar geometry, slow rotation.
              Pure CSS, no scroll listener, respects prefers-reduced-motion via globals. */}
          <div className="efsw-events-masthead__orbit" aria-hidden="true">
            <span className="efsw-events-masthead__orbit-ring efsw-events-masthead__orbit-ring--outer" />
            <span className="efsw-events-masthead__orbit-ring efsw-events-masthead__orbit-ring--mid" />
            <span className="efsw-events-masthead__orbit-ring efsw-events-masthead__orbit-ring--inner" />
            <span className="efsw-events-masthead__orbit-marker efsw-events-masthead__orbit-marker--1"><Sparkles size={14} /></span>
            <span className="efsw-events-masthead__orbit-marker efsw-events-masthead__orbit-marker--2"><Ticket size={12} /></span>
            <span className="efsw-events-masthead__orbit-marker efsw-events-masthead__orbit-marker--3"><MapPin size={12} /></span>
          </div>
        </header>

        {/* ── Events feed (uses the news-card layout, kind="event") ── */}
        <PublicContentFeed
          kind="event"
          initialItems={initialItems}
          linkLabel={t("events.linkLabel")}
        />

        {/* ── CTA ── */}
        <section className="efsw-content-cta" id="events-cta">
          <h2>
            {t("events.ctaHeadline")}<br /><span>{t("events.ctaHeadlineAccent")}</span>
          </h2>
          <p className="efsw-content-cta__copy">{t("events.ctaBody")}</p>
          <Button
            variant="secondary"
            size="lg"
            magnetic
            className="mt-6"
            asChild
          >
            <a href="/member/register">
              {t("events.ctaButton")} <ArrowUpRight size={17} aria-hidden />
            </a>
          </Button>
        </section>

        <footer className="efsw-about-footer">
          <span>© 2026 EFSW</span>
          <a href="/">Eurasia Forum for Social Workers</a>
        </footer>
      </main>
    </>
  );
}
