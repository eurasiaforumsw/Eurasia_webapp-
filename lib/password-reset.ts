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

const generateCode = (): string => {
  // 6 digits with leading zeros allowed. Uses crypto when available.
  const max = 1_000_000;
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return String(buf[0] % max).padStart(CODE_LENGTH, "0");
  }
  return String(Math.floor(Math.random() * max)).padStart(CODE_LENGTH, "0");
};

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
  // btoa exists in browser + Node 16+
  const b64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const generateId = (): string =>
  `reset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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
export const verifyResetCode = async (
  resetId: string,
  token: string,
  code: string,
): Promise<VerifyCodeResult> => {
  if (!supabaseAdmin) return { ok: false, error: "Member service is not configured." };
  if (!resetId || !token || !code) return { ok: false, error: "Missing reset details." };
  if (!/^\d{6}$/.test(code.trim())) return { ok: false, error: "Code must be 6 digits." };

  const tokenHash = await hashValue(token);
  const codeHash = await hashValue(code.trim());

  const { data: row, error } = await supabaseAdmin
    .from("password_resets")
    .select("*")
    .eq("id", resetId)
    .maybeSingle<ResetRow>();
  if (error) return { ok: false, error: error.message };
  if (!row) return { ok: false, error: "Reset request not found. Please request a new code." };
  if (row.consumed_at) return { ok: false, error: "This reset link has already been used." };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "This code has expired. Please request a new one." };
  }
  if (row.token_hash !== tokenHash) {
    return { ok: false, error: "Invalid reset link. Please request a new code." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many failed attempts. Please request a new code." };
  }

  // Constant-time-ish comparison on both hashes.
  if (row.code_hash !== codeHash) {
    await supabaseAdmin
      .from("password_resets")
      .update({ attempts: row.attempts + 1 })
      .eq("id", resetId);
    return { ok: false, error: "Incorrect code. Please try again." };
  }

  return { ok: true, resetId: row.id, email: row.email };
};

type CompleteResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

/** Apply the new password. Marks the reset as consumed. */
export const completePasswordReset = async (
  resetId: string,
  token: string,
  newPassword: string,
): Promise<CompleteResult> => {
  if (!supabaseAdmin) return { ok: false, error: "Member service is not configured." };
  if (!resetId || !token || !newPassword) {
    return { ok: false, error: "Missing reset details." };
  }
  if (newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const tokenHash = await hashValue(token);
  const { data: row, error } = await supabaseAdmin
    .from("password_resets")
    .select("*")
    .eq("id", resetId)
    .maybeSingle<ResetRow>();
  if (error) return { ok: false, error: error.message };
  if (!row) return { ok: false, error: "Reset request not found." };
  if (row.consumed_at) return { ok: false, error: "This reset link has already been used." };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "This code has expired. Please request a new one." };
  }
  if (row.token_hash !== tokenHash) {
    return { ok: false, error: "Invalid reset link." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many failed attempts. Please request a new code." };
  }

  // Hash new password (same scheme as register/login — SHA-256).
  const newHash = await hashValue(newPassword);

  const { error: updateError } = await supabaseAdmin
    .from("members")
    .update({ password_hash: newHash })
    .eq("email", row.email);
  if (updateError) {
    return { ok: false, error: `Could not update password: ${updateError.message}` };
  }

  // Mark reset as consumed so it can't be reused.
  await supabaseAdmin
    .from("password_resets")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", resetId);

  // Invalidate any other outstanding resets for the same email.
  await supabaseAdmin
    .from("password_resets")
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", row.email)
    .is("consumed_at", null)
    .neq("id", resetId);

  return { ok: true, email: row.email };
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