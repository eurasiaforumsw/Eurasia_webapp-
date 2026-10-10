"use client";

/* Member engagement — interests, likes, views for content (news/events).
 *
 * Strategy: optimistic local-first with API sync, so the UI feels instant
 * even before the server round-trip lands. Server is the source of truth
 * when it's reachable; localStorage is the source of truth when offline
 * or before the API exists. The shapes are identical on both sides so
 * swapping in a real backend (Supabase) later won't break consumers.
 *
 * Anonymous views (no memberId) are counted too — public visitors can bump
 * a view count without logging in. The dedupe key is contentId + a
 * coarse-grained session identifier, so refreshing the page doesn't
 * inflate the number but reading multiple articles does.
 */

const INTERESTS_KEY = "efsw.engagement.interests";
const LIKES_KEY = "efsw.engagement.likes";
const VIEWS_KEY = "efsw.engagement.views";
const SESSION_TOKEN_KEY = "efsw.engagement.session";

/* Helper to extract memberId from JWT cookie or localStorage session. */
const getMemberId = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    // Check localStorage session first (member-auth.ts stores this)
    const member = window.localStorage.getItem("efsw.member");
    if (member) {
      const parsed = JSON.parse(member);
      return parsed.id || null;
    }
  } catch {
    /* ignore */
  }
  return null;
};

/* Check if API is available by looking for Supabase env vars. */
const isAPIEnabled = (): boolean =>
  typeof window !== "undefined" &&
  Boolean((window as any).__NEXT_DATA__?.props?.pageProps?.env?.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL);

export type Interest = {
  memberId: string;
  contentId: string;
  createdAt: string;
};

export type Like = {
  memberId: string;
  contentId: string;
  createdAt: string;
};

/* Coarse view tally — a single `memberId + contentId` row keeps the most
   recent timestamp. The presence of a row means "this visitor saw this
   item", regardless of how many times; public/anonymous visitors use the
   `sessionId` as the visitor identity. */
export type ViewRecord = {
  contentId: string;
  visitorId: string; // memberId or sessionId for anonymous
  viewedAt: string;
};

/* Aggregated counts returned by `engagementCounts()`. Callers render these
   against cards and detail headers. */
export type EngagementCounts = {
  views: number;
  likes: number;
  interests: number;
  isInterested: boolean;
  isLiked: boolean;
};

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const read = <T>(key: string, fallback: T): T => {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // Notify other tabs / same-tab listeners. The storage event fires
    // cross-tab; the custom event covers same-tab subscribers (most of
    // our use case — toggle hearts from inside the same page).
    window.dispatchEvent(new CustomEvent("efsw:engagement-changed", { detail: { key } }));
  } catch {
    /* storage quota — silently drop; engagement is non-critical. */
  }
};

const ensureSessionId = (): string => {
  if (!canUseStorage()) return "ssr";
  let id = window.localStorage.getItem(SESSION_TOKEN_KEY);
  if (!id) {
    id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    try {
      window.localStorage.setItem(SESSION_TOKEN_KEY, id);
    } catch {
      /* ignore */
    }
  }
  return id;
};

/* ─── Interests (heart / "save for later") ─────────────────────────────── */

export const getInterests = (): Interest[] => read<Interest[]>(INTERESTS_KEY, []);

export const isInterested = (memberId: string, contentId: string): boolean =>
  getInterests().some((row) => row.memberId === memberId && row.contentId === contentId);

