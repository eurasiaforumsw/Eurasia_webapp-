"use client";

import { memo } from "react";
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

  const recentActivity = activity.slice(0, 6);

  const formatActivityTime = (at: string) => {
    try {
      return new Intl.DateTimeFormat("th-TH", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(at));
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Members */}
        <div className="rounded-2xl border border-surface-subtle bg-surface-raised/80 p-5 backdrop-blur-sm transition-all hover:border-teal/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Active members
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal-light">
              <UsersRound size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-text-primary">
              {activeCount}
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              +{members.length} total
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
            <span>{pendingCount} pending review</span>
            <button
              onClick={() => onNavigate("members")}
              className="font-medium text-teal hover:underline inline-flex items-center gap-0.5"
            >
              Manage <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="rounded-2xl border border-surface-subtle bg-surface-raised/80 p-5 backdrop-blur-sm transition-all hover:border-amber-500/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Pending applications
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-text-primary">
              {pendingCount}
            </span>
            <span className="text-xs font-semibold text-amber-400">
              Requires review
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
            <span>{suspendedCount} suspended</span>
            <button
              onClick={() => onNavigate("members")}
              className="font-medium text-amber-400 hover:underline inline-flex items-center gap-0.5"
            >
              Open queue <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* Published Knowledge & News */}
        <div className="rounded-2xl border border-surface-subtle bg-surface-raised/80 p-5 backdrop-blur-sm transition-all hover:border-teal/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Published content
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal-light">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-text-primary">
              {publishedNews + publishedDocs}
            </span>
            <span className="text-xs font-semibold text-teal-light">
              {draftContentCount} drafts
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
            <span>{publishedNews} news · {publishedDocs} documents</span>
            <button
              onClick={() => onNavigate("content")}
              className="font-medium text-teal hover:underline inline-flex items-center gap-0.5"
            >
              View all <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* System Health / Performance */}
        <div className="rounded-2xl border border-surface-subtle bg-surface-raised/80 p-5 backdrop-blur-sm transition-all hover:border-emerald-500/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Performance status
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-emerald-400">
              100%
            </span>
            <span className="text-xs font-semibold text-text-muted">
              Zero Lag Optimized
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
            <span>Automatic Canvas image compression</span>
            <span className="text-emerald-400 font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-teal/30 bg-gradient-to-r from-teal/20 via-surface-raised to-surface-raised p-6 shadow-md">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold text-teal-light mb-2">
              <Sparkles size={14} className="text-teal" />
              Quick Operational Hub
            </div>
            <h2 className="text-xl font-bold font-display text-text-primary">
              Welcome to the Eurasia Forum control centre
            </h2>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl">
              Manage members across borders, approve access to the research library, and update the website layout in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewContent}
              className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal/30 hover:bg-teal-vivid transition-all"
            >
              <FileText size={16} />
              Add news or document
            </button>
            <button
              onClick={() => onNavigate("layout")}
              className="inline-flex items-center gap-2 rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs font-bold text-text-primary hover:border-teal transition-all"
            >
              <Layout size={16} />
              Customise website
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Activities & Fast Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activities Feed (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-surface-subtle bg-surface-raised p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-surface-subtle pb-4">
            <div>
              <h3 className="text-base font-bold font-display text-text-primary">
                Recent activity (Audit Stream)
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Recent activity and changes in the system
              </p>
            </div>
            <button
              onClick={() => onNavigate("activity")}
              className="text-xs font-semibold text-teal hover:underline inline-flex items-center gap-1"
            >
                View all <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="mt-4 divide-y divide-surface-subtle">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                No recent activity
              </div>
            ) : (
              recentActivity.map((act) => {
                const isSuccess = act.tone === "success";
                const isWarning = act.tone === "warning";

                return (
                  <div key={act.id} className="flex items-start gap-3 py-3.5">
                    <div
                      className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                        isSuccess
                          ? "bg-emerald-500/15 text-emerald-400"
                          : isWarning
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-surface-subtle text-text-muted"
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 size={15} />
                      ) : isWarning ? (
                        <AlertCircle size={15} />
                      ) : (
                        <Clock size={15} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-bold text-text-primary truncate">
                          {act.action}
                        </span>
                        <span className="text-[11px] text-text-muted whitespace-nowrap">
                          {formatActivityTime(act.at)}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5 truncate">
                        {act.detail}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Member Category Breakdown & Platform Overview (1 Col) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 shadow-sm">
            <h3 className="text-base font-bold font-display text-text-primary mb-1">
              Membership types
            </h3>
            <p className="text-xs text-text-muted mb-5">
              Distribution across the three member groups
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-text-secondary">Professional</span>
                  <span className="font-bold text-text-primary">
                    {members.filter((m) => m.membershipType === "professional").length}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal transition-all duration-500"
                    style={{
                      width: `${
                        members.length > 0
                          ? (members.filter((m) => m.membershipType === "professional").length /
                              members.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-text-secondary">Student</span>
                  <span className="font-bold text-text-primary">
                    {members.filter((m) => m.membershipType === "student").length}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{
                      width: `${
                        members.length > 0
                          ? (members.filter((m) => m.membershipType === "student").length /
                              members.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-text-secondary">Institutional</span>
                  <span className="font-bold text-text-primary">
                    {members.filter((m) => m.membershipType === "institutional").length}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{
                      width: `${
                        members.length > 0
                          ? (members.filter((m) => m.membershipType === "institutional").length /
                              members.length) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-surface-subtle">
              <button
                onClick={() => onNavigate("members")}
                className="w-full text-center rounded-xl bg-surface-base py-2.5 text-xs font-bold text-text-primary hover:border-teal hover:text-teal transition-all border border-surface-subtle"
              >
                View all members
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
