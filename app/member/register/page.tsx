"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Eye, EyeOff, UserPlus } from "lucide-react";
import { registerMember, MembershipType } from "@/lib/member-auth";

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

  const update = (name: keyof typeof baseFields, value: string) => setFields((current) => ({ ...current, [name]: value }));

  const continueToDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!fields.fullName.trim() || !fields.email.trim() || !fields.country.trim()) return setError("Please complete all required fields.");
    if (fields.password.length < 8) return setError("Password must be at least 8 characters.");
    if (fields.password !== fields.confirmPassword) return setError("Passwords do not match.");
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
    <main className="efsw-auth-page">
      <a href="/" className="efsw-brand" aria-label="EFSW home"><span className="efsw-brand__mark">E</span><span>Eurasia Forum<br />for Social Workers</span></a>
      <section className="efsw-auth-card efsw-register-card" aria-labelledby="register-title">
        {complete ? (
          <div className="efsw-auth-success">
            <div className="efsw-auth-card__icon"><Check size={21} /></div>
            <h1>Welcome to<br /><span>the EFSW network.</span></h1>
            <p>Your profile was created in this browser and is now pending review by the team.</p>
            <div className="efsw-auth-card__actions"><a href="/member/profile" className="efsw-button efsw-button--dark">Open profile <ArrowUpRight size={17} /></a><a href="/" className="efsw-text-link"><ArrowLeft size={16} /> Back to home</a></div>
          </div>
        ) : (
          <>
            <div className="efsw-auth-card__icon"><UserPlus size={21} /></div>
            <h1 id="register-title">Create your<br /><span>EFSW profile.</span></h1>
            <p>Build a member profile and connect with social work professionals across the region.</p>
            <div className="efsw-form-steps" aria-label={`Step ${step} of 2`}><span className="is-active">01 Account</span><i /><span className={step === 2 ? "is-active" : ""}>02 Professional</span></div>
            {error && <div className="efsw-form-error" role="alert">{error}</div>}
            {step === 1 ? (
              <form onSubmit={continueToDetails} className="efsw-member-form">
                <div className="efsw-form-grid"><label>Full name *<input required value={fields.fullName} onChange={(event) => update("fullName", event.target.value)} autoComplete="name" /></label><label>Country of residence *<input required value={fields.country} onChange={(event) => update("country", event.target.value)} autoComplete="country-name" /></label></div>
                <label>Email address *<input required type="email" value={fields.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" /></label>
                <div className="efsw-password-field"><label>Password *<input required type={showPassword ? "text" : "password"} value={fields.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" /></label><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
                <div className="efsw-password-field"><label>Confirm password *<input required type={showConfirm ? "text" : "password"} value={fields.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} autoComplete="new-password" /></label><button type="button" onClick={() => setShowConfirm((value) => !value)} aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"}>{showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
                <button type="submit" className="efsw-button efsw-button--dark">Continue <ArrowUpRight size={17} /></button>
              </form>
            ) : (
              <form onSubmit={submit} className="efsw-member-form">
                <fieldset><legend>Membership type *</legend><div className="efsw-membership-options">{[["professional", "Professional", "Social workers, academics, and practitioners"], ["student", "Student", "Students in social work or a related field"], ["institutional", "Institutional", "Universities, NGOs, public bodies, and partners"]].map(([value, title, description]) => <label key={value} className={fields.membershipType === value ? "is-selected" : ""}><input type="radio" name="membershipType" value={value} checked={fields.membershipType === value} onChange={(event) => update("membershipType", event.target.value)} /><span><strong>{title}</strong><small>{description}</small></span></label>)}</div></fieldset>
                {fields.membershipType === "professional" && <div className="efsw-form-grid"><label>Organization<input value={fields.organization} onChange={(event) => update("organization", event.target.value)} /></label><label>Position<input value={fields.position} onChange={(event) => update("position", event.target.value)} /></label></div>}
                {fields.membershipType === "professional" && <label>Area of expertise<input value={fields.expertise} onChange={(event) => update("expertise", event.target.value)} placeholder="e.g. child and family welfare" /></label>}
                {fields.membershipType === "student" && <div className="efsw-form-grid"><label>University / institution<input value={fields.university} onChange={(event) => update("university", event.target.value)} /></label><label>Faculty / field<input value={fields.faculty} onChange={(event) => update("faculty", event.target.value)} /></label></div>}
                {fields.membershipType === "student" && <label>Degree level<select value={fields.degree} onChange={(event) => update("degree", event.target.value)}><option value="bachelor">Bachelor&apos;s</option><option value="master">Master&apos;s</option><option value="doctorate">Doctorate</option></select></label>}
                {fields.membershipType === "institutional" && <div className="efsw-form-grid"><label>Organization name<input value={fields.organization} onChange={(event) => update("organization", event.target.value)} /></label><label>Organization type<select value={fields.organizationType} onChange={(event) => update("organizationType", event.target.value)}><option value="ngo">NGO</option><option value="university">University</option><option value="government">Public body</option><option value="social-enterprise">Social enterprise</option></select></label></div>}
                {fields.membershipType === "institutional" && <label>Contact position<input value={fields.contactPosition} onChange={(event) => update("contactPosition", event.target.value)} /></label>}
                <div className="efsw-auth-card__actions"><button type="button" className="efsw-text-link" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button><button type="submit" className="efsw-button efsw-button--dark" disabled={submitting}>{submitting ? "Creating profile..." : "Create profile"} <ArrowUpRight size={17} /></button></div>
              </form>
            )}
            <div className="efsw-auth-card__footer">Already a member? <a href="/member/login">Sign in <ArrowUpRight size={15} /></a></div>
          </>
        )}
      </section>
      <p className="efsw-auth-prototype-note">Prototype mode · Local browser session for this preview</p>
    </main>
  );
}
