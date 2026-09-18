"use client";

import { memo, useMemo, useState } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  FileText,
  Newspaper,
  Edit3,
  Trash2,
  Globe2,
  Calendar,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  Archive,
} from "lucide-react";
import { AdminContentCategory, AdminContentItem, AdminContentKind, AdminContentStatus } from "@/lib/admin-data";
import { useDebounce } from "@/hooks/useDebounce";

interface AdminContentViewProps {
  content: AdminContentItem[];
  onOpenEditor: (item: AdminContentItem) => void;
  onOpenDelete: (item: AdminContentItem) => void;
  onToggleStatus: (item: AdminContentItem) => void;
  onAddNew: () => void;
  contentCategories: AdminContentCategory[];
  onSaveCategories: (categories: AdminContentCategory[]) => void;
}

export const AdminContentView = memo(function AdminContentView({
  content,
  onOpenEditor,
  onOpenDelete,
  onToggleStatus,
  onAddNew,
  contentCategories,
  onSaveCategories,
}: AdminContentViewProps) {
  const [kindFilter, setKindFilter] = useState<"all" | AdminContentKind>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminContentStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryKind, setCategoryKind] = useState<AdminContentKind>("news");
  const [categoryDrafts, setCategoryDrafts] = useState<AdminContentCategory[]>(contentCategories);

  const debouncedSearch = useDebounce(searchQuery.trim().toLowerCase(), 200);

  const visibleCategories = categoryDrafts
    .filter((category) => category.kind === categoryKind)
    .sort((a, b) => a.order - b.order);
  const updateCategory = (id: string, patch: Partial<AdminContentCategory>) => {
    setCategoryDrafts((categories) => categories.map((category) => category.id === id ? { ...category, ...patch } : category));
  };
  const addCategory = () => {
    const id = `category-${Date.now().toString(36)}`;
    setCategoryDrafts((categories) => [...categories, { id, kind: categoryKind, label: "New mode", order: categories.length, enabled: true }]);
  };
  const removeCategory = (id: string) => {
    const next = categoryDrafts.filter((category) => category.id !== id);
    setCategoryDrafts(next);
    onSaveCategories(next);
  };
  const moveCategory = (id: string, direction: -1 | 1) => {
    const ordered = [...visibleCategories];
    const index = ordered.findIndex((category) => category.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const orderMap = new Map(ordered.map((category, nextOrder) => [category.id, nextOrder]));
    setCategoryDrafts((categories) => categories.map((category) => orderMap.has(category.id) ? { ...category, order: orderMap.get(category.id)! } : category));
  };

  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      const matchesKind = kindFilter === "all" || item.kind === kindFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      if (!matchesKind || !matchesStatus) return false;

      if (!debouncedSearch) return true;

      const haystack = [item.title, item.summary, item.category, item.author, ...(item.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(debouncedSearch);
    });
  }, [content, kindFilter, statusFilter, debouncedSearch]);

  const formatDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat("th-TH", { dateStyle: "short" }).format(new Date(value));
    } catch {
      return "-";
    }
  };

  const statusBadge = (status: AdminContentStatus) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Published
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Draft
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-bold text-text-muted">
            <Archive size={11} />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control bar: Search, Filters, Add New button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search titles, summaries, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-surface-subtle bg-surface-raised py-2.5 pl-10 pr-4 text-xs font-medium text-text-primary placeholder:text-text-muted focus:border-teal focus:outline-none transition-colors"
          />
        </div>

        {/* Action: Add New */}
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal/20 hover:bg-teal-vivid transition-all"
        >
          <Plus size={16} />
          <span>Create content</span>
        </button>
      </div>

      <section className="rounded-2xl border border-surface-subtle bg-surface-raised p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-text-primary">News filter modes</h2>
            <p className="mt-1 text-xs text-text-muted">Choose which modes appear in the public filter bar, rename them, or add a new one.</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={categoryKind} onChange={(event) => setCategoryKind(event.target.value as AdminContentKind)} className="rounded-lg border border-surface-subtle bg-surface-base px-2.5 py-2 text-xs font-semibold text-text-primary focus:border-teal focus:outline-none">
              <option value="news">News</option>
              <option value="document">Documents</option>
            </select>
            <button type="button" onClick={addCategory} className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-3 py-2 text-xs font-bold text-white hover:bg-teal-vivid"><Plus size={14} /> Add mode</button>
          </div>
        </div>
        <div className="mt-4 divide-y divide-surface-subtle">
          {visibleCategories.map((category, index) => (
            <div key={category.id} className="flex items-center gap-2 py-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input value={category.label} onChange={(event) => updateCategory(category.id, { label: event.target.value })} className="min-w-0 flex-1 rounded-lg border border-surface-subtle bg-surface-base px-3 py-2 text-xs font-semibold text-text-primary focus:border-teal focus:outline-none" aria-label={`Edit ${category.label} mode`} />
                <label className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-text-muted"><input type="checkbox" checked={category.enabled} onChange={(event) => updateCategory(category.id, { enabled: event.target.checked })} className="h-4 w-4 accent-teal" /> Visible</label>
              </div>
              <button type="button" onClick={() => moveCategory(category.id, -1)} disabled={index === 0} className="rounded-md px-2 py-1 text-xs text-text-muted hover:bg-surface-base disabled:opacity-30" aria-label="Move mode up">↑</button>
              <button type="button" onClick={() => moveCategory(category.id, 1)} disabled={index === visibleCategories.length - 1} className="rounded-md px-2 py-1 text-xs text-text-muted hover:bg-surface-base disabled:opacity-30" aria-label="Move mode down">↓</button>
              <button type="button" onClick={() => removeCategory(category.id)} className="rounded-md px-2 py-1 text-xs text-text-muted hover:bg-red-500/10 hover:text-red-400" aria-label={`Delete ${category.label} mode`}>×</button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={() => onSaveCategories(categoryDrafts)} className="inline-flex items-center gap-1.5 rounded-lg border border-teal/40 bg-teal/10 px-3 py-2 text-xs font-bold text-teal-light hover:bg-teal/20">Save filter modes</button>
        </div>
      </section>

      {/* Filter Tabs: Kind & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-subtle pb-4">
        {/* Kind Filters */}
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: "all", label: "All", count: content.length },
              {
                id: "news",
                label: "News",
                count: content.filter((c) => c.kind === "news").length,
              },
              {
                id: "document",
                label: "Documents",
                count: content.filter((c) => c.kind === "document").length,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setKindFilter(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                kindFilter === tab.id
                  ? "bg-surface-raised text-teal border border-teal/30 shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 text-xs">
          {(
            [
              { id: "all", label: "All statuses" },
              { id: "published", label: "Published" },
              { id: "draft", label: "Draft" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                statusFilter === tab.id
                  ? "bg-teal/20 text-teal-light font-bold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Cards Grid */}
      {filteredContent.length === 0 ? (
        <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-12 text-center text-text-muted">
          <AlertCircle size={32} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm font-medium">No content matches your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredContent.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col justify-between rounded-2xl border border-surface-subtle bg-surface-raised overflow-hidden transition-all duration-200 hover:border-teal/40 hover:shadow-lg hover:shadow-black/20"
            >
              {/* Cover Image or Placeholder */}
              <div className="relative aspect-video w-full overflow-hidden bg-surface-base border-b border-surface-subtle">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-base text-text-muted">
                    {item.kind === "news" ? <Newspaper size={36} /> : <FileText size={36} />}
                  </div>
                )}

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
                    {item.category || item.kind}
                  </span>
                </div>

                <div className="absolute top-3 right-3">{statusBadge(item.status)}</div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-[11px] text-text-muted mb-2">
                  <span>{formatDate(item.updatedAt)}</span>
                  <span>·</span>
                  <span>{item.author || "EFSW Editorial"}</span>
                  <span>·</span>
                  <span className="uppercase font-bold text-teal-light">
                    {item.locale || "en"}
                  </span>
                </div>

                <h3 className="text-sm font-bold font-display text-text-primary line-clamp-2 group-hover:text-teal-light transition-colors mb-2">
                  {item.title}
                </h3>

                <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed flex-1">
                  {item.summary}
                </p>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-surface-base px-2 py-0.5 text-[10px] text-text-muted"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Actions */}
                <div className="mt-5 flex items-center justify-between border-t border-surface-subtle pt-4">
                  <button
                    onClick={() => onToggleStatus(item)}
                    className="text-xs font-semibold text-text-muted hover:text-teal transition-colors"
                  >
                    {item.status === "published" ? "Move to draft" : "Publish now"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenEditor(item)}
                      title="Edit content"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-subtle bg-surface-base text-text-muted hover:border-teal hover:text-teal transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => onOpenDelete(item)}
                      title="Delete content"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-subtle bg-surface-base text-text-muted hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
});
