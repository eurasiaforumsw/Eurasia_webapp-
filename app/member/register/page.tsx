"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  UserPlus,
  Globe2,
  ShieldCheck,
  Users,
  AlertCircle,
} from "lucide-react";
import { registerMember, MembershipType, isRemoteMemberStoreEnabled } from "@/lib/member-auth";

const baseFields = {
  fullName: "",
  email: "",
  country: "",
  password: "",
  confirmPassword: "",
  membershipType: "professional" as MembershipType,
  organization: "",
  position: "",
  expertise: "",
  university: "",
  faculty: "",
  degree: "bachelor",
  organizationType: "ngo",
  contactPosition: "",
};

export default function MemberRegisterPage() {
  const [step, setStep] = useState(1);
  const [fields, setFields] = useState(baseFields);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // /member/register?type=student — preselect the tier chosen on /about/organization.
  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get("type");
    if (type === "professional" || type === "student" || type === "institutional") {
      setFields((current) => ({ ...current, membershipType: type }));
    }
  }, []);

  const update = (name: keyof typeof baseFields, value: string) =>
    setFields((current) => ({ ...current, [name]: value }));

  // Clear field error when user starts typing
  const clearFieldError = (fieldName: string) => {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
  };

  // Field validation functions
  const validateFullName = (value: string) => {
    if (!value.trim()) {
      setFieldErrors((current) => ({ ...current, fullName: "Full name is required" }));
      return false;
    }
    clearFieldError("fullName");
    return true;
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setFieldErrors((current) => ({ ...current, email: "Email is required" }));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setFieldErrors((current) => ({ ...current, email: "Please enter a valid email address" }));
      return false;
    }
    clearFieldError("email");
    return true;
  };

  const validateCountry = (value: string) => {
    if (!value.trim()) {
      setFieldErrors((current) => ({ ...current, country: "Country is required" }));
      return false;
    }
    clearFieldError("country");
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setFieldErrors((current) => ({ ...current, password: "Password is required" }));
      return false;
    }
    if (value.length < 8) {
      setFieldErrors((current) => ({ ...current, password: "Password must be at least 8 characters" }));
      return false;
    }
    clearFieldError("password");
    return true;
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setFieldErrors((current) => ({ ...current, confirmPassword: "Please confirm your password" }));
      return false;
    }
    if (value !== fields.password) {
      setFieldErrors((current) => ({ ...current, confirmPassword: "Passwords do not match" }));
      return false;
    }
    clearFieldError("confirmPassword");
    return true;
  };

  const continueToDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    // Validate all step 1 fields
    const isFullNameValid = validateFullName(fields.fullName);
    const isEmailValid = validateEmail(fields.email);
    const isCountryValid = validateCountry(fields.country);
    const isPasswordValid = validatePassword(fields.password);
    const isConfirmPasswordValid = validateConfirmPassword(fields.confirmPassword);

    if (!isFullNameValid || !isEmailValid || !isCountryValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setStep(2);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await registerMember({
        fullName: fields.fullName,
        email: fields.email,
        country: fields.country,
        password: fields.password,
        membershipType: fields.membershipType,
        organization: fields.organization,
        position: fields.position,
        expertise: fields.expertise,
        university: fields.university,
        faculty: fields.faculty,
        degree: fields.degree,
        organizationType: fields.organizationType,
        contactPosition: fields.contactPosition,
        bio: "",
      });
      setComplete(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to create your profile. Please try again.");
    } finally {
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
        <aside className="efsw-signin__intro" aria-label="EFSW member registration">
          <p className="efsw-signin__eyebrow">Member network · Open enrollment</p>
          <h1>
            Join the<br /><em>network.</em>
          </h1>
          <p className="efsw-signin__intro-copy">
            Build your member profile, connect with professionals across Eurasia,
            and unlock member-only resources, forums, and events.
          </p>
          <div className="efsw-signin__intro-rule" />
          <div className="efsw-signin__intro-meta">
            <span>02</span>
            <div><p>Professional · Student · Institutional</p></div>
          </div>
          <ul className="efsw-signin__features">
            <li>
              <Globe2 size={14} />
              Connect with social workers across Eurasia
            </li>
            <li>
              <ShieldCheck size={14} />
              Verified credentials &amp; member directory listing
            </li>
            <li>
              <Users size={14} />
              Access to working groups &amp; regional forums
            </li>
          </ul>
        </aside>

        {/* ── Right: form card ── */}
        <section className="efsw-signin__card" aria-labelledby="register-title">
          <div className="efsw-signin__card-inner">
            {complete ? (
              <div className="efsw-signin__success">
                <div className="efsw-signin__card-icon"><Check size={22} /></div>
                <h2 id="register-title">
                  Welcome to<br /><em>the network.</em>
                </h2>
                <p className="efsw-signin__card-lede">
                  {isRemoteMemberStoreEnabled()
                    ? "Your profile has been saved and is pending review by the EFSW team."
                    : "Your profile was created in this browser and is pending review."}
                </p>
                <a href="/member/profile" className="efsw-signin__submit" style={{ textDecoration: "none", display: "inline-flex" }}>
                  Open profile <ArrowUpRight size={16} />
                </a>
              </div>
            ) : (
              <>
                <div className="efsw-signin__card-topline">
                  <div className="efsw-signin__card-icon"><UserPlus size={20} /></div>
                  <span>Member registration</span>
                </div>
                <h2 id="register-title">
                  Create your<br /><em>profile.</em>
                </h2>
                <p className="efsw-signin__card-lede">
                  Two short steps. Your profile stays private until approved by the EFSW team.
                </p>

                <div className="efsw-form-steps" aria-label={`Step ${step} of 2`}>
                  <span className={step === 1 ? "is-active" : step > 1 ? "is-active" : ""}>01 Account</span>
                  <i />
                  <span className={step === 2 ? "is-active" : ""}>02 Professional</span>
                </div>

                {error && (
                  <div className="efsw-signin__error" role="alert">
                    <AlertCircle size={15} />
                    {error}
                  </div>
                )}

                {step === 1 ? (
                  <form onSubmit={continueToDetails} className="efsw-signin__form">
                    <div className="efsw-signin__row">
                      <div className="efsw-signin__field">
                        <label htmlFor="reg-name">Full name *</label>
                        <input
                          id="reg-name"
                          required
                          value={fields.fullName}
                          onChange={(e) => {
                            update("fullName", e.target.value);
                            if (e.target.value) validateFullName(e.target.value);
                          }}
                          onBlur={(e) => validateFullName(e.target.value)}
                          autoComplete="name"
                          aria-invalid={!!fieldErrors.fullName}
                          aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
                          style={fieldErrors.fullName ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                        />
                        {fieldErrors.fullName && (
                          <div id="fullName-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                            <AlertCircle size={13} />
                            {fieldErrors.fullName}
                          </div>
                        )}
                      </div>
                      <div className="efsw-signin__field">
                        <label htmlFor="reg-country">Country *</label>
                        <input
                          id="reg-country"
                          required
                          value={fields.country}
                          onChange={(e) => {
                            update("country", e.target.value);
                            if (e.target.value) validateCountry(e.target.value);
                          }}
                          onBlur={(e) => validateCountry(e.target.value)}
                          autoComplete="country-name"
                          aria-invalid={!!fieldErrors.country}
                          aria-describedby={fieldErrors.country ? "country-error" : undefined}
                          style={fieldErrors.country ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                        />
                        {fieldErrors.country && (
                          <div id="country-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                            <AlertCircle size={13} />
                            {fieldErrors.country}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="efsw-signin__field">
                      <label htmlFor="reg-email">Email address *</label>
                      <input
                        id="reg-email"
                        required
                        type="email"
                        value={fields.email}
                        onChange={(e) => {
                          update("email", e.target.value);
                          if (e.target.value) validateEmail(e.target.value);
                        }}
                        onBlur={(e) => validateEmail(e.target.value)}
                        autoComplete="email"
                        placeholder="you@example.org"
                        aria-invalid={!!fieldErrors.email}
                        aria-describedby={fieldErrors.email ? "email-error" : undefined}
                        style={fieldErrors.email ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                      />
                      {fieldErrors.email && (
                        <div id="email-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                          <AlertCircle size={13} />
                          {fieldErrors.email}
                        </div>
                      )}
                    </div>
                    <div className="efsw-signin__field efsw-signin__field--pw">
                      <label htmlFor="reg-password">Password *</label>
                      <input
                        id="reg-password"
                        required
                        type={showPassword ? "text" : "password"}
                        value={fields.password}
                        onChange={(e) => {
                          update("password", e.target.value);
                          if (e.target.value) validatePassword(e.target.value);
                        }}
                        onBlur={(e) => validatePassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        aria-invalid={!!fieldErrors.password}
                        aria-describedby={fieldErrors.password ? "password-error" : undefined}
                        style={fieldErrors.password ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      {fieldErrors.password && (
                        <div id="password-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                          <AlertCircle size={13} />
                          {fieldErrors.password}
                        </div>
                      )}
                    </div>
                    <div className="efsw-signin__field efsw-signin__field--pw">
                      <label htmlFor="reg-confirm">Confirm password *</label>
                      <input
                        id="reg-confirm"
                        required
                        type={showConfirm ? "text" : "password"}
                        value={fields.confirmPassword}
                        onChange={(e) => {
                          update("confirmPassword", e.target.value);
                          if (e.target.value) validateConfirmPassword(e.target.value);
                        }}
                        onBlur={(e) => validateConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        aria-invalid={!!fieldErrors.confirmPassword}
                        aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
                        style={fieldErrors.confirmPassword ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                      />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"}>
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      {fieldErrors.confirmPassword && (
                        <div id="confirmPassword-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                          <AlertCircle size={13} />
                          {fieldErrors.confirmPassword}
                        </div>
                      )}
                    </div>
                    <button type="submit" className="efsw-signin__submit">
                      Continue <ArrowUpRight size={16} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={submit} className="efsw-signin__form">
                    <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                      <legend style={{ fontSize: "0.74rem", fontWeight: 750, color: "var(--efsw-ink-soft)", marginBottom: "0.5rem" }}>Membership type *</legend>
                      <div className="efsw-membership-options">
                        {[
                          ["professional", "Professional", "Social workers, academics, and practitioners"],
                          ["student", "Student", "Students in social work or a related field"],
                          ["institutional", "Institutional", "Universities, NGOs, public bodies"],
                        ].map(([value, title, desc]) => (
                          <label key={value} className={fields.membershipType === value ? "is-selected" : ""}>
                            <input type="radio" name="membershipType" value={value} checked={fields.membershipType === value} onChange={(e) => update("membershipType", e.target.value)} />
                            <span><strong>{title}</strong><small>{desc}</small></span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    {fields.membershipType === "professional" && (
                      <>
                        <div className="efsw-signin__row">
                          <div className="efsw-signin__field">
                            <label htmlFor="pf-org">Organization</label>
                            <input
                              id="pf-org"
                              value={fields.organization}
                              onChange={(e) => update("organization", e.target.value)}
                              aria-invalid={!!fieldErrors.organization}
                              aria-describedby={fieldErrors.organization ? "organization-error" : undefined}
                              style={fieldErrors.organization ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                            />
                            {fieldErrors.organization && (
                              <div id="organization-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                                <AlertCircle size={13} />
                                {fieldErrors.organization}
                              </div>
                            )}
                          </div>
                          <div className="efsw-signin__field">
                            <label htmlFor="pf-pos">Position</label>
                            <input
                              id="pf-pos"
                              value={fields.position}
                              onChange={(e) => update("position", e.target.value)}
                              aria-invalid={!!fieldErrors.position}
                              aria-describedby={fieldErrors.position ? "position-error" : undefined}
                              style={fieldErrors.position ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                            />
                            {fieldErrors.position && (
                              <div id="position-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                                <AlertCircle size={13} />
                                {fieldErrors.position}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="efsw-signin__field">
                          <label htmlFor="pf-exp">Area of expertise</label>
                          <input
                            id="pf-exp"
                            value={fields.expertise}
                            onChange={(e) => update("expertise", e.target.value)}
                            placeholder="e.g. child and family welfare"
                            aria-invalid={!!fieldErrors.expertise}
                            aria-describedby={fieldErrors.expertise ? "expertise-error" : undefined}
                            style={fieldErrors.expertise ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                          />
                          {fieldErrors.expertise && (
                            <div id="expertise-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                              <AlertCircle size={13} />
                              {fieldErrors.expertise}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {fields.membershipType === "student" && (
                      <>
                        <div className="efsw-signin__row">
                          <div className="efsw-signin__field">
                            <label htmlFor="st-uni">University</label>
                            <input
                              id="st-uni"
                              value={fields.university}
                              onChange={(e) => update("university", e.target.value)}
                              aria-invalid={!!fieldErrors.university}
                              aria-describedby={fieldErrors.university ? "university-error" : undefined}
                              style={fieldErrors.university ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                            />
                            {fieldErrors.university && (
                              <div id="university-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                                <AlertCircle size={13} />
                                {fieldErrors.university}
                              </div>
                            )}
                          </div>
                          <div className="efsw-signin__field">
                            <label htmlFor="st-fac">Faculty</label>
                            <input
                              id="st-fac"
                              value={fields.faculty}
                              onChange={(e) => update("faculty", e.target.value)}
                              aria-invalid={!!fieldErrors.faculty}
                              aria-describedby={fieldErrors.faculty ? "faculty-error" : undefined}
                              style={fieldErrors.faculty ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                            />
                            {fieldErrors.faculty && (
                              <div id="faculty-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                                <AlertCircle size={13} />
                                {fieldErrors.faculty}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="efsw-signin__field">
                          <label htmlFor="st-degree">Degree level</label>
                          <select
                            id="st-degree"
                            value={fields.degree}
                            onChange={(e) => update("degree", e.target.value)}
                            aria-invalid={!!fieldErrors.degree}
                            aria-describedby={fieldErrors.degree ? "degree-error" : undefined}
                            style={fieldErrors.degree ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                          >
                            <option value="bachelor">Bachelor&apos;s</option>
                            <option value="master">Master&apos;s</option>
                            <option value="doctorate">Doctorate</option>
                          </select>
                          {fieldErrors.degree && (
                            <div id="degree-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                              <AlertCircle size={13} />
                              {fieldErrors.degree}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {fields.membershipType === "institutional" && (
                      <>
                        <div className="efsw-signin__row">
                          <div className="efsw-signin__field">
                            <label htmlFor="in-name">Organization name</label>
                            <input
                              id="in-name"
                              value={fields.organization}
                              onChange={(e) => update("organization", e.target.value)}
                              aria-invalid={!!fieldErrors.organization}
                              aria-describedby={fieldErrors.organization ? "organization-error-inst" : undefined}
                              style={fieldErrors.organization ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                            />
                            {fieldErrors.organization && (
                              <div id="organization-error-inst" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                                <AlertCircle size={13} />
                                {fieldErrors.organization}
                              </div>
                            )}
                          </div>
                          <div className="efsw-signin__field">
                            <label htmlFor="in-type">Organization type</label>
                            <select
                              id="in-type"
                              value={fields.organizationType}
                              onChange={(e) => update("organizationType", e.target.value)}
                              aria-invalid={!!fieldErrors.organizationType}
                              aria-describedby={fieldErrors.organizationType ? "organizationType-error" : undefined}
                              style={fieldErrors.organizationType ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                            >
                              <option value="ngo">NGO</option>
                              <option value="university">University</option>
                              <option value="government">Public body</option>
                              <option value="social-enterprise">Social enterprise</option>
                            </select>
                            {fieldErrors.organizationType && (
                              <div id="organizationType-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                                <AlertCircle size={13} />
                                {fieldErrors.organizationType}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="efsw-signin__field">
                          <label htmlFor="in-contact">Contact position</label>
                          <input
                            id="in-contact"
                            value={fields.contactPosition}
                            onChange={(e) => update("contactPosition", e.target.value)}
                            aria-invalid={!!fieldErrors.contactPosition}
                            aria-describedby={fieldErrors.contactPosition ? "contactPosition-error" : undefined}
                            style={fieldErrors.contactPosition ? { borderColor: "var(--efsw-danger, #e74c3c)" } : {}}
                          />
                          {fieldErrors.contactPosition && (
                            <div id="contactPosition-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem", color: "var(--efsw-danger, #e74c3c)", fontSize: "0.8rem", fontWeight: 600 }}>
                              <AlertCircle size={13} />
                              {fieldErrors.contactPosition}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.85rem" }}>
                      <button type="button" className="efsw-text-link" onClick={() => setStep(1)} style={{ background: "none", border: 0, color: "var(--efsw-ink-soft)", fontSize: "0.82rem", fontWeight: 650, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        <ArrowLeft size={14} /> Back
                      </button>
                      <button type="submit" className="efsw-signin__submit" disabled={submitting} style={{ width: "auto", padding: "0 1.5rem", flex: 1 }}>
                        {submitting ? "Creating profile…" : "Create profile"} <ArrowUpRight size={16} />
                      </button>
                    </div>
                  </form>
                )}

                <div className="efsw-signin__card-footer">
                  <span>Already a member?</span>
                  <a href="/member/login">Sign in <ArrowUpRight size={14} /></a>
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
          ? "Secure sign-up · Stored in the EFSW member database"
          : "Prototype mode · Registration saved in this browser"}
      </p>
    </main>
  );
}