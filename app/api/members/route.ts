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
    const email = normalizeEmail(String(payload.email ?? ""));

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!payload.fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });

    // Check for duplicate email — return existing member if found
    const existing = await getMemberByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered. Please sign in.", conflict: true },
        { status: 409 },
      );
    }

    // Hash password with bcrypt (12 rounds)
    const password = sanitizeText(payload.password);
    if (!password) return NextResponse.json({ error: "Password is required" }, { status: 400 });

    const bcrypt = await import("bcrypt");
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token (32 chars, URL-safe)
    const generateVerificationToken = (): string => {
      const bytes = new Uint8Array(32);
      if (typeof globalThis.crypto?.getRandomValues === "function") {
        globalThis.crypto.getRandomValues(bytes);
      } else {
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
      }
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      const b64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
      return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    };

    const verificationToken = generateVerificationToken();

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
      verification_token: verificationToken,
    };

    const { data, error } = await withTimeout(
      () => supabaseAdmin!.from("members").upsert(record, { onConflict: "id" }).select().single(),
      "upsertMember",
    );

    if (error) throw error;

    // Send verification email (don't block registration if it fails)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:2024";
    const verifyUrl = `${baseUrl.replace(/\/+$/, "")}/member/verify-email/${encodeURIComponent(verificationToken)}`;

    sendVerificationEmailAsync(email, sanitizeText(payload.fullName), verifyUrl).catch((err) => {
      console.error("[members/register] Verification email failed:", err);
    });

    return NextResponse.json({ member: rowToMember(data as MemberRow) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Send verification email without blocking registration */
async function sendVerificationEmailAsync(to: string, fullName: string, verifyUrl: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "EFSW <no-reply@efsw.local>";

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/v1/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: "Verify your EFSW membership",
          html: buildVerificationEmailHtml(fullName, verifyUrl),
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[email-verification] Resend ${res.status}: ${text.slice(0, 200)}`);
      }
    } catch (err) {
      console.error("[email-verification] Resend fetch failed:", err);
    }
  } else {
    // Dev mode — log to console
    console.info(
      "[email-verification] Dev mode delivery\n" +
        `  email: ${to}\n` +
        `  link:  ${verifyUrl}`,
    );
  }
}

function buildVerificationEmailHtml(fullName: string, verifyUrl: string): string {
  return `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f1ec; padding: 2rem; color: #1a2530;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 36rem; background: #ffffff; border: 1px solid #d8d2c4; border-radius: 8px; padding: 2.5rem;">
    <tr><td>
      <h1 style="margin: 0 0 0.5rem; font-size: 1.4rem;">Welcome to EFSW, ${fullName}!</h1>
      <p style="margin: 0 0 1.5rem; color: #5a6670; font-size: 0.95rem;">Thank you for registering. Please verify your email address to complete your membership registration.</p>
      <p style="margin: 0 0 1.5rem;"><a href="${verifyUrl}" style="display: inline-block; background: #005c69; color: #ffffff; padding: 0.7rem 1.4rem; border-radius: 4px; text-decoration: none; font-weight: 600;">Verify my email</a></p>
      <p style="margin: 0 0 0.5rem; font-size: 0.82rem; color: #5a6670;">Or copy and paste this link into your browser:</p>
      <p style="margin: 0 0 1.5rem; font-size: 0.82rem; color: #005c69; word-break: break-all;">${verifyUrl}</p>
      <p style="margin: 0; font-size: 0.82rem; color: #5a6670;">If you didn't create an EFSW account, you can safely ignore this email.</p>
    </td></tr>
  </table>
</body></html>`;
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
