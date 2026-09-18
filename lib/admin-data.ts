import {
  getMember,
  MemberProfile,
  removeMember,
  updateMember,
} from "@/lib/member-auth";

export type AdminMember = MemberProfile & {
  reviewNote?: string;
  reviewedAt?: string;
};

export type AdminContentKind = "news" | "document";
export type AdminContentStatus = "draft" | "published" | "archived";

export type ContentLocale = "en" | "th" | "ko";
export const CONTENT_LOCALES: ContentLocale[] = ["en", "th", "ko"];

export type AdminContentItem = {
  id: string;
  kind: AdminContentKind;
  category: string;
  title: string;
  summary: string;
  body: string;
  coverImage?: string;
  imageCaption?: string;
  author?: string;
  tags?: string[];
  status: AdminContentStatus;
  locale: ContentLocale;
  updatedAt: string;
};

export type AdminContentCategory = {
  id: string;
  kind: AdminContentKind;
  label: string;
  order: number;
  enabled: boolean;
};

export type AdminLeaderProfile = {
  id: string;
  name: string;
  title: string;
  quote: string;
  specializations: string[];
  portrait: string;
  portraitAlt: string;
  textPosition: "left" | "right" | "both";
};

export type AdminBoardMember = {
  id: string;
  name: string;
  title: string;
  country: string;
  image: string;
};

export type AdminHistoryItem = {
  id: string;
  year: number;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  isCurrent?: boolean;
};

export type AdminLayoutConfig = {
  heroHeadline: string;
  heroSubheadline: string;
  heroTagline: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroBgVideoUrl?: string;
  heroBgPosterUrl?: string;
  deanSectionTitle: string;
  deanProfiles: AdminLeaderProfile[];
  boardMembers: AdminBoardMember[];
  historySectionTitle: string;
  historySectionIntro: string;
  historyItems: AdminHistoryItem[];
  sectionVisibility: {
    hero: boolean;
    voices: boolean;
    deanMessage: boolean;
    about: boolean;
    news: boolean;
    membership: boolean;
  };
};

export type AdminActivity = {
  id: string;
  action: string;
  detail: string;
  at: string;
  tone: "neutral" | "success" | "warning";
};

export type AdminSettings = {
  organizationName: string;
  contactEmail: string;
  defaultLocale: "th" | "en" | "ko";
  reviewNotifications: boolean;
};

export const ADMIN_MEMBERS_KEY = "efsw.admin.members";
export const ADMIN_CONTENT_KEY = "efsw.admin.content";
export const ADMIN_CONTENT_CATEGORIES_KEY = "efsw.admin.content-categories";
export const ADMIN_ACTIVITY_KEY = "efsw.admin.activity";
export const ADMIN_SETTINGS_KEY = "efsw.admin.settings";
export const ADMIN_LAYOUT_KEY = "efsw.admin.layout";

