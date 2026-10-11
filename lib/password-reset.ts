/**
 * Password reset library — handles:
 *   • 6-digit code generation + SHA-256 hashing
 *   • 32-char URL-safe token generation
 *   • Reset request creation, code verification, password update
 *
 * Email delivery: this module stubs the email sender so the UX is wired end
 * to end. When Resend is configured (RESEND_API_KEY env var) the production
 * branch is used automatically; otherwise the reset link + code are logged
 * to the server console so devs can copy them out of the dev server output.
 *
 * Rate limits:
 *   • 3 reset requests per email per hour
 *   • 5 attempts per code (locked after that)
 *   • Code expires 15 minutes after creation
 */

import { randomBytes, randomInt, randomUUID } from "node:crypto";
import bcrypt from "bcrypt";

import { supabaseAdmin } from "@/lib/supabase";

const CODE_LENGTH = 6;
const TOKEN_LENGTH = 32;
const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const REQUEST_COOLDOWN_MS = 60 * 1000; // 1 minute between successive requests
const MAX_REQUESTS_PER_HOUR = 3;

type ResetRow = {
  id: string;
  email: string;
  code_hash: string;
  token_hash: string;
  attempts: number;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
};

type RequestResult =
  | { ok: true; resetId: string; expiresAt: string }
  | { ok: false; error: string; retryAfterSeconds?: number };

/* ─────────────────────────────  hashing  ───────────────────────────── */

const sha256 = async (value: string): Promise<string> => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
};

/* Node-crypto fallback for environments without `globalThis.crypto.subtle`. */
const sha256Sync = (value: string): string => {
  // Lazy require so it doesn't crash in browser-only contexts.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createHash } = require("crypto") as typeof import("crypto");
  return createHash("sha256").update(value).digest("hex");
};

const hashValue = async (value: string): Promise<string> => {
  if (typeof globalThis.crypto?.subtle !== "undefined") {
    try { return await sha256(value); } catch { /* fall through */ }
  }
  return sha256Sync(value);
};

/* ─────────────────────────────  random  ────────────────────────────── */

const generateCode = (): string => String(randomInt(1_000_000)).padStart(CODE_LENGTH, "0");
const generateToken = (): string => randomBytes(TOKEN_LENGTH).toString("base64url");
const generateId = (): string => `reset-${randomUUID()}`;

/* ─────────────────────────────  email  ────────────────────────────── */

type DeliveryPayload = {
  to: string;
  code: string;
  token: string;
  resetUrl: string;
  expiresAt: string;
};

const sendResetEmail = async (payload: DeliveryPayload): Promise<{ delivered: "resend" | "dev"; error?: string }> => {
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
          subject: "Reset your EFSW member password",
          html: buildResetEmailHtml(payload),
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
  if (process.env.NODE_ENV === "production") {
    return { delivered: "dev", error: "Email service is not configured" };
  }
  // Dev mode — log to server console so devs can copy link + code.
  // eslint-disable-next-line no-console
  console.info(
    "[password-reset] Dev mode delivery\n" +
      `  email:  ${payload.to}\n` +
      `  code:   ${payload.code}\n` +
      `  link:   ${payload.resetUrl}`,
  );
  return { delivered: "dev" };
};

const buildResetEmailHtml = ({ code, resetUrl, expiresAt }: DeliveryPayload): string => {
  const minutes = Math.max(1, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000));
  return `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f1ec; padding: 2rem; color: #1a2530;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 36rem; background: #ffffff; border: 1px solid #d8d2c4; border-radius: 8px; padding: 2.5rem;">
    <tr><td>
      <h1 style="margin: 0 0 0.5rem; font-size: 1.4rem;">Reset your EFSW password</h1>
      <p style="margin: 0 0 1.5rem; color: #5a6670; font-size: 0.95rem;">We received a request to reset the password for your EFSW member account.</p>
      <p style="margin: 0 0 1rem; font-size: 0.9rem; color: #1a2530;">Your one-time verification code:</p>
      <p style="margin: 0 0 1.5rem; font-family: 'Courier New', monospace; font-size: 1.6rem; font-weight: 700; letter-spacing: 0.3rem; background: #f4f1ec; padding: 1rem; text-align: center; border-radius: 4px;">${code}</p>
      <p style="margin: 0 0 1rem; font-size: 0.9rem;">Or click the button below to open the reset page directly:</p>
      <p style="margin: 0 0 1.5rem;"><a href="${resetUrl}" style="display: inline-block; background: #005c69; color: #ffffff; padding: 0.7rem 1.4rem; border-radius: 4px; text-decoration: none; font-weight: 600;">Reset my password</a></p>
      <p style="margin: 0 0 0.5rem; font-size: 0.82rem; color: #5a6670;">This code expires in ${minutes} minutes.</p>
      <p style="margin: 0; font-size: 0.82rem; color: #5a6670;">If you didn't request this, you can safely ignore this email.</p>
    </td></tr>
  </table>
</body></html>`;
};

/* ─────────────────────────────  helpers  ───────────────────────────── */

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const getBaseUrl = (override?: string): string => {
  if (override) return override.replace(/\/+$/, "");
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:2024"
  ).replace(/\/+$/, "");
};

/* ─────────────────────────────  API  ───────────────────────────────── */

