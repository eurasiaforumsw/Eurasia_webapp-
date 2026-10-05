"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LogIn,
  Globe2,
  ShieldCheck,
  Users,
  AlertCircle,
} from "lucide-react";
import { getSessionMember, isRemoteMemberStoreEnabled, loginMember } from "@/lib/member-auth";

export default function MemberLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // Field-level validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => { setLoggedIn(Boolean(getSessionMember())); }, []);

  // Email validation
  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Password validation
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    // Validate all fields before submit
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setSubmitting(true);
    try {
      await loginMember(email, password);
      window.location.href = "/member/profile";
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in. Please try again.");
      setSubmitting(false);
    }
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
        <aside className="efsw-signin__intro" aria-label="EFSW member network">
          <p className="efsw-signin__eyebrow">Member network · Since 2014</p>
          <h1>
            One region.<br />
            <em>Shared purpose.</em>
          </h1>
          <p className="efsw-signin__intro-copy">
            A professional home for social workers, educators, students, and partners
            across Eurasia to connect, learn, and act together.
          </p>
          <div className="efsw-signin__intro-rule" />
          <div className="efsw-signin__intro-meta">
            <span>01</span>
            <div><p>Connect · Empower · Advocate</p></div>
          </div>
          <ul className="efsw-signin__features">
            <li>
              <Globe2 size={14} />
              Cross-border professional network spanning Eurasia
            </li>
            <li>
              <ShieldCheck size={14} />
              Verified member credentials &amp; member-only resources
            </li>
            <li>
              <Users size={14} />
              Regional forums, working groups, and shared research
            </li>
          </ul>
        </aside>

        {/* ── Right: form card ── */}
        <section className="efsw-signin__card" aria-labelledby="login-title">
          <div className="efsw-signin__card-inner">
            {loggedIn ? (
              <div className="efsw-signin__success">
                <div className="efsw-signin__card-icon"><CheckCircle2 size={22} /></div>
                <h2 id="login-title">
                  You are<br /><em>signed in.</em>
                </h2>
                <p className="efsw-signin__card-lede">Your member session is active in this browser.</p>
                <a href="/member/profile" className="efsw-signin__submit" style={{ textDecoration: "none" }}>
                  Open profile <ArrowUpRight size={16} />
                </a>
              </div>
            ) : (
              <>
                <div className="efsw-signin__card-topline">
                  <div className="efsw-signin__card-icon"><LogIn size={20} /></div>
                  <span>Member sign-in</span>
                </div>
                <h2 id="login-title">
                  Welcome<br /><em>back.</em>
                </h2>
                <p className="efsw-signin__card-lede">
                  Sign in to manage your profile, access member resources, and stay connected.
                </p>

                {error && (
                  <div className="efsw-signin__error" role="alert">
                    <AlertCircle size={15} />
                    {error}
                  </div>
                )}

                <form onSubmit={submit} className="efsw-signin__form">
                  <div className="efsw-signin__field">
                    <label htmlFor="login-email">Email address</label>
                    <input
                      id="login-email"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (e.target.value) validateEmail(e.target.value);
                      }}
                      onBlur={(e) => validateEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="you@example.org"
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? "email-error" : undefined}
                      style={emailError ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                    />
                    {emailError && (
                      <div id="email-error" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                        <AlertCircle size={13} />
                        {emailError}
                      </div>
                    )}
                  </div>

                  <div className="efsw-signin__field efsw-signin__field--pw">
                    <label htmlFor="login-password">Password</label>
                    <input
                      id="login-password"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (e.target.value) validatePassword(e.target.value);
                      }}
                      onBlur={(e) => validatePassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Your password"
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? "password-error" : undefined}
                      style={passwordError ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {passwordError && (
                      <div id="password-error" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                        <AlertCircle size={13} />
                        {passwordError}
                      </div>
                    )}
                  </div>

                  <div className="efsw-signin__meta">
                    <label>
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      Keep me signed in
                    </label>
                    <a href="/member/forgot-password">Forgot password?</a>
                  </div>

                  <button type="submit" className="efsw-signin__submit" disabled={submitting}>
                    {submitting ? "Signing in…" : "Sign in"}
                    <ArrowUpRight size={16} />
                  </button>
                </form>

                <div className="efsw-signin__card-divider">or</div>

                <div className="efsw-signin__card-footer">
                  <span>New to EFSW?</span>
                  <a href="/member/register">
                    Create a member profile <ArrowUpRight size={14} />
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <a href="/" className="efsw-signin__back">
        <ArrowLeft size={14} /> Back to home
      </a>

      <p className="efsw-signin__note">
        {isRemoteMemberStoreEnabled()
          ? "Secure sign-in · Verified against the EFSW member database"
          : "Prototype mode · Sign-in checked against this browser"}
      </p>
    </main>
  );
}