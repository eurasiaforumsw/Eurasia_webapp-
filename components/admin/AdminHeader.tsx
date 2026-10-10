"use client";

import { memo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Sun,
  Moon,
  ChevronRight,
  X,
} from "lucide-react";
import { AdminView } from "./AdminSidebar";
import { useTheme } from "@/contexts/ThemeContext";

interface AdminHeaderProps {
  currentView: AdminView;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  onSignOut: () => void;
  session: {
    name: string;
    email: string;
    role: "super-admin" | "content-editor" | "member";
  } | null;
  notificationCount?: number;
}

const VIEW_LABELS: Record<AdminView, string> = {
  overview: "Overview",
  analytics: "Analytics",
  members: "Members",
  content: "Content & Library",
  layout: "Layout",
  messages: "Messages",
  broadcast: "Broadcast",
  activity: "Activity Log",
  settings: "Settings",
};

export const AdminHeader = memo(function AdminHeader({
  currentView,
  breadcrumbs,
  onSignOut,
  session,
  notificationCount = 3,
}: AdminHeaderProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notifications dropdown
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // User profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Keyboard shortcut: Cmd/Ctrl + K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search logic
      console.log("Searching for:", searchQuery);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Build breadcrumb trail
  const breadcrumbTrail = breadcrumbs || [
    { label: "Admin Console", href: "/admin" },
    { label: VIEW_LABELS[currentView] },
  ];

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] flex h-16 items-center justify-between gap-4 border-b px-6" style={{
      backgroundColor: "var(--surface-1)",
      borderColor: "var(--border-subtle)",
    }}>
      {/* Left: Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 min-w-0">
        {breadcrumbTrail.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-sm font-medium transition-colors truncate" style={{
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-sm font-semibold truncate" style={{
                color: "var(--text-primary)",
              }}>
                {crumb.label}
              </span>
            )}
            {index < breadcrumbTrail.length - 1 && (
              <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
            )}
          </div>
        ))}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div ref={searchRef} className="relative">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex h-9 items-center gap-2 rounded-full px-3 transition-all" style={{
              backgroundColor: "var(--surface-3)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--surface-4)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--surface-3)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            aria-label="Search"
            title="Search (⌘K)"
          >
            <Search size={16} />
            <span className="hidden text-xs font-medium md:inline">Search</span>
            <kbd className="hidden rounded px-1.5 py-0.5 text-[10px] font-mono lg:inline" style={{
              backgroundColor: "var(--surface-2)",
              color: "var(--text-muted)",
            }}>
              ⌘K
            </kbd>
          </button>

          {/* Search Dropdown */}
          {searchOpen && (
            <div
              className="absolute right-0 mt-2 w-96 rounded-xl p-2 shadow-xl"
              style={{
                backgroundColor: "var(--surface-3)",
                border: "1px solid var(--border-default)",
              }}
            >
              <form onSubmit={handleSearch} className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search content, members..."
                  className="w-full rounded-lg py-2.5 pl-10 pr-10 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-label="Clear search"
                  >
                    <X size={14} style={{ color: "var(--text-muted)" }} />
                  </button>
                )}
              </form>

              <div className="mt-2 py-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase" style={{
                  color: "var(--text-muted)",
                  letterSpacing: "var(--tracking-wide)",
                }}>
                  Recent searches
                </div>
                <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                  <div className="px-3 py-2 text-center">No recent searches</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full transition-all"
            style={{
              backgroundColor: "var(--surface-3)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--surface-4)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--surface-3)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
            aria-label={`Notifications (${notificationCount} unread)`}
          >
            <Bell size={18} />
            {notificationCount > 0 && (
              <span
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: "var(--accent-danger)",
                  color: "white",
                }}
              >
                {notificationCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-xl p-2 shadow-xl"
              style={{
                backgroundColor: "var(--surface-3)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center justify-between px-3 py-2">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Notifications
                </h3>
                <button className="text-xs font-medium" style={{ color: "var(--accent-primary)" }}>
                  Mark all read
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {/* Sample notifications */}
                {[
                  {
                    id: 1,
                    title: "New member application",
                    message: "Jane Smith applied for verification",
                    time: "5 min ago",
                    unread: true,
                  },
                  {
                    id: 2,
                    title: "Content published",
                    message: "Research paper #142 is now live",
                    time: "1 hour ago",
                    unread: true,
                  },
                  {
                    id: 3,
                    title: "System update",
                    message: "Platform upgraded to v2.4",
                    time: "3 hours ago",
                    unread: false,
                  },
                ].map((notif) => (
                  <button
                    key={notif.id}
                    className="w-full rounded-lg p-3 text-left transition-colors"
                    style={{
                      backgroundColor: notif.unread ? "var(--surface-4)" : "transparent",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface-4)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.unread ? "var(--surface-4)" : "transparent"}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {notif.unread && (
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: "var(--accent-primary)" }}
                            />
                          )}
                          <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {notif.title}
                          </div>
                        </div>
                        <div className="mt-0.5 text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                          {notif.message}
                        </div>
                      </div>
                      <div className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {notif.time}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-2 border-t pt-2" style={{ borderColor: "var(--border-subtle)" }}>
                <button
                  className="w-full rounded-lg py-2 text-center text-sm font-medium transition-colors"
                  style={{ color: "var(--accent-primary)" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface-4)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all"
          style={{
            backgroundColor: "var(--surface-3)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--surface-4)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--surface-3)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Help/Docs */}
        <Link
          href="/admin/docs"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-all"
          style={{
            backgroundColor: "var(--surface-3)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--surface-4)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--surface-3)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
          aria-label="Help & Documentation"
          title="Help & Documentation"
        >
          <HelpCircle size={18} />
        </Link>

        {/* User Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-full pl-1 pr-3 transition-all"
            style={{
              backgroundColor: "var(--surface-3)",
              height: "36px",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--surface-4)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--surface-3)"}
            aria-label="User menu"
          >
            <div
              className="flex items-center justify-center rounded-full text-xs font-bold"
              style={{
                width: "28px",
                height: "28px",
                backgroundColor: "var(--accent-primary-muted)",
                color: "var(--accent-primary)",
              }}
            >
              {session?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <span className="hidden text-sm font-medium md:inline" style={{ color: "var(--text-primary)" }}>
              {session?.name || "Admin"}
            </span>
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-xl p-2 shadow-xl"
              style={{
                backgroundColor: "var(--surface-3)",
                border: "1px solid var(--border-default)",
              }}
            >
              {/* User info */}
              <div className="px-3 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {session?.name || "Administrator"}
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  {session?.email || "admin@efsw.local"}
                </div>
                <div className="mt-2">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: session?.role === "super-admin" ? "var(--accent-primary-muted)" : "rgba(59, 130, 246, 0.15)",
                      color: session?.role === "super-admin" ? "var(--accent-primary)" : "#60A5FA",
                    }}
                  >
                    {session?.role === "super-admin" ? "Admin" : session?.role === "content-editor" ? "PR Editor" : "Member"}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/admin/profile"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--surface-4)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <User size={16} />
                  View Profile
                </Link>

                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--surface-4)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <Settings size={16} />
                  Settings
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t pt-1" style={{ borderColor: "var(--border-subtle)" }}>
                <button
                  onClick={onSignOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                  style={{ color: "var(--accent-danger)" }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(248, 113, 113, 0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
});
