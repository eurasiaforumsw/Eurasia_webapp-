"use client";

import { memo, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  Download,
  Check,
  Ban,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UsersRound,
  Clock,
  AlertCircle,
  UserPlus,
  Globe2,
  Lock,
  Briefcase,
  GraduationCap,
  Building2,
  Filter as FilterIcon,
  X as XIcon,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import { AdminMember } from "@/lib/admin-data";
import { useDebounce } from "@/hooks/useDebounce";
import { useFilterPersistence } from "@/hooks/useFilterPersistence";
import { BulkSelectCheckbox } from "@/components/admin/BulkSelectCheckbox";
import { BulkActionBar } from "@/components/admin/BulkActionBar";

// Dynamic import for heavy modal
const BulkProgressModal = dynamic(
  () => import("@/components/admin/modals/BulkProgressModal").then((mod) => ({ default: mod.BulkProgressModal })),
  { ssr: false }
);

/* Member filters are intentionally multi-select so admins can layer
 * conditions (e.g. "Thailand + active + 5+ years"). Every filter
 * intersects with the others — a member must match every active
 * facet to remain in the table. Empty arrays mean "no constraint". */

export type MemberStatusFilter = "pending" | "active" | "suspended";
export type MemberTypeFilter = "professional" | "student" | "institutional";
/* Experience buckets are coarse — they're meant for a glance at the
 * roster, not a precise statistical breakdown. */
export type MemberExperienceBucket = "new" | "mid" | "senior" | "expert";

interface MemberFilterValues {
  searchQuery: string;
  statusFilters: MemberStatusFilter[];
  typeFilters: MemberTypeFilter[];
  countryFilters: string[];
  experienceFilters: MemberExperienceBucket[];
}

interface AdminMembersViewProps {
  members: AdminMember[];
  onOpenMember: (member: AdminMember) => void;
  onUpdateStatus: (member: AdminMember, status: AdminMember["status"]) => void;
  onExportCsv: () => void;
}

const ITEMS_PER_PAGE = 8;
const DISTRIBUTION_LIMIT = 6;
const REGISTRATION_LOG_LIMIT = 6;

export const AdminMembersView = memo(function AdminMembersView({
  members,
  onOpenMember,
  onUpdateStatus,
  onExportCsv,
}: AdminMembersViewProps) {
  // Filter persistence with localStorage and URL state
  const {
    filterValues,
    setFilterValues,
    presets,
    savePreset,
    deletePreset,
    loadPreset,
    clearFilters,
  } = useFilterPersistence<MemberFilterValues>({
    viewName: "members",
    defaultValues: {
      searchQuery: "",
      statusFilters: [],
      typeFilters: [],
      countryFilters: [],
      experienceFilters: [],
    },
    enableUrlState: true, // Allow sharing filtered views via URL
  });

  const [countryOpen, setCountryOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"approve" | "delete" | null>(null);
  const [showBulkProgress, setShowBulkProgress] = useState(false);

  // Destructure for easier access
  const { searchQuery, statusFilters, typeFilters, countryFilters, experienceFilters } = filterValues;

  // Debounce search query to prevent re-filtering on every keystroke
  const debouncedQuery = useDebounce(searchQuery.trim().toLowerCase(), 220);

  /* Distinct country values found in the loaded members — drives the
     country dropdown so admins only see countries that actually have
     someone in the roster. Sorted alphabetically. */
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    for (const member of members) {
      const country = member.country?.trim();
      if (country) set.add(country);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      /* Status filter — if any statuses are picked, the member's status
         must match one of them. Empty list skips this check. */
      if (statusFilters.length > 0 && !statusFilters.includes(member.status as MemberStatusFilter)) {
        return false;
      }
      /* Membership type — same shape, multi-select */
      if (typeFilters.length > 0 && !typeFilters.includes(member.membershipType as MemberTypeFilter)) {
        return false;
      }
      /* Country — case-insensitive membership against the picked list */
      if (countryFilters.length > 0) {
        const memberCountry = member.country?.trim().toLowerCase();
        const normalised = countryFilters.map((c) => c.toLowerCase());
        if (!memberCountry || !normalised.includes(memberCountry)) return false;
      }
      /* Experience bucket — coarse grouping by years since they joined,
         falling back to experienceYears if available. New = <2y,
         Mid = 2-7y, Senior = 8-15y, Expert = 15y+. */
      if (experienceFilters.length > 0) {
        const years = member.experienceYears ?? 0;
        const bucket: MemberExperienceBucket =
          years < 2 ? "new"
            : years < 8 ? "mid"
              : years < 15 ? "senior"
                : "expert";
        if (!experienceFilters.includes(bucket)) return false;
      }
      if (!debouncedQuery) return true;
      const searchable = [
        member.fullName,
        member.email,
        member.country,
        member.organization,
        member.university,
        member.membershipType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(debouncedQuery);
    });
  }, [members, statusFilters, typeFilters, countryFilters, experienceFilters, debouncedQuery]);

  /* Reset to first page whenever any filter or search changes. */
  useMemo(() => {
    setCurrentPage(1);
  }, [debouncedQuery, statusFilters, typeFilters, countryFilters, experienceFilters]);

  const totalActiveFilters =
    statusFilters.length + typeFilters.length + countryFilters.length + experienceFilters.length;

  const clearAllFilters = () => {
    clearFilters();
  };

  // ── Summary stats ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = members.length;
    const pending = members.filter((m) => m.status === "pending").length;
    const active = members.filter((m) => m.status === "active").length;
    const suspended = members.filter((m) => m.status === "suspended").length;
    const institutional = members.filter((m) => m.membershipType === "institutional").length;
    const student = members.filter((m) => m.membershipType === "student").length;
    const professional = members.filter((m) => m.membershipType === "professional").length;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = members.filter(
      (m) => m.joinedAt && Date.parse(m.joinedAt) >= sevenDaysAgo,
    ).length;
    const countries = new Set(members.map((m) => m.country).filter(Boolean)).size;
    return {
      total,
      pending,
      active,
      suspended,
      institutional,
      student,
      professional,
      newThisWeek,
      countries,
    };
  }, [members]);

  // ── Geographic distribution ───────────────────────────────────
  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const member of members) {
      const country = member.country?.trim() || "Unspecified";
      counts.set(country, (counts.get(country) ?? 0) + 1);
    }
    const rows = Array.from(counts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, DISTRIBUTION_LIMIT);
    const max = rows[0]?.count ?? 0;
    return { rows, max };
  }, [members]);

  // ── Recent registrations log ──────────────────────────────────
  const recentRegistrations = useMemo(() => {
    return [...members]
      .filter((m) => m.joinedAt)
      .sort((a, b) => Date.parse(b.joinedAt ?? "") - Date.parse(a.joinedAt ?? ""))
      .slice(0, REGISTRATION_LOG_LIMIT);
  }, [members]);

  // ── Pagination ────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / ITEMS_PER_PAGE));
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  // ── Bulk selection handlers ───────────────────────────────────
  const currentPageIds = useMemo(() => paginatedMembers.map((m) => m.id), [paginatedMembers]);
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const someCurrentPageSelected = currentPageIds.some((id) => selectedIds.has(id)) && !allCurrentPageSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set([...selectedIds, ...currentPageIds]));
    } else {
      const newSet = new Set(selectedIds);
      currentPageIds.forEach((id) => newSet.delete(id));
      setSelectedIds(newSet);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkAction = async (action: "approve" | "delete") => {
    setBulkAction(action);
    setShowBulkProgress(true);
  };

  const handleBulkComplete = () => {
    setShowBulkProgress(false);
    setBulkAction(null);
    setSelectedIds(new Set());
    // Trigger refresh by calling parent's refresh method if available
    // For now, we rely on the parent component to re-fetch data
  };

  // ── Helpers ───────────────────────────────────────────────────
  const formatDate = (value?: string) => {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
    } catch {
      return "—";
    }
  };

  const formatTimeAgo = (value?: string) => {
    if (!value) return "—";
    const diff = Date.now() - Date.parse(value);
    if (Number.isNaN(diff)) return "—";
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) return "Just now";
    if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
    if (diff < day) return `${Math.floor(diff / hour)}h ago`;
    if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
    return formatDate(value);
  };

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "·";

  const statusBadge = (status: AdminMember["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="efsw-admin-status is-active">
            <i aria-hidden /> Active
          </span>
        );
      case "pending":
        return (
          <span className="efsw-admin-status is-pending">
            <i aria-hidden /> Pending review
          </span>
        );
      case "suspended":
        return (
          <span className="efsw-admin-status is-suspended">
            <i aria-hidden /> Suspended
          </span>
        );
      default:
        return null;
    }
  };

  const typeBadge = (type: AdminMember["membershipType"]) => {
    switch (type) {
      case "professional":
        return <span className="efsw-admin-type">Professional</span>;
      case "student":
        return <span className="efsw-admin-type">Student</span>;
      case "institutional":
        return <span className="efsw-admin-type">Institutional</span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "grid", gap: "0.85rem" }}>
      {/* Bulk action bar (sticky when items selected) */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={filteredMembers.length}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            {
              label: "Approve selected",
              icon: Check,
              onClick: () => handleBulkAction("approve"),
              variant: "success",
            },
            {
              label: "Delete selected",
              icon: Ban,
              onClick: () => handleBulkAction("delete"),
              variant: "danger",
            },
          ]}
        />
      )}

      {/* Bulk progress modal */}
      {showBulkProgress && bulkAction && (
        <BulkProgressModal
          isOpen={showBulkProgress}
          onClose={() => {
            setShowBulkProgress(false);
            setBulkAction(null);
          }}
          action={bulkAction}
          selectedIds={Array.from(selectedIds)}
          entityType="members"
          onExecute={async (ids) => {
            if (bulkAction === "delete") {
              await fetch("/api/members/bulk", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
              });
            } else if (bulkAction === "approve") {
              await fetch("/api/members/bulk", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids, action: "approve" }),
              });
            }
          }}
        />
      )}

      {/* ── KPI summary cards ──────────────────────────────────── */}
      <div className="efsw-admin-summary-grid">
        <div className="efsw-admin-summary-card">
          <div className="efsw-admin-summary-card__head">
            <span className="efsw-admin-summary-card__label">Total members</span>
            <span className="efsw-admin-summary-card__icon"><UsersRound size={17} /></span>
          </div>
          <div className="efsw-admin-summary-card__value">{stats.total}</div>
          <div className="efsw-admin-summary-card__meta">
            <strong>{stats.newThisWeek}</strong> joined this week ·{" "}
            <strong>{stats.countries}</strong> {stats.countries === 1 ? "country" : "countries"} represented
          </div>
        </div>

        <div className="efsw-admin-summary-card is-warning">
          <div className="efsw-admin-summary-card__head">
            <span className="efsw-admin-summary-card__label">Pending review</span>
            <span className="efsw-admin-summary-card__icon"><Clock size={17} /></span>
          </div>
          <div className="efsw-admin-summary-card__value">{stats.pending}</div>
          <div className="efsw-admin-summary-card__meta">
            {stats.pending > 0
              ? <>Approve or reject from the table below.</>
              : <>All caught up — no waiting applications.</>}
          </div>
        </div>

        <div className="efsw-admin-summary-card">
          <div className="efsw-admin-summary-card__head">
            <span className="efsw-admin-summary-card__label">Active</span>
            <span className="efsw-admin-summary-card__icon"><ShieldCheck size={17} /></span>
          </div>
          <div className="efsw-admin-summary-card__value">{stats.active}</div>
          <div className="efsw-admin-summary-card__meta">
            <strong>{stats.professional}</strong> professional ·{" "}
            <strong>{stats.student}</strong> student ·{" "}
            <strong>{stats.institutional}</strong> institutional
          </div>
        </div>

        <div className="efsw-admin-summary-card is-danger">
          <div className="efsw-admin-summary-card__head">
            <span className="efsw-admin-summary-card__label">Suspended</span>
            <span className="efsw-admin-summary-card__icon"><Ban size={17} /></span>
          </div>
          <div className="efsw-admin-summary-card__value">{stats.suspended}</div>
          <div className="efsw-admin-summary-card__meta">
            {stats.suspended > 0
              ? <>Review and reinstate when appropriate.</>
              : <>No suspended accounts right now.</>}
          </div>
        </div>
      </div>

      {/* ── Distribution + Registration log ─────────────────────── */}
      <div className="efsw-admin-summary-pair">
        <section className="efsw-admin-distribution" aria-labelledby="members-distribution">
          <header className="efsw-admin-distribution__head">
            <div>
              <h2 id="members-distribution">Geographic distribution</h2>
              <p>Where members are registered, in order of representation.</p>
            </div>
            <Globe2 size={16} />
          </header>
          {distribution.rows.length === 0 ? (
            <div className="efsw-admin-distribution__empty">
              No country data yet. Members can set their country from their profile.
            </div>
          ) : (
            <div className="efsw-admin-distribution__list">
              {distribution.rows.map((row) => {
                const size = distribution.max > 0 ? `${Math.round((row.count / distribution.max) * 100)}%` : "0%";
                const code = row.country.length > 2
                  ? row.country.slice(0, 2).toUpperCase()
                  : row.country.toUpperCase();
                return (
                  <div key={row.country} className="efsw-admin-distribution__row">
                    <span>
                      <span className="efsw-admin-distribution__flag">{code}</span>
                      {row.country}
                    </span>
                    <div
                      className="efsw-admin-bar-track"
                      style={{ "--bar-size": size } as React.CSSProperties}
                    >
                      <span />
                    </div>
                    <span className="efsw-admin-distribution__count">{row.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="efsw-admin-registrations" aria-labelledby="members-registrations">
          <header className="efsw-admin-registrations__head">
            <div>
              <h2 id="members-registrations">Recent registrations</h2>
              <p>
                Latest sign-ups across the network. Passwords are hashed — admins never
                see them in plain text.
              </p>
            </div>
            <UserPlus size={16} />
          </header>
          {recentRegistrations.length === 0 ? (
            <div className="efsw-admin-registrations__empty">
              No registrations yet.
            </div>
          ) : (
            <ul className="efsw-admin-registrations__list">
              {recentRegistrations.map((member) => (
                <li
                  key={member.id}
                  className="efsw-admin-registrations__item"
                  onClick={() => onOpenMember(member)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenMember(member);
                    }
                  }}
                >
                  <div className="efsw-admin-registrations__avatar">
                    {initials(member.fullName)}
                  </div>
                  <div className="efsw-admin-registrations__body">
                    <strong>{member.fullName}</strong>
                    <small>
                      <span className="efsw-admin-password-badge" title="Admins cannot view member passwords. Only SHA-256 hashes are stored.">
                        <Lock size={10} />
                        Password protected
                      </span>
                      {member.country || "Country not set"}
                    </small>
                  </div>
                  <div className="efsw-admin-registrations__meta">
                    <strong>{formatTimeAgo(member.joinedAt)}</strong>
                    {statusBadge(member.status)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Toolbar: Search, Multi-Filters, Export ───────────── */}
      <div className="efsw-admin-toolbar">
        <div className="efsw-admin-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search name, email, country, organisation…"
            value={searchQuery}
            onChange={(e) => setFilterValues({ ...filterValues, searchQuery: e.target.value })}
          />
        </div>

        {/* Status — multi-select chips. Clicking toggles inclusion;
            the count badge on each chip tells admins how many
            members would land in that status regardless of the
            other filters. */}
        <div className="efsw-admin-filter-group">
          <span className="efsw-admin-filter-group__label">Status</span>
          <div className="efsw-admin-chip-set">
            {(
              [
                { id: "pending", label: "Pending" },
                { id: "active", label: "Active" },
                { id: "suspended", label: "Suspended" },
              ] as { id: MemberStatusFilter; label: string }[]
            ).map((tab) => {
              const active = statusFilters.includes(tab.id);
              const count = members.filter((m) => m.status === tab.id).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`efsw-admin-chip${active ? " is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() =>
                    setFilterValues({
                      ...filterValues,
                      statusFilters: statusFilters.includes(tab.id)
                        ? statusFilters.filter((s) => s !== tab.id)
                        : [...statusFilters, tab.id],
                    })
                  }
                >
                  <span>{tab.label}</span>
                  <span className="efsw-admin-chip__count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Membership type — same chip pattern. */}
        <div className="efsw-admin-filter-group">
          <span className="efsw-admin-filter-group__label">Type</span>
          <div className="efsw-admin-chip-set">
            {(
              [
                { id: "professional", label: "Professional", Icon: Briefcase },
                { id: "student", label: "Student", Icon: GraduationCap },
                { id: "institutional", label: "Institutional", Icon: Building2 },
              ] as { id: MemberTypeFilter; label: string; Icon: typeof Briefcase }[]
            ).map((tab) => {
              const active = typeFilters.includes(tab.id);
              const count = members.filter((m) => m.membershipType === tab.id).length;
              const Icon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`efsw-admin-chip${active ? " is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() =>
                    setFilterValues({
                      ...filterValues,
                      typeFilters: typeFilters.includes(tab.id)
                        ? typeFilters.filter((s) => s !== tab.id)
                        : [...typeFilters, tab.id],
                    })
                  }
                >
                  <Icon size={12} strokeWidth={2.2} aria-hidden="true" />
                  <span>{tab.label}</span>
                  <span className="efsw-admin-chip__count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Country — multi-select dropdown. Shows the count of chosen
            countries as the trigger label so it stays compact. */}
        <div className="efsw-admin-filter-group">
          <span className="efsw-admin-filter-group__label">Country</span>
          <div className="efsw-admin-multiselect">
            <button
              type="button"
              className={`efsw-admin-multiselect__trigger${countryFilters.length > 0 ? " is-active" : ""}`}
              aria-expanded={countryOpen}
              aria-haspopup="listbox"
              onClick={() => setCountryOpen((v) => !v)}
            >
              <Globe2 size={12} strokeWidth={2.2} aria-hidden="true" />
              <span>
                {countryFilters.length === 0
                  ? "Any"
                  : countryFilters.length === 1
                    ? countryFilters[0]
                    : `${countryFilters.length} selected`}
              </span>
              <ChevronDownIcon size={12} strokeWidth={2.2} aria-hidden="true" className={countryOpen ? "is-flipped" : undefined} />
            </button>
            {countryOpen && (
              <div className="efsw-admin-multiselect__panel" role="listbox">
                {availableCountries.length === 0 ? (
                  <p className="efsw-admin-multiselect__empty">No countries in roster yet.</p>
                ) : (
                  availableCountries.map((country) => {
                    const active = countryFilters.includes(country);
                    const count = members.filter(
                      (m) => m.country?.trim().toLowerCase() === country.toLowerCase(),
                    ).length;
                    return (
                      <button
                        key={country}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`efsw-admin-multiselect__option${active ? " is-active" : ""}`}
                        onClick={() =>
                          setFilterValues({
                            ...filterValues,
                            countryFilters: countryFilters.includes(country)
                              ? countryFilters.filter((c) => c !== country)
                              : [...countryFilters, country],
                          })
                        }
                      >
                        <span className="efsw-admin-multiselect__check" aria-hidden="true">
                          {active ? <Check size={12} strokeWidth={2.4} /> : null}
                        </span>
                        <span className="efsw-admin-multiselect__name">{country}</span>
                        <span className="efsw-admin-multiselect__count">{count}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Experience — bucket selector. Each chip represents a coarse
            years-of-experience range. */}
        <div className="efsw-admin-filter-group">
          <span className="efsw-admin-filter-group__label">Experience</span>
          <div className="efsw-admin-chip-set">
            {(
              [
                { id: "new", label: "< 2 yrs", helper: "New" },
                { id: "mid", label: "2–7 yrs", helper: "Mid" },
                { id: "senior", label: "8–14 yrs", helper: "Senior" },
                { id: "expert", label: "15+ yrs", helper: "Expert" },
              ] as { id: MemberExperienceBucket; label: string; helper: string }[]
            ).map((tab) => {
              const active = experienceFilters.includes(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`efsw-admin-chip${active ? " is-active" : ""}`}
                  aria-pressed={active}
                  title={tab.helper}
                  onClick={() =>
                    setFilterValues({
                      ...filterValues,
                      experienceFilters: experienceFilters.includes(tab.id)
                        ? experienceFilters.filter((s) => s !== tab.id)
                        : [...experienceFilters, tab.id],
                    })
                  }
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Result summary + clear + export */}
        <div className="efsw-admin-toolbar__tail">
          {totalActiveFilters > 0 && (
            <button
              type="button"
              className="efsw-admin-clear-filters"
              onClick={clearAllFilters}
            >
              <XIcon size={11} strokeWidth={2.4} aria-hidden="true" />
              Clear {totalActiveFilters} filter{totalActiveFilters === 1 ? "" : "s"}
            </button>
          )}
          <span className="efsw-admin-result-count">
            {filteredMembers.length} of {members.length} members
          </span>
          <button
            type="button"
            className="efsw-admin-outline-action"
            onClick={onExportCsv}
          >
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Members table ────────────────────────────────────────── */}
      <div className="efsw-admin-table-wrap">
        <table className="efsw-admin-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>
                <BulkSelectCheckbox
                  checked={allCurrentPageSelected}
                  indeterminate={someCurrentPageSelected}
                  onChange={handleSelectAll}
                  ariaLabel="Select all members on this page"
                />
              </th>
              <th>Member</th>
              <th>Country / institution</th>
              <th>Type</th>
              <th>Status</th>
              <th>Joined</th>
              <th style={{ textAlign: "end" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMembers.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="efsw-admin-empty">
                    <AlertCircle size={20} />
                    <h2>No members match the current filters</h2>
                    <p>Try a different status or clear the search box to see all members.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedMembers.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => onOpenMember(member)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onOpenMember(member);
                  }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <BulkSelectCheckbox
                      checked={selectedIds.has(member.id)}
                      onChange={(checked) => handleSelectOne(member.id, checked)}
                      ariaLabel={`Select ${member.fullName}`}
                    />
                  </td>
                  <td>
                    <div className="efsw-admin-member-cell">
                      <div className="efsw-admin-member-avatar">
                        {initials(member.fullName)}
                      </div>
                      <span>
                        <strong>{member.fullName}</strong>
                        <small>{member.email}</small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong style={{ fontSize: "0.76rem" }}>{member.country || "—"}</strong>
                    <small>{member.organization || member.university || "—"}</small>
                  </td>
                  <td>{typeBadge(member.membershipType)}</td>
                  <td>{statusBadge(member.status)}</td>
                  <td>
                    <small style={{ color: "var(--admin-muted)" }}>
                      {formatDate(member.joinedAt)}
                    </small>
                  </td>
                  <td style={{ textAlign: "end" }}>
                    <div
                      style={{ display: "inline-flex", gap: "0.4rem" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {member.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(member, "active")}
                          className="efsw-admin-icon-button"
                          title="Approve member"
                          aria-label={`Approve ${member.fullName}`}
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {member.status === "active" && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(member, "suspended")}
                          className="efsw-admin-icon-button"
                          title="Suspend member"
                          aria-label={`Suspend ${member.fullName}`}
                        >
                          <Ban size={14} />
                        </button>
                      )}
                      {member.status === "suspended" && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(member, "active")}
                          className="efsw-admin-icon-button"
                          title="Reactivate member"
                          aria-label={`Reactivate ${member.fullName}`}
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenMember(member)}
                        className="efsw-admin-icon-button"
                        title="Open full profile"
                        aria-label={`Open ${member.fullName}'s profile`}
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {filteredMembers.length > ITEMS_PER_PAGE && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              borderTop: "1px solid var(--admin-line)",
              fontSize: "0.72rem",
              color: "var(--admin-muted)",
            }}
          >
            <span>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length}
            </span>
            <div style={{ display: "inline-flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="efsw-admin-icon-button"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ alignSelf: "center" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="efsw-admin-icon-button"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});