export const toggleInterest = async (memberId: string, contentId: string): Promise<boolean> => {
  // Optimistic update: update localStorage immediately
  const list = getInterests();
  const idx = list.findIndex((row) => row.memberId === memberId && row.contentId === contentId);
  let nowInterested: boolean;
  if (idx >= 0) {
    list.splice(idx, 1);
    nowInterested = false;
  } else {
    list.push({ memberId, contentId, createdAt: new Date().toISOString() });
    nowInterested = true;
  }
  write(INTERESTS_KEY, list);

  // Background sync to API
  if (isAPIEnabled()) {
    try {
      const res = await fetch("/api/engagement/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, contentId }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update localStorage with server response for consistency
        const serverList = getInterests();
        const serverIdx = serverList.findIndex((row) => row.memberId === memberId && row.contentId === contentId);
        if (data.saved && serverIdx < 0) {
          serverList.push({ memberId, contentId, createdAt: new Date().toISOString() });
          write(INTERESTS_KEY, serverList);
        } else if (!data.saved && serverIdx >= 0) {
          serverList.splice(serverIdx, 1);
          write(INTERESTS_KEY, serverList);
        }
        return data.saved;
      }
    } catch {
      /* ignore — localStorage is source of truth for now */
    }
  }

  return nowInterested;
};