/** Issue a new password reset. Returns success even when the email doesn't
 *  exist (prevents account enumeration). Caller can inspect `devCode` only
 *  in development mode for testing. */
export const requestPasswordReset = async (
  rawEmail: string,
  options: { baseUrl?: string } = {},
): Promise<RequestResult & { devCode?: string }> => {
  if (!supabaseAdmin) {
    return { ok: false, error: "Member service is not configured." };
  }
  const email = normalizeEmail(rawEmail);

  // Always do an email lookup so timing is roughly constant regardless of
  // whether the email exists.
  const { data: member } = await supabaseAdmin
    .from("members")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (!member) {
    // No-op success to avoid leaking whether the email is registered.
    return { ok: true, resetId: "noop", expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString() };
  }

  // Rate limit: count recent un-consumed rows for this email.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabaseAdmin
    .from("password_resets")
    .select("id", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", oneHourAgo);
  if ((recentCount ?? 0) >= MAX_REQUESTS_PER_HOUR) {
    return {
      ok: false,
      error: "Too many reset requests. Please wait an hour and try again.",
    };
  }

  // Cooldown: if a fresh, un-consumed reset exists, refuse for 1 min.
  const cooldownAgo = new Date(Date.now() - REQUEST_COOLDOWN_MS).toISOString();
  const { data: cooldown } = await supabaseAdmin
    .from("password_resets")
    .select("id, created_at")
    .eq("email", email)
    .is("consumed_at", null)
    .gte("created_at", cooldownAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (cooldown) {
    const ageMs = Date.now() - new Date(cooldown.created_at).getTime();
    const retryAfterSeconds = Math.max(1, Math.ceil((REQUEST_COOLDOWN_MS - ageMs) / 1000));
    return {
      ok: false,
      error: `A reset code was already sent. Please wait ${retryAfterSeconds}s before requesting another.`,
      retryAfterSeconds,
    };
  }

  // Invalidate any older un-consumed resets for this email.
  await supabaseAdmin
    .from("password_resets")
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", email)
    .is("consumed_at", null);

  const code = generateCode();
  const token = generateToken();
  const codeHash = await hashValue(code);
  const tokenHash = await hashValue(token);
  const id = generateId();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  const { error: insertError } = await supabaseAdmin.from("password_resets").insert({
    id,
    email,
    code_hash: codeHash,
    token_hash: tokenHash,
    attempts: 0,
    expires_at: expiresAt,
  });
  if (insertError) {
    return { ok: false, error: `Could not save reset request: ${insertError.message}` };
  }

  const baseUrl = getBaseUrl(options.baseUrl);
  const resetUrl = `${baseUrl}/member/reset-password?token=${encodeURIComponent(token)}&id=${encodeURIComponent(id)}`;
  const delivery = await sendResetEmail({
    to: email,
    code,
    token,
    resetUrl,
    expiresAt,
  });

  // In dev mode the email is logged — return the code so the API can echo it
  // back to the browser for testing. Never include it in production.
  const isDev = delivery.delivered === "dev";
  return {
    ok: true,
    resetId: id,
    expiresAt,
    devCode: isDev && process.env.NODE_ENV !== "production" ? code : undefined,
  };
};

type VerifyCodeResult =
  | { ok: true; resetId: string; email: string }
  | { ok: false; error: string };

/** Verify a (token, code) pair. On success returns resetId+email so the next
 *  step can update the password atomically. */
async function verifyResetAtomically(
  resetId: string, token: string, code: string, passwordHash: string | null,
): Promise<VerifyCodeResult> {
  if (!supabaseAdmin) return { ok: false, error: "Member service is not configured." };
  if (!resetId || !token || !/^\d{6}$/.test(code.trim())) {
    return { ok: false, error: "Invalid reset details." };
  }
  const { data, error } = await supabaseAdmin.rpc("verify_security_password_reset", {
    p_reset_id: resetId,
    p_token_hash: await hashValue(token),
    p_code_hash: await hashValue(code.trim()),
    p_password_hash: passwordHash,
  });
  if (error || !data || typeof data.ok !== "boolean") {
    console.error("[password-reset] Reset verification unavailable");
    return { ok: false, error: "Password reset service temporarily unavailable." };
  }
  return data as VerifyCodeResult;
}

export const verifyResetCode = async (
  resetId: string, token: string, code: string,
): Promise<VerifyCodeResult> => verifyResetAtomically(resetId, token, code, null);

type CompleteResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

export const completePasswordReset = async (
  resetId: string, token: string, newPassword: string, code: string,
): Promise<CompleteResult> => {
  if (!newPassword || newPassword.length < 8 || Buffer.byteLength(newPassword, "utf8") > 72) {
    return { ok: false, error: "Password must be at least 8 characters and at most 72 bytes." };
  }
  const result = await verifyResetAtomically(resetId, token, code, await bcrypt.hash(newPassword, 12));
  return result.ok ? { ok: true, email: result.email } : result;
};

/* Public constants used by the UI to display copy + match behaviour. */
export const PASSWORD_RESET_POLICY = {
  CODE_LENGTH,
  CODE_TTL_MS,
  CODE_TTL_MINUTES: CODE_TTL_MS / 60000,
  MAX_ATTEMPTS,
  REQUEST_COOLDOWN_MS,
  MAX_REQUESTS_PER_HOUR,
};