export const defaultLayoutConfig: AdminLayoutConfig = {
  heroHeadline: "Where social work finds its regional voice.",
  heroSubheadline: "The Eurasia Forum for Social Workers connects practitioners, educators, students, and institutions across continents.",
  heroTagline: "Bridging practice, policy, and education across Eurasia",
  heroCtaText: "Join the Network",
  heroCtaLink: "/member",
  heroBgVideoUrl: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_122702_390f5305-8719-41d5-ae80-d23ab3796c28.mp4",
  heroBgPosterUrl: "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090123_74be96d4-9c1b-40cf-932a-96f4f4babed3.png&w=1280&q=85",
  deanSectionTitle: "Executive Messages & Leadership",
  deanProfiles: [
    {
      id: "dean-1",
      name: "Prof. Dr. Emily Peterson",
      title: "Senior General Lead & Academic Council Chair",
      quote: "Our mission is to establish sustainable bridges across European and Asian social work networks, advancing research-grounded methodologies and regional solidarity.",
      specializations: ["Cross-Border Welfare", "Comparative Social Work", "Curriculum Harmonization"],
      portrait: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&h=1100&q=80",
      portraitAlt: "Prof. Dr. Emily Peterson",
      textPosition: "both",
    },
    {
      id: "dean-2",
      name: "Dr. Michael Chen",
      title: "Director of International Collaborations",
      quote: "By fostering multilateral knowledge exchange and field research cooperation, EFSW elevates community impact and professional standards across all member countries.",
      specializations: ["Community Development", "Public Healthcare Systems", "Regional Policy"],
      portrait: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&h=1100&q=80",
      portraitAlt: "Dr. Michael Chen",
      textPosition: "left",
    },
    {
      id: "dean-3",
      name: "Assoc. Prof. Dr. Sarah Williams",
      title: "Dean of Social Work & Regional Practice Lead",
      quote: "Building compassionate ecosystems through evidence-based practice and resilient leadership in social work education across Eurasia.",
      specializations: ["Youth & Family Welfare", "Disaster Relief Operations", "Clinical Practice"],
      portrait: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&h=1100&q=80",
      portraitAlt: "Assoc. Prof. Dr. Sarah Williams",
      textPosition: "both",
    },
  ],
  boardMembers: [
    { id: "board-president", name: "Mr. Sug Pyo Kim", title: "President", country: "South Korea", image: "" },
    { id: "board-armenia", name: "Ms. Manane Petrosyan", title: "Executive Committee", country: "Armenia", image: "" },
    { id: "board-india", name: "Dr. Gandhi Doss", title: "Executive Committee", country: "India", image: "" },
    { id: "board-philippines", name: "Ms. Eva Ponce de Leon", title: "Executive Committee", country: "Philippines", image: "" },
    { id: "board-russia-1", name: "Dr. Antonina Dashkina", title: "Executive Committee", country: "Russia", image: "" },
    { id: "board-russia-2", name: "Ms. Maria Kholodtsova", title: "Executive Committee", country: "Russia", image: "" },
    { id: "board-thailand-1", name: "Mrs. Rapeepan Kumhom", title: "Executive Committee", country: "Thailand", image: "" },
    { id: "board-thailand-2", name: "Dr. Puchong Senanuch", title: "Executive Committee", country: "Thailand", image: "" },
    { id: "board-thailand-3", name: "Ms. Vanpa Lumjeakthes", title: "Executive Committee", country: "Thailand", image: "" },
  ],
  historySectionTitle: "Built through shared work.",
  historySectionIntro: "Follow the milestones that have shaped the Eurasia Forum for Social Workers, from its early conversations to the regional network it is today.",
  historyItems: [
    {
      id: "history-current",
      year: 2026,
      title: "A shared regional platform",
      description: "EFSW brings practitioners, educators, students, and institutions together across Eurasia to share knowledge, strengthen practice, and shape the next chapter of regional social work.",
      image: "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090123_74be96d4-9c1b-40cf-932a-96f4f4babed3.png&w=1280&q=85",
      imageAlt: "EFSW regional social work network",
      isCurrent: true,
    },
  ],
  sectionVisibility: {
    hero: true,
    voices: true,
    deanMessage: true,
    about: true,
    news: true,
    membership: true,
  },
};

const defaultSettings: AdminSettings = {
  organizationName: "Eurasia Forum for Social Workers",
  contactEmail: "support@eurasiaforumsw.org",
  defaultLocale: "en",
  reviewNotifications: true,
};

