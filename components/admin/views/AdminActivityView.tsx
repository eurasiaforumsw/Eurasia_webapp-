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
    <div style={{ display: "grid", gap: "1rem" }}>
      {/* Control bar */}
      <div
        className="efsw-admin-toolbar"
        style={{ justifyContent: "space-between" }}
      >
        <div className="efsw-admin-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Search activity or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="efsw-admin-segmented">
          {(
            [
              { id: "all", label: "All" },
              { id: "success", label: "Success" },
              { id: "warning", label: "Warning / deletion" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setToneFilter(tab.id)}
              className={toneFilter === tab.id ? "is-active" : ""}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity timeline list */}
      <section className="efsw-admin-panel">
        <header className="efsw-admin-panel__head">
          <div>
            <span className="efsw-admin-eyebrow">Audit log</span>
            <h2>Recent activity</h2>
          </div>
          <span className="efsw-admin-status">
            <i aria-hidden /> {filtered.length} entries
          </span>
        </header>

        <div className="efsw-admin-activity-list" style={{ margin: "0 1.35rem", borderTop: "1px solid var(--admin-line)" }}>
          {filtered.length === 0 ? (
            <div className="efsw-admin-empty">
              <Activity size={20} />
              <h2>No activity matches your filters</h2>
              <p>Try a broader search term or switch the tone filter back to All.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const tone =
                item.tone === "success"
                  ? "is-success"
                  : item.tone === "warning"
                  ? "is-warning"
                  : "";

              return (
                <article key={item.id}>
                  <div className={`efsw-admin-activity-icon ${tone}`}>
                    {item.tone === "success" ? (
                      <CheckCircle2 size={13} />
                    ) : item.tone === "warning" ? (
                      <AlertCircle size={13} />
                    ) : (
                      <Clock size={13} />
                    )}
                  </div>
                  <span>
                    <strong>{item.action}</strong>
                    <p>{item.detail}</p>
                  </span>
                  <time dateTime={item.at}>{formatTime(item.at)}</time>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
});
