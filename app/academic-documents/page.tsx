"use client";

import { useState, useMemo } from "react";
import { BookOpen, FileText, FileBarChart2, ExternalLink, Search, X } from "lucide-react";
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
import { AuthorMarquee } from "@/components/academic/AuthorMarquee";
import { StickyDocumentFilters } from "@/components/academic/StickyDocumentFilters";
import { DocumentCard } from "@/components/academic/DocumentCard";
import "./styles-light.css";

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
  const [likedDocs, setLikedDocs] = useState<Set<string>>(new Set());
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);

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

  // Calculate author stats
  const authorStats = useMemo(() => {
    const stats = new Map<string, {
      id: string;
      name: string;
      documentCount: number;
      totalViews: number;
      latestDate: string;
      profileImage?: string;
    }>();

    allDocuments.forEach((doc) => {
      const existing = stats.get(doc.author);
      const engagement = getContentEngagement(doc.id);

      if (existing) {
        existing.documentCount++;
        existing.totalViews += engagement.viewCount || 0;
        if (new Date(doc.date) > new Date(existing.latestDate)) {
          existing.latestDate = doc.date;
        }
      } else {
        stats.set(doc.author, {
          id: doc.author.toLowerCase().replace(/\s+/g, "-"),
          name: doc.author,
          documentCount: 1,
          totalViews: engagement.viewCount || 0,
          latestDate: doc.date,
        });
      }
    });

    return Array.from(stats.values());
  }, [allDocuments]);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let filtered = [...allDocuments];

    // Author filter
    if (selectedAuthor) {
      filtered = filtered.filter((doc) =>
        doc.author.toLowerCase().replace(/\s+/g, "-") === selectedAuthor
      );
    }

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
  }, [allDocuments, searchQuery, selectedCategory, selectedTags, sortBy, selectedAuthor]);

  // Get category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    allDocuments.forEach((doc) => {
      stats[doc.category] = (stats[doc.category] || 0) + 1;
    });
    return stats;
  }, [allDocuments]);

  const categories = useMemo(() => {
    return [
      { value: "Research", label: "Research Papers", count: categoryStats["Research"] || 0 },
      { value: "Practice", label: "Practice Guides", count: categoryStats["Practice"] || 0 },
      { value: "Briefings", label: "Policy Briefings", count: categoryStats["Briefings"] || 0 },
    ];
  }, [categoryStats]);

  const handleAuthorClick = (authorId: string) => {
    setSelectedAuthor(selectedAuthor === authorId ? null : authorId);
    window.scrollTo({ top: 800, behavior: "smooth" });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedTags([]);
    setSelectedAuthor(null);
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

  return (
    <>
      <SiteNav />
      <main className="academic-library">
        {/* Hero Section with Marquee */}
        <section className="academic-hero">
          <div className="academic-hero__inner">
            <div className="academic-hero__content">
              <span className="academic-hero__eyebrow">Knowledge Hub</span>
              <h1 className="academic-hero__title">
                Academic Documents
              </h1>
              <p className="academic-hero__description">
                A shared library of research papers, field manuals, and policy briefings
                from social work practitioners and researchers across Eurasia.
              </p>
              <div className="academic-hero__stats">
                <div className="academic-hero__stat">
                  <strong>{allDocuments.length}</strong>
                  <span>Documents</span>
                </div>
                <div className="academic-hero__stat">
                  <strong>{authorStats.length}</strong>
                  <span>Authors</span>
                </div>
                <div className="academic-hero__stat">
                  <strong>{allTags.length}</strong>
                  <span>Topics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Author Marquee */}
          <AuthorMarquee
            authors={authorStats}
            sortMode="popular"
            onAuthorClick={handleAuthorClick}
          />
        </section>

        {/* Sticky Filters */}
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

        {/* Documents Grid */}
        <section className="academic-results">
          <div className="academic-results__inner">
            {selectedAuthor && (
              <div className="academic-results__filter-notice">
                <span>
                  Showing documents by{" "}
                  <strong>
                    {authorStats.find((a) => a.id === selectedAuthor)?.name}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAuthor(null)}
                  className="academic-results__clear-filter"
                >
                  Clear
                </button>
              </div>
            )}

            {filteredDocuments.length === 0 ? (
              <div className="academic-empty">
                <BookOpen size={48} />
                <h3>No documents found</h3>
                <p>Try adjusting your filters or search query</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="academic-btn academic-btn--primary"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div
                className={`academic-grid ${
                  viewMode === "list" ? "academic-grid--list" : ""
                }`}
              >
                {filteredDocuments.map((doc) => {
                  const engagement = getContentEngagement(doc.id);
                  const isLiked = likedDocs.has(doc.id);

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
                      downloads={doc.downloads}
                      featured={doc.featured}
                      viewCount={engagement.viewCount || 0}
                      likeCount={engagement.likeCount || 0}
                      isLiked={isLiked}
                      onView={() => handleView(doc.id)}
                      onLike={(e) => handleLike(doc.id, e)}
                      onDownload={(e) => handleDownload(doc.id, e)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="academic-cta">
          <div className="academic-cta__inner">
            <h2>Share your knowledge</h2>
            <p>
              Have research or resources to contribute? Help grow this library
              by sharing your work with the EFSW community.
            </p>
            <a
              href="mailto:support@eurasiaforumsw.org"
              className="academic-btn academic-btn--primary"
            >
              Submit a document
              <ExternalLink size={16} />
            </a>
          </div>
        </section>

        <footer className="academic-footer">
          <span>© 2026 EFSW</span>
          <a href="/">Eurasia Forum for Social Workers</a>
        </footer>
      </main>
    </>
  );
}