export const interestCount = async (contentId: string, all?: Interest[]): Promise<number> => {
  // Try fetching from API first
  if (isAPIEnabled() && !all) {
    try {
      const res = await fetch(`/api/engagement?contentId=${encodeURIComponent(contentId)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return data.saveCount || 0;
      }
    } catch {
      /* fall through to localStorage */
    }
  }
  // Fallback to localStorage
  return (all ?? getInterests()).filter((row) => row.contentId === contentId).length;
};

/* ─── Likes (thumb-up) ──────────────────────────────────────────────────── */

export const getLikes = (): Like[] => read<Like[]>(LIKES_KEY, []);

export const isLiked = (memberId: string, contentId: string): boolean =>
  getLikes().some((row) => row.memberId === memberId && row.contentId === contentId);

export const toggleLike = async (memberId: string, contentId: string): Promise<boolean> => {
  // Optimistic update: update localStorage immediately
  const list = getLikes();
  const idx = list.findIndex((row) => row.memberId === memberId && row.contentId === contentId);
  let nowLiked: boolean;
  if (idx >= 0) {
    list.splice(idx, 1);
    nowLiked = false;
  } else {
    list.push({ memberId, contentId, createdAt: new Date().toISOString() });
    nowLiked = true;
  }
  write(LIKES_KEY, list);

  // Background sync to API
  if (isAPIEnabled()) {
    try {
      const res = await fetch("/api/engagement/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, contentId }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update localStorage with server response for consistency
        const serverList = getLikes();
        const serverIdx = serverList.findIndex((row) => row.memberId === memberId && row.contentId === contentId);
        if (data.liked && serverIdx < 0) {
          serverList.push({ memberId, contentId, createdAt: new Date().toISOString() });
          write(LIKES_KEY, serverList);
        } else if (!data.liked && serverIdx >= 0) {
          serverList.splice(serverIdx, 1);
          write(LIKES_KEY, serverList);
        }
        return data.liked;
      }
    } catch {
      /* ignore — localStorage is source of truth for now */
    }
  }

  return nowLiked;
};

export const likeCount = async (contentId: string, all?: Like[]): Promise<number> => {
  // Try fetching from API first
  if (isAPIEnabled() && !all) {
    try {
      const res = await fetch(`/api/engagement?contentId=${encodeURIComponent(contentId)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return data.likeCount || 0;
      }
    } catch {
      /* fall through to localStorage */
    }
  }
  // Fallback to localStorage
  return (all ?? getLikes()).filter((row) => row.contentId === contentId).length;
};

/* ─── Views (page visits) ──────────────────────────────────────────────── */

export const getViews = (): ViewRecord[] => read<ViewRecord[]>(VIEWS_KEY, []);

export const viewCount = async (contentId: string, all?: ViewRecord[]): Promise<number> => {
  // Try fetching from API first
  if (isAPIEnabled() && !all) {
    try {
      const res = await fetch(`/api/engagement?contentId=${encodeURIComponent(contentId)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return data.viewCount || 0;
      }
    } catch {
      /* fall through to localStorage */
    }
  }
  // Fallback to localStorage
  return (all ?? getViews()).filter((row) => row.contentId === contentId).length;
};

/* `recordView` adds a row if this visitor hasn't seen the item in this
   session yet. Returns true if the count was incremented. */
export const recordView = async (visitorId: string, contentId: string): Promise<boolean> => {
  const list = getViews();
  // De-dupe within a 30-minute window for the same visitor + content.
  const recent = list.find(
    (row) => row.visitorId === visitorId && row.contentId === contentId
      && Date.now() - Date.parse(row.viewedAt) < 30 * 60 * 1000,
  );
  if (recent) return false;

  // Optimistic update: add to localStorage immediately
  list.push({ visitorId, contentId, viewedAt: new Date().toISOString() });
  write(VIEWS_KEY, list);

  // Background sync to API
  if (isAPIEnabled()) {
    try {
      await fetch("/api/engagement/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, contentId }),
      });
    } catch {
      /* ignore — localStorage is source of truth for now */
    }
  }

  return true;
};

export const getSessionVisitorId = (): string => ensureSessionId();

/* ─── Aggregated counts (the shape most callers want) ──────────────────── */

export const engagementCounts = async (
  contentId: string,
  memberId: string | null,
): Promise<EngagementCounts> => {
  // Try to fetch from API first for more accurate counts
  if (isAPIEnabled()) {
    try {
      const params = new URLSearchParams({ contentId });
      if (memberId) params.append("memberId", memberId);

      const res = await fetch(`/api/engagement?${params.toString()}`, {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        return {
          views: data.viewCount || 0,
          likes: data.likeCount || 0,
          interests: data.saveCount || 0,
          isInterested: data.userEngagement?.saved || false,
          isLiked: data.userEngagement?.liked || false,
        };
      }
    } catch {
      /* fall through to localStorage */
    }
  }

  // Fallback to localStorage
  const interests = getInterests();
  const likes = getLikes();
  const views = getViews();
  return {
    views: views.filter((row) => row.contentId === contentId).length,
    likes: likes.filter((row) => row.contentId === contentId).length,
    interests: interests.filter((row) => row.contentId === contentId).length,
    isInterested: memberId ? interests.some((row) => row.contentId === contentId && row.memberId === memberId) : false,
    isLiked: memberId ? likes.some((row) => row.contentId === contentId && row.memberId === memberId) : false,
  };
};

/* `useEngagementCounts` is a hook variant that subscribes to updates so
   callers re-render when a heart is toggled in another tab or via the
   same-tab custom event. */

import { useEffect, useState } from "react";

export const useEngagementCounts = (
  contentId: string,
  memberId: string | null,
): EngagementCounts => {
  const [value_, setValue] = useState<EngagementCounts>({
    views: 0,
    likes: 0,
    interests: 0,
    isInterested: false,
    isLiked: false,
  });

  useEffect(() => {
    let mounted = true;

    const fetchCounts = async () => {
      const counts = await engagementCounts(contentId, memberId);
      if (mounted) setValue(counts);
    };

    fetchCounts();

    const refresh = () => {
      fetchCounts();
    };

    window.addEventListener("storage", refresh);
    window.addEventListener("efsw:engagement-changed", refresh as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("efsw:engagement-changed", refresh as EventListener);
    };
  }, [contentId, memberId]);

  return value_;
};

/* Compact human-readable counter for "1.2k", "15k", "1.4m". */
export const formatCount = (n: number): string => {
  if (n < 1000) return String(n);
  if (n < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  if (n < 1_000_000) return Math.round(n / 1000) + "k";
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
};

/* `subscribeToEngagement` lets callers react to changes (e.g. for badges
   or the avatar-dropdown counter). Returns an unsubscribe function. */
export const subscribeToEngagement = (handler: () => void): (() => void) => {
  const wrap = () => handler();
  window.addEventListener("storage", wrap);
  window.addEventListener("efsw:engagement-changed", wrap as EventListener);
  return () => {
    window.removeEventListener("storage", wrap);
    window.removeEventListener("efsw:engagement-changed", wrap as EventListener);
  };
};