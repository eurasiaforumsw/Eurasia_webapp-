"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  Download,
  Eye,
  Heart,
  Image as ImageIcon,
  MapPin,
  Tag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareBar from "@/components/efsw/ShareBar";
import TranslateControl from "@/components/efsw/TranslateControl";
import { SiteNav } from "@/components/efsw/SiteNav";
import CoverImage from "@/components/content/CoverImage";
import ImageGallery from "@/components/content/ImageGallery";
import { useTranslatedFields } from "@/hooks/useTranslatedFields";
import { useI18n } from "@/contexts/I18nContext";
import {
  ADMIN_CONTENT_KEY,
  getAdminContent,
  getPublishedContentBySlug,
  getRelatedContent,
  type AdminContentItem,
  type AdminContentKind,
} from "@/lib/admin-data";
import { getSessionMember, type MemberProfile } from "@/lib/member-auth";
import { EngagementRow, RecordView } from "@/components/efsw/EngagementRow";
import { articleBodyText } from "@/lib/article-body";
import { getLibraryDocuments } from "@/lib/academic-library";
import { getContentEngagement, hasUserLiked, incrementDownloadCount, incrementViewCount,
  toggleLike, type ContentEngagement } from "@/lib/content-engagement";

export type ArticleSeed = Pick<
  AdminContentItem,
  "id" | "category" | "title" | "summary" | "body"
> & Partial<Pick<AdminContentItem, "coverImage" | "coverImageCrop" | "imageCaption" | "author" | "tags" | "updatedAt" | "startsAt" | "endsAt" | "venue" | "format" | "registrationUrl" | "fileUrl" | "fileName" | "fileSize" | "fileType" | "pageCount">>;

type ArticleViewProps = {
  kind: AdminContentKind;
  slug: string;
  /** Initial copy supplied by the detail route. */
  seed: ArticleSeed;
  backHref: string;
  contentSource?: "local" | "public" | "local-library";
};

const formatDate = (value?: string) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
  } catch {
    return "";
  }
};

const formatDateRange = (startsAt?: string, endsAt?: string) => {
  if (!startsAt) return "";
  try {
    const start = new Date(startsAt);
    const end = endsAt ? new Date(endsAt) : null;
    const sameDay = end && start.toDateString() === end.toDateString();
    const startStr = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(start);
    if (!end) return startStr;
    if (sameDay) {
      const timeStart = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(start);
      const timeEnd = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(end);
      return `${startStr} · ${timeStart} – ${timeEnd}`;
    }
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const endStr = sameMonth
      ? new Intl.DateTimeFormat("en-US", { day: "numeric", year: "numeric" }).format(end)
      : new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(end);
    return `${startStr} – ${endStr}`;
  } catch {
    return "";
  }
};

