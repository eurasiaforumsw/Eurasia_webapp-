export type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";

export type BroadcastCampaign = {
  id: string;
  contentId?: string;
  contentTitle: string;
  contentKind: "news" | "event" | "document" | "academic" | "custom";
  subject: string;
  preheader: string;
  body: string;
  coverImage?: string;
  audience: string;
  targetGroups: string[];
  targetStatuses: string[];
  status: BroadcastStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
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
  targetGroups?: string[];
}

export type BroadcastAudience = {
  id: string;
  label: string;
  description: string;
  filter: (member: BroadcastRecipient) => boolean;
};

export const DEFAULT_TARGET_GROUPS: BroadcastAudience[] = [
  { id: "all", label: "All Members", description: "Send to every selected member status", filter: () => true },
  { id: "professional", label: "Professional Members", description: "Practicing social workers", filter: (m) => m.membershipType === "professional" },
  { id: "student", label: "Student Members", description: "Currently enrolled students", filter: (m) => m.membershipType === "student" },
  { id: "institutional", label: "Institutional Members", description: "Organizations & universities", filter: (m) => m.membershipType === "institutional" },
];

type CampaignRow = Record<string, unknown>;
export function mapBroadcastCampaign(row: CampaignRow): BroadcastCampaign {
  return {
    id: String(row.id),
    contentId: typeof row.content_id === "string" ? row.content_id : undefined,
    contentTitle: String(row.title || row.subject || "Untitled"),
    contentKind: (row.content_kind || "custom") as BroadcastCampaign["contentKind"],
    subject: String(row.subject || ""),
    preheader: String(row.preheader || ""),
    body: String(row.body_html || ""),
    coverImage: typeof row.cover_image === "string" ? row.cover_image : undefined,
    audience: String(row.audience || "all"),
    targetGroups: Array.isArray(row.target_groups) ? row.target_groups as string[] : [],
    targetStatuses: Array.isArray(row.target_statuses) ? row.target_statuses as string[] : [],
    status: row.status as BroadcastStatus,
    recipientCount: Number(row.recipient_count || 0),
    sentCount: Number(row.sent_count || 0),
    failedCount: Number(row.failed_count || 0),
    sentAt: typeof row.sent_at === "string" ? row.sent_at : undefined,
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
    error: typeof row.error_message === "string" ? row.error_message : undefined,
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result as T;
}

export async function listBroadcasts(): Promise<BroadcastCampaign[]> {
  const data = await api<{ campaigns: CampaignRow[] }>("/api/broadcast?pageSize=100");
  return (data.campaigns || []).map(mapBroadcastCampaign);
}

export async function createBroadcast(input: Record<string, unknown>): Promise<BroadcastCampaign> {
  const data = await api<{ campaign: CampaignRow }>("/api/broadcast", { method: "POST", body: JSON.stringify(input) });
  return mapBroadcastCampaign(data.campaign);
}

export async function removeBroadcast(id: string): Promise<void> {
  await api("/api/broadcast", { method: "DELETE", body: JSON.stringify({ campaignId: id }) });
}

export async function sendBroadcast(id: string): Promise<{ totalSent: number; totalFailed: number }> {
  return api("/api/broadcast/send", { method: "POST", body: JSON.stringify({ campaignId: id }) });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
}

export function buildEmailBody(contentTitle: string, contentSummary: string, contentBody: string, customMessage: string, authorName: string): string {
  return `<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.6;">
  <p style="font-size: 14px; margin-bottom: 24px;">${escapeHtml(customMessage)}</p>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
  <h1 style="font-size: 22px; margin: 0 0 12px 0; color: #0f172a;">${escapeHtml(contentTitle)}</h1>
  ${contentSummary ? `<p style="font-size: 15px; color: #475569; margin-bottom: 16px;">${escapeHtml(contentSummary)}</p>` : ""}
  <div style="font-size: 14px; color: #334155;">${contentBody.split("\n").slice(0, 6).map((p) => `<p>${escapeHtml(p)}</p>`).join("\n")}</div>
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
  <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">You are receiving this because you are a member of the Eurasia Forum for Social Workers (EFSW).<br />${escapeHtml(authorName)} · EFSW Communications</p>
</div>`;
}

export function calculateRecipients(members: BroadcastRecipient[], audience: BroadcastAudience | null, targetGroups: string[], targetStatuses: string[]): BroadcastRecipient[] {
  return members.filter((member) =>
    (!audience || audience.filter(member)) &&
    (targetGroups.length === 0 || targetGroups.some((group) => member.targetGroups?.includes(group))) &&
    (targetStatuses.length === 0 ? member.status === "active" : targetStatuses.includes(member.status))
  );
}
