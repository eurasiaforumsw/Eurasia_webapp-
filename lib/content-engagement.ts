// Academic engagement is persisted on the server. The in-memory cache is only
// for rendering cards after a successful read/write; browser storage holds
// only an anonymous visitor identity, never engagement totals.
const VISITOR_STORAGE_KEY = "efsw_academic_visitor";

export type ContentEngagement = {
  contentId: string;
  viewCount: number;
  downloadCount: number;
  likeCount: number;
  likedBy: string[];
  lastUpdated: string;
};

type RemoteEngagement = Omit<ContentEngagement, "likedBy" | "lastUpdated"> & { liked: boolean };
const cache = new Map<string, ContentEngagement>();
let visitorId: string | undefined;

function getVisitorId() {
  if (visitorId) return visitorId;
  if (typeof window === "undefined") return "";
  try { visitorId = window.localStorage.getItem(VISITOR_STORAGE_KEY) || undefined; }
  catch { /* A visitor can still use this tab when storage is disabled. */ }
  if (!visitorId || !/^[a-zA-Z0-9_-]{16,100}$/.test(visitorId)) {
    visitorId = `academic_${crypto.randomUUID()}`;
    try { window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId); }
    catch { /* Keep the identity in memory for this tab. */ }
  }
  return visitorId;
}

function remember(item: RemoteEngagement): ContentEngagement {
  const engagement = { contentId: item.contentId, viewCount: item.viewCount,
    downloadCount: item.downloadCount, likeCount: item.likeCount,
    likedBy: item.liked ? [getVisitorId()] : [], lastUpdated: new Date().toISOString() };
  cache.set(item.contentId, engagement);
  return engagement;
}

async function payload(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Document activity is unavailable");
  return data;
}

export function getContentEngagement(contentId: string): ContentEngagement {
  return cache.get(contentId) || { contentId, viewCount: 0, downloadCount: 0, likeCount: 0,
    likedBy: [], lastUpdated: "" };
}

export async function loadContentEngagement(ids: string[], signal?: AbortSignal): Promise<ContentEngagement[]> {
  const items: ContentEngagement[] = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const params = new URLSearchParams({ ids: ids.slice(offset, offset + 100).join(","), visitorId: getVisitorId() });
    const data = await payload(await fetch(`/api/academic/engagement?${params}`, { cache: "no-store", signal }));
    items.push(...(data.items as RemoteEngagement[]).map(remember));
  }
  return items;
}

async function record(contentId: string, action: "view" | "download" | "like" | "unlike") {
  const data = await payload(await fetch("/api/academic/engagement", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentId, visitorId: getVisitorId(), action }), keepalive: true,
  }));
  const engagement = remember(data.item);
  window.dispatchEvent(new Event("efsw:academic-engagement-changed"));
  return engagement;
}

export const incrementViewCount = (contentId: string) => record(contentId, "view");
export const incrementDownloadCount = (contentId: string) => record(contentId, "download");
export const hasUserLiked = (contentId: string) => getContentEngagement(contentId).likedBy.includes(getVisitorId());
export async function toggleLike(contentId: string) {
  const engagement = await record(contentId, hasUserLiked(contentId) ? "unlike" : "like");
  return { liked: hasUserLiked(contentId), engagement };
}
export const getAllEngagement = () => Array.from(cache.values());
export const clearEngagementData = () => cache.clear();
