"use client";

import { memo, useMemo, useState, useEffect } from "react";
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
  Settings,
  CalendarCheck,
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

interface EventRegistrationStats {
  totalActiveEvents: number;
  totalRegistrationsThisMonth: number;
  isLoading: boolean;
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
  const [eventStats, setEventStats] = useState<EventRegistrationStats>({
    totalActiveEvents: 0,
    totalRegistrationsThisMonth: 0,
    isLoading: true,
  });

  // Fetch event registration stats
  useEffect(() => {
    let mounted = true;

    async function fetchEventStats() {
      try {
        const response = await fetch('/api/admin/events/registration-stats');
        if (!response.ok) {
          console.warn('Failed to fetch event stats');
          if (mounted) {
            setEventStats({ totalActiveEvents: 0, totalRegistrationsThisMonth: 0, isLoading: false });
          }
          return;
        }
        const data = await response.json();
        if (mounted) {
          setEventStats({
            totalActiveEvents: data.totalActiveEvents || 0,
            totalRegistrationsThisMonth: data.totalRegistrationsThisMonth || 0,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error fetching event stats:', error);
        if (mounted) {
          setEventStats({ totalActiveEvents: 0, totalRegistrationsThisMonth: 0, isLoading: false });
        }
      }
    }

    fetchEventStats();

    return () => {
      mounted = false;
    };
  }, []);

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
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Welcome header with user greeting */}
      <div className="efsw-admin-welcome-header">
        <div className="efsw-admin-welcome-header__content">
          <div className="efsw-admin-welcome-header__badge">
            <Sparkles size={14} />
            <span>Dashboard</span>
          </div>
          <h1 className="efsw-admin-welcome-header__title">
            Welcome to EFSW Control Centre
          </h1>
          <p className="efsw-admin-welcome-header__subtitle">
            Monitor member activity, manage content, and track engagement across the platform
          </p>
        </div>
        <div className="efsw-admin-welcome-header__actions">
          <button
            type="button"
            onClick={onOpenNewContent}
            className="efsw-admin-btn-primary"
          >
            <FileText size={16} />
            <span>Create Content</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("analytics")}
            className="efsw-admin-btn-secondary"
          >
            <TrendingUp size={16} />
            <span>View Analytics</span>
          </button>
        </div>
      </div>

      {/* Quick stats - improved visual hierarchy */}
      <div className="efsw-admin-stats-grid">
        <div className="efsw-admin-stat-card">
          <div className="efsw-admin-stat-card__icon-wrapper">
            <UsersRound size={24} strokeWidth={2} />
          </div>
          <div className="efsw-admin-stat-card__content">
            <span className="efsw-admin-stat-card__label">Total Members</span>
            <div className="efsw-admin-stat-card__value">{totalMembers.toLocaleString()}</div>
            <div className="efsw-admin-stat-card__meta">
              <span className="efsw-admin-stat-badge efsw-admin-stat-badge--success">
                +{newThisWeek} this week
              </span>
              <span className="efsw-admin-stat-card__detail">
                {countryCount} {countryCount === 1 ? "country" : "countries"}
              </span>
            </div>
          </div>
        </div>

        <div className="efsw-admin-stat-card efsw-admin-stat-card--warning">
          <div className="efsw-admin-stat-card__icon-wrapper">
            <Clock size={24} strokeWidth={2} />
          </div>
          <div className="efsw-admin-stat-card__content">
            <span className="efsw-admin-stat-card__label">Pending Review</span>
            <div className="efsw-admin-stat-card__value">{pendingCount}</div>
            <div className="efsw-admin-stat-card__meta">
              <button
                type="button"
                className="efsw-admin-stat-card__action"
                onClick={() => onNavigate("members")}
              >
                Review now <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="efsw-admin-stat-card">
          <div className="efsw-admin-stat-card__icon-wrapper">
            <FileText size={24} strokeWidth={2} />
          </div>
          <div className="efsw-admin-stat-card__content">
            <span className="efsw-admin-stat-card__label">Published Content</span>
            <div className="efsw-admin-stat-card__value">
              {(publishedNews + publishedDocs).toLocaleString()}
              {draftContentCount > 0 && (
                <span className="efsw-admin-stat-card__badge">{draftContentCount}</span>
              )}
            </div>
            <div className="efsw-admin-stat-card__meta">
              <span className="efsw-admin-stat-card__detail">
                {publishedNews} news · {publishedDocs} documents
              </span>
            </div>
          </div>
        </div>

        <div className="efsw-admin-stat-card">
          <div className="efsw-admin-stat-card__icon-wrapper">
            <ShieldCheck size={24} strokeWidth={2} />
          </div>
          <div className="efsw-admin-stat-card__content">
            <span className="efsw-admin-stat-card__label">Active Members</span>
            <div className="efsw-admin-stat-card__value">{activeCount.toLocaleString()}</div>
            <div className="efsw-admin-stat-card__meta">
              {suspendedCount > 0 ? (
                <span className="efsw-admin-stat-badge efsw-admin-stat-badge--danger">
                  {suspendedCount} suspended
                </span>
              ) : (
                <span className="efsw-admin-stat-card__detail">All in good standing</span>
              )}
            </div>
          </div>
        </div>

        {/* NEW: Event Registrations Card */}
        <div className="efsw-admin-stat-card efsw-admin-stat-card--accent">
          <div className="efsw-admin-stat-card__icon-wrapper">
            <CalendarCheck size={24} strokeWidth={2} />
          </div>
          <div className="efsw-admin-stat-card__content">
            <span className="efsw-admin-stat-card__label">Event Registrations</span>
            <div className="efsw-admin-stat-card__value">
              {eventStats.isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '2rem' }}>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal border-t-transparent" />
                </div>
              ) : (
                eventStats.totalRegistrationsThisMonth.toLocaleString()
              )}
            </div>
            <div className="efsw-admin-stat-card__meta">
              <span className="efsw-admin-stat-card__detail">
                {eventStats.isLoading ? '—' : `${eventStats.totalActiveEvents} active ${eventStats.totalActiveEvents === 1 ? 'event' : 'events'}`}
              </span>
              <button
                type="button"
                className="efsw-admin-stat-card__action"
                onClick={() => onNavigate("content")}
                disabled={eventStats.isLoading}
              >
                Manage <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions panel */}
      <section className="efsw-admin-quick-actions-panel">
        <header className="efsw-admin-panel__head">
          <div>
            <span className="efsw-admin-eyebrow">Quick actions</span>
            <h2>Common tasks</h2>
          </div>
        </header>
        <div className="efsw-admin-quick-actions-grid">
          <button
            type="button"
            onClick={onOpenNewContent}
            className="efsw-admin-quick-action-card"
          >
            <div className="efsw-admin-quick-action-card__icon">
              <FileText size={20} />
            </div>
            <div className="efsw-admin-quick-action-card__content">
              <h3>Create Content</h3>
              <p>Write and publish news or documents</p>
            </div>
            <ArrowUpRight className="efsw-admin-quick-action-card__arrow" size={16} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("members")}
            className="efsw-admin-quick-action-card"
          >
            <div className="efsw-admin-quick-action-card__icon">
              <UsersRound size={20} />
            </div>
            <div className="efsw-admin-quick-action-card__content">
              <h3>Manage Members</h3>
              <p>Review and approve registrations</p>
            </div>
            <ArrowUpRight className="efsw-admin-quick-action-card__arrow" size={16} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("layout")}
            className="efsw-admin-quick-action-card"
          >
            <div className="efsw-admin-quick-action-card__icon">
              <Layout size={20} />
            </div>
            <div className="efsw-admin-quick-action-card__content">
              <h3>Edit Layout</h3>
              <p>Customize website appearance</p>
            </div>
            <ArrowUpRight className="efsw-admin-quick-action-card__arrow" size={16} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("broadcast")}
            className="efsw-admin-quick-action-card"
          >
            <div className="efsw-admin-quick-action-card__icon">
              <Mail size={20} />
            </div>
            <div className="efsw-admin-quick-action-card__content">
              <h3>Send Broadcast</h3>
              <p>Email campaigns to members</p>
            </div>
            <ArrowUpRight className="efsw-admin-quick-action-card__arrow" size={16} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("analytics")}
            className="efsw-admin-quick-action-card"
          >
            <div className="efsw-admin-quick-action-card__icon">
              <TrendingUp size={20} />
            </div>
            <div className="efsw-admin-quick-action-card__content">
              <h3>View Reports</h3>
              <p>Analytics and insights</p>
            </div>
            <ArrowUpRight className="efsw-admin-quick-action-card__arrow" size={16} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className="efsw-admin-quick-action-card"
          >
            <div className="efsw-admin-quick-action-card__icon">
              <Settings size={20} />
            </div>
            <div className="efsw-admin-quick-action-card__content">
              <h3>Settings</h3>
              <p>Organization preferences</p>
            </div>
            <ArrowUpRight className="efsw-admin-quick-action-card__arrow" size={16} />
          </button>
        </div>
      </section>

      {/* Two-column panels - Activity & Recent members */}
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