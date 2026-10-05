"use client";

import { FormEvent, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  KeyRound,
  Mail,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function MemberForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [devCode, setDevCode] = useState("");
  const { addToast } = useToast();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/members/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        devCode?: string;
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error || "Could not send the reset email.");
      }
      setSentTo(email.trim().toLowerCase());
      if (body.devCode) {
        setDevCode(body.devCode);
        addToast({
          type: "info",
          title: "Dev mode — code shown on screen",
          description:
            "No Resend API key is configured, so the verification code is displayed here for testing.",
        });
      } else {
        addToast({
          type: "success",
          title: "Check your email",
          description: "If that address is registered, a 6-digit code is on its way.",
        });
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not send the reset email.",
      );
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <main className="efsw-signin">
      <a href="/" className="efsw-signin__brand" aria-label="EFSW home">
        <span className="efsw-brand__mark">
          <img src="/efsw-logo-lg.png" alt="EFSW" />
        </span>
        <span>Eurasia Forum<br />for Social Workers</span>
      </a>

      <div className="efsw-signin__shell">
        {/* ── Left: editorial intro ── */}
        <aside className="efsw-signin__intro" aria-label="EFSW password reset">
          <p className="efsw-signin__eyebrow">Password recovery · Member</p>
          <h1>
            Forgot your<br />
            <em>password?</em>
          </h1>
          <p className="efsw-signin__intro-copy">
            We&apos;ll email you a 6-digit verification code and a secure reset
            link. Use either one to choose a new password.
          </p>
          <div className="efsw-signin__intro-rule" />
          <div className="efsw-signin__intro-meta">
            <span>01</span>
            <div><p>Secure · Encrypted · Single-use</p></div>
          </div>
          <ul className="efsw-signin__features">
            <li>
              <Mail size={14} />
              Code + link delivered to your registered email
            </li>
            <li>
              <KeyRound size={14} />
              6-digit code · 15-minute expiry · 5 attempts
            </li>
            <li>
              <CheckCircle2 size={14} />
              Choose a new password on the secure reset page
            </li>
          </ul>
        </aside>

        {/* ── Right: form card ── */}
        <section className="efsw-signin__card" aria-labelledby="forgot-title">
          <div className="efsw-signin__card-inner">
            <div className="efsw-signin__card-topline">
              <div className="efsw-signin__card-icon"><KeyRound size={20} /></div>
              <span>Password recovery</span>
            </div>
            <h2 id="forgot-title">
              Reset your<br />
              <em>password.</em>
            </h2>
            <p className="efsw-signin__card-lede">
              Enter the email associated with your EFSW member profile.
            </p>

            {error && (
              <div className="efsw-signin__error" role="alert">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            {sentTo ? (
              <div className="efsw-forgot__success">
                <div className="efsw-signin__card-icon"><CheckCircle2 size={22} /></div>
                <h3>Check your inbox</h3>
                <p>
                  If <strong>{sentTo}</strong> is registered with EFSW, a
                  verification code and reset link are on their way. Codes
                  expire in 15 minutes.
                </p>
                {devCode && (
                  <div className="efsw-forgot__devcode" role="status">
                    <div className="efsw-forgot__devcode-head">
                      <Sparkles size={13} /> Dev mode code
                    </div>
                    <div className="efsw-forgot__devcode-value">{devCode}</div>
                    <p className="efsw-forgot__devcode-hint">
                      No email provider is configured. Use this code on the reset
                      page: <a href="/member/reset-password">/member/reset-password</a>
                    </p>
                  </div>
                )}
                <div className="efsw-forgot__success-actions">
                  <a href="/member/reset-password" className="efsw-signin__submit" style={{ textDecoration: "none", display: "inline-flex" }}>
                    Open reset page <ArrowUpRight size={16} />
                  </a>
                  <button
                    type="button"
                    className="efsw-text-link"
                    onClick={() => { setSentTo(""); setDevCode(""); setEmail(""); }}
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="efsw-signin__form">
                <div className="efsw-signin__field">
                  <label htmlFor="forgot-email">Email address</label>
                  <input
                    id="forgot-email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@example.org"
                  />
                  <span className="efsw-signin__field-hint">
                    Must match the email on your member profile
                  </span>
                </div>

                <button type="submit" className="efsw-signin__submit" disabled={submitting}>
                  {submitting ? "Sending code…" : "Send verification code"}
                  <ArrowUpRight size={16} />
                </button>
              </form>
            )}

            <div className="efsw-signin__card-footer">
              <span>Remembered your password?</span>
              <a href="/member/login">Back to sign in <ArrowUpRight size={14} /></a>
            </div>
          </div>
        </section>
      </div>

      <a href="/" className="efsw-signin__back">
        <ArrowLeft size={14} /> Back to home
      </a>

      <p className="efsw-signin__note">
        Email delivery handled by Resend · No password is ever stored in plain text
      </p>
    </main>
  );
}