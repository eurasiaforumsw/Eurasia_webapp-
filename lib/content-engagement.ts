// ---------------------------------------------------------------------------
// Content Engagement — Track views, downloads, and likes
// Stored in localStorage; will be persisted to Supabase in a future migration.
// ---------------------------------------------------------------------------

const ENGAGEMENT_STORAGE_KEY = "efsw_content_engagement";
const USER_LIKES_STORAGE_KEY = "efsw_user_likes";

export type ContentEngagement = {
  contentId: string;
  viewCount: number;
  downloadCount: number;
  likeCount: number;
  likedBy: string[]; // Array of user/session IDs
  lastUpdated: string;
};

type EngagementStore = Record<string, ContentEngagement>;

/**
 * Get all engagement data
 */
const getEngagementStore = (): EngagementStore => {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Save engagement store
 */
const saveEngagementStore = (store: EngagementStore): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error("Failed to save engagement data:", err);
  }
};

/**
 * Get engagement data for a specific content item
 */
export const getContentEngagement = (contentId: string): ContentEngagement => {
  const store = getEngagementStore();
  return store[contentId] || {
    contentId,
    viewCount: 0,
    downloadCount: 0,
    likeCount: 0,
    likedBy: [],
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Increment view count for a content item
 */
export const incrementViewCount = (contentId: string): ContentEngagement => {
  const store = getEngagementStore();
  const engagement = store[contentId] || {
    contentId,
    viewCount: 0,
    downloadCount: 0,
    likeCount: 0,
    likedBy: [],
    lastUpdated: new Date().toISOString(),
  };

  engagement.viewCount += 1;
  engagement.lastUpdated = new Date().toISOString();

  store[contentId] = engagement;
  saveEngagementStore(store);

  return engagement;
};

/**
 * Increment download count for a content item
 */
export const incrementDownloadCount = (contentId: string): ContentEngagement => {
  const store = getEngagementStore();
  const engagement = store[contentId] || {
    contentId,
    viewCount: 0,
    downloadCount: 0,
    likeCount: 0,
    likedBy: [],
    lastUpdated: new Date().toISOString(),
  };

  engagement.downloadCount += 1;
  engagement.lastUpdated = new Date().toISOString();

  store[contentId] = engagement;
  saveEngagementStore(store);

  return engagement;
};

/**
 * Get current user/session ID for likes
 */
const getUserId = (): string => {
  if (typeof window === "undefined") return "anonymous";

  // Try to get member ID from session
  try {
    const memberSession = window.localStorage.getItem("efsw_member_session");
    if (memberSession === "active") {
      const members = window.localStorage.getItem("efsw_members");
      if (members) {
        const parsed = JSON.parse(members);
        const entries = Object.entries(parsed);
        if (entries.length > 0) {
          return (entries[0] as [string, any])[1].id;
        }
      }
    }
  } catch {
    // Fallback to session ID
  }

  // Use session ID as fallback
  let sessionId = window.sessionStorage.getItem("efsw_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    window.sessionStorage.setItem("efsw_session_id", sessionId);
  }
  return sessionId;
};

/**
 * Check if current user has liked a content item
 */
export const hasUserLiked = (contentId: string): boolean => {
  const engagement = getContentEngagement(contentId);
  const userId = getUserId();
  return engagement.likedBy.includes(userId);
};

/**
 * Toggle like for a content item
 */
export const toggleLike = (contentId: string): { liked: boolean; engagement: ContentEngagement } => {
  const store = getEngagementStore();
  const userId = getUserId();

  const engagement = store[contentId] || {
    contentId,
    viewCount: 0,
    downloadCount: 0,
    likeCount: 0,
    likedBy: [],
    lastUpdated: new Date().toISOString(),
  };

  const hasLiked = engagement.likedBy.includes(userId);

  if (hasLiked) {
    // Unlike
    engagement.likedBy = engagement.likedBy.filter((id) => id !== userId);
    engagement.likeCount = Math.max(0, engagement.likeCount - 1);
  } else {
    // Like
    engagement.likedBy.push(userId);
    engagement.likeCount += 1;
  }

  engagement.lastUpdated = new Date().toISOString();
  store[contentId] = engagement;
  saveEngagementStore(store);

  return { liked: !hasLiked, engagement };
};

/**
 * Get all engagement data (for admin/analytics)
 */
export const getAllEngagement = (): ContentEngagement[] => {
  const store = getEngagementStore();
  return Object.values(store);
};

/**
 * Clear engagement data (for testing/reset)
 */
export const clearEngagementData = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ENGAGEMENT_STORAGE_KEY);
  window.sessionStorage.removeItem("efsw_session_id");
};
