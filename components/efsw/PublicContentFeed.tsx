/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Calendar, User, Tag, X, Image as ImageIcon, Search, FileText, Download } from "lucide-react";
import {
  ADMIN_CONTENT_KEY,
  getPublishedAdminContent,
  type AdminContentItem,
  type AdminContentKind,
} from "@/lib/admin-data";

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
};

type PublicContentFeedProps = {
  kind: AdminContentKind;
  initialItems: PublicContentItem[];
  linkLabel: string;
  showFilters?: boolean;
};

const itemNumber = (index: number) => String(index + 1).padStart(2, "0");

const formatDate = (value?: string) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
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
  const [items, setItems] = useState<PublicContentItem[]>(initialItems);
  const [activeStory, setActiveStory] = useState<PublicContentItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const refresh = () => {
      const published = getPublishedAdminContent(kind).map((item) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        summary: item.summary,
        body: item.body,
        coverImage: item.coverImage,
        imageCaption: item.imageCaption,
        author: item.author,
        tags: item.tags,
        updatedAt: item.updatedAt,
      }));
      if (published.length > 0) {
        setItems(published);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_CONTENT_KEY) refresh();
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

  // Extract unique categories from items
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["All", ...Array.from(set)];
  }, [items]);

  // Filter items by category and search
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch = !query ||
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query) ||
        (item.author && item.author.toLowerCase().includes(query)) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(query)));
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  // Lock body scroll when viewing story
  useEffect(() => {
    if (activeStory) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeStory]);

  const emptyItem = kind === "news"
    ? { category: "Newsroom", title: "ไม่พบข่าวในหมวดหมู่นี้", summary: "ลองเปลี่ยนตัวกรองหมวดหมู่หรือคำค้นหา หรือรอการเผยแพร่ข่าวใหม่จากผู้ดูแล" }
    : { category: "Resources", title: "ไม่พบเอกสารในหมวดหมู่นี้", summary: "ลองเปลี่ยนตัวกรองหมวดหมู่หรือคำค้นหา หรือติดต่อทีมงานวิชาการ EFSW" };

  return (
    <>
      {/* Search & Category Filter Strip */}
      {showFilters && (
        <div className="efsw-feed-filters-bar">
          <div className="efsw-feed-categories" role="tablist" aria-label="Filter by category">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                className={`efsw-category-pill ${selectedCategory === cat ? "is-active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="efsw-feed-search">
            <Search size={15} aria-hidden />
            <input
              type="search"
              placeholder={kind === "news" ? "ค้นหาข่าวหรือหัวข้อ..." : "ค้นหาเอกสารหรือรายงาน..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search content"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="efsw-feed-search__clear"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* News Feed View */}
      {kind === "news" ? (
        <section className="efsw-news-grid" aria-live="polite">
          {filteredItems.length ? filteredItems.map((item, index) => (
            <article
              key={item.id}
              className="efsw-news-card"
              onClick={() => setActiveStory(item)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveStory(item);
                }
              }}
            >
              <div className="efsw-news-card__media">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.imageCaption || item.title}
                    className="efsw-news-card__image"
                    loading="lazy"
                  />
                ) : (
                  <div className="efsw-news-card__placeholder">
                    <ImageIcon size={28} />
                    <span>EFSW News</span>
                  </div>
                )}
                <span className="efsw-news-card__category">{item.category}</span>
                <span className="efsw-news-card__index">{itemNumber(index)}</span>
              </div>

              <div className="efsw-news-card__body">
                <div className="efsw-news-card__meta">
                  {item.updatedAt && (
                    <span className="efsw-news-card__date">
                      <Calendar size={13} aria-hidden />
                      {formatDate(item.updatedAt)}
                    </span>
                  )}
                  {item.author && (
                    <span className="efsw-news-card__author">
                      <User size={13} aria-hidden />
                      {item.author}
                    </span>
                  )}
                </div>

                <h2 className="efsw-news-card__title">{item.title}</h2>
                <p className="efsw-news-card__summary">{item.summary}</p>

                {item.tags && item.tags.length > 0 && (
                  <div className="efsw-news-card__tags">
                    {item.tags.map((tag) => (
                      <span key={tag} className="efsw-news-tag">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="efsw-news-card__action">
                  <span className="efsw-text-link">
                    {linkLabel} <ArrowUpRight size={16} />
                  </span>
                </div>
              </div>
            </article>
          )) : (
            <article className="efsw-empty-card" style={{ gridColumn: "1 / -1" }}>
              <div><span aria-hidden="true">--</span><small>{emptyItem.category}</small></div>
              <div><h2>{emptyItem.title}</h2><p>{emptyItem.summary}</p></div>
            </article>
          )}
        </section>
      ) : (
        /* Academic Documents View */
        <section className="efsw-resource-list" aria-live="polite">
          {filteredItems.length ? filteredItems.map((item, index) => (
            <article
              key={item.id}
              onClick={() => setActiveStory(item)}
              tabIndex={0}
              role="button"
              style={{ cursor: "pointer" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveStory(item);
                }
              }}
            >
              <div className="efsw-resource-list__label">
                <span>{itemNumber(index)}</span>
                <small>{item.category}</small>
              </div>
              <div>
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="efsw-news-card__tags" style={{ marginTop: "0.6rem" }}>
                    {item.tags.map((tag) => (
                      <span key={tag} className="efsw-news-tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <span className="efsw-text-link">
                  {linkLabel} <ArrowUpRight size={16} />
                </span>
              </div>
            </article>
          )) : (
            <article>
              <div className="efsw-resource-list__label"><span aria-hidden="true">--</span><small>{emptyItem.category}</small></div>
              <div><h2>{emptyItem.title}</h2><p>{emptyItem.summary}</p></div>
            </article>
          )}
        </section>
      )}

      {/* Story & Document Detail Modal */}
      {activeStory && (
        <div
          className="efsw-story-modal-backdrop"
          role="presentation"
          onClick={() => setActiveStory(null)}
        >
          <div
            className="efsw-story-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="story-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="efsw-story-modal__close"
              onClick={() => setActiveStory(null)}
              aria-label="Close story"
            >
              <X size={20} />
            </button>

            {activeStory.coverImage && (
              <div className="efsw-story-modal__hero">
                <img
                  src={activeStory.coverImage}
                  alt={activeStory.imageCaption || activeStory.title}
                />
                {activeStory.imageCaption && (
                  <figcaption className="efsw-story-modal__caption">
                    {activeStory.imageCaption}
                  </figcaption>
                )}
              </div>
            )}

            <div className="efsw-story-modal__content">
              <div className="efsw-story-modal__tags">
                <span className="efsw-story-modal__badge">{activeStory.category}</span>
                {activeStory.updatedAt && (
                  <span>{formatDate(activeStory.updatedAt)}</span>
                )}
                {activeStory.author && (
                  <span>· โดย {activeStory.author}</span>
                )}
              </div>

              <h1 id="story-modal-title">{activeStory.title}</h1>
              <p className="efsw-story-modal__lede">{activeStory.summary}</p>

              {activeStory.body && (
                <div className="efsw-story-modal__body">
                  {activeStory.body.split("\n\n").map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              )}

              {activeStory.tags && activeStory.tags.length > 0 && (
                <div className="efsw-story-modal__tag-list">
                  <Tag size={14} aria-hidden />
                  {activeStory.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              )}

              <div className="efsw-story-modal__footer">
                <a
                  href="mailto:support@eurasiaforumsw.org"
                  className="efsw-button efsw-button--dark"
                >
                  {kind === "news" ? "Contact EFSW regarding this story" : "Request full paper / document access"} <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


