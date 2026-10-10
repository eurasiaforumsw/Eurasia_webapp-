"use client";

import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  AlertCircle,
  CheckCircle2,
  Database,
  LayoutGrid,
  Mail,
  Sparkles,
  Copy,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<"" | "email" | "password">("");
  const { addToast } = useToast();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to sign in. Please try again.");
      }

      addToast({
        type: "success",
        title: "Welcome back!",
        description: "You've successfully signed in to the admin console.",
      });
      window.location.replace("/admin");
    } catch (submissionError) {
      const errorMessage = submissionError instanceof Error
        ? submissionError.message
        : "Unable to sign in. Please try again.";
      setError(errorMessage);
      addToast({
        type: "error",
        title: "Sign in failed",
        description: errorMessage,
      });
      setSubmitting(false);
    }
  };

  const copyDemo = async (kind: "email" | "password") => {
    const value = kind === "email" ? "admin@efsw.local" : "EFSW-demo-admin-2024";
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      addToast({
        type: "success",
        title: `${kind === "email" ? "Email" : "Password"} copied`,
        description: "Paste it into the sign-in form.",
      });
      setTimeout(() => setCopied(""), 1600);
    } catch {
      // ignore — clipboard may be unavailable
    }
  };

  const fillDemo = () => {
    setEmail("admin@efsw.local");
    setPassword("EFSW-demo-admin-2024");
    setError("");
  };

  return (
    <main className="efsw-signin efsw-signin--admin">
      <a href="/" className="efsw-signin__brand" aria-label="EFSW home">
        <span className="efsw-brand__mark">
          <img src="/efsw-logo-lg.png" alt="EFSW" />
        </span>
        <span>Eurasia Forum<br />for Social Workers</span>
      </a>

      <div className="efsw-signin__shell">
        {/* ── Left: editorial intro ── */}
        <aside className="efsw-signin__intro" aria-label="EFSW admin console">
          <p className="efsw-signin__eyebrow">Operations console · Admin only</p>
          <h1>
            Control room.<br />
            <em>One workspace.</em>
          </h1>
          <p className="efsw-signin__intro-copy">
            Manage members, publications, events, broadcasts, and site settings
            from one unified console.
          </p>
          <div className="efsw-signin__intro-rule" />
          <div className="efsw-signin__intro-meta">
            <span>EFSW</span>
            <div><p>Secure admin access</p></div>
          </div>
          <ul className="efsw-signin__features">
            <li>
              <Database size={14} />
              Members, content &amp; broadcasts in one place
            </li>
            <li>
              <LayoutGrid size={14} />
              Layout, hero, and section visibility controls
            </li>
            <li>
              <Mail size={14} />
              Email campaigns to targeted member groups
            </li>
          </ul>
        </aside>

        {/* ── Right: form card ── */}
        <section className="efsw-signin__card" aria-labelledby="admin-login-title">
          <div className="efsw-signin__card-inner">
            <div className="efsw-signin__card-topline">
              <div className="efsw-signin__card-icon"><LockKeyhole size={20} /></div>
              <span>Administrator access</span>
            </div>
            <h2 id="admin-login-title">
              Enter the<br /><em>control room.</em>
            </h2>
            <p className="efsw-signin__card-lede">
              Manage members, publications, academic resources, and site settings from one workspace.
            </p>

            {error && (
              <div className="efsw-signin__error" role="alert">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <form onSubmit={submit} className="efsw-signin__form">
              <div className="efsw-signin__field">
                <label htmlFor="admin-email">Admin email</label>
                <input
                  id="admin-email"
                  required
                  type="text"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="admin@efsw.local"
                />
              </div>

              <div className="efsw-signin__field efsw-signin__field--pw">
                <label htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button type="submit" className="efsw-signin__submit" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in to admin"}
                <ArrowUpRight size={16} />
              </button>
            </form>

            <div className="efsw-signin__card-divider">
              <ShieldCheck size={13} /> Demo access
            </div>

            <div className="efsw-signin__demo">
              <div className="efsw-signin__demo-row">
                <span className="efsw-signin__demo-label">Email</span>
                <code>admin@efsw.local</code>
                <button
                  type="button"
                  className="efsw-signin__demo-copy"
                  onClick={() => copyDemo("email")}
                  aria-label="Copy demo email"
                >
                  {copied === "email" ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <div className="efsw-signin__demo-row">
                <span className="efsw-signin__demo-label">Password</span>
                <code>EFSW-demo-admin-2024</code>
                <button
                  type="button"
                  className="efsw-signin__demo-copy"
                  onClick={() => copyDemo("password")}
                  aria-label="Copy demo password"
                >
                  {copied === "password" ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                </button>
              </div>
              <button
                type="button"
                className="efsw-signin__demo-fill"
                onClick={fillDemo}
              >
                <Sparkles size={13} /> Fill the form with demo credentials
              </button>
            </div>
          </div>
        </section>
      </div>

      <a href="/" className="efsw-signin__back">
        <ArrowLeft size={14} /> Back to home
      </a>

      <p className="efsw-signin__note">
        Prototype mode · Admin session stored locally
      </p>
    </main>
  );
}