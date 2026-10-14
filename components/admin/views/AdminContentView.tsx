"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Plus,
  Search,
  FileText,
  Newspaper,
  Edit3,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
  CalendarClock,
  Users,
  Archive,
  FileCheck,
  Tag,
} from "lucide-react";
import {
  AdminContentCategory,
  AdminContentItem,
  AdminContentKind,
  AdminContentStatus,
  isContentExpired,
  isContentVisible,
  getAdminContent,
  saveAdminContent,
  deleteAdminContent,
} from "@/lib/admin-data";
import { useDebounce } from "@/hooks/useDebounce";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { BulkSelectCheckbox } from "@/components/admin/BulkSelectCheckbox";
import { BulkActionBar } from "@/components/admin/BulkActionBar";

// Dynamic imports for heavy components
const BulkProgressModal = dynamic(
  () => import("@/components/admin/modals/BulkProgressModal").then((mod) => ({ default: mod.BulkProgressModal })),
  { ssr: false }
);

const ContentAdvancedFilters = dynamic(
  () => import("@/components/admin/ContentAdvancedFilters").then((mod) => ({ default: mod.ContentAdvancedFilters })),
  { ssr: false }
);

interface AdminContentViewProps {
  content: AdminContentItem[];
  onOpenEditor: (item: AdminContentItem) => void;
  onOpenDelete: (item: AdminContentItem) => void;
  onToggleStatus: (item: AdminContentItem) => void;
  onAddNew: () => void;
  contentCategories: AdminContentCategory[];
  onSaveCategories: (categories: AdminContentCategory[]) => Promise<void>;
}

interface ContentFilterValues {
  kindFilter: "all" | AdminContentKind;
  statusFilter: "all" | AdminContentStatus;
  searchQuery: string;
}

const KIND_LABELS: Record<AdminContentKind, string> = {
  news: "News",
  document: "Documents",
  event: "Events",
  academic: "Academic",
};

const STATUS_PILL: Record<AdminContentStatus, string> = {
  draft: "is-draft",
  published: "is-published",
  archived: "is-archived",
};