/* ~200 wpm is the usual reading-time baseline for editorial prose. */
const readingMinutes = (body?: string, summary?: string) => {
  const words = `${summary ?? ""} ${articleBodyText(body)}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

/* Admin bodies are plain text: blank lines separate blocks and leading "-"
   marks list items, so consecutive dashed lines collapse into one <ul>. */
type Block =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

const parseBody = (body?: string): Block[] => {
  if (!body?.trim()) return [];
  return articleBodyText(body).split(/\n{2,}/).flatMap<Block>((chunk) => {
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

type GalleryImage = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export default function ArticleView({ kind, slug, seed, backHref, contentSource = "local" }: ArticleViewProps) {
  const { t } = useI18n();
  const [article, setArticle] = useState<ArticleSeed>(seed);
  const [related, setRelated] = useState<AdminContentItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const isAcademic = kind === "academic" || kind === "document";
  const [academicStats, setAcademicStats] = useState<ContentEngagement>(() => getContentEngagement(seed.id));
  const [engagementError, setEngagementError] = useState<string | null>(null);
  const [engagementLoaded, setEngagementLoaded] = useState(false);
  const [engagementRetry, setEngagementRetry] = useState(0);
  const [savingLike, setSavingLike] = useState(false);

  useEffect(() => {
    if (!isAcademic || contentSource === "local-library") return;
    let disposed = false;
    setEngagementLoaded(false);
    setEngagementError(null);
    setAcademicStats(getContentEngagement(article.id));
    const load = async () => {
      try {
        const engagement = await incrementViewCount(article.id);
        if (!disposed) {
          setAcademicStats(engagement);
          setEngagementLoaded(true);
          setEngagementError(null);
        }
      } catch (error) {
        if (!disposed) setEngagementError(error instanceof Error ? error.message : "Document statistics are unavailable");
      }
    };
    void load();
    return () => { disposed = true; };
  }, [article.id, isAcademic, contentSource, engagementRetry]);

  const likeDocument = async () => {
    if (savingLike || !engagementLoaded) return;
    setSavingLike(true);
    try {
      const { engagement } = await toggleLike(article.id);
      setAcademicStats(engagement);
      setEngagementError(null);
    } catch (error) {
      setEngagementError(error instanceof Error ? error.message : "Could not save this like");
    } finally { setSavingLike(false); }
  };
  const trackDownload = async () => {
    try {
      setAcademicStats(await incrementDownloadCount(article.id));
    } catch (error) {
      setEngagementError(error instanceof Error ? error.message : "Download statistics could not be saved");
    }
  };
  const academicEngagementRow = <div className="efsw-engagement">
    <button type="button" className="efsw-engagement__btn" disabled={savingLike || !engagementLoaded || contentSource === "local-library"}
      aria-label={hasUserLiked(article.id) ? "Unlike document" : "Like document"}
      aria-pressed={hasUserLiked(article.id)} onClick={() => void likeDocument()}>
      <Heart size={15} aria-hidden fill={hasUserLiked(article.id) ? "currentColor" : "none"} />
      <span className="efsw-engagement__count">{engagementLoaded ? academicStats.likeCount : "—"}</span>
    </button>
    <span className="efsw-engagement__btn efsw-engagement__view" aria-label={engagementLoaded ? `${academicStats.viewCount} views` : "Loading document views"}>
      <Eye size={15} aria-hidden /><span className="efsw-engagement__count">{engagementLoaded ? academicStats.viewCount : "—"}</span>
    </span>
  </div>;

  // Track the current member so engagement actions know who to credit.
  useEffect(() => {
    setMember(getSessionMember());
    const refresh = () => setMember(getSessionMember());
    window.addEventListener("storage", refresh);
    window.addEventListener("efsw:member-session-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("efsw:member-session-changed", refresh);
    };
  }, []);

  // Academic routes receive authoritative public content from the server.
  // Keep that copy and use the public API for related papers; local browser
  // drafts must never replace a published record on these routes.
  useEffect(() => {
    if (contentSource === "local-library") {
      setArticle(seed);
      setRelated(getLibraryDocuments(getAdminContent())
        .filter((item) => item.id !== slug)
        .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
        .slice(0, 3));
      return;
    }
    if (contentSource === "public") {
      const controller = new AbortController();
      setArticle(seed);
      const refresh = async () => {
        try {
          const response = await fetch("/api/content/public", { cache: "no-store", signal: controller.signal });
          if (!response.ok) throw new Error("Failed to load related documents");
          const { items } = await response.json() as { items: AdminContentItem[] };
          setRelated(items
            .filter((item) => (isAcademic ? item.kind === "academic" || item.kind === "document" : item.kind === kind) && item.id !== slug)
            .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
            .slice(0, 3));
        } catch (error) {
          if (!controller.signal.aborted) console.error("Failed to load related documents:", error);
        }
      };
      void refresh();
      return () => controller.abort();
    }

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
  }, [kind, slug, seed, contentSource]);

  // Load gallery images for this content
  useEffect(() => {
    if (contentSource === "local-library") return;
    const loadGallery = async () => {
      try {
        const res = await fetch(`/api/content/${article.id}/gallery`);
        if (res.ok) {
          const { images } = await res.json();
          if (images && images.length > 0) {
            setGalleryImages(
              images.map((img: any) => ({
                id: img.id,
                url: img.image_url,
                alt: img.caption || "",
              }))
            );
          } else {
            setGalleryImages([]);
          }
        }
      } catch (err) {
        console.error("Failed to load gallery:", err);
        setGalleryImages([]);
      }
    };

    if (article.id) {
      loadGallery();
    }
  }, [article.id, contentSource]);

  // Reading-progress rail across the top of the viewport.
  // Driven by a scroll-driven CSS animation when the browser supports it
  // (Chrome 115+), falling back to a rAF-throttled listener elsewhere.
  useEffect(() => {
    if (typeof CSS !== "undefined" && CSS.supports?.("animation-timeline", "scroll()")) {
      // Zero-JS path: the browser composites the rail off the main thread.
      document.documentElement.style.setProperty("--efsw-article-rail", "css");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);
    };
    const request = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const blocks = useMemo(() => parseBody(article.body), [article.body]);
  const minutes = useMemo(() => readingMinutes(article.body, article.summary), [article.body, article.summary]);
  const publishedLabel = formatDate(article.updatedAt);
  const downloadHref = (kind === "academic" || kind === "document") && article.fileUrl &&
    /^(https?:\/\/|\/(?!\/))/i.test(article.fileUrl) ? article.fileUrl : null;
  const sharePath = `${backHref}/${encodeURIComponent(slug)}`;

  // Reader-triggered machine translation of the article copy.
  const translatable = useMemo(() => ({
    title: article.title,
    summary: article.summary,
    body: articleBodyText(article.body),
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
      <div className={`efsw-article-page${contentSource !== "local" ? " academic-document-detail" : ""}`}>
        <div className="efsw-article-progress" aria-hidden>
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>
        <article className="efsw-article">
          <header className="efsw-article__head">
            <Link href={backHref} className="efsw-article__back">
              <ArrowLeft size={15} strokeWidth={2} aria-hidden />
              {t(kind === "news" ? "article.backToNews" : kind === "event" ? "article.backToEvents" : "article.backToDocuments")}
            </Link>

            <p className="efsw-article__eyebrow">{shown.category}</p>
            <h1>{shown.title}</h1>
            <p className="efsw-article__lede">{shown.summary}</p>

            <div className="efsw-article__meta">
              {publishedLabel && kind !== "event" && (
                <span>
                  <Calendar size={14} strokeWidth={1.9} aria-hidden />
                  <time dateTime={article.updatedAt}>{publishedLabel}</time>
                </span>
              )}
              {kind === "event" && article.startsAt && (
                <span>
                  <Calendar size={14} strokeWidth={1.9} aria-hidden />
                  <time dateTime={article.startsAt}>{formatDateRange(article.startsAt, article.endsAt)}</time>
                </span>
              )}
              {kind === "event" && article.venue && (
                <span>
                  <MapPin size={14} strokeWidth={1.9} aria-hidden />
                  {article.venue}
                </span>
              )}
              {kind === "event" && article.format && (
                <span className="efsw-event-format">{article.format}</span>
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

            {/* Engagement row — heart / like / view sits inside the article
               header so the read-time meta and the social proof share the
               same horizontal band. The view counter auto-increments via
               RecordView on first mount; members can toggle the heart and
               thumbs-up, anonymous visitors see the buttons disabled. */}
            {!isAcademic && <RecordView contentId={article.id} />}
            <div className="efsw-article__engagement">
              {isAcademic ? academicEngagementRow : <EngagementRow contentId={article.id} memberId={member?.id ?? null} />}
            </div>
            {engagementError && <div role="alert">
              <p>{engagementError}</p>
              {isAcademic && !engagementLoaded && contentSource !== "local-library" && (
                <button type="button" onClick={() => setEngagementRetry((value) => value + 1)}>Retry document statistics</button>
              )}
            </div>}

            {kind === "event" && article.registrationUrl && (
              <div className="efsw-article__register">
                <Button variant="default" size="lg" magnetic asChild>
                  <a href={article.registrationUrl}>
                    {t("events.rsvp")} <ArrowUpRight size={14} aria-hidden />
                  </a>
                </Button>
              </div>
            )}

            {downloadHref && (
              <div className="efsw-article__register">
                <Button variant="default" size="lg" asChild>
                  <a href={downloadHref} download={article.fileName || true} target="_blank" rel="noopener noreferrer" onClick={isAcademic && contentSource !== "local-library" ? () => void trackDownload() : undefined}>
                    <Download size={16} aria-hidden /> {t("documents.download")}
                  </a>
                </Button>
                {article.fileName && <p className="efsw-article__file-name">{article.fileName}</p>}
              </div>
            )}

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
              <CoverImage
                src={article.coverImage}
                alt={article.imageCaption || article.title}
                crop={article.coverImageCrop}
                className="efsw-article__hero-image"
                loading="eager"
              />
            ) : (
              <div className="efsw-article__hero-placeholder">
                <ImageIcon size={34} strokeWidth={1.4} aria-hidden />
              </div>
            )}
            {article.imageCaption && <figcaption>{article.imageCaption}</figcaption>}
          </figure>

          <div className="efsw-article__layout">
            {/* Desktop rail: stays with the reader while scrolling the body. */}
            <aside className="efsw-article__rail">
              <ShareBar title={shown.title} summary={shown.summary} heading={t("article.share")} variant="inline" path={sharePath} />
              <div className="efsw-article__rail-engagement">
                {isAcademic ? academicEngagementRow : <EngagementRow contentId={article.id} memberId={member?.id ?? null} />}
              </div>
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
                <ShareBar title={shown.title} summary={shown.summary} heading={t(kind === "news" ? "article.shareStory" : "article.shareDocument")} path={sharePath} />
              </div>

              {/* Image Gallery — show if there are gallery images */}
              {galleryImages.length > 0 && (
                <div className="efsw-article__gallery">
                  <h2 className="efsw-article__gallery-heading">
                    {t("article.gallery")} ({galleryImages.length})
                  </h2>
                  <ImageGallery images={galleryImages} />
                </div>
              )}

              {!downloadHref && <div className="efsw-article__cta">
                <div>
                  <h2>{t(kind === "news" ? "article.newsCtaHeadline" : "article.documentCtaHeadline")}</h2>
                  <p>{t(kind === "news" ? "article.newsCtaBody" : "article.documentCtaBody")}</p>
                </div>
                <a href="mailto:support@eurasiaforumsw.org" className="efsw-button efsw-button--dark">
                  {t("article.ctaButton")} <ArrowUpRight size={16} aria-hidden />
                </a>
              </div>}
            </div>
          </div>

          {related.length > 0 && (
            <section className="efsw-article__related" aria-label="More from EFSW">
              <div className="efsw-article__related-head">
                <Link href={backHref} className="efsw-text-link">
                  {t(kind === "news" ? "article.backToNews" : "article.backToDocuments")} <ArrowUpRight size={15} aria-hidden />
                </Link>
              </div>
              <div className="efsw-article__related-grid">
                {related.map((item) => (
                  <Link key={item.id} href={`${backHref}/${encodeURIComponent(item.id)}`} className="efsw-article__related-card">
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
      </div>
    </>
  );
}