export const initialContent: AdminContentItem[] = [
  {
    id: "news-platform",
    kind: "news",
    category: "Platform update",
    title: "A trilingual platform for regional exchange",
    summary: "EFSW connects English, Korean, and Thai resources so professional knowledge can move more freely across Eurasia.",
    body: "The Eurasia Forum for Social Workers (EFSW) officially launches its integrated trilingual digital workspace. This platform brings together practitioners, researchers, and students from across Eurasia to collaborate seamlessly across language barriers.\n\nKey highlights include:\n- Seamless multilingual navigation and research material access in Thai, English, and Korean.\n- Peer-to-peer directory and verified credentials for registered social work professionals.\n- Direct digital repository for policy briefings and community practice guides.",
    coverImage: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&h=700&q=80",
    imageCaption: "Cross-border symposium and trilingual digital knowledge exchange",
    author: "EFSW Editorial Board",
    tags: ["Platform", "Trilingual", "Regional Exchange"],
    status: "published",
    locale: "en",
    updatedAt: "2026-08-07T00:00:00.000Z",
  },
  {
    id: "news-membership",
    kind: "news",
    category: "Membership",
    title: "A network for professionals, students, and institutions",
    summary: "Three membership pathways make room for practitioners, emerging social workers, universities, NGOs, and public partners.",
    body: "Expanding our community reach, EFSW introduces comprehensive membership tiers specifically designed to support practitioners at every stage of their careers, from undergraduate social work students to international research bodies.\n\nMembers gain prioritized access to conferences, publication subsidies, and our cross-border mentorship portal.",
    coverImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&h=700&q=80",
    imageCaption: "Community practitioners gathering for regional social work alliance",
    author: "Membership Committee",
    tags: ["Membership", "Community", "Partnerships"],
    status: "published",
    locale: "en",
    updatedAt: "2026-08-07T00:00:00.000Z",
  },
  {
    id: "news-resources",
    kind: "news",
    category: "Resources",
    title: "Research and practice belong in the same conversation",
    summary: "The resource hub brings research papers, case studies, field manuals, and regional learning into one shared place.",
    body: "Bridging the gap between academic theory and frontline field practice, our new open research hub indexes peer-reviewed papers alongside field practical manuals developed by local welfare organizations across Thailand, South Korea, and Europe.",
    coverImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&h=700&q=80",
    imageCaption: "Academic research and field practice materials repository",
    author: "Academic Working Group",
    tags: ["Research", "Field Practice", "Publications"],
    status: "published",
    locale: "en",
    updatedAt: "2026-08-07T00:00:00.000Z",
  },
  {
    id: "document-research",
    kind: "document",
    category: "Research",
    title: "Research papers and academic articles",
    summary: "A home for academic writing, field research, and lessons drawn from practice across the region.",
    body: "A collection of international social welfare and social work research for academics and practitioners to reference and build on.",
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&h=700&q=80",
    imageCaption: "Social welfare research and academic resources",
    author: "EFSW Editorial Board",
    tags: ["Research", "Academic", "Welfare"],
    status: "published",
    locale: "en",
    updatedAt: "2026-08-07T00:00:00.000Z",
  },
  {
    id: "document-practice",
    kind: "document",
    category: "Practice",
    title: "Social work practice manuals",
    summary: "Resources that help social workers adapt shared knowledge to the realities of their own context.",
    body: "Field practice guides for supporting vulnerable groups, children, women, and older people across the region.",
    coverImage: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&h=700&q=80",
    imageCaption: "Field practice guide",
    author: "Practice Working Group",
    tags: ["Manual", "Field Practice", "Case Management"],
    status: "published",
    locale: "en",
    updatedAt: "2026-08-07T00:00:00.000Z",
  },
  {
    id: "document-briefings",
    kind: "document",
    category: "Briefings",
    title: "Regional policy briefings",
    summary: "Short, clear perspectives ready to bring into conversations about policy and collaboration.",
    body: "Key policy insights prepared for government and civil society partners working to advance social benefits.",
    coverImage: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&h=700&q=80",
    imageCaption: "Policy and public sector collaboration documents",
    author: "Policy Committee",
    tags: ["Policy", "Collaboration", "Regional"],
    status: "published",
    locale: "en",
    updatedAt: "2026-08-07T00:00:00.000Z",
  },
];

export const defaultContentCategories: AdminContentCategory[] = [
  { id: "news-platform", kind: "news", label: "Platform update", order: 0, enabled: true },
  { id: "news-membership", kind: "news", label: "Membership", order: 1, enabled: true },
  { id: "news-resources", kind: "news", label: "Resources", order: 2, enabled: true },
  { id: "document-research", kind: "document", label: "Research", order: 0, enabled: true },
  { id: "document-practice", kind: "document", label: "Practice", order: 1, enabled: true },
  { id: "document-briefings", kind: "document", label: "Briefings", order: 2, enabled: true },
];

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readArray = <T,>(key: string): T[] => {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
};

const write = (key: string, value: unknown) => {
  if (canUseStorage()) window.localStorage.setItem(key, JSON.stringify(value));
};

const migrateLegacyContent = (content: AdminContentItem[]) => {
  let changed = false;
  const next = content.map((item) => {
    if (typeof item.body === "undefined") {
      item = { ...item, body: "" };
      changed = true;
    }
    const initialItem = initialContent.find((entry) => entry.id === item.id);
    if (typeof item.coverImage === "undefined" && initialItem?.coverImage) {
      item = { ...item, coverImage: initialItem.coverImage };
      changed = true;
    }
    const isUntouchedLegacyDocument = initialItem?.kind === "document"
      && item.kind === initialItem.kind
      && item.status === "draft"
      && item.category === initialItem.category
      && item.title === initialItem.title
      && item.summary === initialItem.summary
      && item.locale === initialItem.locale
      && item.updatedAt === initialItem.updatedAt;

    if (!isUntouchedLegacyDocument) return item;
    changed = true;
    return { ...item, status: "published" as const };
  });

  if (changed) write(ADMIN_CONTENT_KEY, next);
  return next;
};

export const getAdminMembers = (): AdminMember[] => {
  const stored = readArray<AdminMember>(ADMIN_MEMBERS_KEY);
  const current = getMember();
  if (!current) return stored;

  const existingIndex = stored.findIndex((member) => member.id === current.id);
  if (existingIndex === -1) {
    const next = [current, ...stored];
    write(ADMIN_MEMBERS_KEY, next);
    return next;
  }

  const next = stored.map((member, index) => index === existingIndex ? { ...member, ...current, status: member.status } : member);
  write(ADMIN_MEMBERS_KEY, next);
  return next;
};

