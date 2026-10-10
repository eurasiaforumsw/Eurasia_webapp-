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

export type AdminContentKind = "news" | "document" | "event" | "academic";
export type AdminContentStatus = "draft" | "published" | "archived";

export type ContentLocale = "en" | "th" | "ko";
export const CONTENT_LOCALES: ContentLocale[] = ["en", "th", "ko"];

export type CoverImageCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
};

export type AdminContentItem = {
  id: string;
  kind: AdminContentKind;
  category: string;
  title: string;
  summary: string;
  body: string;
  coverImage?: string;
  coverImageCrop?: CoverImageCrop;  // Crop settings for cover image
  imageCaption?: string;
  author?: string;
  tags?: string[];
  status: AdminContentStatus;
  locale: ContentLocale;
  updatedAt: string;
  /* event-only extras — pill date + venue; unused for news/documents */
  startsAt?: string;   // ISO datetime
  endsAt?: string;     // ISO datetime
  venue?: string;      // free-form location label
  format?: string;     // e.g. "Webinar", "In-person", "Hybrid"
  registrationUrl?: string;
  /* visibility window — content auto-archives once `expiresAt` passes.
     `publishAt` lets an admin schedule future publication. */
  publishAt?: string;  // ISO datetime — earliest moment it goes public
  expiresAt?: string;  // ISO datetime — auto-archive threshold
  /* audience gating — `targetMembershipTypes` is the membership tier
     (professional/student/institutional); `targetGroups` reuses the
     EFSW target-group hashtags (children-youth, gender-lgbtq, …).
     An empty array means "all members and the public". */
  targetMembershipTypes?: ("professional" | "student" | "institutional")[];
  targetGroups?: string[];
  /* engagement metrics — for tracking user interactions */
  viewCount?: number;        // Number of views
  downloadCount?: number;    // Number of downloads
  likeCount?: number;        // Number of likes
  likedBy?: string[];        // Array of user IDs who liked this content
  /* hero slider settings — for events featured on homepage */
  showInHeroSlider?: boolean;  // Show this event in the homepage hero slider
  sliderDuration?: number;     // Duration in milliseconds (default: 6000)
  sliderOrder?: number;        // Order in slider (lower = first)
  /* SEO & metadata */
  seoTitle?: string;           // SEO title (overrides title)
  seoDescription?: string;     // Meta description
  seoKeywords?: string[];      // Keywords array
  ogImage?: string;            // Open Graph image URL
  canonicalUrl?: string;       // Canonical URL
};

/** The default audience when nothing is specified — open to everyone. */
export const DEFAULT_CONTENT_AUDIENCE = {
  membershipTypes: [] as AdminContentItem["targetMembershipTypes"],
  groups: [] as AdminContentItem["targetGroups"],
};

/** Returns true if a content item should be visible at the given moment. */
export const isContentVisible = (
  item: Pick<AdminContentItem, "status" | "publishAt" | "expiresAt">,
  now: Date = new Date(),
): boolean => {
  if (item.status === "archived") return false;
  if (item.publishAt && Date.parse(item.publishAt) > now.getTime()) return false;
  if (item.expiresAt && Date.parse(item.expiresAt) < now.getTime()) return false;
  return true;
};

/** Returns true when the content has passed its expiresAt but is still
 *  marked published — admins should auto-archive it. */
