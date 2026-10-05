/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */
"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, Calendar, User, X, Image as ImageIcon, Search, FileText, ChevronLeft, ChevronRight, Microscope, BookOpenText, ScrollText, GraduationCap, Landmark, Megaphone, UsersRound, MapPin, type LucideIcon } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SkeletonCard } from "@/components/ui/skeleton";
import {
  ADMIN_CONTENT_KEY,
  ADMIN_CONTENT_CATEGORIES_KEY,
  defaultContentCategories,
  getPublishedAdminContent,
  getAdminContentCategories,
  initialContent,
  type AdminContentItem,
  type AdminContentKind,
} from "@/lib/admin-data";
import { getSessionMember, type MemberProfile } from "@/lib/member-auth";
import { EngagementRow } from "@/components/efsw/EngagementRow";

export type PublicContentItem = {
  id: string;
  category: string;
  title: string;
  summary: string;
  body?: string;
  coverImage?: string;
  imageCaption?: string;
  author?: string;
  tags?: string[];
  updatedAt?: string;
  /* event-only extras */
  startsAt?: string;
  endsAt?: string;
  venue?: string;
  format?: string;
  registrationUrl?: string;
};

type PublicContentFeedProps = {
  kind: AdminContentKind;
  initialItems: PublicContentItem[];
  linkLabel: string;
  showFilters?: boolean;
};

const itemNumber = (index: number) => String(index + 1).padStart(2, "0");

/* Category glyphs replace the numeric index in the resource list — an icon reads
   faster than "01" and carries the mode of the entry. Matched on keyword so
   admin-authored categories still resolve to something sensible. */
const categoryIcons: Array<[RegExp, LucideIcon]> = [
  [/research|academic|study|stud/i, Microscope],
  [/practice|manual|guide|field/i, BookOpenText],
  [/brief|policy|report/i, ScrollText],
  [/train|curricul|educat|course/i, GraduationCap],
  [/govern|institut|regional/i, Landmark],
  [/announce|news|update|platform/i, Megaphone],
  [/member|network|communit/i, UsersRound],
];

const categoryIcon = (category?: string): LucideIcon => {
  if (!category) return FileText;
  return categoryIcons.find(([pattern]) => pattern.test(category))?.[1] ?? FileText;
};

const formatDate = (value?: string) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
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
    const startStr = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(start);
    if (!end) return startStr;
    if (sameDay) {
      const timeStr = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(end);
      return `${startStr} · ${timeStr}`;
    }
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    const endStr = sameMonth
      ? new Intl.DateTimeFormat("en-US", { day: "numeric", year: "numeric" }).format(end)
      : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(end);
    return `${startStr} – ${endStr}`;
  } catch {
    return "";
  }
};

