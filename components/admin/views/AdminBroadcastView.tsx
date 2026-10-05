"use client";

import { memo, useMemo, useState, type CSSProperties } from "react";
import {
  Mail,
  Send,
  Clock,
  Check,
  Plus,
  Trash2,
  Eye,
  Users,
  Filter,
  Calendar,
  ChevronRight,
  FileText,
  Newspaper,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  Copy,
  X,
} from "lucide-react";
import { AdminContentItem, AdminContentKind } from "@/lib/admin-data";
import { BroadcastCampaign, BroadcastRecipient, DEFAULT_TARGET_GROUPS, buildEmailBody, calculateRecipients, deleteBroadcast, generateBroadcastId, getBroadcasts, saveBroadcast } from "@/lib/broadcast";
import { AdminMember } from "@/lib/admin-data";

/* ── Constants ─────────────────────────────────────────────────── */

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid var(--admin-line)",
  borderRadius: "0.5rem",
  background: "var(--admin-surface)",
  color: "var(--admin-ink)",
  padding: "0.55rem 0.7rem",
  fontSize: "0.78rem",
};

const TARGET_GROUPS = [
  "Children & Youth",
  "Families & Communities",
  "Health & Well-Being",
  "Clinical Practice",
  "Offenders & Corrections",
  "Persons with Disabilities",
  "Older Adults & Aging",
  "School Social Work",
  "Mental Health & Psychiatry",
  "Substance Abuse & Addictions",
  "Gender & Sexual Diversity (LGBTQ+)",
  "Informal & Migrant Workers",
  "Ethnic & Indigenous Communities",
  "Survivors of Violence & Abuse",
  "Stateless Persons",
  "Migrants & Refugees",
  "Homelessness",
  "Financial Hardship & Poverty",
  "Other",
];

const STATUS_OPTIONS = [
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "suspended", label: "Suspended" },
];

/* ── Props ─────────────────────────────────────────────────────── */

interface AdminBroadcastViewProps {
  content: AdminContentItem[];
  members: AdminMember[];
}

/* ── Component ─────────────────────────────────────────────────── */

