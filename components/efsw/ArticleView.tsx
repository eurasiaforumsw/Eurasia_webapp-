"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  Image as ImageIcon,
  Tag,
  User,
} from "lucide-react";
import ShareBar from "@/components/efsw/ShareBar";
import TranslateControl from "@/components/efsw/TranslateControl";
import { SiteNav } from "@/components/efsw/SiteNav";
import { useTranslatedFields } from "@/hooks/useTranslatedFields";
import { useI18n } from "@/contexts/I18nContext";
import {
  ADMIN_CONTENT_KEY,
  getPublishedContentBySlug,
  getRelatedContent,
  type AdminContentItem,
  type AdminContentKind,
} from "@/lib/admin-data";

export type ArticleSeed = Pick<
  AdminContentItem,
  "id" | "category" | "title" | "summary" | "body"
> & Partial<Pick<AdminContentItem, "coverImage" | "imageCaption" | "author" | "tags" | "updatedAt">>;

type ArticleViewProps = {
  kind: AdminContentKind;
  slug: string;
  /** Build-time copy rendered before localStorage hydration. */
  seed: ArticleSeed;
  backHref: string;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
  } catch {
    return "";
  }
};

/* ~200 wpm is the usual reading-time baseline for editorial prose. */
const readingMinutes = (body?: string, summary?: string) => {
  const words = `${summary ?? ""} ${body ?? ""}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

/* Admin bodies are plain text: blank lines separate blocks and leading "-"
   marks list items, so consecutive dashed lines collapse into one <ul>. */
type Block =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

const parseBody = (body?: string): Block[] => {
  if (!body?.trim()) return [];
  return body.split(/\n{2,}/).flatMap<Block>((chunk) => {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    const blocks: Block[] = [];
    let list: string[] = [];

    const flushList = () => {
      if (list.length) {
        blocks.push({ type: "list", items: list });
        list = [];
      }
    };

    lines.forEach((line) => {
      const bullet = line.match(/^[-•*]\s+(.*)$/);
      if (bullet) {
        list.push(bullet[1]);
        return;
      }
      flushList();
      blocks.push({ type: "paragraph", text: line });
    });

    flushList();
    return blocks;
  });
};

export default function ArticleView({ kind, slug, seed, backHref }: ArticleViewProps) {
  const { t } = useI18n();
  const [article, setArticle] = useState<ArticleSeed>(seed);
  const [related, setRelated] = useState<AdminContentItem[]>([]);
  const [progress, setProgress] = useState(0);

  // Published content lives in localStorage, so the admin's copy replaces the
  // build-time seed once mounted. Refreshes on cross-tab edits.
  useEffect(() => {
    const refresh = () => {
      const stored = getPublishedContentBySlug(kind, slug);
      if (stored) setArticle(stored);
      setRelated(getRelatedContent(kind, slug));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_CONTENT_KEY) refresh();
    };

    refresh();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [kind, slug]);

  // Reading-progress rail across the top of the viewport.
  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const blocks = useMemo(() => parseBody(article.body), [article.body]);
  const minutes = useMemo(() => readingMinutes(article.body, article.summary), [article.body, article.summary]);
  const publishedLabel = formatDate(article.updatedAt);

  // Reader-triggered machine translation of the article copy.
  const translatable = useMemo(() => ({
    title: article.title,
    summary: article.summary,
    body: article.body ?? "",
    category: article.category,
  }), [article.title, article.summary, article.body, article.category]);

  const translation = useTranslatedFields(`${kind}:${slug}`, translatable);
  const shown = translation.state === "done" && translation.translated
    ? { ...article, ...translation.translated }
    : article;
  const shownBlocks = useMemo(
    () => (shown.body === article.body ? blocks : parseBody(shown.body)),
    [shown.body, article.body, blocks],
  );

  return (
    <>
      <SiteNav />
      <div className="efsw-article-progress" aria-hidden>
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <main className="efsw-article-page">
        <article className="efsw-article">
          <header className="efsw-article__head">
            <Link href={backHref} className="efsw-article__back">
              <ArrowLeft size={15} strokeWidth={2} aria-hidden />
              {t(kind === "news" ? "article.backToNews" : "article.backToDocuments")}
            </Link>

            <p className="efsw-article__eyebrow">{shown.category}</p>
            <h1>{shown.title}</h1>
            <p className="efsw-article__lede">{shown.summary}</p>

            <div className="efsw-article__meta">
              {publishedLabel && (
                <span>
                  <Calendar size={14} strokeWidth={1.9} aria-hidden />
                  <time dateTime={article.updatedAt}>{publishedLabel}</time>
                </span>
              )}
              {article.author && (
                <span>
                  <User size={14} strokeWidth={1.9} aria-hidden />
                  {article.author}
                </span>
              )}
              <span>
                <Clock size={14} strokeWidth={1.9} aria-hidden />
                {t("article.minRead", { minutes })}
              </span>
            </div>

            <TranslateControl
              target={translation.target}
              state={translation.state}
              error={translation.error}
              onTranslate={translation.translate}
              onReset={translation.reset}
            />
          </header>

          <figure className="efsw-article__hero">
            {article.coverImage ? (
              <img src={article.coverImage} alt={article.imageCaption || article.title} />
            ) : (
              <div className="efsw-article__hero-placeholder">
                <ImageIcon size={34} strokeWidth={1.4} aria-hidden />
                <span>EFSW</span>
              </div>
            )}
            {article.imageCaption && <figcaption>{article.imageCaption}</figcaption>}
          </figure>

          <div className="efsw-article__layout">
            {/* Desktop rail: stays with the reader while scrolling the body. */}
            <aside className="efsw-article__rail">
              <ShareBar title={shown.title} summary={shown.summary} heading={t("article.share")} variant="inline" path={`${backHref}/${slug}`} />
            </aside>

            <div className="efsw-article__body" lang={translation.target ?? "en"}>
              {shownBlocks.length > 0 ? (
                shownBlocks.map((block, index) => (
                  block.type === "list" ? (
                    <ul key={index}>
                      {block.items.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  ) : (
                    <p key={index}>{block.text}</p>
                  )
                ))
              ) : (
                <p>{shown.summary}</p>
              )}

              {article.tags && article.tags.length > 0 && (
                <div className="efsw-article__tags">
                  <Tag size={14} strokeWidth={1.9} aria-hidden />
                  {article.tags.map((tag) => (
                    <Link key={tag} href={`${backHref}?category=${encodeURIComponent(article.category)}`}>
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Mobile/tablet placement — the rail is hidden below 68rem. */}
              <div className="efsw-article__share-inline">
                <ShareBar title={shown.title} summary={shown.summary} heading={t(kind === "news" ? "article.shareStory" : "article.shareDocument")} path={`${backHref}/${slug}`} />
              </div>

              <div className="efsw-article__cta">
                <div>
                  <p className="efsw-section-label">{t("article.ctaLabel")}</p>
                  <h2>{t(kind === "news" ? "article.newsCtaHeadline" : "article.documentCtaHeadline")}</h2>
                  <p>{t(kind === "news" ? "article.newsCtaBody" : "article.documentCtaBody")}</p>
                </div>
                <a href="mailto:support@eurasiaforumsw.org" className="efsw-button efsw-button--dark">
                  {t("article.ctaButton")} <ArrowUpRight size={16} aria-hidden />
                </a>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <section className="efsw-article__related" aria-label="More from EFSW">
              <div className="efsw-article__related-head">
                <p className="efsw-section-label">{t(kind === "news" ? "article.readNext" : "article.moreDocuments")}</p>
                <Link href={backHref} className="efsw-text-link">
                  {t(kind === "news" ? "article.backToNews" : "article.backToDocuments")} <ArrowUpRight size={15} aria-hidden />
                </Link>
              </div>
              <div className="efsw-article__related-grid">
                {related.map((item) => (
                  <Link key={item.id} href={`${backHref}/${item.id}`} className="efsw-article__related-card">
                    <span className="efsw-article__related-media">
                      {item.coverImage ? (
                        <img src={item.coverImage} alt={item.imageCaption || item.title} loading="lazy" />
                      ) : (
                        <ImageIcon size={20} strokeWidth={1.5} aria-hidden />
                      )}
                    </span>
                    <span className="efsw-article__related-copy">
                      <small>{item.category}</small>
                      <strong>{item.title}</strong>
                      <span className="efsw-article__related-link">
                        {t(kind === "news" ? "newsroom.readStory" : "article.viewDocument")} <ArrowUpRight size={14} aria-hidden />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
    </>
  );
}
