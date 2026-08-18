"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, Check, LogOut, Save, UserRound, CreditCard, FileText, Mail, Settings } from "lucide-react";
import { getSessionMember, logoutMember, MemberProfile, updateMember } from "@/lib/member-auth";

const typeLabels = { professional: "Professional member", student: "Student member", institutional: "Institutional member" };
const statusLabels: Record<MemberProfile["status"], string> = { pending: "รอตรวจสอบ", active: "สมาชิกใช้งานอยู่", suspended: "ระงับการใช้งานชั่วคราว" };

const quickActions = [
  { icon: CreditCard, label: "Membership Card", description: "View digital card", href: "#card" },
  { icon: FileText, label: "Documents", description: "Certificates & receipts", href: "#documents" },
  { icon: Mail, label: "Communications", description: "Email preferences", href: "#communications" },
  { icon: Settings, label: "Account Settings", description: "Password & security", href: "#settings" },
];

export default function MemberProfilePage() {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "edit">("overview");
  const [draft, setDraft] = useState({ fullName: "", country: "", organization: "", position: "", expertise: "", university: "", faculty: "", contactPosition: "", bio: "" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    const current = getSessionMember();
    if (!current) { window.location.href = "/member/login"; return; }
    setMember(current);
    setDraft({ fullName: current.fullName, country: current.country, organization: current.organization, position: current.position, expertise: current.expertise, university: current.university, faculty: current.faculty, contactPosition: current.contactPosition, bio: current.bio });
  }, []);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setStatus("saving");
    try {
      const updated = await updateMember(draft);
      setMember(updated);
      setStatus("success");
      setActiveTab("overview");
      setTimeout(() => setStatus(""), 2000);
    } catch (err) {
      setStatus("error");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const handleLogout = () => {
    logoutMember();
    window.location.href = "/member/login";
  };

  if (!member) return <div className="efsw-auth-page"><p>Loading profile...</p></div>;

  return (
    <main className="efsw-member-profile-page">
      <header className="efsw-member-profile-header">
        <div className="efsw-member-profile-header__inner">
          <a href="/" className="efsw-member-profile-back">← Home</a>
          <h1><UserRound size={20} /> Member Profile</h1>
          <button type="button" onClick={handleLogout} className="efsw-member-profile-logout">
            <LogOut size={16} /> Log out
          </button>
        </div>
      </header>

      <div className="efsw-member-profile-container">
        {/* Sidebar with member card */}
        <aside className="efsw-member-profile-sidebar">
          <div className="efsw-member-card-mini">
            <div className="efsw-member-card-mini__avatar">
              {member.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="efsw-member-card-mini__info">
              <h2>{member.fullName}</h2>
              <p>{member.email}</p>
              <span className={`efsw-member-status efsw-member-status--${member.status}`}>
                {statusLabels[member.status]}
              </span>
            </div>
          </div>

          <div className="efsw-member-profile-meta">
            <div className="efsw-member-profile-meta__item">
              <span className="label">Membership Type</span>
              <span className="value">{typeLabels[member.membershipType]}</span>
            </div>
            <div className="efsw-member-profile-meta__item">
              <span className="label">Member Since</span>
              <span className="value">{new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="efsw-member-profile-meta__item">
              <span className="label">Country</span>
              <span className="value">{member.country}</span>
            </div>
          </div>

          <div className="efsw-member-quick-actions">
            <h3>Quick Actions</h3>
            {quickActions.map((action, i) => (
              <a key={i} href={action.href} className="efsw-member-quick-action">
                <action.icon size={18} />
                <div>
                  <strong>{action.label}</strong>
                  <span>{action.description}</span>
                </div>
                <ArrowUpRight size={14} />
              </a>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <section className="efsw-member-profile-main">
          <nav className="efsw-member-profile-tabs">
            <button
              type="button"
              className={activeTab === "overview" ? "active" : ""}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              className={activeTab === "edit" ? "active" : ""}
              onClick={() => setActiveTab("edit")}
            >
              Edit Profile
            </button>
          </nav>

          {activeTab === "overview" && (
            <div className="efsw-member-profile-overview">
              <div className="efsw-member-profile-section">
                <h3>Professional Information</h3>
                <dl>
                  <div><dt>Organization</dt><dd>{member.organization || "—"}</dd></div>
                  <div><dt>Position</dt><dd>{member.position || "—"}</dd></div>
                  <div><dt>Expertise</dt><dd>{member.expertise || "—"}</dd></div>
                </dl>
              </div>

              {member.membershipType === "student" && (
                <div className="efsw-member-profile-section">
                  <h3>Academic Information</h3>
                  <dl>
                    <div><dt>University</dt><dd>{member.university || "—"}</dd></div>
                    <div><dt>Faculty</dt><dd>{member.faculty || "—"}</dd></div>
                  </dl>
                </div>
              )}

              {member.membershipType === "institutional" && (
                <div className="efsw-member-profile-section">
                  <h3>Institutional Contact</h3>
                  <dl>
                    <div><dt>Contact Position</dt><dd>{member.contactPosition || "—"}</dd></div>
                  </dl>
                </div>
              )}

              {member.bio && (
                <div className="efsw-member-profile-section">
                  <h3>Bio</h3>
                  <p>{member.bio}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "edit" && (
            <form onSubmit={handleUpdate} className="efsw-member-profile-edit">
              <div className="efsw-form-field">
                <label htmlFor="fullName">Full Name *</label>
                <input id="fullName" type="text" value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} required />
              </div>

              <div className="efsw-form-field">
                <label htmlFor="country">Country *</label>
                <input id="country" type="text" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} required />
              </div>

              <div className="efsw-form-field">
                <label htmlFor="organization">Organization</label>
                <input id="organization" type="text" value={draft.organization} onChange={(e) => setDraft({ ...draft, organization: e.target.value })} />
              </div>

              <div className="efsw-form-field">
                <label htmlFor="position">Position</label>
                <input id="position" type="text" value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value })} />
              </div>

              <div className="efsw-form-field">
                <label htmlFor="expertise">Area of Expertise</label>
                <input id="expertise" type="text" value={draft.expertise} onChange={(e) => setDraft({ ...draft, expertise: e.target.value })} />
              </div>

              {member.membershipType === "student" && (
                <>
                  <div className="efsw-form-field">
                    <label htmlFor="university">University</label>
                    <input id="university" type="text" value={draft.university} onChange={(e) => setDraft({ ...draft, university: e.target.value })} />
                  </div>
                  <div className="efsw-form-field">
                    <label htmlFor="faculty">Faculty</label>
                    <input id="faculty" type="text" value={draft.faculty} onChange={(e) => setDraft({ ...draft, faculty: e.target.value })} />
                  </div>
                </>
              )}

              {member.membershipType === "institutional" && (
                <div className="efsw-form-field">
                  <label htmlFor="contactPosition">Contact Position</label>
                  <input id="contactPosition" type="text" value={draft.contactPosition} onChange={(e) => setDraft({ ...draft, contactPosition: e.target.value })} />
                </div>
              )}

              <div className="efsw-form-field">
                <label htmlFor="bio">Bio (optional)</label>
                <textarea id="bio" rows={4} value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} placeholder="Tell us about yourself..." />
              </div>

              <div className="efsw-form-actions">
                <button type="submit" className="efsw-button efsw-button--dark" disabled={status === "saving"}>
                  {status === "saving" ? "Saving..." : <><Save size={16} /> Save Changes</>}
                </button>
                {status === "success" && <span className="efsw-form-success"><Check size={16} /> Saved successfully</span>}
                {status === "error" && <span className="efsw-form-error">Failed to save changes</span>}
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
