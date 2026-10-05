"use client";

import { memo, useMemo } from "react";
import {
  UsersRound,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  Layout,
  Layers,
  ShieldCheck,
  TrendingUp,
  Mail,
  Globe2,
} from "lucide-react";
import { AdminActivity, AdminContentItem, AdminMember } from "@/lib/admin-data";
import { AdminView } from "../AdminSidebar";

interface AdminOverviewViewProps {
  members: AdminMember[];
  content: AdminContentItem[];
  activity: AdminActivity[];
  onNavigate: (view: AdminView) => void;
  onOpenNewContent: () => void;
}

const recentRegistrations = (members: AdminMember[]) =>
  [...members]
    .filter((m) => m.joinedAt)
    .sort((a, b) => Date.parse(b.joinedAt ?? "") - Date.parse(a.joinedAt ?? ""))
    .slice(0, 5);

export const AdminOverviewView = memo(function AdminOverviewView({
  members,
  content,
  activity,
  onNavigate,
  onOpenNewContent,
}: AdminOverviewViewProps) {
  const pendingCount = members.filter((m) => m.status === "pending").length;
  const activeCount = members.filter((m) => m.status === "active").length;
  const suspendedCount = members.filter((m) => m.status === "suspended").length;

  const publishedNews = content.filter((c) => c.kind === "news" && c.status === "published").length;
  const publishedDocs = content.filter((c) => c.kind === "document" && c.status === "published").length;
  const draftContentCount = content.filter((c) => c.status === "draft").length;

  const professionalCount = members.filter((m) => m.membershipType === "professional").length;
  const studentCount = members.filter((m) => m.membershipType === "student").length;
  const institutionalCount = members.filter((m) => m.membershipType === "institutional").length;
  const totalMembers = members.length;

  const countryCount = new Set(members.map((m) => m.country).filter(Boolean)).size;
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = members.filter(
    (m) => m.joinedAt && Date.parse(m.joinedAt) >= sevenDaysAgo,
  ).length;

  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const member of members) {
      const country = member.country?.trim() || "Unspecified";
      counts.set(country, (counts.get(country) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [members]);
  const distMax = distribution[0]?.count ?? 0;

  const recent = recentRegistrations(members);

  const formatActivityTime = (at: string) => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(at));
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
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
  };

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "·";

  return (
    <div style={{ display: "grid", gap: "0.85rem" }}>
      {/* ── KPI summary cards ──────────────────────────────────── */}
      <div className="efsw-admin-summary-grid">
        <div className="efsw-admin-summary-card">
          <div className="efsw-admin-summary-card__head">
            <span className="efsw-admin-summary-card__label">Total members</span>
            <span className="efsw-admin-summary-card__icon"><UsersRound size={17} /></span>
          </div>
          <div className="efsw-admin-summary-card__value">{totalMembers}</div>
          <div className="efsw-admin-summary-card__meta">
            <strong>{newThisWeek}</strong> new this week ·{" "}
            <strong>{countryCount}</strong> {countryCount === 1 ? "country" : "countries"}
          </div>
        </div>

        <div className="efsw-admin-summary-card is-warning">
          <div className="efsw-admin-summary-card__head">
            <span className="efsw-admin-summary-card__label">Pending review</span>
            <span className="efsw-admin-summary-card__icon"><Clock size={17} /></span>
          </div>
          <div className="efsw-admin-summary-card__value">{pendingCount}</div>
          <div className="efsw-admin-summary-card__meta">
            <button
              type="button"
              className="efsw-admin-text-action"
              onClick={() => onNavigate("members")}
            >
              Open queue <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        <div className="efsw-admin-summary-card">
          <div className="efsw-admin-summary-card__head">
            <span className="efsw-admin-summary-card__label">Published content</span>
            <span className="efsw-admin-summary-card__icon"><FileText size={17} /></span>
          </div>
          <div className="efsw-admin-summary-card__value">
            {publishedNews + publishedDocs}
            <span className="efsw-admin-summary-card__delta">{draftContentCount} drafts</span>
          </div>
          <div className="efsw-admin-summary-card__meta">
            <strong>{publishedNews}</strong> news · <strong>{publishedDocs}</strong> documents
          </div>
        </div>

        <div className="efsw-admin-summary-card">
          <div className="efsw-admin-summary-card__head">
            <span className="efsw-admin-summary-card__label">Active sessions</span>
            <span className="efsw-admin-summary-card__icon"><ShieldCheck size={17} /></span>
          </div>
          <div className="efsw-admin-summary-card__value">{activeCount}</div>
          <div className="efsw-admin-summary-card__meta">
            {suspendedCount > 0
              ? <><strong>{suspendedCount}</strong> suspended</>
              : <>All accounts in good standing</>}
          </div>
        </div>
      </div>

      {/* ── Welcome band ───────────────────────────────────────── */}
      <section
        className="efsw-admin-panel"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "center",
          gap: "1.5rem",
          padding: "1.5rem 1.75rem",
          background: "linear-gradient(120deg, var(--admin-green-soft) 0%, var(--admin-surface) 100%)",
        }}
      >
        <div>
          <span className="efsw-admin-eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            <Sparkles size={12} /> Operations
          </span>
          <h2
            style={{
              margin: "0.4rem 0 0.3rem",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.4rem, 2vw, 1.85rem)",
              fontWeight: 650,
              lineHeight: 1.05,
            }}
          >
            Welcome back to the EFSW control centre
          </h2>
          <p
            style={{
              margin: 0,
              color: "var(--admin-muted)",
              fontSize: "0.82rem",
              maxWidth: "52rem",
            }}
          >
            Approve new members, publish trilingual research, and keep the regional
            directory in sync with R2 and Supabase.
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
          <button
            type="button"
            onClick={onOpenNewContent}
            className="efsw-admin-primary"
          >
            <FileText size={13} /> New content
          </button>
          <button
            type="button"
            onClick={() => onNavigate("layout")}
            className="efsw-admin-outline-action"
          >
            <Layout size={13} /> Customise layout
          </button>
          <button
            type="button"
            onClick={() => onNavigate("broadcast")}
            className="efsw-admin-outline-action"
          >
            <Mail size={13} /> Broadcast
          </button>
        </div>
      </section>

      {/* ── Two-column panels ───────────────────────────────────── */}
      <div className="efsw-admin-overview-grid">
        <section className="efsw-admin-panel" aria-labelledby="overview-activity">
          <header className="efsw-admin-panel__head">
            <div>
              <span className="efsw-admin-eyebrow">Recent activity</span>
              <h2 id="overview-activity">Audit stream</h2>
            </div>
            <button
              type="button"
              className="efsw-admin-text-action"
              onClick={() => onNavigate("activity")}
            >
              View log <ArrowUpRight size={13} />
            </button>
          </header>
          {activity.length === 0 ? (
            <div className="efsw-admin-empty">
              <Clock size={20} />
              <h2>No activity recorded yet</h2>
              <p>Member approvals, content changes, and broadcasts will appear here.</p>
            </div>
          ) : (
            <ul className="efsw-admin-activity-list">
              {activity.slice(0, 6).map((act) => {
                const tone =
                  act.tone === "success"
                    ? "is-success"
                    : act.tone === "warning"
                    ? "is-warning"
                    : "";
                return (
                  <article key={act.id}>
                    <div className={`efsw-admin-activity-icon ${tone}`}>
                      {act.tone === "success" ? (
                        <CheckCircle2 size={13} />
                      ) : act.tone === "warning" ? (
                        <AlertCircle size={13} />
                      ) : (
                        <Clock size={13} />
                      )}
                    </div>
                    <span>
                      <strong>{act.action}</strong>
                      <p>{act.detail}</p>
                    </span>
                    <time dateTime={act.at}>{formatActivityTime(act.at)}</time>
                  </article>
                );
              })}
            </ul>
          )}
        </section>

        <section className="efsw-admin-panel" aria-labelledby="overview-recent">
          <header className="efsw-admin-panel__head">
            <div>
              <span className="efsw-admin-eyebrow">Recent registrations</span>
              <h2 id="overview-recent">Latest members</h2>
            </div>
            <button
              type="button"
              className="efsw-admin-text-action"
              onClick={() => onNavigate("members")}
            >
              Manage <ArrowUpRight size={13} />
            </button>
          </header>
          {recent.length === 0 ? (
            <div className="efsw-admin-empty">
              <UsersRound size={20} />
              <h2>No registrations yet</h2>
              <p>Members who sign up will appear here in chronological order.</p>
            </div>
          ) : (
            <ul className="efsw-admin-registrations__list">
              {recent.map((member) => (
                <li
                  key={member.id}
                  className="efsw-admin-registrations__item"
                  onClick={() => onNavigate("members")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="efsw-admin-registrations__avatar">
                    {initials(member.fullName)}
                  </div>
                  <div className="efsw-admin-registrations__body">
                    <strong>{member.fullName}</strong>
                    <small>
                      {member.country || "Country not set"} · {member.membershipType}
                    </small>
                  </div>
                  <div className="efsw-admin-registrations__meta">
                    <strong>{formatTimeAgo(member.joinedAt)}</strong>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Lower row: membership type + geographic ──────────────── */}
      <div className="efsw-admin-overview-grid efsw-admin-overview-grid--lower">
        <section className="efsw-admin-panel" aria-labelledby="overview-membership-types">
          <header className="efsw-admin-panel__head">
            <div>
              <span className="efsw-admin-eyebrow">Membership types</span>
              <h2 id="overview-membership-types">Distribution</h2>
            </div>
            <span className="efsw-admin-status">
              <i aria-hidden /> {totalMembers} total
            </span>
          </header>
          <div className="efsw-admin-bars">
            <div className="efsw-admin-bar-row">
              <div><span>Professional</span><strong>{professionalCount}</strong></div>
              <div
                className="efsw-admin-bar-track"
                style={{ "--bar-size": `${totalMembers > 0 ? (professionalCount / totalMembers) * 100 : 0}%` } as React.CSSProperties}
              >
                <span />
              </div>
            </div>
            <div className="efsw-admin-bar-row">
              <div><span>Student</span><strong>{studentCount}</strong></div>
              <div
                className="efsw-admin-bar-track"
                style={{ "--bar-size": `${totalMembers > 0 ? (studentCount / totalMembers) * 100 : 0}%` } as React.CSSProperties}
              >
                <span className="is-pending" />
              </div>
            </div>
            <div className="efsw-admin-bar-row">
              <div><span>Institutional</span><strong>{institutionalCount}</strong></div>
              <div
                className="efsw-admin-bar-track"
                style={{ "--bar-size": `${totalMembers > 0 ? (institutionalCount / totalMembers) * 100 : 0}%` } as React.CSSProperties}
              >
                <span />
              </div>
            </div>
          </div>
          <p className="efsw-admin-panel__note">
            <TrendingUp size={12} />
            Composition is computed live from the directory — no separate sync needed.
          </p>
        </section>

        <section className="efsw-admin-panel" aria-labelledby="overview-geo">
          <header className="efsw-admin-panel__head">
            <div>
              <span className="efsw-admin-eyebrow">Geographic spread</span>
              <h2 id="overview-geo">Top countries</h2>
            </div>
            <Globe2 size={14} />
          </header>
          {distribution.length === 0 ? (
            <div className="efsw-admin-empty">
              <Globe2 size={20} />
              <h2>No country data yet</h2>
              <p>Set your country in your member profile to appear on the map.</p>
            </div>
          ) : (
            <div className="efsw-admin-bars">
              {distribution.map((row) => {
                const code = row.country.length > 2 ? row.country.slice(0, 2).toUpperCase() : row.country.toUpperCase();
                const size = distMax > 0 ? `${Math.round((row.count / distMax) * 100)}%` : "0%";
                return (
                  <div key={row.country} className="efsw-admin-bar-row">
                    <div>
                      <span>
                        <span className="efsw-admin-distribution__flag" style={{ marginRight: "0.4rem" }}>
                          {code}
                        </span>
                        {row.country}
                      </span>
                      <strong>{row.count}</strong>
                    </div>
                    <div
                      className="efsw-admin-bar-track"
                      style={{ "--bar-size": size } as React.CSSProperties}
                    >
                      <span />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
});