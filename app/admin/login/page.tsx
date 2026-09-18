"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { ADMIN_DEMO_ACCOUNT, getAdminSession, loginAdmin } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getAdminSession()) window.location.replace("/admin");
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginAdmin(email, password);
      window.location.replace("/admin");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="efsw-admin-auth">
      <a href="/" className="efsw-brand" aria-label="EFSW home">
        <span className="efsw-brand__mark">E</span>
        <span>Eurasia Forum<br />for Social Workers</span>
      </a>
      <section className="efsw-admin-auth__card" aria-labelledby="admin-login-title">
        <div className="efsw-admin-auth__icon"><LockKeyhole size={20} /></div>
        <p className="efsw-admin-eyebrow">EFSW operations / Admin</p>
        <h1 id="admin-login-title">Enter the<br /><span>control room.</span></h1>
        <p className="efsw-admin-auth__lede">Manage members, publications, academic resources, and site settings from one workspace.</p>
        {error && <div className="efsw-admin-error" role="alert">{error}</div>}
        <form onSubmit={submit} className="efsw-admin-login-form">
          <label>Admin email *<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" /></label>
          <div className="efsw-admin-password">
            <label>Password *<input id="admin-password" required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></label>
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-controls="admin-password" aria-pressed={showPassword} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <button type="submit" className="efsw-admin-primary" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in to admin"}
            <ArrowUpRight size={17} />
          </button>
        </form>
        <div className="efsw-admin-demo-hint">
          <span>Demo access</span>
          <code>{ADMIN_DEMO_ACCOUNT.email}</code>
          <code>Contact admin for password</code>
        </div>
      </section>
      <a href="/" className="efsw-admin-auth__back"><ArrowLeft size={15} /> Back to home</a>
      <p className="efsw-admin-prototype-note">Prototype mode · Local browser session for this preview</p>
    </main>
  );
}
