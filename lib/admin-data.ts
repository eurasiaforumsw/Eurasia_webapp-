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
  status: AdminContentStatus;
  locale: "th" | "en" | "ko";
  updatedAt: string;
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
    body: "",
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
    body: "",
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
    body: "",
    status: "published",
    locale: "en",
    updatedAt: "2026-08-07T00:00:00.000Z",
  },
  {
    id: "document-research",
    kind: "document",
    category: "Research",
    title: "คลังงานวิจัยและบทความ",
    summary: "พื้นที่สำหรับบทความวิชาการ งานวิจัยเชิงพื้นที่ และบทเรียนจากการทำงานระดับภูมิภาค",
    body: "",
    status: "published",
    locale: "th",
    updatedAt: "2026-08-07T00:00:00.000Z",
  },
  {
    id: "document-practice",
    kind: "document",
    category: "Practice",
    title: "คู่มือการปฏิบัติงาน",
    summary: "ทรัพยากรที่ช่วยให้นักสังคมสงเคราะห์นำความรู้ไปปรับใช้ในบริบทของตนเอง",
    body: "",
    status: "published",
    locale: "th",
    updatedAt: "2026-08-07T00:00:00.000Z",
  },
  {
    id: "document-briefings",
    kind: "document",
    category: "Briefings",
    title: "เอกสารสรุปเชิงนโยบาย",
    summary: "มุมมองสั้น กระชับ และพร้อมใช้สำหรับการพูดคุยเรื่องนโยบายและความร่วมมือ",
    body: "",
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
