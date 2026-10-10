"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { Command } from "lucide-react";
import "@/styles/admin-layout.css";

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();

  // Simulate loading bar on navigation
  useEffect(() => {
    setLoading(true);
    loadingTimeoutRef.current = setTimeout(() => setLoading(false), 300);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [pathname]);

  // Command palette keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }

      // ESC to close
      if (e.key === "Escape" && showCommandPalette) {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCommandPalette]);

  const closeCommandPalette = useCallback(() => {
    setShowCommandPalette(false);
  }, []);

  return (
    <>
      {/* Loading bar at top */}
      {loading && (
        <div
          className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal via-teal-light to-cyan z-[9999]"
          style={{
            animation: "loading-bar 300ms ease-out",
          }}
        />
      )}

      {children}

      {/* Command Palette Modal */}
      {showCommandPalette && (
        <div
          className="fixed inset-0 z-[1400] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={closeCommandPalette}
        >
          <div
            className="w-full max-w-2xl bg-surface-raised border border-border-default rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "command-palette-in 200ms ease-out",
            }}
          >
            <div className="flex items-center gap-3 p-4 border-b border-border-subtle">
              <Command size={20} className="text-text-muted flex-shrink-0" />
              <input
                type="text"
                placeholder="Type a command or search..."
                autoFocus
                className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-base"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono text-text-muted bg-surface-deep border border-border-subtle rounded">
                ESC
              </kbd>
            </div>

            <div className="p-2 max-h-96 overflow-y-auto">
              <div className="px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide">
                Quick Actions
              </div>
              <CommandItem label="Go to Overview" shortcut="⌘1" />
              <CommandItem label="Go to Analytics" shortcut="⌘2" />
              <CommandItem label="Go to Members" shortcut="⌘3" />
              <CommandItem label="Go to Content" shortcut="⌘4" />
              <CommandItem label="Go to Layout" shortcut="⌘5" />
              <CommandItem label="View Live Site" />
              <CommandItem label="Sign Out" />
            </div>

            <div className="px-4 py-3 bg-surface-deep border-t border-border-subtle">
              <p className="text-xs text-text-muted">
                Navigate using arrow keys · Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-surface-raised border border-border-subtle rounded">Enter</kbd> to select
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CommandItem({ label, shortcut }: { label: string; shortcut?: string }) {
  return (
    <button
      className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-text-primary rounded-lg hover:bg-surface-deep transition-colors text-left"
      onClick={() => {
        // Command action would go here
      }}
    >
      <span>{label}</span>
      {shortcut && (
        <kbd className="text-xs font-mono text-text-muted bg-surface-deep px-2 py-1 rounded border border-border-subtle">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
