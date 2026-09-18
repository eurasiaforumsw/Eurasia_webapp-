"use client";

import { ArrowUpRight, BookOpen, FileText, FileBarChart2 } from "lucide-react";
import PublicContentFeed, { type PublicContentItem } from "@/components/efsw/PublicContentFeed";
import { SiteNav } from "@/components/efsw/SiteNav";
import { useI18n } from "@/contexts/I18nContext";

/* Category cards: labels/copy come from the `library.categories` namespace so
   the three cards translate with the rest of the page. */
const CATEGORY_CARDS = [
  { Icon: BookOpen, key: "research", mod: "research" },
  { Icon: FileText, key: "practice", mod: "practice" },
  { Icon: FileBarChart2, key: "briefings", mod: "briefings" },
] as const;

export default function LibraryPage({ initialItems }: { initialItems: PublicContentItem[] }) {
  const { t } = useI18n();

  return (
    <>
      <SiteNav />
      <main className="efsw-library-page">

        {/* ── Hero ── */}
        <header className="efsw-library-hero" id="resources-intro">
          <div className="efsw-library-hero__text">
            <p className="efsw-section-label" data-reveal="fade">
              <FileText size={14} aria-hidden /> {t("library.eyebrow")}
            </p>
            <h1 data-reveal="clip" data-reveal-slow>
              {t("library.headline")}<br /><span>{t("library.headlineAccent")}</span>
            </h1>
            <p data-reveal="slide">{t("library.intro")}</p>
          </div>

          {/* Category cards */}
          <div className="efsw-library-cats" data-reveal-group aria-label={t("library.categoriesLabel")}>
            {CATEGORY_CARDS.map(({ Icon, key, mod }) => {
              const label = t(`library.categories.${key}.label`);
              return (
                <a
                  key={key}
                  href={`/academic-documents?category=${encodeURIComponent(label)}#documents`}
                  className={`efsw-library-cat efsw-library-cat--${mod}`}
                  data-reveal="scale"
                  aria-label={t("library.browseAria", { label })}
                >
                  <div className="efsw-library-cat__icon">
                    <Icon size={20} aria-hidden />
                  </div>
                  <strong>{label}</strong>
                  <span>{t(`library.categories.${key}.sublabel`)}</span>
                  <em className="efsw-library-cat__purpose">{t(`library.categories.${key}.purpose`)}</em>
                  <p>{t(`library.categories.${key}.description`)}</p>
                  <span className="efsw-library-cat__action">
                    {t("library.openCollection")} <ArrowUpRight size={15} aria-hidden />
                  </span>
                </a>
              );
            })}
          </div>
        </header>

        {/* ── Document list ── */}
        <PublicContentFeed
          kind="document"
          initialItems={initialItems}
          linkLabel={t("library.linkLabel")}
        />

        {/* ── Contribute CTA ── */}
        <section className="efsw-content-cta" id="contribute" data-reveal-group>
          <p className="efsw-section-label" data-reveal="fade">{t("library.ctaLabel")}</p>
          <h2 data-reveal="clip" data-reveal-slow>
            {t("library.ctaHeadline")}<br /><span>{t("library.ctaHeadlineAccent")}</span>
          </h2>
          <p className="efsw-content-cta__copy" data-reveal="slide">{t("library.ctaBody")}</p>
          <a
            href="mailto:support@eurasiaforumsw.org"
            className="efsw-button efsw-button--dark"
            data-reveal="scale"
          >
            {t("library.ctaButton")} <ArrowUpRight size={17} aria-hidden />
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
