/**
 * Email verification library — handles:
 *   • 32-char URL-safe token generation
 *   • Verification email sending via Resend API
 *   • Token verification and account activation
 *
 * Email delivery: When Resend is configured (RESEND_API_KEY env var) the
 * production branch is used automatically; otherwise the verification link
 * is logged to the server console for dev testing.
 */

import { supabaseAdmin } from "@/lib/supabase";

const TOKEN_LENGTH = 32;

type SendVerificationResult =
  | { ok: true }
  | { ok: false; error: string };

/* ─────────────────────────────  random  ────────────────────────────── */

const generateToken = (): string => {
  const bytes = new Uint8Array(TOKEN_LENGTH);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  // URL-safe base64 (no padding)
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

/* ─────────────────────────────  helpers  ───────────────────────────── */

const getBaseUrl = (override?: string): string => {
  if (override) return override.replace(/\/+$/, "");
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:2024"
  ).replace(/\/+$/, "");
};

/* ─────────────────────────────  email  ────────────────────────────── */

type EmailPayload = {
  to: string;
  fullName: string;
  verifyUrl: string;
};

const sendVerificationEmail = async (payload: EmailPayload): Promise<{ delivered: "resend" | "dev"; error?: string }> => {
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
          to: [payload.to],
          subject: "Verify your EFSW membership",
          html: buildVerificationEmailHtml(payload),
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { delivered: "dev", error: `Resend ${res.status}: ${text.slice(0, 200)}` };
      }
      return { delivered: "resend" };
    } catch (err) {
      return {
        delivered: "dev",
        error: err instanceof Error ? err.message : "Resend fetch failed",
      };
    }
  }

  // Dev mode — log to server console
  // eslint-disable-next-line no-console
  console.info(
    "[email-verification] Dev mode delivery\n" +
      `  email: ${payload.to}\n` +
      `  link:  ${payload.verifyUrl}`,
  );
  return { delivered: "dev" };
};

const buildVerificationEmailHtml = ({ fullName, verifyUrl }: EmailPayload): string => {
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
};

/* ─────────────────────────────  API  ───────────────────────────────── */

/**
 * Send a verification email to a newly registered member.
 * This should be called after creating the member account.
 * Returns success even if email fails to prevent registration blocking.
 */
export const sendMemberVerificationEmail = async (
  memberId: string,
  options: { baseUrl?: string } = {},
): Promise<SendVerificationResult> => {
  if (!supabaseAdmin) {
    return { ok: false, error: "Member service is not configured." };
  }

  // Fetch member details
  const { data: member } = await supabaseAdmin
    .from("members")
    .select("id, email, full_name, email_verified_at")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    return { ok: false, error: "Member not found." };
  }

  if (member.email_verified_at) {
    return { ok: true }; // Already verified, no-op
  }

  // Generate verification token
  const token = generateToken();

  // Store token in database
  const { error: updateError } = await supabaseAdmin
    .from("members")
    .update({ verification_token: token })
    .eq("id", memberId);

  if (updateError) {
    // Log error but don't block registration
    console.error("[email-verification] Failed to store token:", updateError.message);
    return { ok: false, error: `Could not store verification token: ${updateError.message}` };
  }

  // Build verification URL
  const baseUrl = getBaseUrl(options.baseUrl);
  const verifyUrl = `${baseUrl}/member/verify-email/${encodeURIComponent(token)}`;

  // Send email
  const delivery = await sendVerificationEmail({
    to: member.email,
    fullName: member.full_name,
    verifyUrl,
  });

  // Log error but return success (don't block registration)
  if (delivery.error) {
    console.error("[email-verification] Email delivery failed:", delivery.error);
  }

  return { ok: true };
};

type VerifyResult =
  | { ok: true; memberId: string; email: string }
  | { ok: false; error: string };

/**
 * Verify an email verification token and mark the member as verified.
 */
export const verifyMemberEmail = async (token: string): Promise<VerifyResult> => {
  if (!supabaseAdmin) {
    return { ok: false, error: "Member service is not configured." };
  }

  if (!token || token.length < 10) {
    return { ok: false, error: "Invalid verification token." };
  }

  // Find member by token
  const { data: member } = await supabaseAdmin
    .from("members")
    .select("id, email, email_verified_at, verification_token")
    .eq("verification_token", token)
    .maybeSingle();

  if (!member) {
    return { ok: false, error: "Invalid or expired verification token." };
  }

  if (member.email_verified_at) {
    return { ok: true, memberId: member.id, email: member.email }; // Already verified
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
    return { ok: false, error: `Could not verify email: ${updateError.message}` };
  }

  return { ok: true, memberId: member.id, email: member.email };
};
