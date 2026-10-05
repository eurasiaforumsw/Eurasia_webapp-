"use client";

import { useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  FileText,
  FileBarChart2,
  Download,
  ExternalLink,
  Filter,
  X,
  Calendar,
  User,
  Tag,
  TrendingUp,
  Grid3x3,
  List,
  ChevronDown,
  Heart,
  Eye,
} from "lucide-react";
import { SiteNav } from "@/components/efsw/SiteNav";
import { getPublishedAdminContent } from "@/lib/admin-data";
import {
  getContentEngagement,
  incrementViewCount,
  incrementDownloadCount,
  toggleLike,
  hasUserLiked,
} from "@/lib/content-engagement";
import { useRouter } from "next/navigation";

// Document type definition
type Document = {
  id: string;
  title: string;
  category: "Research" | "Practice" | "Briefings";
  author: string;
  date: string;
  summary: string;
  tags: string[];
  downloads: number;
  featured?: boolean;
  fileType?: "PDF" | "DOC" | "DOCX";
  pageCount?: number;
};

const CATEGORY_CONFIG = {
  Research: {
    icon: BookOpen,
    color: "#3b82f6",
    bgColor: "#eff6ff",
    label: "Research Papers",
    description: "Academic writing and field research",
  },
  Practice: {
    icon: FileText,
    color: "#10b981",
    bgColor: "#ecfdf5",
    label: "Practice Guides",
    description: "Field manuals and practical resources",
  },
  Briefings: {
    icon: FileBarChart2,
    color: "#f59e0b",
    bgColor: "#fef3c7",
    label: "Policy Briefings",
    description: "Policy perspectives and insights",
  },
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "popular", label: "Most downloaded" },
  { value: "title", label: "Title A-Z" },
];

