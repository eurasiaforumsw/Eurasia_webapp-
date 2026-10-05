// ---------------------------------------------------------------------------
// Broadcast (email) — queue + send history, designed for later Resend integration.
// Stored in localStorage; will be persisted to Supabase in a future migration.
// ---------------------------------------------------------------------------

export type BroadcastStatus = "draft" | "scheduled" | "sent" | "failed";

export type BroadcastCampaign = {
  id: string;
  /** Reference to the source content item (news/event/document) */
  contentId?: string;
  contentTitle: string;
  contentKind: "news" | "event" | "document" | "academic" | "custom";
  /** Email subject line */
  subject: string;
  /** Short pre-header preview text */
  preheader: string;
  /** Full HTML body */
  body: string;
  /** Cover image URL (optional, shown in the email header) */
  coverImage?: string;
  /** Target groups — empty means "all members" */
  targetGroups: string[];
  /** Target member statuses — empty means "active" */
  targetStatuses: string[];
  /** When to send (ISO string); null = send immediately */
  scheduledAt?: string;
  status: BroadcastStatus;
  /** Number of recipients calculated at send time */
  recipientCount: number;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
};

export interface BroadcastRecipient {
  id: string;
  fullName: string;
  email: string;
  membershipType: string;
  status: string;
}

export type BroadcastAudience = {
  id: string;
  label: string;
  description: string;
  filter: (member: BroadcastRecipient) => boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BROADCAST_STORAGE_KEY = "efsw_admin_broadcasts";

export const DEFAULT_TARGET_GROUPS: BroadcastAudience[] = [
  { id: "all", label: "All Members", description: "Send to every active member", filter: () => true },
  { id: "professional", label: "Professional Members", description: "Practicing social workers", filter: (m) => m.membershipType === "professional" },
  { id: "student", label: "Student Members", description: "Currently enrolled students", filter: (m) => m.membershipType === "student" },
  { id: "institutional", label: "Institutional Members", description: "Organizations & universities", filter: (m) => m.membershipType === "institutional" },
];

export function getBroadcasts(): BroadcastCampaign[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BROADCAST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BroadcastCampaign[]) : [];
  } catch {
    return [];
  }
}

export function saveBroadcast(campaign: BroadcastCampaign): BroadcastCampaign {
  const campaigns = getBroadcasts();
  const existing = campaigns.findIndex((c) => c.id === campaign.id);
  if (existing >= 0) campaigns[existing] = campaign;
  else campaigns.push(campaign);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(campaigns));
  }
  return campaign;
}

export function deleteBroadcast(id: string): BroadcastCampaign[] {
  const campaigns = getBroadcasts().filter((c) => c.id !== id);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(campaigns));
  }
  return campaigns;
}

export function getBroadcastById(id: string): BroadcastCampaign | null {
  return getBroadcasts().find((c) => c.id === id) ?? null;
}

export function generateBroadcastId(): string {
  return `bc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Build a plain-text email HTML body from a content item + custom message.
 * In a real implementation this would go through a template engine.
 */
export function buildEmailBody(
  contentTitle: string,
  contentSummary: string,
  contentBody: string,
  customMessage: string,
  authorName: string,
): string {
  return `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
  <p style="font-size: 14px; margin-bottom: 24px;">${customMessage}</p>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />

  <h1 style="font-size: 22px; margin: 0 0 12px 0; color: #0f172a;">${contentTitle}</h1>

  ${contentSummary ? `<p style="font-size: 15px; color: #475569; margin-bottom: 16px;">${contentSummary}</p>` : ""}

  <div style="font-size: 14px; color: #334155;">
    ${contentBody
      .split("\n")
      .slice(0, 6)
      .map((p) => `<p>${p}</p>`)
      .join("\n")}
  </div>

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />

  <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">
    You are receiving this because you are a member of the Eurasia Forum for Social Workers (EFSW).
    <br />${authorName} · EFSW Communications
  </p>
</div>
  `.trim();
}

/**
 * Calculate the recipient list for a broadcast.
 * In production this would call the members API; here we use the local member list.
 */
export function calculateRecipients(
  members: BroadcastRecipient[],
  audience: BroadcastAudience | null,
  targetGroups: string[],
  targetStatuses: string[],
): BroadcastRecipient[] {
  let filtered = members;

  if (audience && audience.id !== "all") {
    filtered = filtered.filter(audience.filter);
  }

  if (targetGroups.length > 0) {
    filtered = filtered.filter((m) => {
      const memberGroups = getMemberTargetGroups(m);
      return targetGroups.some((g) => memberGroups.includes(g));
    });
  }

  if (targetStatuses.length > 0) {
    filtered = filtered.filter((m) => targetStatuses.includes(m.status));
  } else {
    filtered = filtered.filter((m) => m.status === "active");
  }

  return filtered;
}

function getMemberTargetGroups(member: BroadcastRecipient): string[] {
  // This would normally come from the member profile; here we infer from email domain or type
  const domains: Record<string, string[]> = {
    professional: ["Health & Well-Being", "Clinical Practice", "Mental Health & Psychiatry"],
    student: ["School Social Work", "Children & Youth"],
    institutional: ["Families & Communities"],
  };
  return domains[member.membershipType] ?? [];
}
