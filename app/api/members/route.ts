import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { EducationLevel } from "@/lib/member-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MembershipType = "professional" | "student" | "institutional";
type MemberStatus = "pending" | "active" | "suspended";

type MemberRow = {
  id: string;
  full_name: string;
  email: string;
  country: string;
  membership_type: MembershipType;
  organization: string;
  position: string;
  expertise: string;
  university: string;
  faculty: string;
  degree: string;
  organization_type: string;
  contact_position: string;
  bio: string;
  password_hash: string;
  status: MemberStatus;
  joined_at: string;
  avatar_url?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  city?: string | null;
  education_level?: string | null;
  license?: string | null;
  experience_years?: number | null;
  target_groups?: string[] | null;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const sanitizeText = (value: unknown, maxLength = 4000): string =>
  String(value ?? "")
    .trim()
    .slice(0, maxLength);

const sanitizeMembershipType = (value: unknown): MembershipType =>
  value === "student" || value === "institutional" ? value : "professional";

const sanitizeStatus = (value: unknown): MemberStatus =>
  value === "active" || value === "suspended" ? value : "pending";

const sanitizeEducationLevel = (v: unknown) =>
  v === "high-school" || v === "diploma" || v === "bachelor" || v === "master" || v === "doctorate"
    ? v
    : null;

const sanitizeExperienceYears = (v: unknown) => {
  const n = Number(v);
  if (Number.isNaN(n) || n < 0) return 0;
  if (n > 80) return 80;
  return Math.round(n * 10) / 10;
};

const sanitizeTargetGroups = (v: unknown): string[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => String(item).trim().slice(0, 80))
    .filter((item) => item.length > 0)
    .slice(0, 20);
};

const rowToMember = (row: MemberRow) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  country: row.country,
  membershipType: row.membership_type,
  organization: row.organization,
  position: row.position,
  expertise: row.expertise,
  university: row.university,
  faculty: row.faculty,
  degree: row.degree,
  organizationType: row.organization_type,
  contactPosition: row.contact_position,
  bio: row.bio,
  status: row.status,
  joinedAt: row.joined_at,
  avatarUrl: row.avatar_url ?? undefined,
  firstName: row.first_name ?? undefined,
  lastName: row.last_name ?? undefined,
  city: row.city ?? undefined,
  educationLevel: (row.education_level as EducationLevel | null) ?? undefined,
  license: row.license ?? undefined,
  experienceYears: row.experience_years ?? undefined,
  targetGroups: row.target_groups ?? undefined,
});

/** Run a Supabase thenable with a 10s timeout so we fail fast when the table
 *  doesn't exist yet (instead of hanging the request forever). */
