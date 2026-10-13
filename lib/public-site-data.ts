import type { AdminContentItem, AdminContentKind } from "./admin-data";

export async function fetchPublishedContent(kind: AdminContentKind): Promise<AdminContentItem[]> {
  const response = await fetch(`/api/content/public?kind=${encodeURIComponent(kind)}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load published content");
  const data = await response.json();
  if (!Array.isArray(data.items)) throw new Error("Invalid published content response");
  return data.items;
}
