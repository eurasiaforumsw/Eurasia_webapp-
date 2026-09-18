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
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Info */}
        <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold font-display text-text-primary flex items-center gap-2">
              <Building size={18} className="text-teal" />
              Organisation and contact details
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Details shown in official documents and the website footer.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Organisation name
              </label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, organizationName: e.target.value }))
                }
                className="w-full rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Primary contact email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
                }
                className="w-full rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Default locale
              </label>
              <select
                value={formData.defaultLocale}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    defaultLocale: e.target.value as "th" | "en" | "ko",
                  }))
                }
                className="w-full rounded-xl border border-surface-subtle bg-surface-base px-4 py-2.5 text-xs text-text-primary focus:border-teal focus:outline-none"
              >
                <option value="th">Thai</option>
                <option value="en">English (US)</option>
                <option value="ko">한국어 (Korean)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications & Automation */}
        <div className="rounded-2xl border border-surface-subtle bg-surface-raised p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold font-display text-text-primary flex items-center gap-2">
              <Bell size={18} className="text-teal" />
              Notifications and review
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Configure notifications when new members register.
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-surface-subtle bg-surface-base">
            <div>
              <div className="text-xs font-bold text-text-primary">
                Notify when a new application arrives
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                Show a badge in the admin navigation for applications awaiting review
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  reviewNotifications: !prev.reviewNotifications,
                }))
              }
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                formData.reviewNotifications ? "bg-teal" : "bg-surface-subtle"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                  formData.reviewNotifications ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between border-t border-surface-subtle pt-5">
          {savedSuccess ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 size={16} />
              <span>Settings saved</span>
            </div>
          ) : (
            <span className="text-xs text-text-muted">
              Changes take effect immediately.
            </span>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal/20 hover:bg-teal-vivid transition-all"
          >
            <Save size={15} />
            <span>Save settings</span>
          </button>
        </div>
      </form>
    </div>
  );
});