export const isContentExpired = (
  item: Pick<AdminContentItem, "status" | "expiresAt">,
  now: Date = new Date(),
): boolean => {
  if (item.status !== "published") return false;
  if (!item.expiresAt) return false;
  return Date.parse(item.expiresAt) < now.getTime();
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

export type AdminPartnerLogo = {
  id: string;
  name: string;       // Partner organization name (for alt text + admin label)
  logoUrl: string;    // URL to logo image (any size — will be normalized via CSS)
  websiteUrl?: string; // Optional link when the logo is clicked
  order: number;      // Display order in the marquee
  /* Set when `logoUrl` was uploaded via /api/upload (R2). Same fields as
     AdminHeroScene / AdminHistoryItem — powers the asset summary panel. */
  sizeBytes?: number;
  mimeType?: string;
  uploadedAt?: string;
  /** Display size for the logo, in CSS pixels. Admins pick a uniform
   *  size for every logo in the marquee so they all render consistently.
   *  Default 200. */
  displaySize?: 80 | 100 | 120 | 160 | 200;
};

export type AdminBoardMember = {
  id: string;
  name: string;
  title: string;
  country: string;
  image: string;
  /* Short biography shown inside the card's "Show more" disclosure on the
     Executive Board page. Optional — the button hides itself when empty. */
  bio?: string;
};

export type AdminHistoryItem = {
  id: string;
  year: number;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  /** Set when `image` was uploaded via /api/upload (R2). Used by the
   *  "Asset summary" panel — same fields as AdminHeroScene. */
  imageSizeBytes?: number;
  imageMimeType?: string;
  imageUploadedAt?: string;
  isCurrent?: boolean;
};

/* Branch on the /about/organization org-structure grid (Knowledge,
   Partnerships, Community, plus the primary Council node which is
   always hardcoded above the branches in copy). */
export type AdminOrgBranch = {
  id: string;
  /** Display number, e.g. "02". The primary node is "01". */
  num: string;
  /** Translation key inside `organization.nodes.<key>` for label + tag. */
  key: string;
  /** Lucide icon name to render next to the title. */
  iconName: string;
};

export type AdminOrgWorkingGroup = {
  id: string;
  /** Translation key inside `organization.workingGroups.<key>`. */
  key: string;
  /** Display number, e.g. "WG-01". */
  label: string;
  /** Allocated seats — drives the network total too. */
  seats: number;
};

export type AdminOrgReachStat = {
  id: string;
  /** Big number shown in the reach grid. */
  value: string;
  /** Translation key inside `organization.reach.<key>` for label/note. */
  key: string;
  iconName: string;
};

export type AdminOrgStage = {
  id: string;
  /** Step number shown above the card. */
  step: string;
  /** Translation key inside `organization.stages.<key>`. */
  key: string;
};

export type AdminLibraryCategory = {
  id: string;
  /** Translation key inside `library.categories.<key>` (label / sublabel / purpose / description). */
  key: string;
  /** Visual modifier used by the card class. */
  mod: string;
  /** Accent color for icons/CTA (CSS color, hex, or var(--token)). */
  accent: string;
};

export type AdminHeroScene = {
  id: string;
  /** Image scenes auto-advance after `durationSec`; video scenes
   *  advance when playback ends. */
  kind: "image" | "video";
  /** Public URL of the asset (image or video file). */
  url: string;
  /** For videos: poster image shown until first frame. For images: ignored. */
  posterUrl?: string;
  /** Display time for image scenes (seconds). Default 5.
   *  Ignored for video scenes (uses real video duration). */
  durationSec?: number;
  /** Optional per-scene overlay — overrides the global headline. */
  headline?: string;
  /** Optional per-scene CTA. When omitted, the global CTA is used. */
  ctaText?: string;
  ctaLink?: string;
  /** Display order (lower first). */
  order: number;
  /** Set when the file was uploaded from the admin — used by the
   *  "Asset summary" panel to show file size, MIME type, and storage
   *  location. Not required when the URL is pasted manually. */
  sizeBytes?: number;
  mimeType?: string;
  uploadedAt?: string;
};

export type AdminLayoutConfig = {
  heroHeadline: string;
  heroSubheadline: string;
  heroTagline: string;
  heroCtaText: string;
  heroCtaLink: string;
  /** Multi-scene hero carousel. When at least one scene is present,
   *  the public hero cycles through them (image scenes use
   *  `durationSec`, video scenes advance on `ended`). Legacy
   *  `heroBgVideoUrl` / `heroBgPosterUrl` remain as fallbacks for
   *  existing installations that haven't migrated yet. */
  heroScenes?: AdminHeroScene[];
  heroBgVideoUrl?: string;
  heroBgPosterUrl?: string;
  /* Optional hero announcement — when set, the hero switches to
     announcement mode (image/video bg + message + detail link). */
  heroAnnouncementTitle?: string;
  heroAnnouncementSummary?: string;
  heroAnnouncementLink?: string;
  heroAnnouncementLinkLabel?: string;
  deanSectionTitle: string;
  deanProfiles: AdminLeaderProfile[];
  partnerLogos: AdminPartnerLogo[];
  boardMembers: AdminBoardMember[];
  historySectionTitle: string;
  historySectionIntro: string;
  historyItems: AdminHistoryItem[];

  /* ── Home page section copy (titles/subtitles/CTAs) ── */
  homeAboutBridgeTitle: string;
  homeAboutBridgeBody: string;
  homeAboutBridgeCtaText: string;
  homeEventsTitle: string;
  homeEventsSubtitle: string;
  homeEventsCtaText: string;
  homeNewsTitle: string;
  homeNewsSubtitle: string;
  homeNewsCtaText: string;

  /* ── Footer (shared across all public pages) ── */
  footerTagline: string;          // small line under brand, e.g. "Connect · Empower · Advocate"
  footerEmailLabel: string;       // e.g. "Start a conversation"
  footerEmail: string;
  footerLinksLabel: string;
  footerAdminLinkLabel: string;   // visible label, e.g. "Admin Console"
  footerCopyright: string;       // e.g. "© 2026 EFSW"

  /* ── /about/organization page data ── */
  orgPageBranchesTitle: string;   // header above 4 org nodes
  orgPageBranches: AdminOrgBranch[];
  orgPageWorkingGroups: AdminOrgWorkingGroup[];
  orgPageReachTitle: string;
  orgPageReach: AdminOrgReachStat[];
  orgPageStagesTitle: string;
  orgPageStages: AdminOrgStage[];

  /* ── /academic-documents category cards ── */
  libraryCategories: AdminLibraryCategory[];

  sectionVisibility: {
    hero: boolean;
    voices: boolean;
    deanMessage: boolean;
    about: boolean;
    events: boolean;
    news: boolean;
    membership: boolean;
    partnerLogos: boolean;
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
  heroScenes: [
    {
      id: "scene-default-video",
      kind: "video",
      url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260516_122702_390f5305-8719-41d5-ae80-d23ab3796c28.mp4",
      posterUrl: "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090123_74be96d4-9c1b-40cf-932a-96f4f4babed3.png&w=1280&q=85",
      durationSec: 5,
      order: 0,
      uploadedAt: new Date().toISOString(),
    },
  ],
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
  partnerLogos: [
    { id: "partner-1", name: "Chulalongkorn University", logoUrl: "/partners/partner-1.svg", websiteUrl: "https://www.chula.ac.th", order: 1, displaySize: 200 },
    { id: "partner-2", name: "UNESCO Bangkok", logoUrl: "/partners/partner-2.svg", websiteUrl: "https://www.unesco.org", order: 2, displaySize: 200 },
    { id: "partner-3", name: "Seoul National University", logoUrl: "/partners/partner-3.svg", websiteUrl: "https://www.snu.ac.kr", order: 3, displaySize: 200 },
    { id: "partner-4", name: "Mahidol University", logoUrl: "/partners/partner-4.svg", websiteUrl: "https://mahidol.ac.th", order: 4, displaySize: 200 },
    { id: "partner-5", name: "Ewha Womans University", logoUrl: "/partners/partner-5.svg", websiteUrl: "https://www.ewha.ac.kr", order: 5, displaySize: 200 },
    { id: "partner-6", name: "Thammasat University", logoUrl: "/partners/partner-6.svg", websiteUrl: "https://tu.ac.th", order: 6, displaySize: 200 },
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

  /* ── Home page section copy defaults ── */
  homeAboutBridgeTitle: "A professional network with a human centre.",
  homeAboutBridgeBody:
    "We bring social workers, educators, researchers, students, and institutions into one regional conversation about social justice and human wellbeing.",
  homeAboutBridgeCtaText: "Read about us",
  homeEventsTitle: "Where the network",
  homeEventsSubtitle:
    "Summits, webinars, workshops and convenings — join a live conversation with practitioners from across Eurasia.",
  homeEventsCtaText: "View all events",
  homeNewsTitle: "Stories moving",
  homeNewsSubtitle:
    "News, announcements, and updates from the work of connecting social workers across Eurasia.",
  homeNewsCtaText: "View all news",

  /* ── Footer defaults ── */
  footerTagline: "Connect · Empower · Advocate",
  footerEmailLabel: "Start a conversation",
  footerEmail: "support@eurasiaforumsw.org",
  footerLinksLabel: "Quick links",
  footerAdminLinkLabel: "Admin Console",
  footerCopyright: "© 2026 EFSW",

  /* ── /about/organization defaults ── */
  orgPageBranchesTitle: "Four bodies. One direction.",
  orgPageBranches: [
    { id: "branch-knowledge",    num: "02", key: "knowledge",    iconName: "BookOpen" },
    { id: "branch-partnerships", num: "03", key: "partnerships", iconName: "Globe"    },
    { id: "branch-community",    num: "04", key: "community",    iconName: "Users"    },
  ],
  orgPageWorkingGroups: [
    { id: "wg01", key: "research", label: "WG-01", seats: 12 },
    { id: "wg02", key: "field", label: "WG-02", seats: 18 },
    { id: "wg03", key: "curriculum", label: "WG-03", seats: 9  },
    { id: "wg04", key: "policy", label: "WG-04", seats: 10 },
  ],
  orgPageReachTitle: "Reach across the network",
  orgPageReach: [
    { id: "reach-groups",    value: "4",    key: "groups",    iconName: "Network"  },
    { id: "reach-seats",     value: "49",   key: "seats",     iconName: "Users"    },
    { id: "reach-languages", value: "3",    key: "languages", iconName: "Globe"    },
    { id: "reach-cycle",     value: "2026", key: "cycle",     iconName: "Handshake"},
  ],
  orgPageStagesTitle: "How the collaboration moves",
  orgPageStages: [
    { id: "stage-proposal", step: "01", key: "proposal" },
    { id: "stage-review",   step: "02", key: "review"   },
    { id: "stage-joint",    step: "03", key: "joint"    },
    { id: "stage-practice", step: "04", key: "practice" },
  ],

  /* ── Library category defaults ── */
  libraryCategories: [
    { id: "cat-research",  key: "research",  mod: "research",  accent: "var(--efsw-green)" },
    { id: "cat-practice",  key: "practice",  mod: "practice",  accent: "#9a6f1a"          },
    { id: "cat-briefings", key: "briefings", mod: "briefings", accent: "#005C69"          },
  ],

  sectionVisibility: {
    hero: true,
    voices: true,
    deanMessage: true,
    about: true,
    events: true,
    news: true,
    membership: true,
    partnerLogos: true,
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
  {
    id: "event-summit-2026",
    kind: "event",
    category: "Summit",
    title: "EFSW Regional Summit 2026",
    summary: "Our flagship annual gathering — three days of keynotes, workshops and cross-border partnerships under one roof.",
    body: "The Eurasia Forum for Social Workers invites practitioners, researchers, students and institutional partners to the 2026 Regional Summit in Bangkok. Across three days we'll move from plenary keynotes to hands-on masterclasses, and from country delegation briefings to open working groups on child protection, digital practice and community care.\n\nExpect trilingual interpretation throughout, an evening cultural programme hosted by our Thai chapter, and a closing commitment signed by member-country delegations.",
    coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&h=900&q=80",
    imageCaption: "Delegates at a regional summit plenary",
    author: "EFSW Secretariat",
    tags: ["Summit", "Regional", "Trilingual"],
    status: "published",
    locale: "en",
    updatedAt: "2026-08-07T00:00:00.000Z",
    startsAt: "2026-11-12T09:00:00.000Z",
    endsAt: "2026-11-14T17:30:00.000Z",
    venue: "Bangkok International Trade & Exhibition Centre (BITEC)",
    format: "In-person",
    registrationUrl: "/member/register",
  },
  {
    id: "event-webinar-youth",
    kind: "event",
    category: "Webinar",
    title: "Youth mental-health practice across borders",
    summary: "A 90-minute panel bringing school social workers from Seoul, Bangkok and Tbilisi into one live conversation.",
    body: "Join three frontline school social workers as they compare notes on post-pandemic adolescent mental health. We'll look at what's working in peer-support models, how each country handles family engagement, and what tools transfer across contexts. Live Q&A follows the moderated panel.",
    coverImage: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=1600&h=900&q=80",
    imageCaption: "Online panel discussion",
    author: "Practice Working Group",
    tags: ["Youth", "Mental health", "Webinar"],
    status: "published",
    locale: "en",
    updatedAt: "2026-08-07T00:00:00.000Z",
    startsAt: "2026-10-08T13:00:00.000Z",
    endsAt: "2026-10-08T14:30:00.000Z",
    venue: "Online (Zoom)",
    format: "Webinar",
    registrationUrl: "/member/register",
  },
  {
    id: "event-workshop-data",
    kind: "event",
    category: "Workshop",
    title: "Field data & evidence: a two-day masterclass",
    summary: "Hands-on training for practitioner-researchers who want to turn casework into publishable evidence.",
    body: "This small-cohort workshop walks through research design, consent workflows, qualitative coding and ethical write-up — using real (anonymised) cases contributed by participants. Bring a question from your own practice; leave with a draft research plan. Limited to 24 seats.",
    coverImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&h=900&q=80",
    imageCaption: "Small-group workshop",
    author: "Academic Working Group",
    tags: ["Research methods", "Masterclass"],
    status: "published",
    locale: "en",
    updatedAt: "2026-08-07T00:00:00.000Z",
    startsAt: "2026-09-22T09:00:00.000Z",
    endsAt: "2026-09-23T16:00:00.000Z",
    venue: "Chulalongkorn University, Bangkok",
    format: "In-person",
    registrationUrl: "/member/register",
  },
];

export const defaultContentCategories: AdminContentCategory[] = [
  { id: "news-platform", kind: "news", label: "Platform update", order: 0, enabled: true },
  { id: "news-membership", kind: "news", label: "Membership", order: 1, enabled: true },
  { id: "news-resources", kind: "news", label: "Resources", order: 2, enabled: true },
  { id: "document-research", kind: "document", label: "Research", order: 0, enabled: true },
  { id: "document-practice", kind: "document", label: "Practice", order: 1, enabled: true },
  { id: "document-briefings", kind: "document", label: "Briefings", order: 2, enabled: true },
  { id: "event-summit", kind: "event", label: "Summit", order: 0, enabled: true },
  { id: "event-conference", kind: "event", label: "Conference", order: 1, enabled: true },
  { id: "event-webinar", kind: "event", label: "Webinar", order: 2, enabled: true },
  { id: "event-workshop", kind: "event", label: "Workshop", order: 3, enabled: true },
  { id: "event-meetup", kind: "event", label: "Meetup", order: 4, enabled: true },
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
        kind: item.kind === "document" ? "document" : item.kind === "event" ? "event" : "news",
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

/* ═════════════════════════════════════════════════════════════
   Supabase sync layer — async; falls back to localStorage.
   Every public read path stays synchronous (localStorage is always
   the source of truth for the current render); the sync layer
   pulls from Supabase and writes the merged result back.
   ═════════════════════════════════════════════════════════════ */

const USE_REMOTE =
  typeof window !== "undefined" &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Fetch all admin content rows from Supabase. */
async function fetchRemoteContent(): Promise<AdminContentItem[] | null> {
  if (!USE_REMOTE) return null;

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "")}/rest/v1/content?select=*`;
  const headers = {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
  };

  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (!res.ok) return null;

    const rows = (await res.json()) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: row.id as string,
      kind: row.kind as AdminContentKind,
      category: (row.category as string) ?? "General",
      title: (row.title as string) ?? "",
      summary: (row.summary as string) ?? "",
      body: (row.body as string) ?? "",
      coverImage: (row.cover_image as string) ?? undefined,
      coverImageCrop: row.cover_image_crop
        ? (row.cover_image_crop as CoverImageCrop)
        : undefined,
      imageCaption: (row.image_caption as string) ?? undefined,
      author: (row.author as string) ?? undefined,
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      status: (row.status as AdminContentStatus) ?? "draft",
      locale: (row.locale as AdminContentItem["locale"]) ?? "en",
      updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
      startsAt: (row.starts_at as string) ?? undefined,
      endsAt: (row.ends_at as string) ?? undefined,
      venue: (row.venue as string) ?? undefined,
      format: (row.format as string) ?? undefined,
      registrationUrl: (row.registration_url as string) ?? undefined,
      publishAt: (row.publish_at as string) ?? undefined,
      expiresAt: (row.expires_at as string) ?? undefined,
      targetMembershipTypes: Array.isArray(row.target_membership_types)
        ? (row.target_membership_types as AdminContentItem["targetMembershipTypes"])
        : undefined,
      targetGroups: Array.isArray(row.target_groups)
        ? (row.target_groups as AdminContentItem["targetGroups"])
        : undefined,
    }));
  } catch {
    return null;
  }
}

/** Sync content: localStorage + Supabase. Remote wins on conflict. */
export async function syncAdminContent(): Promise<AdminContentItem[]> {
  const local = getAdminContent();

  if (!USE_REMOTE) return autoArchive(local);

  const remote = await fetchRemoteContent();
  if (!remote) return autoArchive(local);

  // Merge: remote items first (they win), then any local-only items
  // that haven't been pushed to remote yet.
  const remoteIds = new Set(remote.map((i) => i.id));
  const localOnly = local.filter((i) => !remoteIds.has(i.id) && i.id);

  const merged = autoArchive([...remote, ...localOnly]);
  write(ADMIN_CONTENT_KEY, merged);

  // Push local-only items to remote so nothing is lost
  for (const item of localOnly) {
    await pushContentRow(item);
  }

  // Push back any items we just auto-archived
  for (const before of remote) {
    const after = merged.find((m) => m.id === before.id);
    if (after && after.status !== before.status && after.status === "archived" && before.status !== "archived") {
      await pushContentRow(after);
    }
  }

  return merged;
}

/**
 * Mark expired items as `archived` so the public feed never ships them.
 * The auto-archive is local-only; the admin sees the change and the
 * synced Supabase row updates the next time the content is edited.
 */
export function autoArchive(items: AdminContentItem[]): AdminContentItem[] {
  const now = Date.now();
  let changed = false;
  const next = items.map((item) => {
    if (
      item.status === "published" &&
      item.expiresAt &&
      Date.parse(item.expiresAt) < now
    ) {
      changed = true;
      return { ...item, status: "archived" as const };
    }
    return item;
  });
  if (changed && canUseStorage()) write(ADMIN_CONTENT_KEY, next);
  return next;
}

/** Save one row: optimistic localStorage write + async remote POST. */
export async function saveAdminContentRemote(
  item: AdminContentItem,
  onError?: (message: string) => void
): Promise<AdminContentItem[]> {
  // 1) Optimistic local write — UI updates instantly.
  const next = saveAdminContent(item);

  if (!USE_REMOTE) return next;

  // 2) Push to Supabase; on failure, keep local but surface the error.
  try {
    await pushContentRow(item);
  } catch (err: any) {
    onError?.(err?.message || "Failed to save to database");
  }
  return next;
}

/** Delete one row locally + remotely. */
export async function deleteAdminContentRemote(
  id: string,
  onError?: (message: string) => void
): Promise<AdminContentItem[]> {
  // 1) Optimistic local delete
  const next = deleteAdminContent(id);

  if (!USE_REMOTE) return next;

  // 2) Remote delete
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
    const res = await fetch(`${supabaseUrl}/rest/v1/content?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (err: any) {
    onError?.(err?.message || "Failed to delete from database");
  }
  return next;
}

/** Push one row to Supabase via REST. */
async function pushContentRow(item: AdminContentItem): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
  const body = {
    id: item.id,
    kind: item.kind,
    category: item.category,
    title: item.title,
    summary: item.summary,
    body: item.body,
    cover_image: item.coverImage || null,
    cover_image_crop: item.coverImageCrop || null,
    image_caption: item.imageCaption || null,
    author: item.author || null,
    tags: item.tags ?? [],
    status: item.status,
    locale: item.locale,
    updated_at: new Date().toISOString(),
    starts_at: item.startsAt || null,
    ends_at: item.endsAt || null,
    venue: item.venue || null,
    format: item.format || null,
    registration_url: item.registrationUrl || null,
    publish_at: item.publishAt || null,
    expires_at: item.expiresAt || null,
    target_membership_types: item.targetMembershipTypes ?? [],
    target_groups: item.targetGroups ?? [],
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/content`, {
    method: "POST",
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      "Content-Type": "application/json",
      // upsert on primary key
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase save failed: ${res.status} ${text.slice(0, 300)}`);
  }
}

/* ════════════════════════════════════════════════════════════
   R2 image upload — posts to /api/upload, returns public URL.
   ════════════════════════════════════════════════════════════ */

export type R2UploadResult = {
  url: string;
  key: string;
  sizeBytes?: number;
  mimeType?: string;
  humanSize?: string;
  originalSizeBytes?: number;
  originalHumanSize?: string;
  bucket?: string | null;
  kind?: "image" | "video";
};

export async function uploadImageToR2(
  file: File
): Promise<{ url: string; key: string }> {
  const result = await uploadMediaToR2(file);
  return { url: result.url, key: result.key };
}

/**
 * Upload any image or video file. Returns the public URL plus an
 * asset summary (size, MIME, original/compressed dimensions) so the
 * admin UI can show "Uploaded · 4.2 MB · image/webp · R2" inline.
 */
export async function uploadMediaToR2(file: File): Promise<R2UploadResult> {
  if (!USE_REMOTE) {
    // Fallback: compress images to data URL; pass videos through as-is
    // (browsers can't compress video in-canvas).
    if (file.type.startsWith("video/")) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
      return {
        url: dataUrl,
        key: "",
        sizeBytes: file.size,
        mimeType: file.type,
        humanSize: formatBytesLocal(file.size),
        kind: "video",
        bucket: null,
      };
    }
    const compressed = await (await import("@/lib/image-utils")).compressImageFile(file, {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.82,
      outputFormat: "image/webp",
    });
    const approxBytes = Math.floor((compressed.length * 3) / 4);
    return {
      url: compressed,
      key: "",
      sizeBytes: approxBytes,
      mimeType: "image/webp",
      humanSize: formatBytesLocal(approxBytes),
      originalSizeBytes: file.size,
      originalHumanSize: formatBytesLocal(file.size),
      kind: "image",
      bucket: null,
    };
  }

  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }
  return (await res.json()) as R2UploadResult;
}