export default function PublicContentFeed({
  kind,
  initialItems,
  linkLabel,
  showFilters = true,
}: PublicContentFeedProps) {
  const { t } = useI18n();
  const ns = kind === "news" ? "newsroom" : kind === "event" ? "events" : "library";
  const [items, setItems] = useState<PublicContentItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // True only after the first user interaction — prevents the entrance animation
  // from running on initial page load (items should be visible immediately).
  const [hasInteracted, setHasInteracted] = useState(false);
  // Drives the direction-aware enter animation when the featured story swaps.
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [categoryDefinitions, setCategoryDefinitions] = useState(() => defaultContentCategories.filter((category) => category.kind === kind));
  const [member, setMember] = useState<MemberProfile | null>(null);

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

  const showFeatured = (resolveIndex: (current: number) => number, direction: 1 | -1) => {
    setSlideDirection(direction);
    setFeaturedIndex(resolveIndex);
  };

  useEffect(() => {
    const refresh = () => {
      setCategoryDefinitions(getAdminContentCategories(kind));
      const published = getPublishedAdminContent(kind).map((item) => {
        const englishFallback = initialContent.find((entry) => entry.id === item.id && entry.kind === kind);
        const useEnglishFallback = kind === "document" && englishFallback && item.locale !== "en";
        const source = useEnglishFallback
          ? {
              ...item,
              category: englishFallback.category,
              title: englishFallback.title,
              summary: englishFallback.summary,
              body: englishFallback.body,
              coverImage: item.coverImage || englishFallback.coverImage,
              imageCaption: item.imageCaption || englishFallback.imageCaption,
              author: item.author || englishFallback.author,
              tags: item.tags?.length ? item.tags : englishFallback.tags,
            }
          : item;

        return {
          id: source.id,
          category: source.category,
          title: source.title,
          summary: source.summary,
          body: source.body,
          coverImage: source.coverImage,
          imageCaption: source.imageCaption,
          author: source.author,
          tags: source.tags,
          updatedAt: source.updatedAt,
          startsAt: source.startsAt,
          endsAt: source.endsAt,
          venue: source.venue,
          format: source.format,
          registrationUrl: source.registrationUrl,
        };
      });
      if (published.length > 0) {
        setItems(published);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_CONTENT_KEY || event.key === ADMIN_CONTENT_CATEGORIES_KEY) refresh();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [kind]);

  // Configured filter modes come first; retain any legacy content categories as a fallback.
  const categories = useMemo(() => {
    const configuredLabels = categoryDefinitions.map((category) => category.label);
    const labels: string[] = categoryDefinitions
      .filter((category) => category.enabled)
      .sort((a, b) => a.order - b.order)
      .map((category) => category.label);
    const normalized = new Set(configuredLabels.map((label) => label.toLowerCase()));
    const knownLabels = new Set(
      defaultContentCategories.filter((category) => category.kind === kind).map((category) => category.label.toLowerCase()),
    );
    items.forEach((item) => {
      if (item.category && !normalized.has(item.category.toLowerCase()) && !knownLabels.has(item.category.toLowerCase())) {
        labels.push(item.category);
        normalized.add(item.category.toLowerCase());
      }
    });
    return ["All", ...labels];
  }, [categoryDefinitions, items]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("category");
    if (!requested) return;
    const matchingCategory = categories.find((category) => category.toLowerCase() === requested.toLowerCase());
    if (matchingCategory) setSelectedCategory(matchingCategory);
  }, [categories]);

  // Filter items by category and search
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch = !query ||
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        (item.author && item.author.toLowerCase().includes(query)) ||
        (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(query)));
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  useEffect(() => {
    setSlideDirection(1);
    setFeaturedIndex(0);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    if ((kind !== "news" && kind !== "event") || filteredItems.length < 2) return;
    const rotation = window.setInterval(() => {
      showFeatured((index) => (index + 1) % filteredItems.length, 1);
    }, 5000);
    return () => window.clearInterval(rotation);
  }, [kind, filteredItems.length]);

  const emptyItem = kind === "news"
    ? { category: t("newsroom.eyebrow"), title: t("newsroom.emptyTitle"), summary: t("newsroom.emptyBody") }
    : kind === "event"
      ? { category: t("events.eyebrow"), title: t("events.emptyTitle"), summary: t("events.emptyBody") }
      : { category: t("library.eyebrow"), title: t("library.emptyTitle"), summary: t("library.emptyBody") };
  const detailBase = kind === "news" ? "/news" : kind === "event" ? "/events" : "/academic-documents";
  const featuredItem = filteredItems[featuredIndex % Math.max(filteredItems.length, 1)];
  const streamItems = featuredItem ? filteredItems.filter((item) => item.id !== featuredItem.id) : [];

  return (
    <div id={kind === "document" ? "documents" : "content-feed"} className="efsw-content-feed">
      {/* Search & Category Filter Strip */}
      {showFilters && (
        <div className="efsw-feed-filters-bar" aria-label="Browse and filter the library">
          <div className="efsw-feed-categories" role="tablist" aria-label={t("common.filter")}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                className={`efsw-category-pill ${selectedCategory === cat ? "is-active" : ""}`}
                onClick={() => {
                  setIsLoading(true);
                  setHasInteracted(true);
                  setSelectedCategory(cat);
                  setTimeout(() => setIsLoading(false), 300);
                }}
              >
                {cat === "All" ? t("newsroom.all") : cat}
              </button>
            ))}
          </div>

          <div className="efsw-feed-search">
            <Input
              type="search"
              placeholder={t(`${ns}.searchPlaceholder`)}
              value={searchQuery}
              onChange={(e) => {
                setIsLoading(true);
                setHasInteracted(true);
                setSearchQuery(e.target.value);
                setTimeout(() => setIsLoading(false), 300);
              }}
              className="efsw-feed-search__input"
              floatingLabel={false}
            />
            <Search size={15} className="efsw-feed-search__icon" aria-hidden />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsLoading(false);
                }}
                className="efsw-feed-search__clear"
                aria-label={t("common.clear")}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* News Feed View — also used for events (kind === "event") */}
      {kind === "news" || kind === "event" ? (
        <section className={`efsw-news-grid ${streamItems.length === 0 ? "is-single" : ""}`} aria-live="polite">
          {filteredItems.length ? (
            <>
              {featuredItem && (
                <article
                  key={featuredItem.id}
                  className="efsw-news-feature"
                  data-slide-dir={slideDirection === 1 ? "next" : "prev"}
                >
                  <div className="efsw-news-feature__media">
                    {featuredItem.coverImage ? (
                      <img src={featuredItem.coverImage} alt={featuredItem.imageCaption || featuredItem.title} loading="eager" />
                    ) : (
                      <div className="efsw-news-card__placeholder"><ImageIcon size={30} /><span>{kind === "event" ? "EFSW Event" : "EFSW News"}</span></div>
                    )}
                    <span className="efsw-news-card__category">{featuredItem.category}</span>
                  </div>
                  <div className="efsw-news-feature__body">
                    <div className="efsw-news-card__meta">
                      {kind !== "event" && featuredItem.updatedAt && <span><Calendar size={13} aria-hidden />{formatDate(featuredItem.updatedAt)}</span>}
                      {kind === "event" && featuredItem.startsAt && <span><Calendar size={13} aria-hidden />{formatDateRange(featuredItem.startsAt, featuredItem.endsAt)}</span>}
                      {kind === "event" && featuredItem.venue && <span><MapPin size={13} aria-hidden />{featuredItem.venue}</span>}
                      {kind === "event" && featuredItem.format && <span className="efsw-event-format">{featuredItem.format}</span>}
                      {featuredItem.author && <span><User size={13} aria-hidden />{featuredItem.author}</span>}
                    </div>
                    <p className="efsw-news-feature__eyebrow">{t("newsroom.featured")}</p>
                    <h2>
                      {/* Stretched link: covers the card so the whole surface is
                          clickable, while the carousel controls sit above it. */}
                      <Link href={`${detailBase}/${featuredItem.id}`} className="efsw-news-feature__link">
                        {featuredItem.title}
                      </Link>
                    </h2>
                    <p className="efsw-news-feature__summary">{featuredItem.summary}</p>
                    <span className="efsw-text-link">{linkLabel} <ArrowUpRight size={16} /></span>
                    {filteredItems.length > 1 && (
                      <div className="efsw-news-feature__controls">
                        <button
                          type="button"
                          className="efsw-news-feature__arrow"
                          onClick={() => showFeatured((index) => (index - 1 + filteredItems.length) % filteredItems.length, -1)}
                          aria-label={t("common.back")}
                          title={t("common.back")}
                        >
                          <ChevronLeft size={17} aria-hidden />
                        </button>
                        <div className="efsw-news-feature__dots" role="tablist" aria-label={t("newsroom.featured")}>
                          {filteredItems.map((story, index) => (
                            <button
                              key={story.id}
                              type="button"
                              role="tab"
                              aria-selected={index === featuredIndex % filteredItems.length}
                              aria-label={`${t("newsroom.readStory")} ${index + 1}`}
                              title={`${t("newsroom.readStory")} ${index + 1}`}
                              className={`efsw-news-feature__dot ${index === featuredIndex % filteredItems.length ? "is-active" : ""}`}
                              onClick={() => showFeatured(
                                () => index,
                                index >= featuredIndex % filteredItems.length ? 1 : -1,
                              )}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          className="efsw-news-feature__arrow"
                          onClick={() => showFeatured((index) => (index + 1) % filteredItems.length, 1)}
                          aria-label={t("common.next")}
                          title={t("common.next")}
                        >
                          <ChevronRight size={17} aria-hidden />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )}

              {streamItems.length > 0 && (
                <div className="efsw-news-stream" key={`stream-${featuredItem?.id ?? "none"}`}>
                  <div className="efsw-news-stream__heading">
                    <h3 className="efsw-section-label">{t("newsroom.moreStories")}</h3>
                    <span>{t("newsroom.updated")}</span>
                  </div>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={`skeleton-stream-${index}`} className="efsw-news-story">
                        <div className="efsw-news-story__media" />
                        <div className="efsw-news-story__body">
                          <div className="efsw-news-story__meta"><span>Loading...</span></div>
                          <h2>Loading story...</h2>
                        </div>
                      </div>
                    ))
                  ) : (
                    streamItems.slice(0, 5).map((item, index) => (
                      <article
                        key={item.id}
                        className="efsw-news-story"
                        style={{ "--story-stagger": `${index * 60}ms` } as CSSProperties}
                      >
                        <Link href={`${detailBase}/${item.id}`} className="efsw-news-story__link-cover" aria-label={item.title} />
                        <div className="efsw-news-story__media">
                          {item.coverImage ? (
                            <img src={item.coverImage} alt={item.imageCaption || item.title} loading="lazy" />
                          ) : (
                            <div className="efsw-news-card__placeholder">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>
                        <div className="efsw-news-story__body">
                          <div className="efsw-news-story__meta">
                            <span>{item.category}</span>
                            {kind !== "event" && item.updatedAt && <time dateTime={item.updatedAt}>{formatDate(item.updatedAt)}</time>}
                            {kind === "event" && item.startsAt && <time dateTime={item.startsAt}>{formatDateRange(item.startsAt, item.endsAt)}</time>}
                            {kind === "event" && item.format && <span className="efsw-event-format efsw-event-format--sm">{item.format}</span>}
                          </div>
                          <h2>{item.title}</h2>
                          <p>{item.summary}</p>
                          <div className="efsw-news-story__engagement">
                            <EngagementRow contentId={item.id} memberId={member?.id ?? null} />
                          </div>
                          <span className="efsw-news-story__link">
                            {linkLabel} <ArrowUpRight size={13} />
                          </span>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <article className="efsw-empty-card" style={{ gridColumn: "1 / -1" }}>
              <div><span aria-hidden="true">--</span><small>{emptyItem.category}</small></div>
              <div><h2>{emptyItem.title}</h2><p>{emptyItem.summary}</p></div>
            </article>
          )}
        </section>
      ) : (
        /* Academic Documents View */
        <section className="efsw-resource-list" aria-live="polite">
          {filteredItems.length ? filteredItems.map((item, index) => {
            const CategoryGlyph = categoryIcon(item.category);
            return (
            <article
              key={item.id}
              data-category={item.category}
              className={hasInteracted ? undefined : "efsw-resource-list__row--no-anim"}
              style={hasInteracted ? ({ "--row-stagger": `${index * 50}ms` } as CSSProperties) : undefined}
            >
              <span className="efsw-resource-list__glyph" aria-hidden>
                <CategoryGlyph size={17} strokeWidth={1.9} />
              </span>
              <div className="efsw-resource-list__main">
                <div className="efsw-resource-list__mode">
                  <small>{item.category}</small>
                  {item.updatedAt && <time dateTime={item.updatedAt}>{formatDate(item.updatedAt)}</time>}
                </div>
                <h2>
                  <Link href={`${detailBase}/${item.id}`} className="efsw-resource-list__link">
                    {item.title}
                  </Link>
                </h2>
                <p>{item.summary}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="efsw-resource-list__tags">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <span className="efsw-resource-list__cta" aria-hidden>
                <ArrowUpRight size={15} strokeWidth={2.1} />
              </span>
            </article>
            );
          }) : (
            <article className="efsw-resource-list__empty">
              <span className="efsw-resource-list__glyph" aria-hidden><FileText size={17} strokeWidth={1.9} /></span>
              <div className="efsw-resource-list__main">
                <div className="efsw-resource-list__mode"><small>{emptyItem.category}</small></div>
                <h2>{emptyItem.title}</h2>
                <p>{emptyItem.summary}</p>
              </div>
            </article>
          )}
        </section>
      )}

    </div>
  );
}
