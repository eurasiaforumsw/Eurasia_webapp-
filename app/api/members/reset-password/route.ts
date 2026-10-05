import { NextRequest, NextResponse } from "next/server";
import { verifyResetCode, completePasswordReset } from "@/lib/password-reset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/members/reset-password
 *   Body: { id: string; token: string; code: string; newPassword?: string }
 *
 * Two-step endpoint:
 *   1. If `newPassword` is omitted: verify (id, token, code) and return ok.
 *      The client then re-submits with `newPassword` to commit the change.
 *   2. If `newPassword` is provided: also verify, then update the password
 *      hash and mark the reset as consumed.
 *
 * Splitting the steps lets the UI show a separate "enter new password" form
 * without keeping the code in a single round-trip payload.
 */
export async function POST(request: NextRequest) {
  let body: { id?: string; token?: string; code?: string; newPassword?: string };
  try {
    body = (await request.json()) as {
      id?: string;
      token?: string;
      code?: string;
      newPassword?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const id = String(body.id ?? "");
  const token = String(body.token ?? "");
  const code = String(body.code ?? "").trim();

  if (!id || !token || !code) {
    return NextResponse.json(
      { error: "Missing reset details. Please use the link from your email." },
      { status: 400 },
    );
  }

  if (body.newPassword !== undefined) {
    // Step 2 — commit the new password.
    if (typeof body.newPassword !== "string" || body.newPassword.length === 0) {
      return NextResponse.json({ error: "Please enter a new password." }, { status: 400 });
    }
    const result = await completePasswordReset(id, token, body.newPassword);
    if (!result.ok) {
      const status = result.error.toLowerCase().includes("password") ? 400 : 401;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, email: result.email });
  }

  // Step 1 — verify only.
  const result = await verifyResetCode(id, token, code);
  if (!result.ok) {
    const status = result.error.toLowerCase().includes("attempts") ? 429 : 401;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ ok: true, resetId: result.resetId, email: result.email });
}