function formatBytesLocal(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

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
            imageSizeBytes:
              typeof item.imageSizeBytes === "number" && item.imageSizeBytes >= 0
                ? item.imageSizeBytes
                : undefined,
            imageMimeType:
              typeof item.imageMimeType === "string" ? item.imageMimeType : undefined,
            imageUploadedAt:
              typeof item.imageUploadedAt === "string" ? item.imageUploadedAt : undefined,
            isCurrent: Boolean(item.isCurrent),
          }))
          .sort((a: AdminHistoryItem, b: AdminHistoryItem) => a.year - b.year)
      : defaultLayoutConfig.historyItems;
    const storedScenes = Array.isArray(parsed.heroScenes)
      ? parsed.heroScenes
          .filter((s: unknown): s is Partial<AdminHeroScene> => Boolean(s && typeof s === "object"))
          .map((s: Partial<AdminHeroScene>, index: number): AdminHeroScene => ({
            id: typeof s.id === "string" && s.id ? s.id : `scene-${index}`,
            kind: s.kind === "video" ? "video" : "image",
            url: typeof s.url === "string" ? s.url : "",
            posterUrl: typeof s.posterUrl === "string" ? s.posterUrl : undefined,
            durationSec:
              typeof s.durationSec === "number" && s.durationSec >= 1 && s.durationSec <= 120
                ? s.durationSec
                : 5,
            headline: typeof s.headline === "string" ? s.headline : undefined,
            ctaText: typeof s.ctaText === "string" ? s.ctaText : undefined,
            ctaLink: typeof s.ctaLink === "string" ? s.ctaLink : undefined,
            order: typeof s.order === "number" ? s.order : index,
            sizeBytes: typeof s.sizeBytes === "number" ? s.sizeBytes : undefined,
            mimeType: typeof s.mimeType === "string" ? s.mimeType : undefined,
            uploadedAt: typeof s.uploadedAt === "string" ? s.uploadedAt : undefined,
          }))
          .sort((a: AdminHeroScene, b: AdminHeroScene) => a.order - b.order)
      : undefined;

    // If there are no stored scenes yet but legacy `heroBgVideoUrl` /
    // `heroBgPosterUrl` are, migrate them into a single video scene so
    // existing installations immediately benefit from the carousel.
    const migratedScenes: AdminHeroScene[] | undefined =
      storedScenes ??
      (parsed.heroBgVideoUrl || parsed.heroBgPosterUrl
        ? [
            {
              id: "scene-migrated",
              kind: parsed.heroBgVideoUrl ? "video" : "image",
              url: parsed.heroBgVideoUrl || parsed.heroBgPosterUrl || "",
              posterUrl: parsed.heroBgPosterUrl || undefined,
              durationSec: 5,
              order: 0,
              uploadedAt: new Date().toISOString(),
            },
          ]
        : undefined);

    return {
      ...defaultLayoutConfig,
      ...parsed,
      sectionVisibility: {
        ...defaultLayoutConfig.sectionVisibility,
        ...(parsed.sectionVisibility || {}),
      },
      boardMembers: Array.isArray(parsed.boardMembers) ? parsed.boardMembers : defaultLayoutConfig.boardMembers,
      partnerLogos: Array.isArray(parsed.partnerLogos)
        ? parsed.partnerLogos
            .filter((item: unknown): item is Partial<AdminPartnerLogo> => Boolean(item && typeof item === "object"))
            .map((item: Partial<AdminPartnerLogo>, index: number): AdminPartnerLogo => ({
              id: typeof item.id === "string" && item.id ? item.id : `partner-${index}`,
              name: typeof item.name === "string" ? item.name : "",
              logoUrl: typeof item.logoUrl === "string" ? item.logoUrl : "",
              websiteUrl: typeof item.websiteUrl === "string" ? item.websiteUrl : undefined,
              order: typeof item.order === "number" ? item.order : index + 1,
              sizeBytes: typeof item.sizeBytes === "number" ? item.sizeBytes : undefined,
              mimeType: typeof item.mimeType === "string" ? item.mimeType : undefined,
              uploadedAt: typeof item.uploadedAt === "string" ? item.uploadedAt : undefined,
              displaySize:
                item.displaySize === 80 || item.displaySize === 100 ||
                item.displaySize === 120 || item.displaySize === 160 ||
                item.displaySize === 200
                  ? item.displaySize
                  : 200,
            }))
            .sort((a: AdminPartnerLogo, b: AdminPartnerLogo) => a.order - b.order)
        : defaultLayoutConfig.partnerLogos,
      historySectionTitle: typeof parsed.historySectionTitle === "string"
        ? parsed.historySectionTitle
        : defaultLayoutConfig.historySectionTitle,
      historySectionIntro: typeof parsed.historySectionIntro === "string"
        ? parsed.historySectionIntro
        : defaultLayoutConfig.historySectionIntro,
      historyItems: storedHistory,
      heroScenes: migratedScenes,

      /* ── Home page section copy ── */
      homeAboutBridgeTitle: typeof parsed.homeAboutBridgeTitle === "string"
        ? parsed.homeAboutBridgeTitle
        : defaultLayoutConfig.homeAboutBridgeTitle,
      homeAboutBridgeBody: typeof parsed.homeAboutBridgeBody === "string"
        ? parsed.homeAboutBridgeBody
        : defaultLayoutConfig.homeAboutBridgeBody,
      homeAboutBridgeCtaText: typeof parsed.homeAboutBridgeCtaText === "string"
        ? parsed.homeAboutBridgeCtaText
        : defaultLayoutConfig.homeAboutBridgeCtaText,
      homeEventsTitle: typeof parsed.homeEventsTitle === "string"
        ? parsed.homeEventsTitle
        : defaultLayoutConfig.homeEventsTitle,
      homeEventsSubtitle: typeof parsed.homeEventsSubtitle === "string"
        ? parsed.homeEventsSubtitle
        : defaultLayoutConfig.homeEventsSubtitle,
      homeEventsCtaText: typeof parsed.homeEventsCtaText === "string"
        ? parsed.homeEventsCtaText
        : defaultLayoutConfig.homeEventsCtaText,
      homeNewsTitle: typeof parsed.homeNewsTitle === "string"
        ? parsed.homeNewsTitle
        : defaultLayoutConfig.homeNewsTitle,
      homeNewsSubtitle: typeof parsed.homeNewsSubtitle === "string"
        ? parsed.homeNewsSubtitle
        : defaultLayoutConfig.homeNewsSubtitle,
      homeNewsCtaText: typeof parsed.homeNewsCtaText === "string"
        ? parsed.homeNewsCtaText
        : defaultLayoutConfig.homeNewsCtaText,

      /* ── Footer ── */
      footerTagline: typeof parsed.footerTagline === "string"
        ? parsed.footerTagline
        : defaultLayoutConfig.footerTagline,
      footerEmailLabel: typeof parsed.footerEmailLabel === "string"
        ? parsed.footerEmailLabel
        : defaultLayoutConfig.footerEmailLabel,
      footerEmail: typeof parsed.footerEmail === "string"
        ? parsed.footerEmail
        : defaultLayoutConfig.footerEmail,
      footerLinksLabel: typeof parsed.footerLinksLabel === "string"
        ? parsed.footerLinksLabel
        : defaultLayoutConfig.footerLinksLabel,
      footerAdminLinkLabel: typeof parsed.footerAdminLinkLabel === "string"
        ? parsed.footerAdminLinkLabel
        : defaultLayoutConfig.footerAdminLinkLabel,
      footerCopyright: typeof parsed.footerCopyright === "string"
        ? parsed.footerCopyright
        : defaultLayoutConfig.footerCopyright,

      /* ── /about/organization ── */
      orgPageBranchesTitle: typeof parsed.orgPageBranchesTitle === "string"
        ? parsed.orgPageBranchesTitle
        : defaultLayoutConfig.orgPageBranchesTitle,
      orgPageBranches: Array.isArray(parsed.orgPageBranches)
        ? parsed.orgPageBranches.filter(
            (b: unknown): b is AdminOrgBranch =>
              !!b && typeof b === "object" &&
              typeof (b as AdminOrgBranch).id === "string" &&
              typeof (b as AdminOrgBranch).num === "string" &&
              typeof (b as AdminOrgBranch).key === "string" &&
              typeof (b as AdminOrgBranch).iconName === "string",
          )
        : defaultLayoutConfig.orgPageBranches,
      orgPageWorkingGroups: Array.isArray(parsed.orgPageWorkingGroups)
        ? parsed.orgPageWorkingGroups.filter(
            (w: unknown): w is AdminOrgWorkingGroup =>
              !!w && typeof w === "object" &&
              typeof (w as AdminOrgWorkingGroup).id === "string" &&
              typeof (w as AdminOrgWorkingGroup).key === "string" &&
              typeof (w as AdminOrgWorkingGroup).label === "string" &&
              typeof (w as AdminOrgWorkingGroup).seats === "number",
          )
        : defaultLayoutConfig.orgPageWorkingGroups,
      orgPageReachTitle: typeof parsed.orgPageReachTitle === "string"
        ? parsed.orgPageReachTitle
        : defaultLayoutConfig.orgPageReachTitle,
      orgPageReach: Array.isArray(parsed.orgPageReach)
        ? parsed.orgPageReach.filter(
            (r: unknown): r is AdminOrgReachStat =>
              !!r && typeof r === "object" &&
              typeof (r as AdminOrgReachStat).id === "string" &&
              typeof (r as AdminOrgReachStat).value === "string" &&
              typeof (r as AdminOrgReachStat).key === "string" &&
              typeof (r as AdminOrgReachStat).iconName === "string",
          )
        : defaultLayoutConfig.orgPageReach,
      orgPageStagesTitle: typeof parsed.orgPageStagesTitle === "string"
        ? parsed.orgPageStagesTitle
        : defaultLayoutConfig.orgPageStagesTitle,
      orgPageStages: Array.isArray(parsed.orgPageStages)
        ? parsed.orgPageStages.filter(
            (s: unknown): s is AdminOrgStage =>
              !!s && typeof s === "object" &&
              typeof (s as AdminOrgStage).id === "string" &&
              typeof (s as AdminOrgStage).step === "string" &&
              typeof (s as AdminOrgStage).key === "string",
          )
        : defaultLayoutConfig.orgPageStages,

      /* ── Library categories ── */
      libraryCategories: Array.isArray(parsed.libraryCategories)
        ? parsed.libraryCategories.filter(
            (c: unknown): c is AdminLibraryCategory =>
              !!c && typeof c === "object" &&
              typeof (c as AdminLibraryCategory).id === "string" &&
              typeof (c as AdminLibraryCategory).key === "string" &&
              typeof (c as AdminLibraryCategory).mod === "string" &&
              typeof (c as AdminLibraryCategory).accent === "string",
          )
        : defaultLayoutConfig.libraryCategories,
    } as AdminLayoutConfig;
  } catch {
    return defaultLayoutConfig;
  }
};

