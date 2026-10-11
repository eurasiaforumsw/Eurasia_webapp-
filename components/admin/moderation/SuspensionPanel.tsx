"use client";

import {
  memo,
  useState,
  useCallback,
  useEffect,
  CSSProperties,
  FormEvent,
} from "react";
import {
  Ban,
  AlertCircle,
  Calendar,
  FileText,
  Loader,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface MemberInfo {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface Suspension {
  id: string;
  suspension_type: "temporary_24h" | "temporary_custom" | "permanent";
  reason_category: string;
  reason_details?: string;
  suspended_at: string;
  expires_at?: string;
  is_active: boolean;
  lifted_at?: string;
}

interface SuspensionPanelProps {
  memberId: string;
  memberName?: string;
  onSuccess?: () => void;
}

type SuspensionType = "temporary_24h" | "temporary_custom" | "permanent";
type ReasonCategory =
  | "Spam or flooding"
  | "Abusive language"
  | "Harassment"
  | "Inappropriate content"
  | "Terms of service violation"
  | "Other";

const styles = {
  container: {
    display: "grid",
    gap: "1.5rem",
  } as CSSProperties,
  card: {
    padding: "1.5rem",
    borderRadius: "0.75rem",
    background: "var(--admin-surface)",
    border: "1px solid var(--admin-line)",
  } as CSSProperties,
  cardTitle: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "var(--admin-ink)",
    margin: "0 0 1rem 0",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  } as CSSProperties,
  memberInfo: {
    display: "grid",
    gap: "0.75rem",
    padding: "1rem",
    background: "var(--admin-surface-deep)",
    borderRadius: "0.5rem",
    marginBottom: "1.5rem",
  } as CSSProperties,
  memberInfoRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: "1rem",
    alignItems: "start",
  } as CSSProperties,
  memberLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "var(--admin-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  } as CSSProperties,
  memberValue: {
    fontSize: "0.85rem",
    color: "var(--admin-ink)",
  } as CSSProperties,
  formSection: {
    display: "grid",
    gap: "1rem",
    marginBottom: "1.5rem",
  } as CSSProperties,
  formGroup: {
    display: "grid",
    gap: "0.5rem",
  } as CSSProperties,
  label: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--admin-ink)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  } as CSSProperties,
  radioGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  } as CSSProperties,
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    cursor: "pointer",
    fontSize: "0.8rem",
  } as CSSProperties,
  radioInput: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: "var(--admin-red)",
  } as CSSProperties,
  input: {
    border: "1px solid var(--admin-line)",
    borderRadius: "0.5rem",
    background: "var(--admin-surface-deep)",
    color: "var(--admin-ink)",
    padding: "0.6rem 0.75rem",
    fontSize: "0.8rem",
    fontFamily: "inherit",
  } as CSSProperties,
  select: {
    border: "1px solid var(--admin-line)",
    borderRadius: "0.5rem",
    background: "var(--admin-surface-deep)",
    color: "var(--admin-ink)",
    padding: "0.6rem 0.75rem",
    fontSize: "0.8rem",
    fontFamily: "inherit",
  } as CSSProperties,
  textarea: {
    border: "1px solid var(--admin-line)",
    borderRadius: "0.5rem",
    background: "var(--admin-surface-deep)",
    color: "var(--admin-ink)",
    padding: "0.6rem 0.75rem",
    fontSize: "0.8rem",
    fontFamily: "inherit",
    minHeight: "4rem",
    resize: "vertical" as const,
  } as CSSProperties,
  buttonGroup: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "flex-end",
    marginTop: "1.5rem",
  } as CSSProperties,
  buttonPrimary: {
    padding: "0.75rem 1.25rem",
    border: 0,
    borderRadius: "0.5rem",
    background: "var(--admin-red)",
    color: "white",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "background 150ms",
  } as CSSProperties,
  buttonSecondary: {
    padding: "0.75rem 1.25rem",
    border: "1px solid var(--admin-line)",
    borderRadius: "0.5rem",
    background: "var(--admin-surface)",
    color: "var(--admin-ink)",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 600,
  } as CSSProperties,
  suspensionHistory: {
    display: "grid",
    gap: "0.75rem",
  } as CSSProperties,
  suspensionItem: {
    padding: "1rem",
    background: "var(--admin-surface-deep)",
    borderRadius: "0.5rem",
    border: "1px solid var(--admin-line)",
  } as CSSProperties,
  suspensionHeader: {
    display: "flex",
    alignItems: "start",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "0.5rem",
  } as CSSProperties,
  suspensionBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.3rem 0.6rem",
    borderRadius: "0.25rem",
    fontSize: "0.65rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
  } as CSSProperties,
  badge24h: {
    background: "var(--admin-blue-soft)",
    color: "var(--admin-blue)",
  } as CSSProperties,
  badgeCustom: {
    background: "var(--admin-orange-soft)",
    color: "var(--admin-orange)",
  } as CSSProperties,
  badgePermanent: {
    background: "var(--admin-red-soft)",
    color: "var(--admin-red)",
  } as CSSProperties,
  suspensionMeta: {
    fontSize: "0.7rem",
    color: "var(--admin-muted)",
    display: "grid",
    gap: "0.3rem",
  } as CSSProperties,
  emptyState: {
    padding: "2rem 1rem",
    textAlign: "center",
    color: "var(--admin-muted)",
    fontSize: "0.8rem",
  } as CSSProperties,
  errorBox: {
    padding: "1rem",
    borderRadius: "0.5rem",
    background: "var(--admin-red-soft)",
    color: "var(--admin-red)",
    display: "flex",
    gap: "0.5rem",
    alignItems: "start",
    fontSize: "0.75rem",
    marginBottom: "1rem",
  } as CSSProperties,
  successBox: {
    padding: "1rem",
    borderRadius: "0.5rem",
    background: "var(--admin-green-soft)",
    color: "var(--admin-green)",
    display: "flex",
    gap: "0.5rem",
    alignItems: "start",
    fontSize: "0.75rem",
    marginBottom: "1rem",
  } as CSSProperties,
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "grid",
    placeItems: "center",
    padding: "1rem",
    background: "color-mix(in oklch, var(--admin-ink) 40%, transparent)",
    backdropFilter: "blur(4px)",
  } as CSSProperties,
  modalContent: {
    width: "100%",
    maxWidth: "32rem",
    padding: "1.5rem",
    borderRadius: "1rem",
    background: "var(--admin-surface)",
    boxShadow: "0 8px 24px var(--color-shadow-soft)",
  } as CSSProperties,
};

