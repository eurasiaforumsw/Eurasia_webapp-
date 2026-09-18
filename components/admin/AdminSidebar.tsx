"use client";

import { memo } from "react";
import Link from "next/link";
import {
  BarChart3,
  UsersRound,
  FileText,
  Layout,
  Activity,
  Settings,
  LogOut,
  X,
  ShieldCheck,
} from "lucide-react";
import { AdminSession } from "@/lib/admin-auth";

export type AdminView = "overview" | "members" | "content" | "layout" | "activity" | "settings";

interface AdminSidebarProps {
  currentView: AdminView;
  onSelectView: (view: AdminView) => void;
  session: AdminSession | null;
  pendingMembersCount: number;
  draftContentCount: number;
  onSignOut: () => void;
  mobileNavOpen: boolean;
  onCloseMobileNav: () => void;
}

export const AdminSidebar = memo(function AdminSidebar({
  currentView,
  onSelectView,
  session,
  pendingMembersCount,
  draftContentCount,
  onSignOut,
  mobileNavOpen,
  onCloseMobileNav,
}: AdminSidebarProps) {
  const navItems = [
    {
      id: "overview" as AdminView,
      label: "Overview",
      subtitle: "Dashboard & KPIs",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "members" as AdminView,
      label: "Members",
      subtitle: "Directory & Verifications",
      icon: UsersRound,
      badge: pendingMembersCount > 0 ? `${pendingMembersCount}` : null,
    },
    {
      id: "content" as AdminView,
      label: "Content & Library",
      subtitle: "News & Documents",
      icon: FileText,
      badge: draftContentCount > 0 ? `${draftContentCount}` : null,
    },
    {
      id: "layout" as AdminView,
      label: "Layout",
      subtitle: "Hero, Leadership, Sections",
      icon: Layout,
      badge: null,
    },
    {
      id: "activity" as AdminView,
      label: "Activity log",
      subtitle: "Audit & Logs",
      icon: Activity,
      badge: null,
    },
    {
      id: "settings" as AdminView,
      label: "Settings",
      subtitle: "Settings & Profile",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobileNav}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-surface-subtle bg-surface-deep/95 backdrop-blur-md transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-surface-subtle p-5">
          <Link href="/" className="flex items-center gap-3 text-text-primary hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-teal-vivid text-lg font-bold text-white shadow-lg shadow-teal/20">
              E
            </div>
            <div>
              <div className="font-display text-sm font-bold tracking-tight text-text-primary">
                EFSW Console
              </div>
              <div className="text-[11px] font-medium text-text-muted">
                Admin Management
              </div>
            </div>
          </Link>

          <button
            onClick={onCloseMobileNav}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-subtle text-text-muted hover:bg-surface-raised hover:text-text-primary lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security Badge */}
        <div className="mx-4 my-3 flex items-center gap-2 rounded-lg bg-teal/10 px-3 py-2 text-xs font-semibold text-teal-light">
          <ShieldCheck size={15} className="text-teal" />
          <span>Secured Session · Trilingual</span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobileNav();
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all duration-150 ${
                  isActive
                    ? "bg-teal text-white shadow-md shadow-teal/25 font-semibold"
                    : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    size={19}
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? "text-white" : "text-text-muted group-hover:text-teal"
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-sm font-medium leading-tight">{item.label}</div>
                    <div
                      className={`text-[11px] leading-tight mt-0.5 truncate ${
                        isActive ? "text-teal-light/90" : "text-text-muted"
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive
                        ? "bg-white text-teal"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="border-t border-surface-subtle p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-raised border border-surface-subtle font-bold text-teal text-xs">
                {session?.name ? session.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="truncate min-w-0">
                <div className="truncate text-xs font-bold text-text-primary">
                  {session?.name || "Administrator"}
                </div>
                <div className="truncate text-[11px] text-text-muted">
                  {session?.role || "Super Admin"}
                </div>
              </div>
            </div>

            <button
              onClick={onSignOut}
              title="Log out"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-surface-subtle text-text-muted hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
});
