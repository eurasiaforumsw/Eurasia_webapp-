"use client";

import { memo, useState } from "react";
import {
  X,
  UserCheck,
  Building2,
  Globe2,
  CalendarDays,
  Check,
  Ban,
  Trash2,
  Save,
  MessageSquare,
  Lock,
  Hash,
  Mail,
} from "lucide-react";
import { AdminMember } from "@/lib/admin-data";

interface MemberDetailDrawerProps {
  member: AdminMember | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: AdminMember["status"], reviewNote: string) => void;
  onDeleteMember: (id: string) => void;
}

const STATUS_LABELS: Record<AdminMember["status"], string> = {
  active: "Approved · full access",
  pending: "Pending review",
  suspended: "Suspended · access paused",
};

const STATUS_CLASS: Record<AdminMember["status"], string> = {
  active: "efsw-admin-status is-active",
  pending: "efsw-admin-status is-pending",
  suspended: "efsw-admin-status is-suspended",
};

const MEMBERSHIP_LABELS: Record<AdminMember["membershipType"], string> = {
  professional: "Professional member",
  student: "Student member",
  institutional: "Institutional member",
};

const EDUCATION_LABELS: Record<NonNullable<AdminMember["educationLevel"]>, string> = {
  "high-school": "High school",
  diploma: "Diploma",
  bachelor: "Bachelor's degree",
  master: "Master's degree",
  doctorate: "Doctorate",
};

