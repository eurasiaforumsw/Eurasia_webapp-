"use client";

import { useState, useMemo, useRef } from "react";
import { Search, Filter, X, ChevronDown, Grid3x3, List } from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";
import DocumentHero from "@/components/efsw/DocumentHero";
import DocumentCard from "@/components/efsw/DocumentCard";
import AuthorMarquee from "@/components/efsw/AuthorMarquee";
import StickyDocumentLayout from "@/components/efsw/StickyDocumentLayout";
import { getPublishedAdminContent } from "@/lib/admin-data";
import {
  getContentEngagement,
  incrementViewCount,
  toggleLike,
  hasUserLiked,
} from "@/lib/content-engagement";
import { getDocumentAuthors, enrichDocumentWithAuthor } from "@/lib/document-authors";
import { useRouter } from "next/navigation";

type Document = {
  id: string;
  title: string;
  category: "Research" | "Practice" | "Briefings";
  author: string;
  authorAvatar: string;
  date: string;
  summary: string;
  tags: string[];
  views: number;
  downloads: number;
  likes: number;
  featured?: boolean;
};

const CATEGORY_CONFIG = {
  Research: {
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.1)",
    label: "Research Papers",
  },
  Practice: {
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.1)",
    label: "Practice Guides",
  },
  Briefings: {
    color: "#f59e0b",
    bgColor: "rgba(245, 158, 11, 0.1)",
    label: "Policy Briefings",
  },
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "popular", label: "Most viewed" },
  { value: "title", label: "Title A-Z" },
];

