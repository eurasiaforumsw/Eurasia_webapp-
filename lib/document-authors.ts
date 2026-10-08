import { getPublishedAdminContent, AdminContentItem } from './admin-data';
import { getAllMembers, MemberProfile } from './member-auth';

export interface DocumentAuthor {
  id: string;
  name: string;
  avatar: string;
  docCount: number;
  totalViews: number;
  latestDate: string;
}

/**
 * Aggregates author data from published academic documents
 * and matches with member profiles for avatars.
 */
export function getDocumentAuthors(sortMode: 'latest' | 'popular' = 'latest'): DocumentAuthor[] {
  const documents = getPublishedAdminContent('academic');
  const members = getAllMembers();

  // Build a map: author name (normalized) -> member profile
  const memberMap = new Map<string, MemberProfile>();
  members.forEach((member) => {
    const normalizedName = member.fullName.trim().toLowerCase();
    memberMap.set(normalizedName, member);
  });

  // Aggregate documents by author
  const authorMap = new Map<string, {
    name: string;
    docIds: string[];
    totalViews: number;
    latestDate: string;
    memberId?: string;
    avatar?: string;
  }>();

  documents.forEach((doc) => {
    const authorName = doc.author || 'EFSW Network';
    const normalizedAuthor = authorName.trim().toLowerCase();

    if (!authorMap.has(normalizedAuthor)) {
      const member = memberMap.get(normalizedAuthor);
      authorMap.set(normalizedAuthor, {
        name: authorName,
        docIds: [],
        totalViews: 0,
        latestDate: doc.publishAt || doc.updatedAt || new Date().toISOString(),
        memberId: member?.id,
        avatar: member?.avatarUrl || '/images/default-avatar.png',
      });
    }

    const authorData = authorMap.get(normalizedAuthor)!;
    authorData.docIds.push(doc.id);
    authorData.totalViews += doc.viewCount || 0;

    // Update latest date if this document is newer
    const docDate = new Date(doc.publishAt || doc.updatedAt || 0);
    const currentLatest = new Date(authorData.latestDate);
    if (docDate > currentLatest) {
      authorData.latestDate = doc.publishAt || doc.updatedAt || authorData.latestDate;
    }
  });

  // Convert to array and sort
  const authors: DocumentAuthor[] = Array.from(authorMap.entries()).map(([key, data]) => ({
    id: data.memberId || key,
    name: data.name,
    avatar: data.avatar || '/images/default-avatar.png',
    docCount: data.docIds.length,
    totalViews: data.totalViews,
    latestDate: data.latestDate,
  }));

  // Sort based on mode
  authors.sort((a, b) => {
    if (sortMode === 'latest') {
      return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
    }
    return b.totalViews - a.totalViews;
  });

  return authors;
}

/**
 * Get all documents by a specific author
 */
export function getDocumentsByAuthor(authorName: string): AdminContentItem[] {
  const documents = getPublishedAdminContent('academic');
  const normalizedAuthor = authorName.trim().toLowerCase();

  return documents.filter((doc) => {
    const docAuthor = (doc.author || 'EFSW Network').trim().toLowerCase();
    return docAuthor === normalizedAuthor;
  });
}

/**
 * Enrich document data with author avatar from member profile
 */
export function enrichDocumentWithAuthor(doc: AdminContentItem): AdminContentItem & { authorAvatar?: string; authorId?: string } {
  const members = getAllMembers();
  const authorName = doc.author || 'EFSW Network';
  const normalizedAuthor = authorName.trim().toLowerCase();

  const member = members.find((m) => m.fullName.trim().toLowerCase() === normalizedAuthor);

  return {
    ...doc,
    authorAvatar: member?.avatarUrl || '/images/default-avatar.png',
    authorId: member?.id,
  };
}
