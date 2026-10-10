"use client";

import { useState, useEffect } from "react";
import { Save, Calendar, Users, Mail, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface RegistrationSettings {
  id?: string;
  event_id: string;
  is_enabled: boolean;
  opens_at: string | null;
  closes_at: string | null;
  max_attendees: number | null;
  confirmation_email_template: string;
  current_attendee_count?: number;
}

interface RegistrationSettingsProps {
  eventId: string;
  onClose?: () => void;
}

const DEFAULT_EMAIL_TEMPLATE = `Dear {name},

Thank you for registering for {event_title}.

Your registration has been confirmed. We look forward to seeing you at the event.

Registration Details:
- Event: {event_title}
- Date: {event_date}
- Registration ID: {registration_id}

If you have any questions, please contact us.

Best regards,
Eurasia Forum for Social Work Education Team`;

export default function RegistrationSettings({ eventId, onClose }: RegistrationSettingsProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<RegistrationSettings>({
    event_id: eventId,
    is_enabled: false,
    opens_at: null,
    closes_at: null,
    max_attendees: null,
    confirmation_email_template: DEFAULT_EMAIL_TEMPLATE,
    current_attendee_count: 0,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [eventId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/registration-settings`);

      if (response.ok) {
        const data = await response.json();
        setSettings({
          ...data,
          confirmation_email_template: data.confirmation_email_template || DEFAULT_EMAIL_TEMPLATE,
        });
      } else if (response.status === 404) {
        // No settings yet, use defaults
        setSettings(prev => ({ ...prev, event_id: eventId }));
      }
    } catch (error) {
      console.error("Failed to fetch registration settings:", error);
      addToast({
        type: "error",
        title: "Failed to load settings",
        description: "Could not fetch registration settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateSettings = (): boolean => {
    setValidationError(null);

    if (settings.is_enabled) {
      if (settings.opens_at && settings.closes_at) {
        const opensDate = new Date(settings.opens_at);
        const closesDate = new Date(settings.closes_at);

        if (closesDate <= opensDate) {
          setValidationError("Closing date must be after opening date");
          return false;
        }
      }

      if (settings.max_attendees !== null && settings.max_attendees < 1) {
        setValidationError("Maximum attendees must be at least 1");
        return false;
      }

      if (settings.max_attendees !== null &&
          settings.current_attendee_count &&
          settings.max_attendees < settings.current_attendee_count) {
        setValidationError(
          `Maximum attendees cannot be less than current registrations (${settings.current_attendee_count})`
        );
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateSettings()) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/events/${eventId}/registration-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      const savedSettings = await response.json();
      setSettings(savedSettings);

      addToast({
        type: "success",
        title: "Settings saved",
        description: "Registration settings updated successfully",
      });

      if (onClose) {
        setTimeout(onClose, 1000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      addToast({
        type: "error",
        title: "Save failed",
        description: "Could not save registration settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDateTimeLocal = (isoString: string | null): string => {
    if (!isoString) return "";
    // Convert ISO to datetime-local format (YYYY-MM-DDTHH:mm)
    return isoString.slice(0, 16);
  };

  const handleDateTimeChange = (field: "opens_at" | "closes_at", value: string) => {
    // Convert datetime-local to ISO string
    const isoString = value ? new Date(value).toISOString() : null;
    setSettings(prev => ({ ...prev, [field]: isoString }));
    setValidationError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-raised border-t-teal" />
          <p className="text-sm text-text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-raised">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-teal-vivid shadow-lg shadow-teal/20">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Registration Settings</h2>
            <p className="text-sm text-text-muted">Configure event registration options</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-3xl space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="rounded-xl border border-surface-raised bg-surface-base p-5">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={settings.is_enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, is_enabled: e.target.checked }))}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-surface-raised peer-checked:bg-teal transition-colors" />
                <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-sm" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-text-primary group-hover:text-teal transition-colors">
                  Enable Registration
                </div>
                <p className="text-sm text-text-muted mt-1">
                  Allow users to register for this event. When disabled, the registration form will not be accessible.
                </p>
              </div>
            </label>
          </div>

          {/* Current Attendee Count */}
          {settings.current_attendee_count !== undefined && settings.current_attendee_count > 0 && (
            <div className="rounded-xl border border-surface-raised bg-surface-base p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10">
                  <Users className="h-5 w-5 text-teal" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-primary">
                    {settings.current_attendee_count}
                  </div>
                  <div className="text-sm text-text-muted">Current registrations</div>
                </div>
              </div>
            </div>
          )}

          {/* Date/Time Settings */}
          <div className="rounded-xl border border-surface-raised bg-surface-base p-5 space-y-5">
            <div className="flex items-center gap-2 text-text-primary font-medium">
              <Calendar className="h-5 w-5 text-teal" />
              Registration Period
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opens At */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Opens At
                </label>
                <input
                  type="datetime-local"
                  value={formatDateTimeLocal(settings.opens_at)}
                  onChange={(e) => handleDateTimeChange("opens_at", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-raised border border-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all"
                />
                <p className="text-xs text-text-muted mt-1.5">
                  When registration opens (optional)
                </p>
              </div>

              {/* Closes At */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Closes At
                </label>
                <input
                  type="datetime-local"
                  value={formatDateTimeLocal(settings.closes_at)}
                  onChange={(e) => handleDateTimeChange("closes_at", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-raised border border-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all"
                />
                <p className="text-xs text-text-muted mt-1.5">
                  When registration closes (optional)
                </p>
              </div>
            </div>
          </div>

          {/* Max Attendees */}
          <div className="rounded-xl border border-surface-raised bg-surface-base p-5">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Maximum Attendees
            </label>
            <input
              type="number"
              min="1"
              value={settings.max_attendees ?? ""}
              onChange={(e) => {
                const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
                setSettings(prev => ({ ...prev, max_attendees: value }));
                setValidationError(null);
              }}
              placeholder="Unlimited"
              className="w-full px-4 py-2.5 rounded-lg bg-surface-raised border border-surface-raised text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all"
            />
            <p className="text-xs text-text-muted mt-1.5">
              Leave empty for unlimited registrations
            </p>
          </div>

          {/* Email Template */}
          <div className="rounded-xl border border-surface-raised bg-surface-base p-5">
            <div className="flex items-center gap-2 text-text-primary font-medium mb-2">
              <Mail className="h-5 w-5 text-teal" />
              Confirmation Email Template
            </div>
            <p className="text-sm text-text-muted mb-4">
              Customize the email sent to registrants. Available variables: {"{name}"}, {"{event_title}"}, {"{event_date}"}, {"{registration_id}"}
            </p>
            <textarea
              value={settings.confirmation_email_template}
              onChange={(e) => setSettings(prev => ({ ...prev, confirmation_email_template: e.target.value }))}
              rows={12}
              className="w-full px-4 py-3 rounded-lg bg-surface-raised border border-surface-raised text-text-primary placeholder:text-text-muted font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-red-400">Validation Error</div>
                <div className="text-sm text-red-300 mt-1">{validationError}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-surface-raised px-6 py-4 bg-surface-base">
        <div className="flex items-center justify-between max-w-3xl">
          <div className="text-xs text-text-muted">
            Changes will be saved to the database
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal to-teal-vivid text-white font-medium hover:shadow-lg hover:shadow-teal/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
