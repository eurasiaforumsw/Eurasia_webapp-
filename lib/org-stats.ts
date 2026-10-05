/**
 * Aggregation for the /about/organization "network at a glance" dashboard.
 *
 * Pure functions only — shared by the API route (Supabase rows) and the
 * client fallback (localStorage prototype data), so both paths produce the
 * exact same shape. Output is counts only; no member PII leaves this module.
 */

export type OrgMembershipType = "professional" | "student" | "institutional";

export type OrgStatsMemberInput = {
  country: string;
  membershipType: string;
  joinedAt?: string | null;
};

export type OrgStatsContentInput = {
  id: string;
  kind: string;
  category: string;
  title: string;
  updatedAt?: string | null;
  startsAt?: string;
  publishAt?: string;
  expiresAt?: string;
};

export type OrgStats = {
  source: "live" | "local";
  generatedAt: string;
  totals: {
    members: number;
    countries: number;
    documents: number;
    events: number;
    upcomingEvents: number;
  };
  membersByType: Record<OrgMembershipType, number>;
  /** All countries, largest first. */
  countries: { name: string; count: number }[];
  /** Members joined per calendar month, oldest first, last 12 months. */
  growth: { month: string; joined: number; total: number }[];
  documentsByCategory: { category: string; count: number }[];
  latestDocuments: { id: string; title: string; category: string; updatedAt: string }[];
};

const MEMBERSHIP_TYPES: OrgMembershipType[] = ["professional", "student", "institutional"];
const DOCUMENT_KINDS = new Set(["document", "academic"]);

/** "  thailand " and "Thailand" are the same country on the chart. */
const normaliseCountry = (raw: string) => {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
};

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const isWithinWindow = (item: OrgStatsContentInput, now: number) => {
  if (item.publishAt && Date.parse(item.publishAt) > now) return false;
  if (item.expiresAt && Date.parse(item.expiresAt) < now) return false;
  return true;
};

export function buildOrgStats(
  members: OrgStatsMemberInput[],
  content: OrgStatsContentInput[],
  source: OrgStats["source"],
  now: Date = new Date(),
): OrgStats {
  const nowMs = now.getTime();

  /* ── Members ── */
  const membersByType: Record<OrgMembershipType, number> = { professional: 0, student: 0, institutional: 0 };
  const countryCounts = new Map<string, number>();
  for (const m of members) {
    const type = MEMBERSHIP_TYPES.includes(m.membershipType as OrgMembershipType)
      ? (m.membershipType as OrgMembershipType)
      : "professional";
    membersByType[type] += 1;
    const country = normaliseCountry(m.country ?? "");
    if (country) countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
  }
  const countries = Array.from(countryCounts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  /* ── Growth: last 12 calendar months, cumulative ── */
  const months: string[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    months.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  const firstMonth = months[0];
  const joinedPerMonth = new Map<string, number>(months.map((m) => [m, 0]));
  let before = 0;
  for (const m of members) {
    const t = m.joinedAt ? Date.parse(m.joinedAt) : NaN;
    // Members without a usable join date count as already present.
    if (Number.isNaN(t)) { before += 1; continue; }
    const key = monthKey(new Date(t));
    if (key < firstMonth) before += 1;
    else if (joinedPerMonth.has(key)) joinedPerMonth.set(key, (joinedPerMonth.get(key) ?? 0) + 1);
  }
  let running = before;
  const growth = months.map((month) => {
    const joined = joinedPerMonth.get(month) ?? 0;
    running += joined;
    return { month, joined, total: running };
  });

  /* ── Content ── */
  const visible = content.filter((c) => isWithinWindow(c, nowMs));
  const documents = visible.filter((c) => DOCUMENT_KINDS.has(c.kind));
  const events = visible.filter((c) => c.kind === "event");

  const categoryCounts = new Map<string, number>();
  for (const d of documents) {
    const cat = d.category?.trim() || "General";
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }
  const documentsByCategory = Array.from(categoryCounts, ([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));

  const latestDocuments = [...documents]
    .sort((a, b) => Date.parse(b.updatedAt ?? "") - Date.parse(a.updatedAt ?? "") || 0)
    .slice(0, 3)
    .map((d) => ({ id: d.id, title: d.title, category: d.category || "General", updatedAt: d.updatedAt ?? "" }));

  return {
    source,
    generatedAt: now.toISOString(),
    totals: {
      members: members.length,
      countries: countries.length,
      documents: documents.length,
      events: events.length,
      upcomingEvents: events.filter((e) => e.startsAt && Date.parse(e.startsAt) >= nowMs).length,
    },
    membersByType,
    countries,
    growth,
    documentsByCategory,
    latestDocuments,
  };
}
