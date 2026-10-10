import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/members/verify-email
 *   Body: { token: string }
 *
 * Verifies the email verification token and activates the member account.
 */
export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 503 },
    );
  }

  let body: { token?: string };
  try {
    body = (await request.json()) as { token?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = String(body.token ?? "").trim();
  if (!token || token.length < 10) {
    return NextResponse.json({ error: "Invalid verification token." }, { status: 400 });
  }

  try {
    // Find member by token
    const { data: member } = await supabaseAdmin
      .from("members")
      .select("id, email, email_verified_at, verification_token, full_name")
      .eq("verification_token", token)
      .maybeSingle();

    if (!member) {
      return NextResponse.json(
        { error: "Invalid or expired verification token." },
        { status: 404 },
      );
    }

    if (member.email_verified_at) {
      // Already verified
      return NextResponse.json({
        ok: true,
        message: "Email already verified.",
        email: member.email,
      });
    }

    // Mark as verified and clear token
    const { error: updateError } = await supabaseAdmin
      .from("members")
      .update({
        email_verified_at: new Date().toISOString(),
        verification_token: null,
        status: "active", // Activate account upon verification
      })
      .eq("id", member.id);

    if (updateError) {
      throw new Error(`Could not verify email: ${updateError.message}`);
    }

    return NextResponse.json({
      ok: true,
      message: "Email verified successfully!",
      email: member.email,
      fullName: member.full_name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
