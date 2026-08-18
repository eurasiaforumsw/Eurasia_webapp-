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
  locale: "th" | "en" | "ko";
  updatedAt: string;
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
  defaultLocale: "th",
  reviewNotifications: true,
};

const initialContent: AdminContentItem[] = [
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
    title: "คลังงานวิจัยและบทความวิชาการ",
    summary: "พื้นที่สำหรับบทความวิชาการ งานวิจัยเชิงพื้นที่ และบทเรียนจากการทำงานระดับภูมิภาค",
    body: "รวบรวมงานวิจัยทางด้านสวัสดิการสังคมและการสงเคราะห์ระดับนานาชาติ เพื่อเป็นแหล่งอ้างอิงและพัฒนาองค์ความรู้สำหรับนักวิชาการและผู้ปฏิบัติงาน",
    coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&h=700&q=80",
    imageCaption: "คลังเอกสารและงานวิจัยเชิงวิชาการสวัสดิการสังคม",
    author: "กองบรรณาธิการ EFSW",
    tags: ["งานวิจัย", "วิชาการ", "สวัสดิการ"],
    status: "published",
    locale: "th",
    updatedAt: "2026-08-07T00:00:00.000Z",
  },
  {
    id: "document-practice",
    kind: "document",
    category: "Practice",
    title: "คู่มือการปฏิบัติงานสังคมสงเคราะห์",
    summary: "ทรัพยากรที่ช่วยให้นักสังคมสงเคราะห์นำความรู้ไปปรับใช้ในบริบทของตนเอง",
    body: "คู่มือแนวทางการปฏิบัติงานภาคสนามสำหรับจัดการเคสกลุ่มเปราะบาง เด็ก สตรี และผู้สูงอายุในระดับภูมิภาค",
    coverImage: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&h=700&q=80",
    imageCaption: "คู่มือแนวทางการปฏิบัติงานภาคสนาม",
    author: "คณะทำงานภาคปฏิบัติ",
    tags: ["คู่มือ", "ภาคปฏิบัติ", "Case Management"],
    status: "published",
    locale: "th",
    updatedAt: "2026-08-07T00:00:00.000Z",
  },
  {
    id: "document-briefings",
    kind: "document",
    category: "Briefings",
    title: "เอกสารสรุปเชิงนโยบายระดับภูมิภาค",
    summary: "มุมมองสั้น กระชับ และพร้อมใช้สำหรับการพูดคุยเรื่องนโยบายและความร่วมมือ",
    body: "สรุปสาระสำคัญเชิงนโยบายเพื่อนำเสนอต่อองค์กรภาครัฐและประชาสังคมในการขับเคลื่อนสิทธิประโยชน์ทางสังคม",
    coverImage: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&h=700&q=80",
    imageCaption: "เอกสารนโยบายและความร่วมมือภาครัฐ",
    author: "คณะกรรมการนโยบาย",
    tags: ["นโยบาย", "ความร่วมมือ", "ภูมิภาค"],
    status: "published",
    locale: "th",
    updatedAt: "2026-08-07T00:00:00.000Z",
  },
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
    return {
      ...defaultLayoutConfig,
      ...parsed,
      sectionVisibility: {
        ...defaultLayoutConfig.sectionVisibility,
        ...(parsed.sectionVisibility || {}),
      },
    } as AdminLayoutConfig;
  } catch {
    return defaultLayoutConfig;
  }
};

export const saveAdminLayout = (layout: AdminLayoutConfig) => {
  write(ADMIN_LAYOUT_KEY, layout);
  return layout;
};

