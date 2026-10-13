import { cache } from "react";
import type { AdminContentItem, AdminContentKind } from "./admin-data";

export const findPublicContent = cache(async (kind: AdminContentKind, slug: string): Promise<AdminContentItem | undefined> => {
  const { GET } = await import("@/app/api/content/public/route");
  const url = new URL("https://eurasiaforumsw.org/api/content/public");
  url.searchParams.set("kind", kind);
  url.searchParams.set("slug", slug);
  const response = await GET(new Request(url));
  if (!response.ok) throw new Error("Failed to load published content");
  const { items } = await response.json() as { items: AdminContentItem[] };
  return items.find((item) => item.kind === kind && item.id === slug);
});