export const setAdminMemberStatus = (id: string, status: MemberProfile["status"], reviewNote = "") => {
  const members = getAdminMembers();
  const next = members.map((member) => member.id === id ? { ...member, status, reviewNote, reviewedAt: new Date().toISOString() } : member);
  write(ADMIN_MEMBERS_KEY, next);
  const current = getMember();
  if (current?.id === id) updateMember({ status });
  return next.find((member) => member.id === id) ?? null;
};

export const deleteAdminMember = (id: string) => {
  const next = getAdminMembers().filter((member) => member.id !== id);
  write(ADMIN_MEMBERS_KEY, next);
  if (getMember()?.id === id) removeMember();
  return next;
};

export const getAdminContent = (): AdminContentItem[] => {
  if (canUseStorage()) {
    const raw = window.localStorage.getItem(ADMIN_CONTENT_KEY);
    if (raw !== null) {
      try {
        const stored = JSON.parse(raw);
        if (Array.isArray(stored)) return migrateLegacyContent(stored as AdminContentItem[]);
      } catch {
        // Invalid prototype data is replaced by the known-good initial content below.
      }
    }
  }
  write(ADMIN_CONTENT_KEY, initialContent);
  return initialContent;
};

export const getPublishedAdminContent = (kind: AdminContentKind) => (
  getAdminContent().filter((item) => item.kind === kind && item.status === "published")
);

/** Slug used by the public detail routes. Ids are already URL-safe. */
export const contentSlug = (item: Pick<AdminContentItem, "id">) => item.id;

/** Resolves one published entry for a detail page, falling back to the bundled
 *  English copy when an admin has only translated part of a record. */
export const getPublishedContentBySlug = (kind: AdminContentKind, slug: string) => {
  const stored = getPublishedAdminContent(kind).find((item) => contentSlug(item) === slug);
  const seeded = initialContent.find((item) => item.kind === kind && item.id === slug);
  if (!stored) return seeded ?? null;
  if (!seeded) return stored;

  const needsEnglishFallback = kind === "document" && stored.locale !== "en";
  return needsEnglishFallback
    ? {
        ...stored,
        category: seeded.category,
        title: seeded.title,
        summary: seeded.summary,
        body: seeded.body,
        coverImage: stored.coverImage || seeded.coverImage,
        imageCaption: stored.imageCaption || seeded.imageCaption,
        author: stored.author || seeded.author,
        tags: stored.tags?.length ? stored.tags : seeded.tags,
      }
    : stored;
};

/** Other published entries of the same kind, newest first, for "read next". */
export const getRelatedContent = (kind: AdminContentKind, excludeId: string, limit = 3) => (
  getPublishedAdminContent(kind)
    .filter((item) => item.id !== excludeId)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, limit)
);

const readContentCategories = (): AdminContentCategory[] => {
  if (!canUseStorage()) return defaultContentCategories;
  const raw = window.localStorage.getItem(ADMIN_CONTENT_CATEGORIES_KEY);
  if (raw === null) {
    write(ADMIN_CONTENT_CATEGORIES_KEY, defaultContentCategories);
    return defaultContentCategories;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Invalid content categories");
    return parsed
      .filter((item): item is Partial<AdminContentCategory> => Boolean(item && typeof item === "object"))
      .map((item, index): AdminContentCategory => ({
        id: typeof item.id === "string" && item.id ? item.id : `category-${index}`,
        kind: item.kind === "document" ? "document" : "news",
        label: typeof item.label === "string" ? item.label.trim() : "",
        order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
        enabled: item.enabled !== false,
      }))
      .filter((item) => item.label.length > 0);
  } catch {
    write(ADMIN_CONTENT_CATEGORIES_KEY, defaultContentCategories);
    return defaultContentCategories;
  }
};

export const getAdminContentCategories = (kind?: AdminContentKind) => (
  readContentCategories()
    .filter((category) => !kind || category.kind === kind)
    .sort((a, b) => a.order - b.order)
);

