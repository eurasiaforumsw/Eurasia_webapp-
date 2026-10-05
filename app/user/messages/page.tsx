"use client";

import type { Metadata } from "next";
import { MessageSquare, Mail, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* /user/messages — placeholder for the upcoming DM system. Lists nothing
 * real yet; surfaces the empty state so the avatar-menu link doesn't 404
 * while the bell icon + DM work is in progress. */

export default function MessagesPage() {
  const router = useRouter();

  return (
    <main className="efsw-interest-page">
      <header className="efsw-interest-page__head">
        <div>
          <h1 className="efsw-interest-page__title" style={{ color: "var(--efsw-ink)" }}>Messages</h1>
          <p className="efsw-interest-page__lede">
            Direct messages with other members of the forum — secure, in-app, and tied to your account.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span className="efsw-interest-page__count">
            <Mail size={13} strokeWidth={2.2} aria-hidden="true" />
            0 unread
          </span>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              display: "grid",
              placeItems: "center",
              width: "2.5rem",
              height: "2.5rem",
              padding: 0,
              border: "1px solid color-mix(in oklch, var(--efsw-ink) 12%, transparent)",
              borderRadius: "0.6rem",
              background: "var(--efsw-paper)",
              color: "var(--efsw-ink)",
              cursor: "pointer",
              transition: "background-color 180ms var(--ease-out), border-color 180ms var(--ease-out)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--efsw-paper-deep)";
              e.currentTarget.style.borderColor = "color-mix(in oklch, var(--efsw-ink) 20%, transparent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--efsw-paper)";
              e.currentTarget.style.borderColor = "color-mix(in oklch, var(--efsw-ink) 12%, transparent)";
            }}
            aria-label="Close messages"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="efsw-interest-page__empty">
        <span className="efsw-interest-page__empty-icon" aria-hidden="true">
          <MessageSquare size={22} strokeWidth={1.9} />
        </span>
        <p style={{ margin: "0 0 0.4rem", fontWeight: 650, color: "var(--efsw-ink)" }}>
          No messages yet
        </p>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          When other members reach out to you, the conversation will appear here.
        </p>
        <p style={{ margin: "1.2rem 0 0", fontSize: "0.82rem" }}>
          Need something now?{" "}
          <Link href="/about" style={{ color: "var(--efsw-green)" }}>
            Browse the team
          </Link>
          .
        </p>
      </div>
    </main>
  );
}