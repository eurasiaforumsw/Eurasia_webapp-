import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SignJWT } from "jose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limiting for login attempts
const LOGIN_ATTEMPTS = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const checkRateLimit = (email: string): { allowed: boolean; remaining: number } => {
  const now = Date.now();
  for (const [key, record] of LOGIN_ATTEMPTS) {
    if (now > record.resetAt) LOGIN_ATTEMPTS.delete(key);
  }
  const record = LOGIN_ATTEMPTS.get(email);
  if (!record) return { allowed: true, remaining: MAX_ATTEMPTS };
  if (now > record.resetAt) {
    LOGIN_ATTEMPTS.delete(email);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }
  if (record.count >= MAX_ATTEMPTS) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
};

const recordAttempt = (email: string, success: boolean) => {
  if (success) {
    LOGIN_ATTEMPTS.delete(email);
    return;
  }
  const now = Date.now();
  const record = LOGIN_ATTEMPTS.get(email);
  if (record && now <= record.resetAt) {
    record.count += 1;
    return;
  }
  LOGIN_ATTEMPTS.set(email, { count: 1, resetAt: now + WINDOW_MS });
};

type MemberRow = {
  id: string;
  full_name: string;
  email: string;
  country: string;
  membership_type: string;
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
  status: string;
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

/** Run a Supabase thenable with a 10s timeout so we fail fast when the table
 *  doesn't exist yet (instead of hanging the request forever). */
const withTimeout = <T extends PromiseLike<any>>(run: () => T, label = "query"): Promise<any> =>
  Promise.race([
    Promise.resolve(run()),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out — check that the members table exists`)), 10_000),
    ),
  ]);

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Member service is not configured" }, { status: 503 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = normalizeEmail(String(body.email ?? ""));
  const password = String(body.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const rateCheck = checkRateLimit(email);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait 15 minutes and try again." },
      { status: 429 },
    );
  }

  try {
    // Wrap the Supabase call with a 10s timeout so we fail fast when the table
    // doesn't exist yet (instead of hanging the request forever).
    const { data, error } = await withTimeout(
      () => supabaseAdmin!.from("members").select("*").eq("email", normalizeEmail(email)).maybeSingle(),
      "loginLookup",
    );

    if (error) {
      recordAttempt(email, false);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const member = data;

    if (!member) {
      recordAttempt(email, false);
      return NextResponse.json({ error: "No member account was found for this email." }, { status: 401 });
    }

    // Verify password using bcrypt
    const bcrypt = await import("bcrypt");
    const isValidPassword = await bcrypt.compare(password, member.password_hash);

    if (!isValidPassword) {
      recordAttempt(email, false);
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    if (member.status === "suspended") {
      recordAttempt(email, false);
      return NextResponse.json(
        { error: "This account has been suspended. Contact support for help." },
        { status: 403 },
      );
    }

    recordAttempt(email, true);

    // Create JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ memberId: member.id, email: member.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .setIssuedAt()
      .sign(secret);

    // Create response with member data
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      member: {
        id: member.id,
        fullName: member.full_name,
        email: member.email,
        country: member.country,
        membershipType: member.membership_type,
        organization: member.organization,
        position: member.position,
        expertise: member.expertise,
        university: member.university,
        faculty: member.faculty,
        degree: member.degree,
        organizationType: member.organization_type,
        contactPosition: member.contact_position,
        bio: member.bio,
        status: member.status,
        joinedAt: member.joined_at,
        avatarUrl: member.avatar_url ?? undefined,
        firstName: member.first_name ?? undefined,
        lastName: member.last_name ?? undefined,
        city: member.city ?? undefined,
        educationLevel: member.education_level ?? undefined,
        license: member.license ?? undefined,
        experienceYears: member.experience_years ?? undefined,
        targetGroups: member.target_groups ?? undefined,
      },
    });

    // Set HttpOnly cookie with JWT token
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set("member_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    });

    return response;
  } catch (err) {
    recordAttempt(email, false);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