export default function AcademicDocumentsPage() {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  // Load documents
  const allDocuments = useMemo(() => {
    const adminDocs = getPublishedAdminContent("academic");
    return adminDocs.map((doc) => {
      const enriched = enrichDocumentWithAuthor(doc);
      const engagement = getContentEngagement(doc.id);

      return {
        id: doc.id,
        title: doc.title,
        category: (doc.category || "Research") as Document["category"],
        author: doc.author || "EFSW Network",
        authorAvatar: enriched.authorAvatar || "/images/default-avatar.png",
        date: doc.publishAt || doc.updatedAt || new Date().toISOString(),
        summary: doc.summary || "",
        tags: doc.tags || [],
        views: engagement.viewCount || 0,
        downloads: engagement.downloadCount || 0,
        likes: engagement.likeCount || 0,
        featured: Math.random() > 0.7,
      };
    });
  }, []);

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [likedDocs, setLikedDocs] = useState<Set<string>>(new Set());
  const [authorSortMode, setAuthorSortMode] = useState<"latest" | "popular">("latest");

  // Load liked state
  useMemo(() => {
    const liked = new Set<string>();
    allDocuments.forEach((doc) => {
      if (hasUserLiked(doc.id)) {
        liked.add(doc.id);
      }
    });
    setLikedDocs(liked);
  }, [allDocuments]);

  // Get authors
  const authors = useMemo(() => getDocumentAuthors(authorSortMode), [authorSortMode]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allDocuments.forEach((doc) => doc.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [allDocuments]);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let filtered = [...allDocuments];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.summary.toLowerCase().includes(query) ||
          doc.author.toLowerCase().includes(query) ||
          doc.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((doc) =>
        selectedTags.some((tag) => doc.tags.includes(tag))
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "popular":
          return b.views - a.views;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allDocuments, searchQuery, selectedCategory, selectedTags, sortBy]);

  const featuredDocuments = useMemo(
    () => filteredDocuments.filter((doc) => doc.featured).slice(0, 3),
    [filteredDocuments]
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedTags([]);
  };

  const handleLike = (docId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { liked } = toggleLike(docId);
    setLikedDocs((prev) => {
      const next = new Set(prev);
      if (liked) {
        next.add(docId);
      } else {
        next.delete(docId);
      }
      return next;
    });
  };

  const handleView = (docId: string) => {
    incrementViewCount(docId);
    router.push(`/academic-documents/${docId}`);
  };

  const handleAuthorClick = (authorId: string) => {
    router.push(`/academic-documents?author=${authorId}`);
  };

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) + selectedTags.length + (searchQuery ? 1 : 0);

  return (
    <>
      <SiteNav />
      <main
        className="min-h-screen"
        style={{
          '--surface-1': '#05070C',
          '--surface-2': '#0A0D12',
          '--surface-3': '#0F131C',
          '--accent-teal': '#38BDF8',
          backgroundColor: 'var(--surface-1)',
        } as React.CSSProperties}
      >
        {/* Hero Section */}
        <DocumentHero
          title="Academic Documents"
          subtitle="A shared library of research papers, field manuals, and policy briefings from social work practitioners and researchers across Eurasia."
          stats={[
            { label: "Documents", value: allDocuments.length },
            { label: "Categories", value: 3 },
            { label: "Topics", value: allTags.length },
          ]}
          onScrollClick={scrollToContent}
        />

        {/* Author Marquee */}
        {authors.length > 0 && (
          <section className="py-16 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-6 mb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Featured Authors</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthorSortMode("latest")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      authorSortMode === "latest"
                        ? "bg-[var(--accent-teal)] text-white"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    Latest
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthorSortMode("popular")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      authorSortMode === "popular"
                        ? "bg-[var(--accent-teal)] text-white"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    Popular
                  </button>
                </div>
              </div>
            </div>
            <AuthorMarquee
              authors={authors}
              sortMode={authorSortMode}
              onAuthorClick={handleAuthorClick}
            />
          </section>
        )}

        {/* Featured Documents - Sticky Layout */}
        {featuredDocuments.length > 0 && (
          <StickyDocumentLayout
            sections={featuredDocuments.map((doc, index) => ({
              id: doc.id,
              title: `Featured ${index + 1}`,
              content: (
                <DocumentCard
                  {...doc}
                  categoryColor={CATEGORY_CONFIG[doc.category].color}
                  categoryBg={CATEGORY_CONFIG[doc.category].bgColor}
                  isLiked={likedDocs.has(doc.id)}
                  onClick={() => handleView(doc.id)}
                  onLike={(e) => handleLike(doc.id, e)}
                />
              ),
            }))}
          />
        )}

        {/* Search and Filters */}
        <section
          ref={contentRef}
          className="py-12 border-t border-white/10"
          style={{ backgroundColor: 'var(--surface-2)' }}
        >
          <div className="max-w-7xl mx-auto px-6">
            {/* Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  placeholder="Search documents by title, author, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-full bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:border-[var(--accent-teal)] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Toolbar Controls */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-full border transition-all ${
                    showFilters
                      ? "bg-[var(--accent-teal)] border-[var(--accent-teal)] text-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Filter size={18} />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 rounded-full bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[var(--accent-teal)] transition-colors cursor-pointer"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
                </div>

                <div className="flex gap-1 p-1 rounded-full bg-white/5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-full transition-all ${
                      viewMode === "grid" ? "bg-[var(--accent-teal)] text-white" : "text-white/70 hover:text-white"
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid3x3 size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-full transition-all ${
                      viewMode === "list" ? "bg-[var(--accent-teal)] text-white" : "text-white/70 hover:text-white"
                    }`}
                    aria-label="List view"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Filter by topic</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm font-medium text-[var(--accent-teal)] hover:underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedTags.includes(tag)
                          ? "bg-[var(--accent-teal)] text-white"
                          : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">
                {filteredDocuments.length}{" "}
                {filteredDocuments.length === 1 ? "document" : "documents"}
                {selectedCategory && ` in ${selectedCategory}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </h2>
            </div>

            {/* Documents Grid */}
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-white/70 mb-4">No documents found</p>
                <p className="text-white/50 mb-6">Try adjusting your filters or search query</p>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-6 py-3 rounded-full bg-[var(--accent-teal)] text-white font-medium hover:bg-[var(--accent-teal)]/90 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div
                className={`grid gap-6 ${
                  viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    {...doc}
                    categoryColor={CATEGORY_CONFIG[doc.category].color}
                    categoryBg={CATEGORY_CONFIG[doc.category].bgColor}
                    isLiked={likedDocs.has(doc.id)}
                    onClick={() => handleView(doc.id)}
                    onLike={(e) => handleLike(doc.id, e)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-white/50 text-sm">
              © 2026 EFSW · Eurasia Forum for Social Workers
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
