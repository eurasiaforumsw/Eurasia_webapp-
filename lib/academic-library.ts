import type { AdminContentItem } from "@/lib/admin-data";

export type LibraryDocument = AdminContentItem & {
  author: string;
  tags: string[];
  date: string;
};

export const authorKey = (name: string) => name.trim().toLocaleLowerCase();

/** Keep the public library faithful to saved content, including an empty library. */
export function getLibraryDocuments(
  items: AdminContentItem[],
  now = Date.now(),
): LibraryDocument[] {
  return items
    .filter(
      (item) =>
        (item.kind === "academic" || item.kind === "document") &&
        item.status === "published" &&
        (!item.publishAt || Date.parse(item.publishAt) <= now) &&
        (!item.expiresAt || Date.parse(item.expiresAt) >= now) &&
        !item.targetMembershipTypes?.length &&
        !item.targetGroups?.length,
    )
    .map((item) => ({
      ...item,
      author: item.author?.trim() || "EFSW Network",
      tags: item.tags || [],
      date: item.publishAt || item.updatedAt,
    }));
}

export function getLibraryAuthors(documents: LibraryDocument[]) {
  const authors = new Map<
    string,
    {
      id: string;
      name: string;
      profileImage?: string;
      documentCount: number;
      totalViews: number;
      latestDate: string;
    }
  >();
  documents.forEach((doc) => {
    const id = authorKey(doc.author);
    const existing = authors.get(id);
    if (existing) {
      existing.documentCount += 1;
      existing.totalViews += doc.viewCount || 0;
      if (Date.parse(doc.date) > Date.parse(existing.latestDate))
        existing.latestDate = doc.date;
      if (!existing.profileImage && doc.authorImage)
        existing.profileImage = doc.authorImage;
    } else {
      authors.set(id, {
        id,
        name: doc.author,
        profileImage: doc.authorImage,
        documentCount: 1,
        totalViews: doc.viewCount || 0,
        latestDate: doc.date,
      });
    }
  });
  return Array.from(authors.values());
}

export function filterLibraryDocuments(
  documents: LibraryDocument[],
  filters: {
    query: string;
    category: string | null;
    author: string | null;
    tags: string[];
    sort: string;
  },
) {
  const query = filters.query.trim().toLocaleLowerCase();
  return documents
    .filter(
      (doc) =>
        (!filters.category || doc.category === filters.category) &&
        (!filters.author || authorKey(doc.author) === filters.author) &&
        (!filters.tags.length ||
          filters.tags.some((tag) => doc.tags.includes(tag))) &&
        (!query ||
          [doc.title, doc.summary, doc.author, ...doc.tags].some((value) =>
            value.toLocaleLowerCase().includes(query),
          )),
    )
    .sort((a, b) => {
      if (filters.sort === "title") return a.title.localeCompare(b.title);
      if (filters.sort === "popular")
        return (b.downloadCount || 0) - (a.downloadCount || 0);
      if (filters.sort === "oldest")
        return Date.parse(a.date) - Date.parse(b.date);
      return Date.parse(b.date) - Date.parse(a.date);
    });
}
