/**
 * Shared list of EFSW target groups — same vocabulary used by
 *   • Member profile (target groups selector)
 *   • Admin broadcast (audience filter)
 *   • Admin content editor (content audience targeting)
 *
 * Keep the labels identical to those used in `app/member/profile/page.tsx`
 * so a target group saved on the member profile matches content audience
 * filters exactly (matching is case-sensitive on the slug string).
 */
export const EFSW_TARGET_GROUPS: readonly string[] = [
  "Children & Youth",
  "Families & Communities",
  "Health & Well-Being",
  "Clinical Practice",
  "Offenders & Corrections",
  "Persons with Disabilities",
  "Older Adults & Aging",
  "School Social Work",
  "Mental Health & Psychiatry",
  "Substance Abuse & Addictions",
  "Gender & Sexual Diversity (LGBTQ+)",
  "Informal & Migrant Workers",
  "Ethnic & Indigenous Communities",
  "Survivors of Violence & Abuse",
  "Stateless Persons",
  "Migrants & Refugees",
  "Homelessness",
  "Financial Hardship & Poverty",
  "Other",
] as const;

export type EfswTargetGroup = (typeof EFSW_TARGET_GROUPS)[number];

export const EFSW_MEMBERSHIP_TYPES = ["professional", "student", "institutional"] as const;
export type EfswMembershipType = (typeof EFSW_MEMBERSHIP_TYPES)[number];

export const EFSW_MEMBERSHIP_LABELS: Record<EfswMembershipType, string> = {
  professional: "Professional members",
  student: "Student members",
  institutional: "Institutional members",
};