export default function AcademicDocumentsPage() {
  const router = useRouter();

  // Load documents from admin content
  const allDocuments = useMemo(() => {
    const adminDocs = getPublishedAdminContent("academic"); // Use 'academic' kind
    const mappedDocs = adminDocs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      category: (doc.category || "Research") as Document["category"],
      author: doc.author || "EFSW Network",
      date: doc.publishAt || new Date().toISOString(),
      summary: doc.summary || "",
      tags: doc.tags || [],
      downloads: Math.floor(Math.random() * 500) + 50,
      featured: Math.random() > 0.7,
      fileType: "PDF" as const,
      pageCount: Math.floor(Math.random() * 50) + 5,
    }));

    // Add sample documents for demo purposes
    const sampleDocs: Document[] = [
      {
        id: "doc-001",
        title: "Social Work Practice in Rural Communities of Central Asia",
        category: "Research",
        author: "Dr. Aisha Karimova",
        date: "2026-09-15T00:00:00Z",
        summary: "A comprehensive study examining the unique challenges and opportunities for social work practice in rural areas across Kazakhstan, Kyrgyzstan, and Uzbekistan. The research explores cultural sensitivity, resource limitations, and community-based interventions.",
        tags: ["Rural Development", "Central Asia", "Community Practice", "Cultural Competency"],
        downloads: 342,
        featured: true,
        fileType: "PDF",
        pageCount: 45,
      },
      {
        id: "doc-002",
        title: "Field Manual: Crisis Intervention for Social Workers",
        category: "Practice",
        author: "EFSW Training Committee",
        date: "2026-08-20T00:00:00Z",
        summary: "A practical guide for social workers responding to crisis situations, including natural disasters, family emergencies, and mental health crises. Includes assessment tools, intervention protocols, and safety guidelines adapted for the Eurasian context.",
        tags: ["Crisis Intervention", "Emergency Response", "Mental Health", "Field Guide"],
        downloads: 567,
        featured: true,
        fileType: "PDF",
        pageCount: 78,
      },
      {
        id: "doc-003",
        title: "Policy Brief: Child Protection Systems in Southeast Asia",
        category: "Briefings",
        author: "Dr. Mei Lin Chen",
        date: "2026-09-01T00:00:00Z",
        summary: "An analysis of child protection policies across Thailand, Vietnam, and Cambodia, with recommendations for strengthening inter-agency collaboration and family support services. Includes comparative policy frameworks and implementation strategies.",
        tags: ["Child Protection", "Policy Analysis", "Southeast Asia", "Child Welfare"],
        downloads: 234,
        featured: false,
        fileType: "PDF",
        pageCount: 28,
      },
      {
        id: "doc-004",
        title: "Trauma-Informed Care: A Guide for Social Workers in Conflict Zones",
        category: "Practice",
        author: "Dr. Yuki Tanaka & Sarah Williams",
        date: "2026-07-12T00:00:00Z",
        summary: "Evidence-based practices for delivering trauma-informed care in regions affected by conflict and displacement. Covers trauma assessment, therapeutic approaches, and self-care for practitioners working in high-stress environments.",
        tags: ["Trauma", "Conflict Zones", "Psychosocial Support", "Evidence-Based Practice"],
        downloads: 489,
        featured: false,
        fileType: "PDF",
        pageCount: 62,
      },
      {
        id: "doc-005",
        title: "Research Report: Gender-Based Violence Prevention in South Asia",
        category: "Research",
        author: "Dr. Priya Sharma",
        date: "2026-06-30T00:00:00Z",
        summary: "A multi-country study examining community-based interventions for preventing gender-based violence in India, Bangladesh, and Pakistan. Includes quantitative data analysis and qualitative case studies from over 50 communities.",
        tags: ["Gender-Based Violence", "Prevention", "South Asia", "Community Interventions"],
        downloads: 412,
        featured: false,
        fileType: "PDF",
        pageCount: 92,
      },
      {
        id: "doc-006",
        title: "Policy Brief: Mental Health Services Integration in Primary Care",
        category: "Briefings",
        author: "EFSW Policy Working Group",
        date: "2026-09-10T00:00:00Z",
        summary: "Recommendations for integrating mental health screening and services into primary healthcare settings across Eurasia. Addresses workforce training, funding mechanisms, and quality assurance frameworks.",
        tags: ["Mental Health", "Primary Care", "Health Policy", "Service Integration"],
        downloads: 287,
        featured: false,
        fileType: "PDF",
        pageCount: 18,
      },
      {
        id: "doc-007",
        title: "Supervision in Social Work: Models and Best Practices",
        category: "Practice",
        author: "Prof. Michael Roberts",
        date: "2026-05-15T00:00:00Z",
        summary: "A comprehensive guide to social work supervision covering administrative, educational, and supportive functions. Includes case examples, supervision contracts, and evaluation tools suitable for diverse practice settings.",
        tags: ["Supervision", "Professional Development", "Best Practices", "Leadership"],
        downloads: 523,
        featured: true,
        fileType: "PDF",
        pageCount: 55,
      },
      {
        id: "doc-008",
        title: "Research: Migration and Social Work Practice in East Asia",
        category: "Research",
        author: "Dr. Kim Min-jun",
        date: "2026-08-05T00:00:00Z",
        summary: "An examination of social work responses to internal and international migration in Japan, South Korea, and Mongolia. Explores issues of cultural adaptation, family separation, and access to services for migrant populations.",
        tags: ["Migration", "East Asia", "Cross-Cultural Practice", "Family Services"],
        downloads: 356,
        featured: false,
        fileType: "PDF",
        pageCount: 68,
      },
      {
        id: "doc-009",
        title: "Policy Brief: Aging Populations and Long-Term Care",
        category: "Briefings",
        author: "Dr. Svetlana Ivanova",
        date: "2026-07-22T00:00:00Z",
        summary: "Policy recommendations for addressing the needs of rapidly aging populations across Russia, Kazakhstan, and neighboring countries. Covers community-based care, caregiver support, and sustainable financing models.",
        tags: ["Aging", "Long-Term Care", "Elder Care", "Policy Development"],
        downloads: 198,
        featured: false,
        fileType: "PDF",
        pageCount: 22,
      },
      {
        id: "doc-010",
        title: "Ethical Dilemmas in Social Work: A Casebook for Practice",
        category: "Practice",
        author: "EFSW Ethics Committee",
        date: "2026-09-18T00:00:00Z",
        summary: "A collection of real-world ethical dilemmas faced by social workers across Eurasia, with guided analysis using ethical frameworks and professional codes of conduct. Includes discussion questions and decision-making tools.",
        tags: ["Ethics", "Professional Practice", "Case Studies", "Decision Making"],
        downloads: 445,
        featured: false,
        fileType: "PDF",
        pageCount: 82,
      },
    ];

    return [...mappedDocs, ...sampleDocs];
  }, []);

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false); // Default: closed
  const [likedDocs, setLikedDocs] = useState<Set<string>>(new Set());

  // Load liked state on mount
  useMemo(() => {
    const liked = new Set<string>();
    allDocuments.forEach((doc) => {
      if (hasUserLiked(doc.id)) {
        liked.add(doc.id);
      }
    });
    setLikedDocs(liked);
  }, [allDocuments]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allDocuments.forEach((doc) => doc.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [allDocuments]);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let filtered = [...allDocuments];

    // Search
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

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((doc) =>
        selectedTags.some((tag) => doc.tags.includes(tag))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "popular":
          return b.downloads - a.downloads;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allDocuments, searchQuery, selectedCategory, selectedTags, sortBy]);

  // Get category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    allDocuments.forEach((doc) => {
      stats[doc.category] = (stats[doc.category] || 0) + 1;
    });
    return stats;
  }, [allDocuments]);

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

  const handleDownload = (docId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    incrementDownloadCount(docId);
    // In real app, trigger actual download here
    alert(`Download started for document: ${docId}`);
  };

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) + selectedTags.length + (searchQuery ? 1 : 0);

  return (
    <>
      <SiteNav />
      <main className="efsw-academic-library">
        {/* Hero Section */}
        <section className="efsw-academic-hero">
          <div className="efsw-academic-hero__inner">
            <div className="efsw-academic-hero__content">
              <span className="efsw-academic-hero__eyebrow">Knowledge Hub</span>
              <h1 className="efsw-academic-hero__title">
                Academic Documents
              </h1>
              <p className="efsw-academic-hero__description">
                A shared library of research papers, field manuals, and policy briefings
                from social work practitioners and researchers across Eurasia.
              </p>
              <div className="efsw-academic-hero__stats">
                <div className="efsw-academic-hero__stat">
                  <strong>{allDocuments.length}</strong>
                  <span>Documents</span>
                </div>
                <div className="efsw-academic-hero__stat">
                  <strong>{Object.keys(categoryStats).length}</strong>
                  <span>Categories</span>
                </div>
                <div className="efsw-academic-hero__stat">
                  <strong>{allTags.length}</strong>
                  <span>Topics</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Cards */}
        <section className="efsw-academic-categories">
          <div className="efsw-academic-categories__inner">
            <div className="efsw-academic-categories__grid">
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const count = categoryStats[key] || 0;
                const isActive = selectedCategory === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(isActive ? null : key)
                    }
                    className={`efsw-academic-category ${
                      isActive ? "is-active" : ""
                    }`}
                    style={
                      {
                        "--category-color": config.color,
                        "--category-bg": config.bgColor,
                      } as React.CSSProperties
                    }
                  >
                    <div className="efsw-academic-category__icon">
                      <Icon size={24} />
                    </div>
                    <div className="efsw-academic-category__content">
                      <h3>{config.label}</h3>
                      <p>{config.description}</p>
                      <span className="efsw-academic-category__count">
                        {count} {count === 1 ? "document" : "documents"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="efsw-academic-toolbar">
          <div className="efsw-academic-toolbar__inner">
            {/* Search Bar */}
            <div className="efsw-academic-search">
              <Search size={20} className="efsw-academic-search__icon" />
              <input
                type="text"
                placeholder="Search documents by title, author, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="efsw-academic-search__input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="efsw-academic-search__clear"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Toolbar Controls */}
            <div className="efsw-academic-toolbar__controls">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`efsw-academic-filter-btn ${
                  showFilters ? "is-active" : ""
                }`}
              >
                <Filter size={18} />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="efsw-academic-filter-badge">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="efsw-academic-sort">
                <label htmlFor="sort-select">Sort:</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="efsw-academic-sort__select"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="efsw-academic-sort__icon" />
              </div>

              <div className="efsw-academic-view-toggle">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "is-active" : ""}
                  aria-label="Grid view"
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "is-active" : ""}
                  aria-label="List view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="efsw-academic-filters">
              <div className="efsw-academic-filters__inner">
                <div className="efsw-academic-filters__header">
                  <h3>Filter by topic</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="efsw-academic-filters__clear"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="efsw-academic-filters__tags">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`efsw-academic-tag ${
                        selectedTags.includes(tag) ? "is-active" : ""
                      }`}
                    >
                      <Tag size={14} />
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Results */}
        <section className="efsw-academic-results">
          <div className="efsw-academic-results__inner">
            <div className="efsw-academic-results__header">
              <h2>
                {filteredDocuments.length}{" "}
                {filteredDocuments.length === 1 ? "document" : "documents"}
                {selectedCategory && ` in ${selectedCategory}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </h2>
            </div>

            {filteredDocuments.length === 0 ? (
              <div className="efsw-academic-empty">
                <BookOpen size={48} />
                <h3>No documents found</h3>
                <p>Try adjusting your filters or search query</p>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="efsw-academic-btn efsw-academic-btn--primary"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div
                className={`efsw-academic-grid ${
                  viewMode === "list" ? "efsw-academic-grid--list" : ""
                }`}
              >
                {filteredDocuments.map((doc) => {
                  const categoryConfig = CATEGORY_CONFIG[doc.category];

                  // Skip if category config not found (safety check)
                  if (!categoryConfig) {
                    console.warn(`Unknown category: ${doc.category}`);
                    return null;
                  }

                  const Icon = categoryConfig.icon;
                  const engagement = getContentEngagement(doc.id);
                  const isLiked = likedDocs.has(doc.id);

                  return (
                    <article
                      key={doc.id}
                      className="efsw-academic-card"
                      onClick={() => handleView(doc.id)}
                      style={{ cursor: "pointer" }}
                    >
                      {doc.featured && (
                        <div className="efsw-academic-card__badge">
                          <TrendingUp size={12} />
                          Featured
                        </div>
                      )}

                      <div className="efsw-academic-card__header">
                        <div
                          className="efsw-academic-card__category"
                          style={
                            {
                              "--category-color": categoryConfig.color,
                              "--category-bg": categoryConfig.bgColor,
                            } as React.CSSProperties
                          }
                        >
                          <Icon size={16} />
                          <span>{doc.category}</span>
                        </div>
                        <div className="efsw-academic-card__meta">
                          <span>
                            <Calendar size={14} />
                            {new Date(doc.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                            })}
                          </span>
                          <span>
                            <Download size={14} />
                            {doc.downloads}
                          </span>
                        </div>
                      </div>

                      <div className="efsw-academic-card__content">
                        <h3>{doc.title}</h3>
                        <p className="efsw-academic-card__summary">
                          {doc.summary}
                        </p>
                        <div className="efsw-academic-card__author">
                          <User size={14} />
                          {doc.author}
                        </div>
                      </div>

                      {doc.tags.length > 0 && (
                        <div className="efsw-academic-card__tags">
                          {doc.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="efsw-academic-card__tag">
                              {tag}
                            </span>
                          ))}
                          {doc.tags.length > 3 && (
                            <span className="efsw-academic-card__tag">
                              +{doc.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="efsw-academic-card__footer">
                        <div className="efsw-academic-card__stats">
                          <span title="Views">
                            <Eye size={14} />
                            {engagement.viewCount || 0}
                          </span>
                          <span title="Downloads">
                            <Download size={14} />
                            {engagement.downloadCount || 0}
                          </span>
                          <span title="Likes">
                            <Heart
                              size={14}
                              fill={isLiked ? "currentColor" : "none"}
                            />
                            {engagement.likeCount || 0}
                          </span>
                        </div>
                        <div className="efsw-academic-card__actions">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(doc.id, e);
                            }}
                            className={`efsw-academic-card__action ${
                              isLiked ? "is-liked" : ""
                            }`}
                            title={isLiked ? "Unlike" : "Like"}
                          >
                            <Heart
                              size={16}
                              fill={isLiked ? "currentColor" : "none"}
                            />
                            {isLiked ? "Liked" : "Like"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDownload(doc.id, e)}
                            className="efsw-academic-card__action"
                          >
                            <Download size={16} />
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(doc.id);
                            }}
                            className="efsw-academic-card__action efsw-academic-card__action--primary"
                          >
                            <ExternalLink size={16} />
                            View
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="efsw-academic-cta">
          <div className="efsw-academic-cta__inner">
            <h2>Share your knowledge</h2>
            <p>
              Have research or resources to contribute? Help grow this library
              by sharing your work with the EFSW community.
            </p>
            <a
              href="mailto:support@eurasiaforumsw.org"
              className="efsw-academic-btn efsw-academic-btn--primary"
            >
              Submit a document
              <ExternalLink size={16} />
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
