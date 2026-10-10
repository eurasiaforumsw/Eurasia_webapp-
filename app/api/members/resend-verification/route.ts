import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/members/resend-verification
 *   Body: { email: string }
 *
 * Resends the verification email to a registered but unverified member.
 */
export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 503 },
    );
  }

  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    // Find member by email
    const { data: member } = await supabaseAdmin
      .from("members")
      .select("id, email, email_verified_at, full_name")
      .eq("email", email)
      .maybeSingle();

    // Always return success to avoid account enumeration
    if (!member) {
      return NextResponse.json({
        ok: true,
        message: "If this email is registered and unverified, a verification email has been sent.",
      });
    }

    if (member.email_verified_at) {
      return NextResponse.json({
        ok: true,
        message: "This email is already verified. You can log in now.",
      });
    }

    // Generate new verification token (32 chars, URL-safe)
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

    // Update verification token
    const { error: updateError } = await supabaseAdmin
      .from("members")
      .update({ verification_token: verificationToken })
      .eq("id", member.id);

    if (updateError) {
      throw new Error(`Could not update verification token: ${updateError.message}`);
    }

    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:2024";
    const verifyUrl = `${baseUrl.replace(/\/+$/, "")}/member/verify-email/${encodeURIComponent(verificationToken)}`;

    sendVerificationEmailAsync(email, member.full_name, verifyUrl).catch((err) => {
      console.error("[members/resend-verification] Email failed:", err);
    });

    return NextResponse.json({
      ok: true,
      message: "Verification email has been sent. Please check your inbox.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Send verification email without blocking request */
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
      "[email-verification] Dev mode delivery (resend)\n" +
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