const withTimeout = <T extends PromiseLike<any>>(run: () => T, label = "query"): Promise<any> =>
  Promise.race([
    Promise.resolve(run()),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out — check that the members table exists`)), 10_000),
    ),
  ]);

/** Read a member by email — used for email-uniqueness checks */
const getMemberByEmail = async (email: string) => {
  const { data, error } = await withTimeout(
    () => supabaseAdmin!.from("members").select("*").eq("email", normalizeEmail(email)).maybeSingle(),
    "getMemberByEmail",
  );
  if (error) throw new Error(error.message);
  return data ? rowToMember(data as MemberRow) : null;
};

const getMemberById = async (id: string) => {
  const { data, error } = await withTimeout(
    () => supabaseAdmin!.from("members").select("*").eq("id", id).maybeSingle(),
    "getMemberById",
  );
  if (error) throw new Error(error.message);
  return data ? rowToMember(data as MemberRow) : null;
};

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 503 },
    );
  }

  const { searchParams } = request.nextUrl;
  const email = searchParams.get("email");
  const id = searchParams.get("id");
  const status = searchParams.get("status");
  const kind = searchParams.get("kind");

  try {
    if (id) {
      const member = await getMemberById(id);
      return NextResponse.json({ member });
    }
    if (email) {
      const member = await getMemberByEmail(email);
      return NextResponse.json({ member });
    }

    let query = supabaseAdmin!.from("members").select("*").order("joined_at", { ascending: false });
    if (status) query = query.eq("status", sanitizeStatus(status));
    if (kind) query = query.eq("membership_type", sanitizeMembershipType(kind));

    const { data, error } = await withTimeout(() => query, "listMembers");
    if (error) throw error;

    return NextResponse.json({ members: (data ?? []).map((row: MemberRow) => rowToMember(row)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 503 },
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const passwordHash = sanitizeText(payload.passwordHash);
    const email = normalizeEmail(String(payload.email ?? ""));

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!passwordHash) return NextResponse.json({ error: "Password hash is required" }, { status: 400 });
    if (!payload.fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });

    // Check for duplicate email — return existing member if found
    const existing = await getMemberByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered. Please sign in.", conflict: true },
        { status: 409 },
      );
    }

    const record = {
      id: sanitizeText(payload.id) || `efsw-${Date.now().toString(36)}`,
      full_name: sanitizeText(payload.fullName),
      email,
      country: sanitizeText(payload.country),
      membership_type: sanitizeMembershipType(payload.membershipType),
      organization: sanitizeText(payload.organization),
      position: sanitizeText(payload.position),
      expertise: sanitizeText(payload.expertise),
      university: sanitizeText(payload.university),
      faculty: sanitizeText(payload.faculty),
      degree: sanitizeText(payload.degree),
      organization_type: sanitizeText(payload.organizationType),
      contact_position: sanitizeText(payload.contactPosition),
      bio: sanitizeText(payload.bio),
      password_hash: passwordHash,
      status: sanitizeStatus(payload.status),
      joined_at: sanitizeText(payload.joinedAt) || new Date().toISOString(),
      avatar_url: payload.avatarUrl ? sanitizeText(payload.avatarUrl, 600) : null,
      first_name: payload.firstName ? sanitizeText(payload.firstName) : null,
      last_name: payload.lastName ? sanitizeText(payload.lastName) : null,
      city: payload.city ? sanitizeText(payload.city) : null,
      education_level: sanitizeEducationLevel(payload.educationLevel),
      license: payload.license ? sanitizeText(payload.license) : null,
      experience_years: payload.experienceYears !== undefined ? sanitizeExperienceYears(payload.experienceYears) : null,
      target_groups: payload.targetGroups !== undefined ? sanitizeTargetGroups(payload.targetGroups) : null,
    };

    const { data, error } = await withTimeout(
      () => supabaseAdmin!.from("members").upsert(record, { onConflict: "id" }).select().single(),
      "upsertMember",
    );

    if (error) throw error;
    return NextResponse.json({ member: rowToMember(data as MemberRow) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 503 },
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const id = String(payload.id ?? "");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    const fieldMap: Array<[string, string, (v: unknown) => unknown]> = [
      ["fullName", "full_name", sanitizeText],
      ["firstName", "first_name", sanitizeText],
      ["lastName", "last_name", sanitizeText],
      ["email", "email", (v) => normalizeEmail(String(v))],
      ["country", "country", sanitizeText],
      ["city", "city", sanitizeText],
      ["membershipType", "membership_type", sanitizeMembershipType],
      ["organization", "organization", sanitizeText],
      ["position", "position", sanitizeText],
      ["expertise", "expertise", sanitizeText],
      ["university", "university", sanitizeText],
      ["faculty", "faculty", sanitizeText],
      ["degree", "degree", sanitizeText],
      ["organizationType", "organization_type", sanitizeText],
      ["contactPosition", "contact_position", sanitizeText],
      ["bio", "bio", sanitizeText],
      ["status", "status", sanitizeStatus],
      ["avatarUrl", "avatar_url", (v) => sanitizeText(v, 600)],
      ["educationLevel", "education_level", sanitizeEducationLevel],
      ["license", "license", sanitizeText],
      ["experienceYears", "experience_years", sanitizeExperienceYears],
      ["targetGroups", "target_groups", sanitizeTargetGroups],
    ];

    for (const [camel, snake, sanitize] of fieldMap) {
      if (payload[camel] !== undefined) {
        updates[snake] = sanitize(payload[camel]);
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await withTimeout(
      () => supabaseAdmin!.from("members").update(updates).eq("id", id).select().single(),
      "updateMember",
    );

    if (error) throw error;
    return NextResponse.json({ member: rowToMember(data as MemberRow) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 503 },
    );
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await withTimeout(
    () => supabaseAdmin!.from("members").delete().eq("id", id),
    "deleteMember",
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deleted: id });
}
