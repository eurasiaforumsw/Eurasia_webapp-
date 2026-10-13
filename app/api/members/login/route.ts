import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SignJWT } from "jose";
import { getJwtSecret } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { isActiveSuspension } from "@/lib/member-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

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
  role?: string | null;
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

  if (!body || typeof body.email !== "string" || typeof body.password !== "string" ||
      body.email.length > 254 || Buffer.byteLength(body.password, "utf8") > 72) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }
  const email = normalizeEmail(body.email);
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  try {
    const rate = await consumeRateLimit(`member-login:${email}`, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many sign-in attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    }
  } catch {
    return NextResponse.json({ error: "Security service temporarily unavailable" }, { status: 503 });
  }

  try {
    // Wrap the Supabase call with a 10s timeout so we fail fast when the table
    // doesn't exist yet (instead of hanging the request forever).
    const { data, error } = await withTimeout(
      () => supabaseAdmin!.from("members").select("*").eq("email", normalizeEmail(email)).maybeSingle(),
      "loginLookup",
    );

    if (error) {

      return NextResponse.json({ error: "Unable to sign in. Please try again later." }, { status: 500 });
    }

    const member = data;

    if (!member) {

      // Match password comparison cost so unknown addresses do not return immediately.
      const bcrypt = await import("bcrypt");
      await bcrypt.compare(password, "$2b$12$wHZkOiIcpUAq7DbR8LQkWefbHqNx6YTUfwEpBCKdWYOGALNn50Gnm");
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Verify password using bcrypt
    const bcrypt = await import("bcrypt");
    const isValidPassword = await bcrypt.compare(password, member.password_hash);

    if (!isValidPassword) {

      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (member.status === "suspended") {
      // Temporary suspensions set the member status to suspended. Resolve an
      // expired record before denying login so an expired ban cannot lock an
      // account forever. Permanent suspensions keep the 403 path below.
      const { data: suspensions, error: suspensionError } = await withTimeout(
        () => supabaseAdmin!.from("member_suspensions")
          .select("id, is_active, expires_at")
          .eq("member_id", member.id)
          .eq("is_active", true),
        "suspensionLookup",
      );
      if (suspensionError) {
        return NextResponse.json({ error: "Unable to verify account status." }, { status: 500 });
      }
      const records = Array.isArray(suspensions) ? suspensions : suspensions ? [suspensions] : [];
      if (records.length === 0 || records.some((record) => isActiveSuspension(record))) {
        return NextResponse.json(
          { error: "This account has been suspended. Contact support for help." },
          { status: 403 },
        );
      }
      // The RPC locks the member and rechecks current suspensions before
      // changing status; a concurrent permanent ban must remain in force.
      const { data: status, error: statusError } = await withTimeout(
        () => supabaseAdmin!.rpc("expire_member_suspensions", { p_member_id: member.id }),
        "suspensionExpiry",
      );
      if (statusError) return NextResponse.json({ error: "Unable to update account status." }, { status: 500 });
      if (status !== "active") {
        return NextResponse.json({ error: "This account has been suspended. Contact support for help." }, { status: 403 });
      }
      member.status = status;
    }


    // Create JWT token with role
    const secret = getJwtSecret();
    const token = await new SignJWT({
      memberId: member.id,
      email: member.email,
      role: member.role || 'member'
    })
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

    console.error("[members/login] Sign-in failed");
    return NextResponse.json({ error: "Unable to sign in. Please try again later." }, { status: 500 });
  }
}
