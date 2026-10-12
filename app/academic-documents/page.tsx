"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  FileText,
  Layers,
  RefreshCw,
  X,
} from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";
import CoverImage from "@/components/content/CoverImage";
import {
  ADMIN_CONTENT_KEY,
  getAdminContent,
  type AdminContentItem,
} from "@/lib/admin-data";
import {
  filterLibraryDocuments,
  getLibraryAuthors,
  getLibraryDocuments,
} from "@/lib/academic-library";
import {
  getContentEngagement,
  hasUserLiked,
  incrementDownloadCount,
  incrementViewCount,
  toggleLike,
} from "@/lib/content-engagement";
import { AuthorMarquee } from "@/components/academic/AuthorMarquee";
import { StickyDocumentFilters } from "@/components/academic/StickyDocumentFilters";
import { DocumentCard } from "@/components/academic/DocumentCard";
import "./styles-light.css";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "popular", label: "Most downloaded" },
  { value: "title", label: "Title A–Z" },
];

export default function AcademicDocumentsPage() {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const previewY = useTransform(scrollYProgress, [0, 1], [0, 48]);
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [likedDocs, setLikedDocs] = useState<Set<string>>(new Set());
  const [engagementRevision, setEngagementRevision] = useState(0);

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | undefined;
    const refresh = async () => {
      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;
      setLoadError(false);
      try {
        let nextItems: AdminContentItem[];
        if (
          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
          !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ) {
          nextItems = getAdminContent();
        } else {
          const responses = await Promise.all(
            ["academic", "document"].map((kind) =>
              fetch(`/api/content/public?kind=${kind}`, {
                cache: "no-store",
                signal: requestController.signal,
              }),
            ),
          );
          if (responses.some((response) => !response.ok))
            throw new Error("Library unavailable");
          const payloads = await Promise.all(
            responses.map(
              (response) =>
                response.json() as Promise<{ items: AdminContentItem[] }>,
            ),
          );
          nextItems = payloads.flatMap((payload) => payload.items);
        }
        if (!disposed) setItems(nextItems);
      } catch (error) {
        if (
          !disposed &&
          !(error instanceof Error && error.name === "AbortError")
        )
          setLoadError(true);
      } finally {
        if (!disposed && !requestController.signal.aborted) setLoading(false);
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_CONTENT_KEY) void refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    void refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("efsw:content-changed", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      controller?.abort();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("efsw:content-changed", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [retry]);

  const allDocuments = useMemo(
    () =>
      getLibraryDocuments(items).map((doc) => {
        const engagement = getContentEngagement(doc.id);
        return {
          ...doc,
          downloadCount: (doc.downloadCount || 0) + engagement.downloadCount,
        };
      }),
    [items, engagementRevision],
  );
  const authors = useMemo(
    () => getLibraryAuthors(allDocuments),
    [allDocuments],
  );
  const allTags = useMemo(
    () => Array.from(new Set(allDocuments.flatMap((doc) => doc.tags))).sort(),
    [allDocuments],
  );
  const categories = useMemo(
    () =>
      Array.from(new Set(allDocuments.map((doc) => doc.category))).map(
        (value) => ({
          value,
          label:
            (
              {
                Research: "Research papers",
                Practice: "Practice guides",
                Briefings: "Policy briefings",
              } as Record<string, string>
            )[value] || value,
          count: allDocuments.filter((doc) => doc.category === value).length,
        }),
      ),
    [allDocuments],
  );
  const filteredDocuments = useMemo(
    () =>
      filterLibraryDocuments(allDocuments, {
        query: searchQuery,
        category: selectedCategory,
        author: selectedAuthor,
        tags: selectedTags,
        sort: sortBy,
      }),
    [
      allDocuments,
      searchQuery,
      selectedCategory,
      selectedAuthor,
      selectedTags,
      sortBy,
    ],
  );
  const spotlight = useMemo(
    () =>
      [...allDocuments].sort(
        (a, b) =>
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
          Date.parse(b.date) - Date.parse(a.date),
      )[0],
    [allDocuments],
  );

  useEffect(() => {
    setLikedDocs(
      new Set(
        allDocuments.filter((doc) => hasUserLiked(doc.id)).map((doc) => doc.id),
      ),
    );
  }, [allDocuments]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "category",
    );
    if (!requested) return;
    const match = categories.find(
      (category) =>
        category.value.toLowerCase() === requested.toLowerCase() ||
        category.label.toLowerCase() === requested.toLowerCase(),
    );
    if (match) setSelectedCategory(match.value);
  }, [categories]);

  const scrollToDocuments = useCallback(() => {
    document
      .getElementById("documents")
      ?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
  }, [reduceMotion]);
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedTags([]);
    setSelectedAuthor(null);
  };
  const handleLike = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    const { liked } = toggleLike(id);
    setLikedDocs((previous) => {
      const next = new Set(previous);
      if (liked) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const handleDownload = (id: string) => {
    incrementDownloadCount(id);
    setEngagementRevision((value) => value + 1);
  };

  return (
    <>
      <SiteNav />
      <div className="academic-library">
        <section
          ref={heroRef}
          className="academic-hero"
          aria-labelledby="library-title"
        >
          <div className="academic-hero__inner">
            <div className="academic-hero__content">
              <span className="academic-hero__eyebrow">
                <BookOpen size={16} aria-hidden="true" /> The EFSW knowledge hub
              </span>
              <h1 id="library-title" className="academic-hero__title">
                Academic
                <br />
                <span>Documents.</span>
              </h1>
              <p className="academic-hero__description">
                Research that informs. Practice that connects. Explore a shared
                library of ideas and resources from social workers across
                Eurasia.
              </p>
              <a
                href="#documents"
                className="academic-btn academic-btn--primary"
              >
                Explore the library <ArrowDown size={18} aria-hidden="true" />
              </a>
              <div
                className="academic-hero__stats"
                aria-label="Library overview"
              >
                <div className="academic-hero__stat">
                  <strong>{loading ? "—" : allDocuments.length}</strong>
                  <span>Documents</span>
                </div>
                <div className="academic-hero__stat">
                  <strong>{loading ? "—" : authors.length}</strong>
                  <span>Contributors</span>
                </div>
                <div className="academic-hero__stat">
                  <strong>{loading ? "—" : allTags.length}</strong>
                  <span>Topics to explore</span>
                </div>
              </div>
            </div>
            <motion.div
              className="academic-hero__preview"
              style={reduceMotion ? undefined : { y: previewY }}
            >
              <div className="academic-preview__label">
                <span>
                  {spotlight?.featured ? "Editor's pick" : "From the library"}
                </span>
                <Layers size={18} aria-hidden="true" />
              </div>
              {spotlight ? (
                <Link
                  href={`/academic-documents/${encodeURIComponent(spotlight.id)}`}
                  className="academic-preview"
                  onClick={() => incrementViewCount(spotlight.id)}
                >
                  <div className="academic-preview__cover">
                    {spotlight.coverImage ? (
                      <CoverImage
                        src={spotlight.coverImage}
                        crop={spotlight.coverImageCrop}
                        alt=""
                        loading="eager"
                      />
                    ) : (
                      <BookOpen size={72} strokeWidth={1} aria-hidden="true" />
                    )}
                    <span className="academic-preview__format">
                      {spotlight.fileUrl
                        ? "Document + download"
                        : "Read online"}
                    </span>
                  </div>
                  <div className="academic-preview__body">
                    <span className="academic-preview__category">
                      {spotlight.category}
                    </span>
                    <h2>{spotlight.title}</h2>
                    <p>{spotlight.author}</p>
                    <span className="academic-preview__link">
                      Open document{" "}
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="academic-preview academic-preview--intro">
                  <BookOpen size={64} strokeWidth={1} aria-hidden="true" />
                  <h2>
                    Knowledge moves
                    <br />
                    practice forward.
                  </h2>
                  <p>
                    Research papers, practice guides, and policy perspectives.
                    One shared space.
                  </p>
                  <a href="#documents">
                    Browse the collection{" "}
                    <ArrowDown size={18} aria-hidden="true" />
                  </a>
                </div>
              )}
              <p className="academic-preview__note">
                Shared knowledge. Stronger communities.
              </p>
            </motion.div>
          </div>
        </section>

        {authors.length > 0 && (
          <section
            className="academic-contributors"
            aria-labelledby="contributors-title"
          >
            <div className="academic-section-heading">
              <div>
                <h2 id="contributors-title">The people behind the ideas.</h2>
                <p>Select a contributor to discover their work.</p>
              </div>
            </div>
            <AuthorMarquee
              authors={authors}
              selectedAuthor={selectedAuthor}
              sortMode="prolific"
              onAuthorClick={(id) => {
                setSelectedAuthor((previous) => (previous === id ? null : id));
                scrollToDocuments();
              }}
            />
          </section>
        )}

        <section
          id="documents"
          className="academic-collection"
          aria-labelledby="collection-title"
        >
          <div className="academic-section-heading academic-section-heading--collection">
            <div>
              <h2 id="collection-title">Find your next perspective.</h2>
              <p>
                Explore the collection by topic, author, or the questions that
                matter to you.
              </p>
            </div>
            <FileText size={32} strokeWidth={1.3} aria-hidden="true" />
          </div>
          <StickyDocumentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            allTags={allTags}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={SORT_OPTIONS}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            resultsCount={filteredDocuments.length}
          />
          <div className="academic-results" aria-busy={loading}>
            {selectedAuthor && (
              <div className="academic-results__filter-notice">
                <span>
                  Documents by{" "}
                  <strong>
                    {authors.find((author) => author.id === selectedAuthor)
                      ?.name || selectedAuthor}
                  </strong>
                </span>
                <button type="button" onClick={() => setSelectedAuthor(null)}>
                  Clear author <X size={16} aria-hidden="true" />
                </button>
              </div>
            )}
            {loadError && (
              <div className="academic-load-error" role="alert">
                <p>The library could not be refreshed. Please try again.</p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setRetry((value) => value + 1);
                  }}
                >
                  <RefreshCw size={16} aria-hidden="true" /> Retry
                </button>
              </div>
            )}
            {loading ? (
              <div className="academic-loading" role="status">
                <BookOpen size={24} aria-hidden="true" /> Loading the library…
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="academic-empty">
                <BookOpen size={40} strokeWidth={1.3} aria-hidden="true" />
                <h3>
                  {allDocuments.length
                    ? "No documents match yet."
                    : "The next chapter starts here."}
                </h3>
                <p>
                  {allDocuments.length
                    ? "Try another keyword or clear your filters to explore the collection."
                    : "Published documents will appear here as the library grows."}
                </p>
                {allDocuments.length > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="academic-btn academic-btn--secondary"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div
                className={`academic-grid ${viewMode === "list" ? "academic-grid--list" : ""}`}
              >
                {filteredDocuments.map((doc) => {
                  const engagement = getContentEngagement(doc.id);
                  return (
                    <DocumentCard
                      key={doc.id}
                      id={doc.id}
                      title={doc.title}
                      category={doc.category}
                      author={doc.author}
                      date={doc.date}
                      summary={doc.summary}
                      tags={doc.tags}
                      downloads={doc.downloadCount || 0}
                      featured={doc.featured}
                      viewCount={(doc.viewCount || 0) + engagement.viewCount}
                      likeCount={(doc.likeCount || 0) + engagement.likeCount}
                      isLiked={likedDocs.has(doc.id)}
                      coverImage={doc.coverImage}
                      coverImageCrop={doc.coverImageCrop}
                      fileUrl={doc.fileUrl}
                      fileName={doc.fileName}
                      fileSize={doc.fileSize}
                      pageCount={doc.pageCount}
                      onView={() => incrementViewCount(doc.id)}
                      onLike={(event) => handleLike(doc.id, event)}
                      onDownload={() => handleDownload(doc.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="academic-cta">
          <div className="academic-cta__inner">
            <div>
              <h2>
                Share your knowledge.
                <br />
                <span>Grow our collective impact.</span>
              </h2>
              <p>
                Have research or resources to contribute? Share your work with
                the EFSW community.
              </p>
            </div>
            <a
              href="mailto:support@eurasiaforumsw.org"
              className="academic-btn academic-btn--primary"
            >
              Submit a document <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
        <footer className="academic-footer">
          <a href="/">Eurasia Forum for Social Workers</a>
          <span>© 2026 EFSW · Connect. Empower. Advocate.</span>
        </footer>
      </div>
    </>
  );
}
