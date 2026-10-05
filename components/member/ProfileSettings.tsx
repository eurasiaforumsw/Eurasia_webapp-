import { LogOut, Trash2, ShieldCheck, AlertCircle } from "lucide-react";
import { MemberProfile } from "@/lib/member-auth";
import { useState } from "react";

interface ProfileSettingsProps {
  member: MemberProfile;
  onLogout: () => void;
}

export function ProfileSettings({ member, onLogout }: ProfileSettingsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = () => {
    // In a real app, this would call an API endpoint
    alert("Account deletion would be processed here. This is a prototype.");
    setShowDeleteConfirm(false);
  };

  return (
    <div className="efsw-profile__settings">
      {/* Account Info */}
      <section className="efsw-profile__card">
        <header className="efsw-profile__card-head">
          <div className="efsw-profile__card-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2>Account</h2>
            <p>Your membership and authentication details.</p>
          </div>
        </header>

        <div className="efsw-profile__display">
          <dl>
            <dt>Email</dt>
            <dd>{member.email}</dd>
            <dt>Member ID</dt>
            <dd>
              <code style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>
                {member.id}
              </code>
            </dd>
            <dt>Joined</dt>
            <dd>
              {new Date(member.joinedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </dd>
            <dt>Status</dt>
            <dd>
              <span className="efsw-profile__badge efsw-profile__badge--status">
                {member.status}
              </span>
            </dd>
          </dl>
        </div>

        <div className="efsw-profile__card-actions">
          <button
            type="button"
            onClick={onLogout}
            className="efsw-profile__btn efsw-profile__btn--secondary"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="efsw-profile__card efsw-profile__card--danger">
        <header className="efsw-profile__card-head">
          <div className="efsw-profile__card-icon">
            <AlertCircle size={18} />
          </div>
          <div>
            <h2>Danger zone</h2>
            <p>Irreversible actions that affect your account.</p>
          </div>
        </header>

        <div className="efsw-profile__display">
          <p>
            <strong>Delete your account</strong>
          </p>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--efsw-ink-soft)" }}>
            Once you delete your account, there is no going back. Your profile, connections,
            and all associated data will be permanently removed.
          </p>
        </div>

        {!showDeleteConfirm ? (
          <div className="efsw-profile__card-actions">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="efsw-profile__btn efsw-profile__btn--danger"
            >
              <Trash2 size={14} /> Delete account
            </button>
          </div>
        ) : (
          <div className="efsw-profile__delete-confirm">
            <div className="efsw-profile__alert efsw-profile__alert--error">
              <AlertCircle size={14} />
              <div>
                <strong>Are you absolutely sure?</strong>
                <p>This action cannot be undone. Type DELETE to confirm.</p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Type DELETE"
              id="delete-confirm-input"
              style={{
                marginTop: "0.75rem",
                padding: "0.65rem",
                border: "1px solid var(--efsw-danger, #e74c3c)",
                borderRadius: "0.5rem",
                width: "100%",
              }}
            />
            <div className="efsw-profile__card-actions" style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="efsw-profile__btn efsw-profile__btn--secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById("delete-confirm-input") as HTMLInputElement;
                  if (input?.value === "DELETE") {
                    handleDeleteAccount();
                  } else {
                    alert('Please type "DELETE" to confirm');
                  }
                }}
                className="efsw-profile__btn efsw-profile__btn--danger"
              >
                <Trash2 size={14} /> Delete my account permanently
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
