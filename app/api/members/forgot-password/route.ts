import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/password-reset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/members/forgot-password
 *   Body: { email: string }
 *
 * Always responds 200 to avoid account enumeration; dev mode also includes
 * the verification code in the response so devs can copy it without setting
 * up Resend.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    const result = await requestPasswordReset(email);
    if (!result.ok) {
      const status = result.retryAfterSeconds ? 429 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }
    // `devCode` is only populated in dev mode (no Resend API key configured).
    return NextResponse.json({
      ok: true,
      expiresAt: result.expiresAt,
      devCode: result.devCode,
      devHint: result.devCode
        ? "No email provider is configured. The verification code is shown for testing only."
        : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}