export const MemberDetailDrawer = memo(function MemberDetailDrawer({
  member,
  onClose,
  onUpdateStatus,
  onDeleteMember,
}: MemberDetailDrawerProps) {
  if (!member) return null;

  const [note, setNote] = useState(member.reviewNote || "");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const handleSaveNote = () => {
    setIsSavingNote(true);
    onUpdateStatus(member.id, member.status, note);
    setTimeout(() => setIsSavingNote(false), 1000);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso));
    } catch {
      return "—";
    }
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(iso),
      );
    } catch {
      return "—";
    }
  };

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "·";

  return (
    <div className="efsw-admin-modal-layer">
      <aside className="efsw-admin-drawer" aria-label={`Profile of ${member.fullName}`}>
        <header>
          <div>
            <span className="efsw-admin-eyebrow">Member profile</span>
            <h2>{member.fullName}</h2>
          </div>
          <button
            type="button"
            className="efsw-admin-icon-button"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </header>

        <div className={STATUS_CLASS[member.status]}>
          <i aria-hidden />
          {STATUS_LABELS[member.status]}
        </div>

        {/* Identity card */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0, 1fr)",
            gap: "1rem",
            margin: "1.5rem 0 0",
            padding: "1rem 1.15rem",
            border: "1px solid var(--admin-line)",
            background: "var(--admin-surface-deep)",
          }}
        >
          <div
            style={{
              width: "3.6rem",
              height: "3.6rem",
              display: "grid",
              placeItems: "center",
              borderRadius: "999px",
              background: "var(--admin-green)",
              color: "var(--admin-surface)",
              fontSize: "1.05rem",
              fontWeight: 800,
            }}
          >
            {initials(member.fullName)}
          </div>
          <div style={{ display: "grid", gap: "0.3rem", minWidth: 0 }}>
            <strong style={{ fontSize: "0.95rem" }}>{member.fullName}</strong>
            <span
              style={{
                color: "var(--admin-muted)",
                fontSize: "0.72rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Mail size={12} /> {member.email}
            </span>
            <span
              style={{
                color: "var(--admin-muted)",
                fontSize: "0.7rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Hash size={12} /> ID: {member.id}
            </span>
          </div>
        </div>

        {/* Membership + credentials */}
        <dl className="efsw-admin-detail-list">
          <div>
            <dt>Membership</dt>
            <dd>{MEMBERSHIP_LABELS[member.membershipType]}</dd>
          </div>
          <div>
            <dt>Country</dt>
            <dd>
              <Globe2 size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {member.country || "—"}
              {member.city && ` · ${member.city}`}
            </dd>
          </div>
          {member.organization && (
            <div>
              <dt>Organisation</dt>
              <dd>
                <Building2 size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />
                {member.organization}
              </dd>
            </div>
          )}
          {member.university && !member.organization && (
            <div>
              <dt>University</dt>
              <dd>{member.university}</dd>
            </div>
          )}
          {member.position && (
            <div>
              <dt>Position</dt>
              <dd>
                <UserCheck size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />
                {member.position}
              </dd>
            </div>
          )}
          {member.expertise && (
            <div>
              <dt>Expertise</dt>
              <dd>{member.expertise}</dd>
            </div>
          )}
          {member.educationLevel && (
            <div>
              <dt>Education</dt>
              <dd>
                {EDUCATION_LABELS[member.educationLevel]}
                {member.degree && ` · ${member.degree}`}
              </dd>
            </div>
          )}
          {member.license && (
            <div>
              <dt>License</dt>
              <dd>{member.license}</dd>
            </div>
          )}
          {member.experienceYears != null && member.experienceYears > 0 && (
            <div>
              <dt>Experience</dt>
              <dd>{member.experienceYears} year(s)</dd>
            </div>
          )}
          {member.targetGroups && member.targetGroups.length > 0 && (
            <div>
              <dt>Target groups</dt>
              <dd style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {member.targetGroups.map((group) => (
                  <span
                    key={group}
                    style={{
                      display: "inline-flex",
                      padding: "0.18rem 0.55rem",
                      border: "1px solid var(--admin-line)",
                      background: "var(--admin-green-soft)",
                      color: "var(--admin-green)",
                      fontSize: "0.66rem",
                      fontWeight: 700,
                    }}
                  >
                    #{group}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {member.bio && (
            <div>
              <dt>Bio</dt>
              <dd style={{ color: "var(--admin-ink-soft)", fontWeight: 500 }}>{member.bio}</dd>
            </div>
          )}
          <div>
            <dt>Joined</dt>
            <dd>
              <CalendarDays size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {formatDate(member.joinedAt)}
            </dd>
          </div>
        </dl>

        {/* Security + audit */}
        <section
          aria-label="Security and audit"
          style={{
            marginTop: "1.5rem",
            padding: "1rem 1.15rem",
            border: "1px solid var(--admin-line)",
            background: "var(--admin-surface)",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              marginBottom: "0.65rem",
            }}
          >
            <span className="efsw-admin-eyebrow">Security & audit</span>
            <span className="efsw-admin-password-badge">
              <Lock size={10} />
              Password protected
            </span>
          </header>
          <p
            style={{
              margin: 0,
              color: "var(--admin-muted)",
              fontSize: "0.72rem",
              lineHeight: 1.5,
            }}
          >
            Passwords are stored as one-way SHA-256 hashes. Admins can approve, suspend, or
            delete accounts — but cannot view or recover a member's password.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "0.6rem",
              marginTop: "0.9rem",
            }}
          >
            <div>
              <div
                style={{
                  color: "var(--admin-muted)",
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Registered
              </div>
              <div style={{ fontSize: "0.78rem" }}>{formatDateTime(member.joinedAt)}</div>
            </div>
            <div>
              <div
                style={{
                  color: "var(--admin-muted)",
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Last reviewed
              </div>
              <div style={{ fontSize: "0.78rem" }}>{formatDateTime(member.reviewedAt)}</div>
            </div>
          </div>
        </section>

        {/* Review note */}
        <section className="efsw-admin-drawer__note" style={{ marginTop: "1.5rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <MessageSquare size={13} /> Admin review note
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Approval rationale, follow-up needed, or context for the next admin…"
          />
          <div className="efsw-admin-note-actions">
            <small>Notes are visible to other admins in the activity log.</small>
            <button
              type="button"
              className="efsw-admin-text-action"
              onClick={handleSaveNote}
              disabled={isSavingNote}
            >
              <Save size={13} /> {isSavingNote ? "Saved" : "Save note"}
            </button>
          </div>
        </section>

        {/* Action footer */}
        <div className="efsw-admin-drawer__actions" style={{ marginTop: "1.5rem" }}>
          {member.status !== "active" ? (
            <button
              type="button"
              onClick={() => onUpdateStatus(member.id, "active", note)}
              className="efsw-admin-text-action"
              style={{ color: "var(--admin-green)", fontSize: "0.78rem" }}
            >
              <Check size={14} /> Approve member
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onUpdateStatus(member.id, "suspended", note)}
              className="efsw-admin-text-action"
              style={{ color: "var(--admin-warning)", fontSize: "0.78rem" }}
            >
              <Ban size={14} /> Suspend account
            </button>
          )}
          <button
            type="button"
            onClick={() => onDeleteMember(member.id)}
            className="efsw-admin-text-action"
            style={{ color: "var(--admin-danger)", marginLeft: "auto", fontSize: "0.78rem" }}
          >
            <Trash2 size={14} /> Delete record
          </button>
        </div>
      </aside>
    </div>
  );
});