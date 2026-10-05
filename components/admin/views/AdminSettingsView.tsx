"use client";

import { FormEvent, memo, useState } from "react";
import {
  Settings,
  Building,
  Mail,
  Languages,
  Bell,
  Save,
  CheckCircle2,
  Trash2,
  Database,
} from "lucide-react";
import { AdminSettings } from "@/lib/admin-data";

interface AdminSettingsViewProps {
  settings: AdminSettings;
  onSaveSettings: (settings: AdminSettings) => void;
  onClearCache?: () => void;
}

export const AdminSettingsView = memo(function AdminSettingsView({
  settings,
  onSaveSettings,
  onClearCache,
}: AdminSettingsViewProps) {
  const [formData, setFormData] = useState<AdminSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: "44rem" }}>
      <form onSubmit={handleSubmit} className="efsw-admin-settings-form">
        {/* Organization Info */}
        <fieldset>
          <legend className="efsw-admin-eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <Building size={15} style={{ color: "var(--admin-green)" }} />
            Organisation and contact details
          </legend>
          <p style={{ margin: "0.35rem 0 0", color: "var(--admin-muted)", fontSize: "0.74rem", lineHeight: 1.5 }}>
            Details shown in official documents and the website footer.
          </p>

          <div style={{ display: "grid", gap: "0.8rem", marginTop: "1.2rem" }}>
            <label>
              Organisation name
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, organizationName: e.target.value }))
                }
              />
            </label>

            <label>
              Primary contact email
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
                }
              />
            </label>

            <label>
              Default locale
              <select
                value={formData.defaultLocale}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultLocale: e.target.value as "th" | "en" | "ko",
                  }))
                }
              >
                <option value="th">Thai</option>
                <option value="en">English (US)</option>
                <option value="ko">한국어 (Korean)</option>
              </select>
            </label>
          </div>
        </fieldset>

        {/* Notifications & Automation */}
        <fieldset>
          <legend className="efsw-admin-eyebrow" style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <Bell size={15} style={{ color: "var(--admin-green)" }} />
            Notifications and review
          </legend>
          <p style={{ margin: "0.35rem 0 0", color: "var(--admin-muted)", fontSize: "0.74rem", lineHeight: 1.5 }}>
            Configure notifications when new members register.
          </p>

          <label className="efsw-admin-switch-row" htmlFor="efsw-admin-toggle-notifications">
            <span>
              <strong>Notify when a new application arrives</strong>
              <small>Show a badge in the admin navigation for applications awaiting review</small>
            </span>
            <input
              id="efsw-admin-toggle-notifications"
              type="checkbox"
              checked={formData.reviewNotifications}
              onChange={() =>
                setFormData((prev) => ({
                  ...prev,
                  reviewNotifications: !prev.reviewNotifications,
                }))
              }
            />
          </label>
        </fieldset>

        {/* Save Bar */}
        <div className="efsw-admin-settings-actions" style={{ justifyContent: "space-between", paddingTop: "1.2rem", borderTop: "1px solid var(--admin-line)" }}>
          {savedSuccess ? (
            <div className="efsw-admin-status is-active">
              <CheckCircle2 size={14} />
              <span>Settings saved</span>
            </div>
          ) : (
            <p>Changes take effect immediately.</p>
          )}

          <button
            type="submit"
            className="efsw-admin-primary"
          >
            <Save size={15} />
            <span>Save settings</span>
          </button>
        </div>
      </form>
    </div>
  );
});
