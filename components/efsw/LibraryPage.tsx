"use client";

import { ArrowUpRight, BookOpen, FileText, FileBarChart2, Layers } from "lucide-react";
import PublicContentFeed, { type PublicContentItem } from "@/components/efsw/PublicContentFeed";
import { SiteNav } from "@/components/efsw/SiteNav";
import { useI18n } from "@/contexts/I18nContext";
import {
  type AdminLayoutConfig,
  defaultLayoutConfig,
  getAdminLayout,
} from "@/lib/admin-data";

/* Map stored icon names → lucide components for category icons. We use
   the same icon library as the seeded values; admins only need to change
   `key`/`accent`/`mod` in real layouts. */
const ICON_BY_MOD = {
  research: BookOpen,
  practice: FileText,
  briefings: FileBarChart2,
} as const;

export default function LibraryPage({ initialItems }: { initialItems: PublicContentItem[] }) {
  const { t } = useI18n();
  const layout: AdminLayoutConfig = (() => {
    try { return getAdminLayout(); } catch { return defaultLayoutConfig; }
  })();
  const categories = layout.libraryCategories;

  return (
    <>
      <SiteNav />
      <main className="efsw-library-page efsw-library-v2">

        {/* ── Masthead ────────────────────────────────────────── */}
        <header className="efsw-library-v2__masthead" id="resources-intro">
          <div className="efsw-library-v2__masthead-inner">
            <div className="efsw-library-v2__masthead-text">
              <p className="efsw-library-v2__eyebrow">{t("library.eyebrow")}</p>
              <h1>
                {t("library.headline")}<br />
                <span>{t("library.headlineAccent")}</span>
              </h1>
              <p className="efsw-library-v2__intro">{t("library.intro")}</p>
            </div>
            <div className="efsw-library-v2__masthead-stats" aria-hidden="true">
              <div className="efsw-library-v2__stat">
                <Layers size={20} aria-hidden />
                <strong>{initialItems.length}+</strong>
                <span>{t("library.documentsLabel")}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Category cards ──────────────────────────────────── */}
        <section className="efsw-library-v2__categories" aria-label={t("library.categoriesLabel")}>
          <div className="efsw-library-v2__categories-grid">
            {categories.map(({ id, key, mod, accent }) => {
              const Icon = (ICON_BY_MOD as Record<string, typeof BookOpen>)[mod] ?? BookOpen;
              const label = t(`library.categories.${key}.label`);
              return (
                <a
                  key={id}
                  href={`/academic-documents?category=${encodeURIComponent(label)}#documents`}
                  className={`efsw-library-v2__cat efsw-library-v2__cat--${mod}`}
                  style={{ "--cat-accent": accent } as React.CSSProperties}
                  aria-label={t("library.browseAria", { label })}
                >
                  <div className="efsw-library-v2__cat-top">
                    <span className="efsw-library-v2__cat-icon" aria-hidden="true">
                      <Icon size={22} />
                    </span>
                    <span className="efsw-library-v2__cat-tag">{t(`library.categories.${key}.sublabel`)}</span>
                  </div>
                  <h2>{label}</h2>
                  <p>{t(`library.categories.${key}.description`)}</p>
                  <span className="efsw-library-v2__cat-cta">
                    {t("library.openCollection")} <ArrowUpRight size={14} aria-hidden />
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        {/* ── Search + filter bar ─────────────────────────────── */}
        <div className="efsw-library-v2__toolbar" id="documents">
          <PublicContentFeed
            kind="document"
            initialItems={initialItems}
            linkLabel={t("library.linkLabel")}
          />
        </div>

        {/* ── Contribute CTA ──────────────────────────────────── */}
        <section className="efsw-library-v2__cta" id="contribute">
          <div className="efsw-library-v2__cta-inner">
            <h2>
              {t("library.ctaHeadline")}<br />
              <span>{t("library.ctaHeadlineAccent")}</span>
            </h2>
            <p>{t("library.ctaBody")}</p>
            <a href="mailto:support@eurasiaforumsw.org" className="efsw-library-v2__cta-btn">
              {t("library.ctaButton")} <ArrowUpRight size={17} aria-hidden />
            </a>
          </div>
        </section>

        <footer className="efsw-about-footer">
          <span>© 2026 EFSW</span>
          <a href="/">Eurasia Forum for Social Workers</a>
        </footer>
      </main>
    </>
  );
}
