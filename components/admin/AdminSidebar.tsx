"use client";

import { memo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  UsersRound,
  FileText,
  Layout,
  Activity,
  Settings,
  LogOut,
  X,
  Mail,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { AdminSession } from "@/lib/admin-auth";

export type AdminView = "overview" | "analytics" | "members" | "content" | "layout" | "messages" | "broadcast" | "activity" | "settings";

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

interface NavItem {
  id: AdminView;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  badge: string | null;
  shortcut: string;
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
  const navRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Map<AdminView, HTMLButtonElement>>(new Map());

  const allNavItems: NavItem[] = [
    {
      id: "overview" as AdminView,
      label: "Overview",
      subtitle: "Dashboard & KPIs",
      icon: BarChart3,
      badge: null,
      shortcut: "1",
    },
    {
      id: "analytics" as AdminView,
      label: "Analytics",
      subtitle: "Performance & Insights",
      icon: TrendingUp,
      badge: null,
      shortcut: "2",
    },
    {
      id: "members" as AdminView,
      label: "Members",
      subtitle: "Directory & Verifications",
      icon: UsersRound,
      badge: pendingMembersCount > 0 ? `${pendingMembersCount}` : null,
      shortcut: "3",
    },
    {
      id: "content" as AdminView,
      label: "Content & Library",
      subtitle: "News & Documents",
      icon: FileText,
      badge: draftContentCount > 0 ? `${draftContentCount}` : null,
      shortcut: "4",
    },
    {
      id: "layout" as AdminView,
      label: "Layout",
      subtitle: "Hero, Leadership, Sections",
      icon: Layout,
      badge: null,
      shortcut: "5",
    },
    {
      id: "messages" as AdminView,
      label: "Messages",
      subtitle: "In-app messaging",
      icon: MessageSquare,
      badge: null,
      shortcut: "6",
    },
    {
      id: "broadcast" as AdminView,
      label: "Broadcast",
      subtitle: "Email campaigns",
      icon: Mail,
      badge: null,
      shortcut: "7",
    },
    {
      id: "activity" as AdminView,
      label: "Activity log",
      subtitle: "Audit & Logs",
      icon: Activity,
      badge: null,
      shortcut: "8",
    },
    {
      id: "settings" as AdminView,
      label: "Settings",
      subtitle: "Settings & Profile",
      icon: Settings,
      badge: null,
      shortcut: "9",
    },
  ];

  // Filter menu items based on role
  const navItems = allNavItems.filter((item) => {
    if (session?.role === "super-admin") {
      return true; // Super admin sees everything
    }
    if (session?.role === "content-editor") {
      // Content editors cannot access Members and Settings
      return item.id !== "members" && item.id !== "settings";
    }
    return false; // Member role shouldn't reach here (blocked by middleware)
  });

  // Keyboard navigation handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, currentIndex: number) => {
      let handled = false;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % navItems.length;
          itemRefs.current.get(navItems[nextIndex].id)?.focus();
          handled = true;
          break;

        case "ArrowUp":
          e.preventDefault();
          const prevIndex = currentIndex === 0 ? navItems.length - 1 : currentIndex - 1;
          itemRefs.current.get(navItems[prevIndex].id)?.focus();
          handled = true;
          break;

        case "Home":
          e.preventDefault();
          itemRefs.current.get(navItems[0].id)?.focus();
          handled = true;
          break;

        case "End":
          e.preventDefault();
          itemRefs.current.get(navItems[navItems.length - 1].id)?.focus();
          handled = true;
          break;

        case "Escape":
          if (mobileNavOpen) {
            e.preventDefault();
            onCloseMobileNav();
            handled = true;
          }
          break;
      }

      return handled;
    },
    [navItems, mobileNavOpen, onCloseMobileNav]
  );

  // Global keyboard shortcuts (Cmd/Ctrl + 1-8)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "8") {
        const index = parseInt(e.key, 10) - 1;
        if (index < navItems.length) {
          e.preventDefault();
          onSelectView(navItems[index].id);
          itemRefs.current.get(navItems[index].id)?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [navItems, onSelectView]);

  // Focus trap for mobile drawer
  useEffect(() => {
    if (!mobileNavOpen) return;

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = navRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, [mobileNavOpen]);

  // Auto-focus first item when mobile nav opens
  useEffect(() => {
    if (mobileNavOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [mobileNavOpen]);

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
        ref={navRef}
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-surface-deep transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Admin navigation"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-5">
          <Link
            href="/"
            className="flex items-center gap-3 text-text-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 focus:ring-offset-surface-deep rounded-lg"
            aria-label="Return to main site"
          >
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
            ref={firstFocusableRef}
            onClick={onCloseMobileNav}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 focus:ring-offset-surface-deep lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <nav
          className="flex-1 space-y-1 overflow-y-auto px-3 py-2"
          role="navigation"
          aria-label="Main admin sections"
        >
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
            const modKey = isMac ? "⌘" : "Ctrl";

            return (
              <button
                key={item.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(item.id, el);
                }}
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobileNav();
                }}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`group relative flex w-full items-center justify-between rounded-lg px-3.5 py-3 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 focus:ring-offset-surface-deep ${
                  isActive
                    ? "font-semibold"
                    : "text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                }`}
                style={
                  isActive
                    ? {
                        borderLeft: "2px solid var(--admin-green)",
                        background: "var(--admin-green-soft)",
                        color: "var(--admin-ink)",
                      }
                    : undefined
                }
                aria-current={isActive ? "page" : undefined}
                aria-label={`${item.label}: ${item.subtitle}`}
                aria-keyshortcuts={`${isMac ? "Meta" : "Control"}+${item.shortcut}`}
                title={`${item.label} (${modKey}+${item.shortcut})`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    size={19}
                    className={`flex-shrink-0 transition-colors ${
                      isActive ? "text-teal" : "text-text-muted group-hover:text-teal"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="truncate">
                    <div className="text-sm font-medium leading-tight">{item.label}</div>
                    <div
                      className={`text-[11px] leading-tight mt-0.5 truncate ${
                        isActive ? "" : "text-text-muted"
                      }`}
                      style={isActive ? { color: "var(--admin-green)" } : undefined}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive
                          ? "bg-teal/15 text-teal"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                      aria-label={`${item.badge} pending items`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Keyboard shortcut hint - visible on hover/focus */}
                  <span
                    className="hidden lg:inline-flex opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity text-[10px] font-mono text-text-muted bg-surface-raised px-1.5 py-0.5 rounded border border-surface-raised"
                    aria-hidden="true"
                  >
                    {modKey}+{item.shortcut}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="mx-3 mb-3 rounded-lg bg-surface-base p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-raised font-bold text-teal text-xs"
                aria-hidden="true"
              >
                {session?.name ? session.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="truncate min-w-0">
                <div className="truncate text-xs font-bold text-text-primary">
                  {session?.name || "Administrator"}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      session?.role === "admin"
                        ? "bg-teal/15 text-teal"
                        : session?.role === "pr"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-gray-500/15 text-gray-400"
                    }`}
                  >
                    {session?.role === "admin" ? "Admin" : session?.role === "pr" ? "PR Editor" : "Member"}
                  </span>
                </div>
              </div>
            </div>

            <button
              ref={lastFocusableRef}
              onClick={onSignOut}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center p-2 rounded-lg text-text-muted hover:bg-red-500/10 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-surface-base transition-colors"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
});
