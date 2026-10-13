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
const versions = new Map<string, number>();
const mutations = new Map<string, Promise<void>>();
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

function nextVersion(contentId: string) {
  const version = (versions.get(contentId) || 0) + 1;
  versions.set(contentId, version);
  return version;
}

async function read(ids: string[], signal?: AbortSignal): Promise<RemoteEngagement[]> {
  const params = new URLSearchParams({ visitorId: getVisitorId() });
  ids.forEach((id) => params.append("id", id));
  const data = await payload(await fetch(`/api/academic/engagement?${params}`, { cache: "no-store", signal }));
  return data.items as RemoteEngagement[];
}

export async function loadContentEngagement(ids: string[], signal?: AbortSignal): Promise<ContentEngagement[]> {
  const items: ContentEngagement[] = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const batch = ids.slice(offset, offset + 100);
    const requests = new Map(batch.map((id) => [id, { version: nextVersion(id), pending: mutations.has(id) }]));
    const data = await read(batch, signal);
    items.push(...data.map((item) => {
      const request = requests.get(item.contentId);
      return request && !request.pending && !mutations.has(item.contentId)
        && request.version === versions.get(item.contentId) ? remember(item) : getContentEngagement(item.contentId);
    }));
  }
  return items;
}

function queueMutation<T>(contentId: string, action: () => Promise<T>): Promise<T> {
  nextVersion(contentId);
  const result = (mutations.get(contentId) || Promise.resolve()).then(action);
  const settled = result.then(() => undefined, () => undefined);
  mutations.set(contentId, settled);
  void settled.then(() => { if (mutations.get(contentId) === settled) mutations.delete(contentId); });
  return result;
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

export const incrementViewCount = (contentId: string) => queueMutation(contentId, () => record(contentId, "view"));
export const incrementDownloadCount = (contentId: string) => queueMutation(contentId, () => record(contentId, "download"));
export const hasUserLiked = (contentId: string) => getContentEngagement(contentId).likedBy.includes(getVisitorId());
export async function toggleLike(contentId: string) {
  return queueMutation(contentId, async () => {
    if (!cache.has(contentId)) {
      const [item] = await read([contentId]);
      if (!item) throw new Error("Document statistics are unavailable");
      remember(item);
    }
    const engagement = await record(contentId, hasUserLiked(contentId) ? "unlike" : "like");
    return { liked: engagement.likedBy.includes(getVisitorId()), engagement };
  });
}
export const getAllEngagement = () => Array.from(cache.values());
export const clearEngagementData = () => cache.clear();