export const saveAdminContentCategories = (categories: AdminContentCategory[]) => {
  const previous = readContentCategories();
  const next = categories
    .filter((category) => category.label.trim())
    .map((category, index) => ({ ...category, label: category.label.trim(), order: index }));
  write(ADMIN_CONTENT_CATEGORIES_KEY, next);

  const renames = new Map(
    next
      .map((category): readonly [string, string] | null => {
        const old = previous.find((entry) => entry.id === category.id);
        return old && old.label !== category.label
          ? [`${old.kind}:${old.label.toLowerCase()}`, category.label] as const
          : null;
      })
      .filter((entry): entry is readonly [string, string] => entry !== null),
  );
  if (renames.size > 0) {
    const content = getAdminContent();
    write(ADMIN_CONTENT_KEY, content.map((item) => {
      const renamed = renames.get(`${item.kind}:${item.category.toLowerCase()}`);
      return renamed ? { ...item, category: renamed, updatedAt: new Date().toISOString() } : item;
    }));
  }
  return next;
};

export const saveAdminContentCategory = (category: AdminContentCategory) => {
  const categories = readContentCategories();
  const next = categories.some((entry) => entry.id === category.id)
    ? categories.map((entry) => entry.id === category.id ? { ...category, label: category.label.trim() } : entry)
    : [...categories, { ...category, label: category.label.trim(), order: categories.length }];
  return saveAdminContentCategories(next);
};

export const deleteAdminContentCategory = (id: string) => (
  saveAdminContentCategories(readContentCategories().filter((category) => category.id !== id))
);

export const saveAdminContent = (item: AdminContentItem) => {
  const content = getAdminContent();
  const next = content.some((entry) => entry.id === item.id)
    ? content.map((entry) => entry.id === item.id ? item : entry)
    : [item, ...content];
  write(ADMIN_CONTENT_KEY, next);
  return next;
};

export const deleteAdminContent = (id: string) => {
  const next = getAdminContent().filter((item) => item.id !== id);
  write(ADMIN_CONTENT_KEY, next);
  return next;
};

export const getAdminActivity = () => readArray<AdminActivity>(ADMIN_ACTIVITY_KEY);

export const recordAdminActivity = (activity: Omit<AdminActivity, "id" | "at">) => {
  const next: AdminActivity[] = [
    { ...activity, id: `activity-${Date.now().toString(36)}`, at: new Date().toISOString() },
    ...getAdminActivity(),
  ].slice(0, 30);
  write(ADMIN_ACTIVITY_KEY, next);
  return next;
};

export const getAdminSettings = (): AdminSettings => {
  if (!canUseStorage()) return defaultSettings;
  const raw = window.localStorage.getItem(ADMIN_SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(raw) } as AdminSettings;
  } catch {
    return defaultSettings;
  }
};

export const saveAdminSettings = (settings: AdminSettings) => {
  write(ADMIN_SETTINGS_KEY, settings);
  return settings;
};

export const getAdminLayout = (): AdminLayoutConfig => {
  if (!canUseStorage()) return defaultLayoutConfig;
  const raw = window.localStorage.getItem(ADMIN_LAYOUT_KEY);
  if (!raw) return defaultLayoutConfig;
  try {
    const parsed = JSON.parse(raw);
    const storedHistory = Array.isArray(parsed.historyItems)
      ? parsed.historyItems
          .filter((item: unknown): item is Partial<AdminHistoryItem> => Boolean(item && typeof item === "object"))
          .map((item: Partial<AdminHistoryItem>, index: number): AdminHistoryItem => ({
            id: typeof item.id === "string" && item.id ? item.id : `history-${index}`,
            year: Number(item.year) || new Date().getFullYear(),
            title: typeof item.title === "string" ? item.title : "",
            description: typeof item.description === "string" ? item.description : "",
            image: typeof item.image === "string" ? item.image : "",
            imageAlt: typeof item.imageAlt === "string" ? item.imageAlt : "",
            isCurrent: Boolean(item.isCurrent),
          }))
          .sort((a: AdminHistoryItem, b: AdminHistoryItem) => a.year - b.year)
      : defaultLayoutConfig.historyItems;
    return {
      ...defaultLayoutConfig,
      ...parsed,
      sectionVisibility: {
        ...defaultLayoutConfig.sectionVisibility,
        ...(parsed.sectionVisibility || {}),
      },
      boardMembers: Array.isArray(parsed.boardMembers) ? parsed.boardMembers : defaultLayoutConfig.boardMembers,
      historySectionTitle: typeof parsed.historySectionTitle === "string"
        ? parsed.historySectionTitle
        : defaultLayoutConfig.historySectionTitle,
      historySectionIntro: typeof parsed.historySectionIntro === "string"
        ? parsed.historySectionIntro
        : defaultLayoutConfig.historySectionIntro,
      historyItems: storedHistory,
    } as AdminLayoutConfig;
  } catch {
    return defaultLayoutConfig;
  }
};

export const saveAdminLayout = (layout: AdminLayoutConfig) => {
  write(ADMIN_LAYOUT_KEY, layout);
  return layout;
};
