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

export const toggleInterest = (memberId: string, contentId: string): boolean => {
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
  return nowInterested;
};

export const interestCount = (contentId: string, all?: Interest[]): number =>
  (all ?? getInterests()).filter((row) => row.contentId === contentId).length;

/* ─── Likes (thumb-up) ──────────────────────────────────────────────────── */

export const getLikes = (): Like[] => read<Like[]>(LIKES_KEY, []);

export const isLiked = (memberId: string, contentId: string): boolean =>
  getLikes().some((row) => row.memberId === memberId && row.contentId === contentId);

export const toggleLike = (memberId: string, contentId: string): boolean => {
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
  return nowLiked;
};

export const likeCount = (contentId: string, all?: Like[]): number =>
  (all ?? getLikes()).filter((row) => row.contentId === contentId).length;

/* ─── Views (page visits) ──────────────────────────────────────────────── */

export const getViews = (): ViewRecord[] => read<ViewRecord[]>(VIEWS_KEY, []);

export const viewCount = (contentId: string, all?: ViewRecord[]): number =>
  (all ?? getViews()).filter((row) => row.contentId === contentId).length;

/* `recordView` adds a row if this visitor hasn't seen the item in this
   session yet. Returns true if the count was incremented. */
export const recordView = (visitorId: string, contentId: string): boolean => {
  const list = getViews();
  // De-dupe within a 30-minute window for the same visitor + content.
  const recent = list.find(
    (row) => row.visitorId === visitorId && row.contentId === contentId
      && Date.now() - Date.parse(row.viewedAt) < 30 * 60 * 1000,
  );
  if (recent) return false;
  list.push({ visitorId, contentId, viewedAt: new Date().toISOString() });
  write(VIEWS_KEY, list);
  return true;
};

export const getSessionVisitorId = (): string => ensureSessionId();

/* ─── Aggregated counts (the shape most callers want) ──────────────────── */

export const engagementCounts = (
  contentId: string,
  memberId: string | null,
): EngagementCounts => {
  const interests = getInterests();
  const likes = getLikes();
  const views = getViews();
  return {
    views: viewCount(contentId, views),
    likes: likeCount(contentId, likes),
    interests: interestCount(contentId, interests),
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
  const [value_, setValue] = useState<EngagementCounts>(() => engagementCounts(contentId, memberId));
  useEffect(() => {
    setValue(engagementCounts(contentId, memberId));
    const refresh = () => setValue(engagementCounts(contentId, memberId));
    window.addEventListener("storage", refresh);
    window.addEventListener("efsw:engagement-changed", refresh as EventListener);
    return () => {
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