const STATUS_LABEL: Record<AdminContentStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const AdminContentView = memo(function AdminContentView({
  content,
  onOpenEditor,
  onOpenDelete,
  onToggleStatus,
  onAddNew,
  contentCategories,
  onSaveCategories,
}: AdminContentViewProps) {
  // Filter persistence with localStorage and URL state
  const {
    filterValues,
    setFilterValues,
    presets,
    savePreset,
    deletePreset,
    loadPreset,
    clearFilters,
  } = useFilterPersistence<ContentFilterValues>({
    viewName: "content",
    defaultValues: {
      kindFilter: "all",
      statusFilter: "all",
      searchQuery: "",
    },
    enableUrlState: true, // Allow sharing filtered views via URL
  });

  const [categoryKind, setCategoryKind] = useState<AdminContentKind>("news");
  const [categoryDrafts, setCategoryDrafts] = useState<AdminContentCategory[]>(contentCategories);
  const [advancedFilteredIds, setAdvancedFilteredIds] = useState<Set<string> | null>(null);
  const handleAdvancedFilterChange = useCallback((filtered: AdminContentItem[]) => {
    setAdvancedFilteredIds(new Set(filtered.map((item) => item.id)));
  }, []);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showBulkProgress, setShowBulkProgress] = useState(false);
  const [bulkAction, setBulkAction] = useState<"delete" | "publish" | "archive" | "unpublish" | "updateCategory" | null>(null);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkHadChanges, setBulkHadChanges] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  useEffect(() => { setCategoryDrafts(contentCategories); }, [contentCategories]);
  const saveCategories = async (categories: AdminContentCategory[]) => {
    setSavingCategories(true);
    setCategoryError("");
    try { await onSaveCategories(categories); }
    catch (error) { setCategoryError(error instanceof Error ? error.message : "Unable to save categories"); }
    finally { setSavingCategories(false); }
  };

  // Destructure for easier access
  const { kindFilter, statusFilter, searchQuery } = filterValues;

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
      if (advancedFilteredIds && !advancedFilteredIds.has(item.id)) return false;
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
  }, [content, advancedFilteredIds, kindFilter, statusFilter, debouncedSearch]);

  const counts = useMemo(() => {
    const published = content.filter((c) => c.status === "published").length;
    const drafts = content.filter((c) => c.status === "draft").length;
    const archived = content.filter((c) => c.status === "archived").length;
    const scheduled = content.filter(
      (c) => c.publishAt && Date.parse(c.publishAt) > Date.now(),
    ).length;
    const expired = content.filter((c) => isContentExpired(c)).length;
    const memberOnly = content.filter(
      (c) => (c.targetMembershipTypes?.length ?? 0) + (c.targetGroups?.length ?? 0) > 0,
    ).length;
    return { published, drafts, archived, scheduled, expired, memberOnly, total: content.length };
  }, [content]);

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredContent.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk operations
  const handleBulkAction = (action: "delete" | "publish" | "archive" | "unpublish" | "updateCategory") => {
    if (selectedIds.size === 0) return;
    setBulkAction(action);
    setBulkHadChanges(false);
    setShowBulkProgress(true);
  };

  const handleBulkClose = () => {
    setShowBulkProgress(false);
    setBulkAction(null);
    setSelectedIds(new Set());
    if (bulkHadChanges) window.location.reload();
  };

  // Legacy handlers (kept for backward compatibility)
  const handleBulkDelete = async () => {
    handleBulkAction("delete");
  };

  const handleBulkUpdateStatus = async (status: AdminContentStatus) => {
    if (status === "published") handleBulkAction("publish");
    else if (status === "archived") handleBulkAction("archive");
    else handleBulkAction("unpublish");
  };

  const handleBulkUpdateCategory = async () => {
    if (selectedIds.size === 0) return;
    
    const category = prompt("Enter the new category for selected items:");
    if (!category || !category.trim()) return;

    setBulkCategory(category.trim());
    handleBulkAction("updateCategory");
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
    } catch {
      return "—";
    }
  };

  const allSelected = filteredContent.length > 0 && selectedIds.size === filteredContent.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredContent.length;

  return (
    <div style={{ display: "grid", gap: "0.85rem" }}>
      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        totalCount={filteredContent.length}
        onClearSelection={handleClearSelection}
        actions={[
          {
            label: "Publish",
            icon: FileCheck,
            onClick: () => handleBulkUpdateStatus("published"),
            variant: "success",
            disabled: bulkProcessing,
          },
          {
            label: "Draft",
            icon: Edit3,
            onClick: () => handleBulkUpdateStatus("draft"),
            variant: "default",
            disabled: bulkProcessing,
          },
          {
            label: "Archive",
            icon: Archive,
            onClick: () => handleBulkUpdateStatus("archived"),
            variant: "default",
            disabled: bulkProcessing,
          },
          {
            label: "Set Category",
            icon: Tag,
            onClick: handleBulkUpdateCategory,
            variant: "default",
            disabled: bulkProcessing,
          },
          {
            label: "Delete",
            icon: Trash2,
            onClick: handleBulkDelete,
            variant: "danger",
            disabled: bulkProcessing,
          },
        ]}
      />

      {/* Bulk Progress Modal */}
      <BulkProgressModal
        isOpen={showBulkProgress}
        onClose={handleBulkClose}
        action={bulkAction || "delete"}
        selectedIds={Array.from(selectedIds)}
        entityType="content"
        onExecute={async () => {}}
        onExecuteBatch={async (ids) => {
          const status = bulkAction === "publish" ? "published" : bulkAction === "archive" ? "archived" : "draft";
          const results: { id: string; success: boolean; error?: string }[] = [];
          setBulkProcessing(true);
          try {
          for (let offset = 0; offset < ids.length; offset += 100) {
            const batch = ids.slice(offset, offset + 100);
            try {
              const response = await fetch("/api/content/bulk", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bulkAction === "delete" ? { action: "delete", ids: batch }
                  : bulkAction === "updateCategory" ? { action: "updateCategory", ids: batch, category: bulkCategory }
                  : { action: "updateStatus", ids: batch, status }),
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data.error || "Bulk operation failed");
              if (!Array.isArray(data.ids) || !Array.isArray(data.results)) throw new Error("Missing bulk operation results");
              const affected = new Set<string>(data.ids.filter((id: unknown): id is string => typeof id === "string" && batch.includes(id)));
              if (bulkAction === "delete") affected.forEach((id) => deleteAdminContent(id));
              else getAdminContent().filter((item) => affected.has(item.id)).forEach((item) => saveAdminContent({
                ...item, ...(bulkAction === "updateCategory" ? { category: bulkCategory } : { status }), updatedAt: new Date().toISOString(),
              }));
              if (affected.size) setBulkHadChanges(true);
              results.push(...batch.map((id) => ({ id, success: affected.has(id),
                ...(!affected.has(id) ? { error: data.results.find((item: { id: string; error?: string }) => item.id === id)?.error || "Content was not updated" } : {}) })));
            } catch (error) {
              results.push(...batch.map((id) => ({ id, success: false, error: error instanceof Error ? error.message : "Bulk operation failed" })));
            }
          }
          return results;
          } finally { setBulkProcessing(false); }
        }}
      />

      {/* Summary KPI strip */}
      <div className="efsw-admin-summary-grid">
        <div className="efsw-admin-summary-card">
          <div className="efsw-admin-summary-card__head">
            <span className="efsw-admin-summary-card__label">Total entries</span>
            <span className="efsw-admin-summary-card__icon"><Newspaper size={17} /></span>
          </div>
          <div className="efsw-admin-summary-card__value">{counts.total}</div>
          <div className="efsw-admin-summary-card__meta">
            <strong>{counts.published}</strong> live · <strong>{counts.drafts}</strong> drafts · <strong>{counts.archived}</strong> archived
          </div>
        </div>

        <div className="efsw-admin-summary-card">
          <div className="efsw-admin-summary-card__head">
            <span className="efsw-admin-summary-card__label">Scheduled</span>
            <span className="efsw-admin-summary-card__icon"><CalendarClock size={17} /></span>
          </div>
          <div className="efsw-admin-summary-card__value">{counts.scheduled}</div>
          <div className="efsw-admin-summary-card__meta">
            Items waiting for their &quot;Show from&quot; window.
          </div>
        </div>

        <div className="efsw-admin-summary-card is-warning">
          <div className="efsw-admin-summary-card__head">
            <span className="efsw-admin-summary-card__label">Expired</span>
            <span className="efsw-admin-summary-card__icon"><Clock size={17} /></span>
          </div>
          <div className="efsw-admin-summary-card__value">{counts.expired}</div>
          <div className="efsw-admin-summary-card__meta">
            Auto-archive on next sync — they won&apos;t appear on the public site.
          </div>
        </div>

        <div className="efsw-admin-summary-card">
          <div className="efsw-admin-summary-card__head">
            <span className="efsw-admin-summary-card__label">Members only</span>
            <span className="efsw-admin-summary-card__icon"><Users size={17} /></span>
          </div>
          <div className="efsw-admin-summary-card__value">{counts.memberOnly}</div>
          <div className="efsw-admin-summary-card__meta">
            Restricted to a membership tier or target group.
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="efsw-admin-toolbar">
        <div className="efsw-admin-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search titles, summaries, or tags…"
            value={searchQuery}
            onChange={(e) => setFilterValues({ ...filterValues, searchQuery: e.target.value })}
          />
        </div>

        <div className="efsw-admin-segmented">
          {(["all", "news", "document", "academic", "event"] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setFilterValues({ ...filterValues, kindFilter: kind })}
              className={kindFilter === kind ? "is-active" : ""}
            >
              {kind === "all" ? "All" : KIND_LABELS[kind as AdminContentKind]}{" "}
              <span style={{ color: "var(--admin-muted)", marginLeft: "0.25rem" }}>
                ({kind === "all" ? counts.total : content.filter((c) => c.kind === kind).length})
              </span>
            </button>
          ))}
        </div>

        <div className="efsw-admin-segmented">
          {(["all", "published", "draft", "archived"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterValues({ ...filterValues, statusFilter: status })}
              className={statusFilter === status ? "is-active" : ""}
            >
              {status === "all" ? "All statuses" : STATUS_LABEL[status as AdminContentStatus]}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="efsw-admin-primary"
          style={{ marginLeft: "auto" }}
        >
          <Plus size={13} /> Create content
        </button>
      </div>

      {/* Advanced Filters */}
      <ContentAdvancedFilters
        content={content}
        onFilterChange={handleAdvancedFilterChange}
      />

      {/* Filter-mode editor */}
      <section className="efsw-admin-panel" aria-label="Filter mode manager">
        <header className="efsw-admin-panel__head">
          <div>
            <span className="efsw-admin-eyebrow">Filter modes</span>
            <h2>Categories visible on the public filter bar</h2>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <div className="efsw-admin-segmented">
              {(["news", "document", "academic", "event"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setCategoryKind(kind)}
                  className={categoryKind === kind ? "is-active" : ""}
                >
                  {KIND_LABELS[kind]}
                </button>
              ))}
            </div>
            <button type="button" onClick={addCategory} className="efsw-admin-text-action">
              <Plus size={13} /> Add mode
            </button>
          </div>
        </header>

        <div style={{ display: "grid", borderTop: "1px solid var(--admin-line)" }}>
          {visibleCategories.length === 0 ? (
            <div className="efsw-admin-empty">
              <AlertCircle size={20} />
              <h2>No modes yet</h2>
              <p>Add the first mode to expose it as a filter on the public site.</p>
            </div>
          ) : (
            visibleCategories.map((category, index) => (
              <div
                key={category.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto auto auto auto",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.7rem 1.35rem",
                  borderBottom: "1px solid var(--admin-line)",
                }}
              >
                <input
                  value={category.label}
                  onChange={(e) => updateCategory(category.id, { label: e.target.value })}
                  style={{
                    width: "100%",
                    border: "1px solid var(--admin-line)",
                    borderRadius: "0.5rem",
                    background: "var(--admin-surface)",
                    color: "var(--admin-ink)",
                    padding: "0.45rem 0.65rem",
                    fontSize: "0.78rem",
                    fontWeight: 750,
                  }}
                  aria-label={`Edit ${category.label} mode`}
                />
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    color: "var(--admin-muted)",
                    fontSize: "0.7rem",
                    fontWeight: 750,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={category.enabled}
                    onChange={(e) => updateCategory(category.id, { enabled: e.target.checked })}
                    style={{ accentColor: "var(--admin-green)" }}
                  />
                  Visible
                </label>
                <button
                  type="button"
                  onClick={() => moveCategory(category.id, -1)}
                  disabled={index === 0}
                  className="efsw-admin-icon-button"
                  aria-label="Move mode up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveCategory(category.id, 1)}
                  disabled={index === visibleCategories.length - 1}
                  className="efsw-admin-icon-button"
                  aria-label="Move mode down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeCategory(category.id)}
                  className="efsw-admin-danger-action"
                  aria-label={`Delete ${category.label} mode`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        <div className="efsw-admin-editor__footer" style={{ padding: "0.85rem 1.35rem" }}>
          {categoryError && <p role="alert">{categoryError}</p>}
          <small style={{ color: "var(--admin-muted)", fontSize: "0.7rem" }}>
            Save filter modes to publish these changes to the website.
          </small>
          <button
            type="button"
            disabled={savingCategories}
            onClick={() => void saveCategories(categoryDrafts)}
            className="efsw-admin-text-action"
            style={{ color: "var(--admin-green)", fontSize: "0.74rem" }}
          >
            {savingCategories ? "Saving…" : "Save filter modes"}
          </button>
        </div>
      </section>

      {/* Content grid with bulk select */}
      {filteredContent.length === 0 ? (
        <div className="efsw-admin-empty">
          <AlertCircle size={20} />
          <h2>No content matches these filters</h2>
          <p>Try a different status or clear the search box.</p>
        </div>
      ) : (
        <>
          {/* Select All Header */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-line)",
            borderRadius: "0.75rem",
          }}>
            <BulkSelectCheckbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={handleSelectAll}
              ariaLabel="Select all content items"
            />
            <span style={{ fontSize: "0.8rem", color: "var(--admin-muted)", fontWeight: 600 }}>
              {selectedIds.size === 0 
                ? `${filteredContent.length} items` 
                : `${selectedIds.size} of ${filteredContent.length} selected`}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gap: "0.85rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(20rem, 1fr))",
            }}
          >
            {filteredContent.map((item) => {
              const expired = isContentExpired(item);
              const visible = isContentVisible(item);
              const audience =
                (item.targetMembershipTypes?.length ?? 0) + (item.targetGroups?.length ?? 0);
              const isSelected = selectedIds.has(item.id);

              return (
                <article
                  key={item.id}
                  className="efsw-admin-panel"
                  style={{
                    display: "grid",
                    gridTemplateRows: "auto auto 1fr",
                    overflow: "hidden",
                    outline: isSelected ? "2px solid var(--admin-green)" : undefined,
                    outlineOffset: "-2px",
                  }}
                >
                  {/* Bulk Select Checkbox */}
                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--admin-line)" }}>
                    <BulkSelectCheckbox
                      checked={isSelected}
                      onChange={(checked) => handleSelectItem(item.id, checked)}
                      ariaLabel={`Select ${item.title}`}
                    />
                  </div>

                  <div
                    style={{
                      position: "relative",
                      aspectRatio: "16 / 9",
                      overflow: "hidden",
                      background: "var(--admin-surface-deep)",
                    }}
                  >
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          placeItems: "center",
                          width: "100%",
                          height: "100%",
                          color: "var(--admin-muted)",
                        }}
                      >
                        {item.kind === "news" ? (
                          <Newspaper size={32} />
                        ) : item.kind === "event" ? (
                          <Sparkles size={32} />
                        ) : (
                          <FileText size={32} />
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        position: "absolute",
                        top: "0.7rem",
                        left: "0.7rem",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.35rem",
                      }}
                    >
                      <span
                        className="efsw-admin-content-status"
                        style={{
                          background: "color-mix(in oklch, var(--admin-ink) 78%, transparent)",
                          color: "#fff",
                        }}
                      >
                        {item.category || item.kind}
                      </span>
                      {!visible && !expired && (
                        <span className="efsw-admin-content-status is-archived">
                          <Clock size={10} /> Scheduled
                        </span>
                      )}
                      {expired && (
                        <span className="efsw-admin-content-status is-draft">
                          <Clock size={10} /> Expired
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        position: "absolute",
                        top: "0.7rem",
                        right: "0.7rem",
                      }}
                    >
                      <span className={`efsw-admin-content-status ${STATUS_PILL[item.status]}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: "1rem 1.1rem 1.15rem", display: "grid", gap: "0.45rem" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        color: "var(--admin-muted)",
                        fontSize: "0.66rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <span>{KIND_LABELS[item.kind]}</span>
                      <span aria-hidden>·</span>
                      <span>{item.locale?.toUpperCase() ?? "EN"}</span>
                      {audience > 0 && (
                        <>
                          <span aria-hidden>·</span>
                          <span style={{ color: "var(--admin-green)" }}>
                            <Users size={10} /> {audience} target{audience === 1 ? "" : "s"}
                          </span>
                        </>
                      )}
                    </div>

                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1.05rem",
                        fontFamily: "var(--font-display)",
                        fontWeight: 650,
                        lineHeight: 1.15,
                      }}
                    >
                      {item.title}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "var(--admin-muted)",
                        fontSize: "0.78rem",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.summary}
                    </p>

                    {(item.publishAt || item.expiresAt) && (
                      <div
                        style={{
                          display: "inline-flex",
                          flexWrap: "wrap",
                          gap: "0.45rem",
                          color: "var(--admin-muted)",
                          fontSize: "0.66rem",
                          fontWeight: 700,
                        }}
                      >
                        {item.publishAt && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            <CalendarClock size={10} /> From {formatDate(item.publishAt)}
                          </span>
                        )}
                        {item.expiresAt && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            <Clock size={10} /> Hide after {formatDate(item.expiresAt)}
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "0.35rem",
                        paddingTop: "0.7rem",
                        borderTop: "1px solid var(--admin-line)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleStatus(item)}
                        className="efsw-admin-text-action"
                        style={{ fontSize: "0.72rem" }}
                      >
                        {item.status === "published" ? "Move to draft" : "Publish now"}
                      </button>
                      <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                        <button
                          type="button"
                          onClick={() => onOpenEditor(item)}
                          className="efsw-admin-icon-button"
                          aria-label={`Edit ${item.title}`}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDelete(item)}
                          className="efsw-admin-icon-button"
                          aria-label={`Delete ${item.title}`}
                          style={{ color: "var(--admin-danger)" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
});
