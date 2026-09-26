"use client";

import { ArrowUpRight, Radio } from "lucide-react";
import PublicContentFeed, { type PublicContentItem } from "@/components/efsw/PublicContentFeed";
import { SiteNav } from "@/components/efsw/SiteNav";
import { useI18n } from "@/contexts/I18nContext";

/* Client body of /news: the route file stays a server component so it can own
   the page metadata, while the copy here reads from the active locale. */
export default function NewsroomPage({ initialItems }: { initialItems: PublicContentItem[] }) {
  const { t } = useI18n();

  return (
    <>
      <SiteNav />
      <main className="efsw-newsroom-page">

        {/* ── Masthead ── */}
        <header className="efsw-newsroom-masthead" id="news-top">
          <div className="efsw-newsroom-masthead__meta" data-reveal="fade">
            <Radio size={12} aria-hidden />
            <span>{t("newsroom.eyebrow")}</span>
            <span className="efsw-newsroom-sep" aria-hidden>·</span>
            <span>EFSW</span>
            <span className="efsw-newsroom-sep" aria-hidden>·</span>
            <span>2026</span>
            <span className="efsw-newsroom-sep" aria-hidden>·</span>
            <span>English · Korean · Thai</span>
          </div>

          <div className="efsw-newsroom-masthead__body" data-reveal-group>
            <h1 data-reveal="clip" data-reveal-slow>
              {t("newsroom.headline")}<br /><span>{t("newsroom.headlineAccent")}</span>
            </h1>
            <p data-reveal="slide">{t("newsroom.intro")}</p>
          </div>
        </header>

        {/* ── Articles & Interactive News Feed ── */}
        <PublicContentFeed
          kind="news"
          initialItems={initialItems}
          linkLabel={t("newsroom.linkLabel")}
        />

        {/* ── CTA ── */}
        <section className="efsw-content-cta" id="news-cta" data-reveal-group>
          <h2 data-reveal="clip" data-reveal-slow>
            {t("newsroom.ctaHeadline")}<br /><span>{t("newsroom.ctaHeadlineAccent")}</span>
          </h2>
          <p className="efsw-content-cta__copy" data-reveal="slide">{t("newsroom.ctaBody")}</p>
          <a
            href="mailto:support@eurasiaforumsw.org"
            className="efsw-button efsw-button--dark"
            data-reveal="slide"
          >
            {t("newsroom.ctaButton")} <ArrowUpRight size={17} aria-hidden />
          </a>
        </section>

        <footer className="efsw-about-footer">
          <span>© 2026 EFSW</span>
          <a href="/">Eurasia Forum for Social Workers</a>
          <span>English · Korean · Thai</span>
        </footer>
      </main>
    </>
  );
}
