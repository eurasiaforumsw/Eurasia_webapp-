"use client";

import { memo, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Download,
  Filter,
} from "lucide-react";
import { AdminActivity } from "@/lib/admin-data";
import { useDebounce } from "@/hooks/useDebounce";

interface AdminActivityViewProps {
  activity: AdminActivity[];
}

export const AdminActivityView = memo(function AdminActivityView({
  activity,
}: AdminActivityViewProps) {
  const [toneFilter, setToneFilter] = useState<"all" | "success" | "warning" | "neutral">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery.trim().toLowerCase(), 200);

  const filtered = useMemo(() => {
    return activity.filter((item) => {
      if (toneFilter !== "all" && item.tone !== toneFilter) return false;
      if (!debouncedSearch) return true;
      const haystack = [item.action, item.detail].join(" ").toLowerCase();
      return haystack.includes(debouncedSearch);
    });
  }, [activity, toneFilter, debouncedSearch]);

  const formatTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso));
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search activity or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-surface-subtle bg-surface-raised py-2.5 pl-10 pr-4 text-xs font-medium text-text-primary placeholder:text-text-muted focus:border-teal focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-surface-subtle bg-surface-raised p-1 text-xs">
          {(
            [
              { id: "all", label: "All" },
              { id: "success", label: "Success" },
              { id: "warning", label: "Warning / deletion" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setToneFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 font-bold transition-all ${
                toneFilter === tab.id
                  ? "bg-teal text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="overflow-hidden rounded-2xl border border-surface-subtle bg-surface-raised shadow-sm">
        <div className="p-4 border-b border-surface-subtle bg-surface-base/50 flex items-center justify-between text-xs text-text-muted font-semibold">
          <span>Recent activity ({filtered.length} entries)</span>
          <span>Security audit log</span>
        </div>

        <div className="divide-y divide-surface-subtle">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              No activity matches your filters.
            </div>
          ) : (
            filtered.map((item) => {
              const isSuccess = item.tone === "success";
              const isWarning = item.tone === "warning";

              return (
                <div key={item.id} className="flex items-start gap-4 p-4 hover:bg-surface-base/30 transition-colors">
                  <div
                    className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
                      isSuccess
                        ? "bg-emerald-500/15 text-emerald-400"
                        : isWarning
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-surface-subtle text-text-muted"
                    }`}
                  >
                    {isSuccess ? (
                      <CheckCircle2 size={16} />
                    ) : isWarning ? (
                      <AlertCircle size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="text-xs font-bold text-text-primary">
                        {item.action}
                      </div>
                      <div className="text-[11px] text-text-muted font-medium">
                        {formatTime(item.at)}
                      </div>
                    </div>
                    <div className="text-xs text-text-secondary mt-1 break-words">
                      {item.detail}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});
