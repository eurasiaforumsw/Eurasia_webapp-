"use client";

import { memo } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, Radio, Sun, Moon } from "lucide-react";
import { AdminView } from "./AdminSidebar";
import { useTheme } from "@/contexts/ThemeContext";

interface AdminTopbarProps {
  currentView: AdminView;
  onOpenMobileNav: () => void;
}

const VIEW_TITLES: Record<AdminView, { title: string; subtitle: string }> = {
  overview: {
    title: "System overview and statistics",
    subtitle: "Real-time metrics, member activities, and platform health",
  },
  analytics: {
    title: "Analytics & Performance",
    subtitle: "Content engagement, traffic insights, and growth metrics",
  },
  members: {
    title: "Manage network members",
    subtitle: "Member applications, credentials verification, and directory",
  },
  content: {
    title: "Manage content and resources",
    subtitle: "Newsroom stories, research papers, and policy briefings",
  },
  layout: {
    title: "Arrange and customise the website",
    subtitle: "Hero visual sequence, leadership messages, and live section switches",
  },
  messages: {
    title: "In-app messaging",
    subtitle: "Send messages to members — auto-expires after 120 days",
  },
  broadcast: {
    title: "Broadcast email campaigns",
    subtitle: "Send newsletters and event updates to targeted member groups",
  },
  activity: {
    title: "Activity log (Audit Trail)",
    subtitle: "Administrative events, changes, and historical logs",
  },
  settings: {
    title: "Organisation settings",
    subtitle: "Organization profile, default language, and alerts",
  },
};

export const AdminTopbar = memo(function AdminTopbar({
  currentView,
  onOpenMobileNav,
}: AdminTopbarProps) {
  const info = VIEW_TITLES[currentView] || VIEW_TITLES.overview;
  const today = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
  }).format(new Date());

  /* Light/dark toggle. The button shows the icon for the theme you can
     switch TO (Sun when in dark, Moon when in light), so the meaning of
     "click to change" is always obvious. */
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-surface-deep border-b border-border-subtle px-6">
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={onOpenMobileNav}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-raised text-text-muted hover:text-text-primary lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-lg font-bold text-text-primary">
              {info.title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-teal/15 px-2.5 py-0.5 text-[11px] font-semibold" style={{ color: "var(--admin-green)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="hidden text-xs text-text-muted md:block truncate">
            {info.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden xl:block text-right text-xs">
          <div className="font-medium text-text-secondary">{today}</div>
          <div className="text-[11px] text-text-muted">EFSW Regional Hub v2.4</div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-surface-raised px-3 py-2 text-xs font-semibold text-text-secondary transition-all hover:text-accent-primary"
        >
          {isDark ? (
            <Sun size={15} aria-hidden />
          ) : (
            <Moon size={15} aria-hidden />
          )}
          <span className="hidden sm:inline">
            {isDark ? "Light" : "Dark"}
          </span>
        </button>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-raised px-3.5 py-2 text-xs font-semibold text-text-secondary transition-all hover:text-accent-primary"
        >
          <span>View live site</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </header>
  );
});