export const SuspensionPanel = memo(function SuspensionPanel({
  memberId,
  memberName,
  onSuccess,
}: SuspensionPanelProps) {
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [suspensions, setSuspensions] = useState<Suspension[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [suspensionType, setSuspensionType] = useState<SuspensionType>(
    "temporary_24h"
  );
  const [customDays, setCustomDays] = useState<number>(1);
  const [reason, setReason] = useState<ReasonCategory | "">("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fetch member info and suspension history
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get member info
        const memberResponse = await fetch(
          `/api/admin/members/${memberId}/details`
        );
        if (memberResponse.ok) {
          const memberData = await memberResponse.json();
          setMemberInfo(memberData);
        }

        // Get suspension history
        const suspensionResponse = await fetch(
          `/api/admin/members/${memberId}/suspensions`
        );
        if (suspensionResponse.ok) {
          const suspensionData = await suspensionResponse.json();
          setSuspensions(suspensionData.suspensions || []);
        }
      } catch (err) {
        console.error("Failed to fetch member data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load member data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [memberId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSuspensionType = (type: string) => {
    switch (type) {
      case "temporary_24h":
        return "24 Hours";
      case "temporary_custom":
        return "Custom Duration";
      case "permanent":
        return "Permanent";
      default:
        return type;
    }
  };

  const formatReason = (reason: string) => {
    switch (reason) {
      case "spam_flooding":
        return "Spam or Flooding";
      case "abusive_language":
        return "Abusive Language";
      case "harassment":
        return "Harassment";
      case "inappropriate_content":
        return "Inappropriate Content";
      case "terms_violation":
        return "Terms of Service Violation";
      case "other":
        return "Other";
      default:
        return reason;
    }
  };

  const getSuspensionBadgeStyle = (type: string) => {
    switch (type) {
      case "temporary_24h":
        return { ...styles.suspensionBadge, ...styles.badge24h };
      case "temporary_custom":
        return { ...styles.suspensionBadge, ...styles.badgeCustom };
      case "permanent":
        return { ...styles.suspensionBadge, ...styles.badgePermanent };
      default:
        return styles.suspensionBadge;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!reason) {
      setError("Please select a reason for suspension");
      return;
    }

    if (suspensionType === "temporary_custom" && customDays <= 0) {
      setError("Days must be greater than 0");
      return;
    }

    setShowConfirmation(true);
  };

  const confirmSuspension = async () => {
    setShowConfirmation(false);
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/members/${memberId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suspension_type: suspensionType,
          suspension_reason: reason,
          additional_notes: additionalNotes || null,
          days_count:
            suspensionType === "temporary_custom" ? customDays : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to suspend member"
        );
      }

      const result = await response.json();
      setSuccessMessage(
        `Member suspended successfully for ${formatSuspensionType(
          suspensionType
        )}`
      );

      // Reset form
      setSuspensionType("temporary_24h");
      setCustomDays(1);
      setReason("");
      setAdditionalNotes("");

      // Refresh suspension history
      const suspensionResponse = await fetch(
        `/api/admin/members/${memberId}/suspensions`
      );
      if (suspensionResponse.ok) {
        const suspensionData = await suspensionResponse.json();
        setSuspensions(suspensionData.suspensions || []);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suspend member");
      console.error("Suspension error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          ...styles.container,
          padding: "3rem 1rem",
          textAlign: "center",
          color: "var(--admin-muted)",
        }}
      >
        <Loader size={24} style={{ margin: "0 auto 1rem", animation: "spin 1s linear infinite" }} />
        <p>Loading member information...</p>
      </div>
    );
  }

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Member Info Card */}
      {memberInfo && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>
            <Ban size={20} />
            Suspend Member
          </h2>
          <div style={styles.memberInfo}>
            <div style={styles.memberInfoRow}>
              <div style={styles.memberLabel}>Name</div>
              <div style={styles.memberValue}>{memberInfo.full_name}</div>
            </div>
            <div style={styles.memberInfoRow}>
              <div style={styles.memberLabel}>Email</div>
              <div style={styles.memberValue}>{memberInfo.email}</div>
            </div>
            <div style={styles.memberInfoRow}>
              <div style={styles.memberLabel}>Member Since</div>
              <div style={styles.memberValue}>{formatDate(memberInfo.created_at)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Form Card */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <AlertCircle size={20} />
          Suspension Details
        </h3>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {successMessage && (
          <div style={styles.successBox}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <div>{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.formSection}>
          {/* Suspension Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Suspension Type</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="temporary_24h"
                  checked={suspensionType === "temporary_24h"}
                  onChange={(e) =>
                    setSuspensionType(e.target.value as SuspensionType)
                  }
                  style={styles.radioInput}
                />
                <span>Temporary (24 hours)</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="temporary_custom"
                  checked={suspensionType === "temporary_custom"}
                  onChange={(e) =>
                    setSuspensionType(e.target.value as SuspensionType)
                  }
                  style={styles.radioInput}
                />
                <span>Temporary (Custom duration)</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="permanent"
                  checked={suspensionType === "permanent"}
                  onChange={(e) =>
                    setSuspensionType(e.target.value as SuspensionType)
                  }
                  style={styles.radioInput}
                />
                <span>Permanent Ban</span>
              </label>
            </div>
          </div>

          {/* Custom Days Input */}
          {suspensionType === "temporary_custom" && (
            <div style={styles.formGroup}>
              <label htmlFor="customDays" style={styles.label}>
                Number of Days
              </label>
              <input
                id="customDays"
                type="number"
                min="1"
                max="365"
                value={customDays}
                onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                style={{ ...styles.input, width: "100%" }}
              />
            </div>
          )}

          {/* Reason */}
          <div style={styles.formGroup}>
            <label htmlFor="reason" style={styles.label}>
              Reason <span style={{ color: "var(--admin-red)" }}>*</span>
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReasonCategory)}
              style={{ ...styles.select, width: "100%" }}
            >
              <option value="">Select a reason...</option>
              <option value="Spam or flooding">Spam or flooding</option>
              <option value="Abusive language">Abusive language</option>
              <option value="Harassment">Harassment</option>
              <option value="Inappropriate content">
                Inappropriate content
              </option>
              <option value="Terms of service violation">
                Terms of service violation
              </option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div style={styles.formGroup}>
            <label htmlFor="notes" style={styles.label}>
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Provide more details if needed..."
              style={{ ...styles.textarea, width: "100%" }}
            />
          </div>

          {/* Buttons */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => {
                setSuspensionType("temporary_24h");
                setCustomDays(1);
                setReason("");
                setAdditionalNotes("");
                setError(null);
                setSuccessMessage(null);
              }}
              style={styles.buttonSecondary}
              disabled={submitting}
            >
              Clear
            </button>
            <button
              type="submit"
              style={styles.buttonPrimary}
              disabled={submitting}
              onMouseEnter={(e) => {
                if (!submitting) {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--admin-red-dark)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--admin-red)";
              }}
            >
              {submitting ? (
                <>
                  <Loader
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Suspending...
                </>
              ) : (
                <>
                  <Ban size={16} />
                  Suspend Member
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Suspension History Card */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <Calendar size={20} />
          Suspension History
        </h3>

        {suspensions.length === 0 ? (
          <div style={styles.emptyState}>
            <FileText size={32} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No suspension history</p>
          </div>
        ) : (
          <div style={styles.suspensionHistory}>
            {suspensions.map((suspension) => (
              <div key={suspension.id} style={styles.suspensionItem}>
                <div style={styles.suspensionHeader}>
                  <div>
                    <div style={getSuspensionBadgeStyle(suspension.suspension_type)}>
                      {suspension.suspension_type === "temporary_24h" && (
                        <>
                          <AlertCircle size={12} />
                          24 Hours
                        </>
                      )}
                      {suspension.suspension_type === "temporary_custom" && (
                        <>
                          <Calendar size={12} />
                          Custom
                        </>
                      )}
                      {suspension.suspension_type === "permanent" && (
                        <>
                          <Ban size={12} />
                          Permanent
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    {suspension.is_active ? (
                      <>
                        <AlertCircle
                          size={16}
                          style={{ color: "var(--admin-red)" }}
                        />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--admin-red)",
                          }}
                        >
                          Active
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle
                          size={16}
                          style={{ color: "var(--admin-muted)" }}
                        />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "var(--admin-muted)",
                          }}
                        >
                          Lifted
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div style={styles.suspensionMeta}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Reason:</span>{" "}
                    {formatReason(suspension.reason_category)}
                  </div>
                  {suspension.reason_details && (
                    <div>
                      <span style={{ fontWeight: 600 }}>Details:</span>{" "}
                      {suspension.reason_details}
                    </div>
                  )}
                  <div>
                    <span style={{ fontWeight: 600 }}>Suspended:</span>{" "}
                    {formatDate(suspension.suspended_at)}
                  </div>
                  {suspension.expires_at && (
                    <div>
                      <span style={{ fontWeight: 600 }}>Expires:</span>{" "}
                      {formatDate(suspension.expires_at)}
                    </div>
                  )}
                  {suspension.lifted_at && (
                    <div>
                      <span style={{ fontWeight: 600 }}>Lifted:</span>{" "}
                      {formatDate(suspension.lifted_at)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div
          style={styles.modalBackdrop}
          onClick={() => setShowConfirmation(false)}
        >
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "start", gap: "1rem", marginBottom: "1rem" }}>
              <AlertCircle
                size={24}
                style={{ color: "var(--admin-red)", flexShrink: 0 }}
              />
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--admin-ink)",
                  }}
                >
                  Confirm Suspension
                </h2>
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    fontSize: "0.8rem",
                    color: "var(--admin-muted)",
                  }}
                >
                  This action will suspend the member from using the platform.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: "1rem",
                background: "var(--admin-surface-deep)",
                borderRadius: "0.5rem",
                marginBottom: "1.5rem",
                fontSize: "0.8rem",
              }}
            >
              <div style={{ marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: 600 }}>Type:</span>{" "}
                {formatSuspensionType(suspensionType)}
                {suspensionType === "temporary_custom" && ` (${customDays} days)`}
              </div>
              <div>
                <span style={{ fontWeight: 600 }}>Reason:</span> {reason}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConfirmation(false)}
                style={styles.buttonSecondary}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={confirmSuspension}
                style={styles.buttonPrimary}
                disabled={submitting}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--admin-red-dark)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--admin-red)";
                }}
              >
                {submitting ? (
                  <>
                    <Loader
                      size={16}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    Suspending...
                  </>
                ) : (
                  <>
                    <Ban size={16} />
                    Confirm Suspension
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 300ms ease-out;
        }
      `}</style>
    </div>
  );
});
