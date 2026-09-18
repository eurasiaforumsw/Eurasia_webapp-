"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Eye, EyeOff, LogIn } from "lucide-react";
import { getSessionMember, loginMember } from "@/lib/member-auth";

export default function MemberLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => { setLoggedIn(Boolean(getSessionMember())); }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
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
    <main className="efsw-auth-page efsw-auth-page--login">
      <a href="/" className="efsw-auth-brand" aria-label="EFSW home">
        <span className="efsw-brand__mark">E</span>
        <span>Eurasia Forum<br />for Social Workers</span>
      </a>

      <div className="efsw-auth-shell">
        <aside className="efsw-auth-intro" aria-label="EFSW member network">
          <p className="efsw-auth-kicker">EFSW member network</p>
          <h1>Work that moves<br /><span>across borders.</span></h1>
          <p className="efsw-auth-intro__copy">
            A shared space for social work professionals, educators, students, and partners across Eurasia.
          </p>
          <div className="efsw-auth-intro__line" />
          <div className="efsw-auth-intro__meta">
            <span>01</span>
            <p>Connect · Empower · Advocate</p>
          </div>
        </aside>

        <section className="efsw-auth-card efsw-auth-card--login" aria-labelledby="login-title">
          {loggedIn ? (
            <div className="efsw-auth-success">
              <div className="efsw-auth-card__icon"><CheckCircle2 size={21} /></div>
              <p className="efsw-auth-kicker">Member access</p>
              <h2 id="login-title">You are<br /><span>signed in.</span></h2>
              <p>Your member session is active in this browser.</p>
              <a href="/member/profile" className="efsw-button efsw-button--dark">Open profile <ArrowUpRight size={17} /></a>
            </div>
          ) : (
            <>
              <div className="efsw-auth-card__topline">
                <div className="efsw-auth-card__icon"><LogIn size={21} /></div>
                <span>Member portal</span>
              </div>
              <h2 id="login-title">Welcome<br /><span>back.</span></h2>
              <p className="efsw-auth-card__lede">Sign in to manage your profile and stay connected to the network.</p>
              {error && <div className="efsw-form-error" role="alert">{error}</div>}
              <form onSubmit={submit} className="efsw-member-form">
                <label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
                <div className="efsw-password-field">
                  <label>Password<input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <button type="submit" className="efsw-button efsw-button--dark" disabled={submitting}>
                  {submitting ? "Signing in..." : "Sign in"}
                  <ArrowUpRight size={17} />
                </button>
              </form>
              <div className="efsw-auth-card__footer">New to EFSW? <a href="/member/register">Create a member profile <ArrowUpRight size={15} /></a></div>
            </>
          )}
        </section>
      </div>

      <a href="/" className="efsw-auth-back"><ArrowLeft size={15} /> Back to home</a>
      <p className="efsw-auth-prototype-note">Prototype mode · Local browser session for this preview</p>
    </main>
  );
}