export const AdminBroadcastView = memo(function AdminBroadcastView({
  content,
  members,
}: AdminBroadcastViewProps) {
  const [view, setView] = useState<"list" | "compose">("list");
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>(() => getBroadcasts());
  const [selectedContent, setSelectedContent] = useState<AdminContentItem | null>(null);
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [targetGroups, setTargetGroups] = useState<string[]>([]);
  const [targetStatuses, setTargetStatuses] = useState<string[]>(["active"]);
  const [selectedAudience, setSelectedAudience] = useState<string>("all");
  const [scheduledAt, setScheduledAt] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /* ── Derived data ─────────────────────────────────────────────── */

  const publishedContent = useMemo(() => content.filter((c) => c.status === "published"), [content]);
  const recipientMembers = useMemo(() => members.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    email: m.email,
    membershipType: m.membershipType,
    status: m.status,
  }) as BroadcastRecipient), [members]);

  const audience = DEFAULT_TARGET_GROUPS.find((a) => a.id === selectedAudience) ?? null;

  const recipientCount = useMemo(
    () => calculateRecipients(recipientMembers, audience, targetGroups, targetStatuses).length,
    [recipientMembers, audience, targetGroups, targetStatuses],
  );

  const emailBody = useMemo(() => {
    if (!selectedContent) return "";
    return buildEmailBody(
      selectedContent.title,
      selectedContent.summary,
      selectedContent.body,
      customMessage || "Please see the latest update from EFSW below.",
      "EFSW Editorial",
    );
  }, [selectedContent, customMessage]);

  /* ── Handlers ────────────────────────────────────────────────── */

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectContent = (item: AdminContentItem) => {
    setSelectedContent(item);
    if (!subject) setSubject(item.title);
    if (!preheader) setPreheader(item.summary.slice(0, 100));
    setView("compose");
  };

  const handleToggleTargetGroup = (group: string) => {
    setTargetGroups((prev) => prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]);
  };

  const handleToggleStatus = (status: string) => {
    setTargetStatuses((prev) => prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]);
  };

  const handleSend = () => {
    if (!selectedContent) return;
    const campaign: BroadcastCampaign = {
      id: generateBroadcastId(),
      contentId: selectedContent.id,
      contentTitle: selectedContent.title,
      contentKind: selectedContent.kind,
      subject: subject || selectedContent.title,
      preheader: preheader || selectedContent.summary.slice(0, 100),
      body: emailBody,
      coverImage: selectedContent.coverImage,
      targetGroups,
      targetStatuses,
      scheduledAt: scheduledAt || undefined,
      status: scheduledAt ? "scheduled" : "sent",
      recipientCount,
      sentAt: scheduledAt ? undefined : new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveBroadcast(campaign);
    setCampaigns(getBroadcasts());
    showToast(scheduledAt ? "Broadcast scheduled" : "Broadcast sent");
    setView("list");
    setSelectedContent(null);
    setSubject("");
    setPreheader("");
    setCustomMessage("");
    setTargetGroups([]);
    setTargetStatuses(["active"]);
    setScheduledAt("");
  };

  const handleDelete = (id: string) => {
    setCampaigns(deleteBroadcast(id));
    setDeleteConfirm(null);
    showToast("Broadcast deleted");
  };

  const handleDuplicate = (campaign: BroadcastCampaign) => {
    const duplicate: BroadcastCampaign = {
      ...campaign,
      id: generateBroadcastId(),
      status: "draft",
      sentAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveBroadcast(duplicate);
    setCampaigns(getBroadcasts());
    showToast("Broadcast duplicated");
  };

  /* ── Format date ─────────────────────────────────────────────── */

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  /* ── Icons ───────────────────────────────────────────────────── */

  const kindIcon = (kind: AdminContentKind) => {
    switch (kind) {
      case "news": return <Newspaper size={15} />;
      case "event": return <Sparkles size={15} />;
      case "document": return <FileText size={15} />;
      default: return <FileText size={15} />;
    }
  };

  const statusBadge = (status: BroadcastCampaign["status"]) => {
    switch (status) {
      case "sent":
        return (
          <span className="efsw-admin-status is-active">
            <i aria-hidden /> Sent
          </span>
        );
      case "scheduled":
        return (
          <span className="efsw-admin-status is-pending">
            <i aria-hidden /> Scheduled
          </span>
        );
      case "draft":
        return (
          <span className="efsw-admin-status">
            <i aria-hidden /> Draft
          </span>
        );
      case "failed":
        return (
          <span className="efsw-admin-status is-suspended">
            <i aria-hidden /> Failed
          </span>
        );
      default:
        return null;
    }
  };

  /* ── Compose view ────────────────────────────────────────────── */

  if (view === "compose" && selectedContent) {
    return (
      <div style={{ display: "grid", gap: "0.85rem" }}>
        {/* Header */}
        <div className="efsw-admin-toolbar" style={{ justifyContent: "space-between", marginBottom: 0 }}>
          <button onClick={() => setView("list")} className="efsw-admin-quiet-action">
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to broadcasts
          </button>
          <div className="efsw-admin-topbar__actions">
            <button
              onClick={() => { setView("list"); setSelectedContent(null); }}
              className="efsw-admin-outline-action"
            >
              Discard
            </button>
            <button onClick={handleSend} className="efsw-admin-primary">
              <Send size={14} /> {scheduledAt ? "Schedule" : "Send"} broadcast
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              alignSelf: "start",
              padding: "0.8rem 1rem",
              borderRadius: "0.5rem",
              background: "var(--admin-green-soft)",
              color: "var(--admin-green)",
              fontSize: "0.75rem",
              fontWeight: 750,
            }}
          >
            <Check size={14} /> {toast}
          </div>
        )}

        <div style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", alignItems: "start" }}>
          {/* Left: Content selector */}
          <div style={{ display: "grid", gap: "0.8rem", gridColumn: "span 1" }}>
            <section className="efsw-admin-panel">
              <header className="efsw-admin-panel__head">
                <h2>Source content</h2>
              </header>
              <div className="efsw-admin-mini-list">
                {publishedContent.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectContent(item)}
                    style={{ background: selectedContent?.id === item.id ? "var(--admin-green-soft)" : undefined }}
                  >
                    <span className="efsw-admin-activity-icon" style={{ width: "2rem", height: "2rem" }}>
                      {kindIcon(item.kind)}
                    </span>
                    <span style={{ display: "grid", gap: "0.2rem", minWidth: 0 }}>
                      <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                        {item.title}
                      </strong>
                      <small style={{ color: "var(--admin-muted)", fontSize: "0.65rem" }}>
                        {item.category || item.kind}
                      </small>
                    </span>
                    {selectedContent?.id === item.id && (
                      <Check size={14} style={{ color: "var(--admin-green)" }} />
                    )}
                  </button>
                ))}
              </div>
              {publishedContent.length === 0 && (
                <p style={{ margin: 0, padding: "0 1.35rem 1.25rem", color: "var(--admin-muted)", fontSize: "0.72rem" }}>
                  No published content available. Publish news or events first.
                </p>
              )}
            </section>

            {/* Audience selector */}
            <section className="efsw-admin-panel">
              <header className="efsw-admin-panel__head">
                <h2 style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                  <Users size={15} /> Audience
                </h2>
              </header>
              <div className="efsw-admin-mini-list" style={{ padding: "0.35rem 0.35rem 0.75rem" }}>
                {DEFAULT_TARGET_GROUPS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAudience(a.id)}
                    style={{ background: selectedAudience === a.id ? "var(--admin-green-soft)" : undefined }}
                  >
                    <span aria-hidden />
                    <span style={{ display: "grid", gap: "0.2rem", minWidth: 0 }}>
                      <strong style={{ fontSize: "0.75rem" }}>{a.label}</strong>
                      <small style={{ color: "var(--admin-muted)", fontSize: "0.65rem" }}>{a.description}</small>
                    </span>
                    {selectedAudience === a.id && <Check size={14} style={{ color: "var(--admin-green)" }} />}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Right: Composer */}
          <div style={{ display: "grid", gap: "0.8rem", gridColumn: "span 2" }}>
            {/* Email details */}
            <section className="efsw-admin-panel">
              <header className="efsw-admin-panel__head">
                <h2>Email details</h2>
              </header>
              <div style={{ display: "grid", gap: "0.8rem", padding: "0.35rem 1.35rem 1.25rem" }}>
                <label style={{ display: "grid", gap: "0.4rem", color: "var(--admin-muted)", fontSize: "0.74rem", fontWeight: 750 }}>
                  Subject line
                  <input style={inputStyle} type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject..." />
                </label>

                <label style={{ display: "grid", gap: "0.4rem", color: "var(--admin-muted)", fontSize: "0.74rem", fontWeight: 750 }}>
                  Preheader text
                  <input style={inputStyle} type="text" value={preheader} onChange={(e) => setPreheader(e.target.value)} placeholder="Short preview text shown in inbox..." />
                </label>

                <label style={{ display: "grid", gap: "0.4rem", color: "var(--admin-muted)", fontSize: "0.74rem", fontWeight: 750 }}>
                  Custom message
                  <textarea
                    style={{ ...inputStyle, minHeight: "6rem", resize: "vertical" }}
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add a personal note to include at the top of the email..."
                  />
                </label>
              </div>
            </section>

            {/* Target groups */}
            <section className="efsw-admin-panel">
              <header className="efsw-admin-panel__head">
                <h2 style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                  <Filter size={15} /> Target groups
                </h2>
              </header>
              <p style={{ margin: "0 1.35rem 0.9rem", color: "var(--admin-muted)", fontSize: "0.72rem", lineHeight: 1.45 }}>
                Select which member groups should receive this broadcast. Leave empty for all.
              </p>
              <div className="efsw-admin-chip-set" style={{ padding: "0 1.35rem 1.25rem" }}>
                {TARGET_GROUPS.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => handleToggleTargetGroup(group)}
                    aria-pressed={targetGroups.includes(group)}
                    className={`efsw-admin-chip${targetGroups.includes(group) ? " is-active" : ""}`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </section>

            {/* Member status */}
            <section className="efsw-admin-panel">
              <header className="efsw-admin-panel__head">
                <h2>Member status</h2>
              </header>
              <div className="efsw-admin-chip-set" style={{ padding: "0 1.35rem 1.25rem" }}>
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleToggleStatus(s.id)}
                    className={`efsw-admin-chip${targetStatuses.includes(s.id) ? " is-active" : ""}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Schedule */}
            <section className="efsw-admin-panel">
              <header className="efsw-admin-panel__head">
                <h2 style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                  <Calendar size={15} /> Schedule
                </h2>
              </header>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", padding: "0.35rem 1.35rem 1.25rem" }}>
                <label style={{ display: "grid", gap: "0.4rem", color: "var(--admin-muted)", fontSize: "0.74rem", fontWeight: 750, flex: 1 }}>
                  Send at (leave empty to send now)
                  <input
                    style={inputStyle}
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </label>
                {scheduledAt && (
                  <button onClick={() => setScheduledAt("")} className="efsw-admin-outline-action">
                    Clear
                  </button>
                )}
              </div>
            </section>

            {/* Preview */}
            <section className="efsw-admin-panel">
              <header className="efsw-admin-panel__head">
                <h2 style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                  <Eye size={15} /> Preview
                </h2>
                <button onClick={() => setPreviewOpen(!previewOpen)} className="efsw-admin-text-action">
                  {previewOpen ? "Hide" : "Show"} email preview
                </button>
              </header>
              {previewOpen && (
                <div
                  style={{
                    borderRadius: "0.5rem",
                    background: "var(--admin-surface-deep)",
                    padding: "1rem 1.35rem",
                    maxHeight: "24rem",
                    overflow: "auto",
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: emailBody }} />
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  margin: "1rem 1.35rem 1.25rem",
                  padding: "0.8rem 1rem",
                  borderRadius: "0.5rem",
                  background: "var(--admin-surface-deep)",
                  fontSize: "0.75rem",
                }}
              >
                <div>
                  <strong style={{ color: "var(--admin-ink)" }}>Recipients: </strong>
                  <span style={{ color: "var(--admin-green)", fontWeight: 800 }}>{recipientCount}</span>
                  <span style={{ color: "var(--admin-muted)" }}> members</span>
                </div>
                <div style={{ color: "var(--admin-muted)", fontSize: "0.65rem" }}>
                  {selectedAudience === "all" ? "All members" : DEFAULT_TARGET_GROUPS.find((a) => a.id === selectedAudience)?.label}
                  {targetGroups.length > 0 && ` · ${targetGroups.length} group${targetGroups.length > 1 ? "s" : ""}`}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  /* ── List view ────────────────────────────────────────────────── */

  return (
    <div style={{ display: "grid", gap: "0.85rem" }}>
      {/* Header */}
      <div className="efsw-admin-toolbar" style={{ justifyContent: "space-between", marginBottom: 0 }}>
        <div>
          <h2 style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "0.45rem", fontFamily: "var(--font-display)", fontSize: "1.05rem", fontWeight: 650 }}>
            <Mail size={16} /> Broadcasts
          </h2>
          <p style={{ margin: "0.35rem 0 0", color: "var(--admin-muted)", fontSize: "0.72rem", lineHeight: 1.5 }}>
            Send email campaigns to members, sourced from published content. Connect Resend for production delivery.
          </p>
        </div>
        <button onClick={() => setView("compose")} className="efsw-admin-primary">
          <Plus size={16} /> New broadcast
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            alignSelf: "start",
            padding: "0.8rem 1rem",
            borderRadius: "0.5rem",
            background: "var(--admin-green-soft)",
            color: "var(--admin-green)",
            fontSize: "0.75rem",
            fontWeight: 750,
          }}
        >
          <Check size={14} /> {toast}
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div className="efsw-admin-empty">
          <Mail size={40} style={{ color: "var(--admin-green)" }} />
          <h2>No broadcasts yet</h2>
          <p>Click "New broadcast" to compose your first email campaign.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.65rem" }}>
          {campaigns.map((c) => (
            <article key={c.id} className="efsw-admin-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1rem 1.35rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
                <span className="efsw-admin-activity-icon">
                  <Mail size={18} />
                </span>
                <span style={{ display: "grid", gap: "0.2rem", minWidth: 0 }}>
                  <strong style={{ fontSize: "0.78rem" }}>{c.subject}</strong>
                  <small style={{ color: "var(--admin-muted)", fontSize: "0.68rem" }}>
                    {c.contentTitle} · {c.recipientCount} recipient{c.recipientCount !== 1 ? "s" : ""}
                  </small>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                <span style={{ display: "grid", gap: "0.3rem", textAlign: "right" }}>
                  <small style={{ color: "var(--admin-muted)", fontSize: "0.64rem" }}>{formatDate(c.createdAt)}</small>
                  {statusBadge(c.status)}
                </span>
                <span style={{ display: "inline-flex", gap: "0.35rem" }}>
                  <button
                    onClick={() => handleDuplicate(c)}
                    title="Duplicate"
                    className="efsw-admin-icon-button"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(c.id)}
                    title="Delete"
                    className="efsw-admin-icon-button"
                    style={{ color: "var(--admin-danger)" }}
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="efsw-admin-modal-layer efsw-admin-modal-layer--center">
          <div
            className="efsw-admin-modal-scrim"
            onClick={() => setDeleteConfirm(null)}
          />
          <div
            className="efsw-admin-modal-card efsw-admin-modal-card--narrow"
            role="dialog"
            aria-modal="true"
            aria-label="Delete broadcast?"
          >
            <div className="efsw-admin-modal-card__head">
              <div className="efsw-admin-modal-card__lead">
                <div className="efsw-admin-modal-card__icon efsw-admin-modal-card__icon--danger">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="efsw-admin-modal-card__title">Delete broadcast?</h3>
                  <p className="efsw-admin-modal-card__lede">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="efsw-admin-modal-actions" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="efsw-admin-outline-action"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                className="efsw-admin-danger-action"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