export const saveAdminLayout = (layout: AdminLayoutConfig) => {
  write(ADMIN_LAYOUT_KEY, layout);
  return layout;
};

/**
 * Save layout config to Supabase (async, with fallback to localStorage)
 */
export async function saveAdminLayoutRemote(
  layout: AdminLayoutConfig,
  onError?: (message: string) => void
): Promise<AdminLayoutConfig> {
  // 1) Optimistic local write
  const next = saveAdminLayout(layout);

  // 2) Push to Supabase
  if (!USE_REMOTE) {
    return next;
  }

  try {
    const response = await fetch("/api/layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: layout }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to save layout");
    }
  } catch (err: any) {
    onError?.(err?.message || "Failed to save to database");
  }

  return next;
}

/**
 * Sync layout config from Supabase to localStorage
 */
export async function syncAdminLayout(): Promise<AdminLayoutConfig> {
  if (!USE_REMOTE) {
    return getAdminLayout();
  }

  try {
    const response = await fetch("/api/layout");
    if (!response.ok) {
      throw new Error("Failed to fetch layout config");
    }

    const data = await response.json();
    if (data.config) {
      // Merge remote config with local, remote wins on conflict
      write(ADMIN_LAYOUT_KEY, data.config);
      return data.config;
    }
  } catch (err) {
    console.error("syncAdminLayout error:", err);
  }

  // Fallback to local
  return getAdminLayout();
}
