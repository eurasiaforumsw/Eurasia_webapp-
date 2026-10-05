"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Stage = "code" | "password" | "done";

export default function MemberResetPasswordPage() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const initialId = params.get("id") || "";
  const initialToken = params.get("token") || "";

  const [stage, setStage] = useState<Stage>("code");
  const [resetId, setResetId] = useState(initialId);
  const [token] = useState(initialToken);
  const [digits, setDigits] = useState<string[]>(Array.from({ length: 6 }, () => ""));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [usedEmail, setUsedEmail] = useState("");
  const { addToast } = useToast();

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const code = digits.join("");

  // Focus the first input on mount and after a code error.
  useEffect(() => {
    if (stage === "code") {
      inputsRef.current[0]?.focus();
    }
  }, [stage]);

  const handleDigitChange = (index: number, value: string) => {
    const next = value.replace(/\D/g, "").slice(0, 6);
    const nextDigits = [...digits];
    if (next.length > 1) {
      // Pasted multiple digits — fill them across.
      for (let i = 0; i < 6; i++) nextDigits[i] = next[i] ?? "";
      setDigits(nextDigits);
      const lastIndex = Math.min(5, next.length - 1);
      inputsRef.current[lastIndex]?.focus();
      return;
    }
    nextDigits[index] = next;
    setDigits(nextDigits);
    if (next && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleDigitKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!resetId || !token) {
      setError("Missing reset link. Please request a new code from the forgot-password page.");
      return;
    }
    if (code.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/members/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetId, token, code }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        email?: string;
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error || "Verification failed.");
      }
      if (body.email) setUsedEmail(body.email);
      addToast({
        type: "success",
        title: "Code verified",
        description: "Now choose a new password.",
      });
      setStage("password");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Verification failed.",
      );
      // Clear the code on failure so the user can re-enter cleanly.
      setDigits(Array(6).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!resetId || !token) {
      setError("Reset session expired. Please request a new code.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/members/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetId, token, code, newPassword: password }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error || "Could not update password.");
      }
      addToast({
        type: "success",
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });
      setStage("done");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "Could not update password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "Empty", tone: "muted" as const };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const label =
      score <= 1 ? "Weak" :
      score <= 3 ? "Fair" :
      score === 4 ? "Strong" : "Excellent";
    const tone =
      score <= 1 ? "danger" :
      score <= 3 ? "warn" : "good";
    return { score: Math.min(score, 5), label, tone };
  }, [password]);

  return (
    <main className="efsw-signin">
      <a href="/" className="efsw-signin__brand" aria-label="EFSW home">
        <span className="efsw-brand__mark">
          <img src="/efsw-logo-lg.png" alt="EFSW" />
        </span>
        <span>Eurasia Forum<br />for Social Workers</span>
      </a>

      <div className="efsw-signin__shell">
        <aside className="efsw-signin__intro" aria-label="EFSW password reset">
          <p className="efsw-signin__eyebrow">Password recovery · Step {stage === "code" ? "1" : stage === "password" ? "2" : "3"} of 2</p>
          <h1>
            {stage === "done" ? (
              <>You&apos;re<br /><em>back in.</em></>
            ) : stage === "password" ? (
              <>Pick a new<br /><em>password.</em></>
            ) : (
              <>Enter your<br /><em>code.</em></>
            )}
          </h1>
          <p className="efsw-signin__intro-copy">
            {stage === "done"
              ? "Your password has been updated. You can now sign in with your new credentials."
              : stage === "password"
              ? "Choose a password that's at least 8 characters and hard to guess."
              : "Enter the 6-digit code from your email. Codes expire after 15 minutes."}
          </p>
          <div className="efsw-signin__intro-rule" />
          <div className="efsw-signin__intro-meta">
            <span>{stage === "done" ? "EFSW" : stage === "password" ? "02" : "01"}</span>
            <div>
              <p>
                {stage === "done"
                  ? "Reset complete"
                  : stage === "password"
                  ? "Choose · Confirm · Done"
                  : "Code · Verify · Reset"}
              </p>
            </div>
          </div>
          <ul className="efsw-signin__features">
            <li>
              <ShieldCheck size={14} />
              Codes are hashed &amp; single-use
            </li>
            <li>
              <KeyRound size={14} />
              5 attempts maximum per code
            </li>
            <li>
              <CheckCircle2 size={14} />
              Old password replaced atomically
            </li>
          </ul>
        </aside>

        <section className="efsw-signin__card" aria-labelledby="reset-title">
          <div className="efsw-signin__card-inner">
            {stage === "code" && (
              <>
                <div className="efsw-signin__card-topline">
                  <div className="efsw-signin__card-icon"><KeyRound size={20} /></div>
                  <span>Verification code</span>
                </div>
                <h2 id="reset-title">
                  Enter your<br /><em>code.</em>
                </h2>
                <p className="efsw-signin__card-lede">
                  Type the 6 digits from your email. You can paste the whole code.
                </p>

                {error && (
                  <div className="efsw-signin__error" role="alert">
                    <AlertCircle size={15} />
                    {error}
                  </div>
                )}

                <form onSubmit={submitCode} className="efsw-signin__form">
                  <input type="hidden" value={resetId} readOnly />
                  <input type="hidden" value={token} readOnly />

                  <div className="efsw-signin__field">
                    <label>6-digit code</label>
                    <div className="efsw-otp" role="group" aria-label="Verification code">
                      {digits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            inputsRef.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          autoComplete={index === 0 ? "one-time-code" : "off"}
                          pattern="\d*"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(index, e)}
                          onFocus={(e) => e.currentTarget.select()}
                          aria-label={`Digit ${index + 1}`}
                          className="efsw-otp__input"
                        />
                      ))}
                    </div>
                    <span className="efsw-signin__field-hint">
                      Don&apos;t have a code?{" "}
                      <a href="/member/forgot-password">Request a new one</a>
                    </span>
                  </div>

                  <button type="submit" className="efsw-signin__submit" disabled={submitting || code.length !== 6}>
                    {submitting ? "Verifying…" : "Verify code"}
                    <ArrowUpRight size={16} />
                  </button>
                </form>
              </>
            )}

            {stage === "password" && (
              <>
                <div className="efsw-signin__card-topline">
                  <div className="efsw-signin__card-icon"><Lock size={20} /></div>
                  <span>New password</span>
                </div>
                <h2 id="reset-title">
                  Pick a new<br /><em>password.</em>
                </h2>
                <p className="efsw-signin__card-lede">
                  {usedEmail ? <>For account <strong>{usedEmail}</strong>.</> : "Make it strong."}
                </p>

                {error && (
                  <div className="efsw-signin__error" role="alert">
                    <AlertCircle size={15} />
                    {error}
                  </div>
                )}

                <form onSubmit={submitPassword} className="efsw-signin__form">
                  <div className="efsw-signin__field efsw-signin__field--pw">
                    <label htmlFor="new-password">New password</label>
                    <input
                      id="new-password"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="efsw-signin__field efsw-signin__field--pw">
                    <label htmlFor="confirm-password">Confirm new password</label>
                    <input
                      id="confirm-password"
                      required
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Type it again"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className={`efsw-strength efsw-strength--${passwordStrength.tone}`}>
                    <div className="efsw-strength__bars" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span key={i} className={i < passwordStrength.score ? "is-on" : ""} />
                      ))}
                    </div>
                    <span className="efsw-strength__label">
                      {password ? passwordStrength.label : "Start typing"}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="efsw-signin__submit"
                    disabled={submitting || password.length < 8 || password !== confirm}
                  >
                    {submitting ? "Updating…" : "Update password"}
                    <ArrowUpRight size={16} />
                  </button>
                </form>
              </>
            )}

            {stage === "done" && (
              <div className="efsw-signin__success">
                <div className="efsw-signin__card-icon"><Sparkles size={22} /></div>
                <h2>
                  Password<br /><em>updated.</em>
                </h2>
                <p className="efsw-signin__card-lede">
                  Your new password is active. You can sign in with your member email
                  and the password you just chose.
                </p>
                <a href="/member/login" className="efsw-signin__submit" style={{ textDecoration: "none", display: "inline-flex" }}>
                  Sign in now <ArrowUpRight size={16} />
                </a>
              </div>
            )}
          </div>
        </section>
      </div>

      <a href="/" className="efsw-signin__back">
        <ArrowLeft size={14} /> Back to home
      </a>

      <p className="efsw-signin__note">
        Verification codes expire in 15 minutes · 5 attempts maximum
      </p>
    </main>
  );
}