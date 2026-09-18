"use client";

import { memo, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  Check,
  Ban,
  Eye,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserRound,
  AlertCircle,
} from "lucide-react";
import { AdminMember } from "@/lib/admin-data";
import { useDebounce } from "@/hooks/useDebounce";

export type MemberFilter = "all" | "pending" | "active" | "suspended";

interface AdminMembersViewProps {
  members: AdminMember[];
  onOpenMember: (member: AdminMember) => void;
  onUpdateStatus: (member: AdminMember, status: AdminMember["status"]) => void;
  onExportCsv: () => void;
}

const ITEMS_PER_PAGE = 8;

export const AdminMembersView = memo(function AdminMembersView({
  members,
  onOpenMember,
  onUpdateStatus,
  onExportCsv,
}: AdminMembersViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MemberFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query to prevent re-filtering on every keystroke
  const debouncedQuery = useDebounce(searchQuery.trim().toLowerCase(), 220);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesStatus = statusFilter === "all" || member.status === statusFilter;
      if (!matchesStatus) return false;

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
  }, [members, statusFilter, debouncedQuery]);

  // Reset to first page when filter/search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [debouncedQuery, statusFilter]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / ITEMS_PER_PAGE));
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  const formatDate = (value: string) => {
    try {
      return new Intl.DateTimeFormat("th-TH", { dateStyle: "short" }).format(new Date(value));
    } catch {
      return "-";
    }
  };

  const statusBadge = (status: AdminMember["status"]) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Pending review
          </span>
        );
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400 border border-red-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            Suspended
          </span>
        );
      default:
        return null;
    }
  };

  const typeBadge = (type: AdminMember["membershipType"]) => {
    switch (type) {
      case "professional":
        return (
          <span className="rounded-md bg-teal/15 px-2 py-0.5 text-[11px] font-bold text-teal-light">
            Professional
          </span>
        );
      case "student":
        return (
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-300">
            Student
          </span>
        );
      case "institutional":
        return (
          <span className="rounded-md bg-purple-500/15 px-2 py-0.5 text-[11px] font-bold text-purple-300">
            Institutional
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control bar: Search, Filters, CSV Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input with icon */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search name, email, institution, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-surface-subtle bg-surface-raised py-2.5 pl-10 pr-4 text-xs font-medium text-text-primary placeholder:text-text-muted focus:border-teal focus:outline-none transition-colors"
          />
        </div>

        {/* Filter pills & Export button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-surface-subtle bg-surface-raised p-1 text-xs">
            {(
              [
                { id: "all", label: "All" },
                { id: "pending", label: "Pending review" },
                { id: "active", label: "Active" },
                { id: "suspended", label: "Suspended" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                  statusFilter === tab.id
                    ? "bg-teal text-white shadow-sm"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-surface-subtle bg-surface-base px-3.5 py-2 text-xs font-bold text-text-primary hover:border-teal hover:text-teal transition-all"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-2xl border border-surface-subtle bg-surface-raised shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-surface-subtle bg-surface-base/80 text-text-muted font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Country / institution</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-subtle">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle size={24} className="text-text-muted" />
                      <p>No members match your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-surface-base/40 transition-colors group cursor-pointer"
                    onClick={() => onOpenMember(member)}
                  >
                    {/* Name and Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-teal/15 text-teal-light font-bold text-xs">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-text-primary group-hover:text-teal-light transition-colors">
                            {member.fullName}
                          </div>
                          <div className="text-[11px] text-text-muted">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Country and Organization */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-text-primary">
                        {member.country || "-"}
                      </div>
                      <div className="text-[11px] text-text-muted truncate max-w-[200px]">
                        {member.organization || member.university || "-"}
                      </div>
                    </td>

                    {/* Membership Type */}
                    <td className="py-3.5 px-4">{typeBadge(member.membershipType)}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{statusBadge(member.status)}</td>

                    {/* Joined Date */}
                    <td className="py-3.5 px-4 text-text-muted">
                      {formatDate(member.joinedAt)}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {member.status === "pending" && (
                          <button
                            onClick={() => onUpdateStatus(member, "active")}
                            title="Approve member"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            <Check size={14} />
                          </button>
                        )}

                        {member.status === "active" && (
                          <button
                            onClick={() => onUpdateStatus(member, "suspended")}
                            title="Suspend temporarily"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Ban size={14} />
                          </button>
                        )}

                        {member.status === "suspended" && (
                          <button
                            onClick={() => onUpdateStatus(member, "active")}
                            title="Reactivate member"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal/15 text-teal-light hover:bg-teal hover:text-white transition-all"
                          >
                            <Check size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => onOpenMember(member)}
                          title="View full details"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-surface-subtle bg-surface-base text-text-muted hover:border-teal hover:text-teal-light transition-all"
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
        </div>

        {/* Pagination bar */}
        {filteredMembers.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between border-t border-surface-subtle bg-surface-base/50 px-4 py-3 text-xs">
            <div className="text-text-muted">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredMembers.length)} of{" "}
              {filteredMembers.length} members
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-subtle bg-surface-raised text-text-muted hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="text-xs font-semibold text-text-secondary">
                Page {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-subtle bg-surface-raised text-text-muted hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
