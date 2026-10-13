"use client";

import { memo, useEffect, useMemo, useState, type CSSProperties } from "react";
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
import { BroadcastCampaign, DEFAULT_TARGET_GROUPS, buildEmailBody, createBroadcast, listBroadcasts, removeBroadcast, sendBroadcast } from "@/lib/broadcast";
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
}: AdminBroadcastViewProps) {
  const [view, setView] = useState<"list" | "compose">("list");
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<AdminContentItem | null>(null);
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [draftBodyOverride, setDraftBodyOverride] = useState<string | null>(null);
  const [targetGroups, setTargetGroups] = useState<string[]>([]);
  const [targetStatuses, setTargetStatuses] = useState<string[]>(["active"]);
  const [selectedAudience, setSelectedAudience] = useState<string>("all");
  const [remoteRecipientCount, setRemoteRecipientCount] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /* ── Derived data ─────────────────────────────────────────────── */

  const publishedContent = useMemo(() => content.filter((c) => c.status === "published"), [content]);
  const recipientCount = remoteRecipientCount;

  const emailBody = useMemo(() => {
    if (draftBodyOverride !== null) return draftBodyOverride;
    if (!selectedContent) return "";
    return buildEmailBody(
      selectedContent.title,
      selectedContent.summary,
      selectedContent.body,
      customMessage || "Please see the latest update from EFSW below.",
      "EFSW Editorial",
    );
  }, [selectedContent, customMessage, draftBodyOverride]);

  useEffect(() => {
    let active = true;
    listBroadcasts().then((items) => {
      if (active) { setCampaigns(items); setLoading(false); }
    }).catch((cause) => {
      if (active) { setError(cause instanceof Error ? cause.message : "Could not load broadcasts"); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (view !== "compose") return;
    let active = true;
    setRemoteRecipientCount(null);
    fetch("/api/broadcast/recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audience: selectedAudience, targetGroups, targetStatuses }),
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not count recipients");
      if (active) setRemoteRecipientCount(typeof data.count === "number" ? data.count : 0);
    }).catch(() => { if (active) setRemoteRecipientCount(null); });
    return () => { active = false; };
  }, [view, selectedAudience, targetGroups, targetStatuses]);

  /* ── Handlers ────────────────────────────────────────────────── */

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectContent = (item: AdminContentItem) => {
    setDraftBodyOverride(null);
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

  const campaignInput = () => ({
    title: selectedContent?.title || subject,
    subject: subject.trim() || selectedContent?.title || "",
    preheader: preheader.trim(),
    body_html: emailBody,
    content_id: selectedContent?.id,
    content_kind: selectedContent?.kind || "custom",
    cover_image: selectedContent?.coverImage,
    audience: selectedAudience,
    target_groups: targetGroups,
    target_statuses: targetStatuses,
  });

  const resetComposer = () => {
    setView("list"); setSelectedContent(null); setDraftId(null);
    setSubject(""); setPreheader(""); setCustomMessage(""); setDraftBodyOverride(null);
    setTargetGroups([]); setTargetStatuses(["active"]); setSelectedAudience("all"); setRemoteRecipientCount(null);
  };

  const saveOrSend = async (sendNow: boolean) => {
    if (!selectedContent || busy) return;
    if (!targetStatuses.length) { setError("Select at least one member status"); return; }
    setBusy(true); setError(null);
    try {
      let campaign: BroadcastCampaign;
      if (draftId) {
        const response = await fetch("/api/broadcast", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId: draftId, ...campaignInput() }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to save draft");
        campaign = { ...data.campaign, id: draftId } as BroadcastCampaign;
      } else {
        campaign = await createBroadcast(campaignInput());
      }
      if (sendNow) {
        const result = await sendBroadcast(campaign.id);
        showToast(result.totalFailed ? `Sent ${result.totalSent}; ${result.totalFailed} failed` : `Sent to ${result.totalSent} members`);
      } else showToast("Draft saved");
      setCampaigns(await listBroadcasts());
      resetComposer();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Broadcast request failed");
      setCampaigns(await listBroadcasts().catch(() => campaigns));
    } finally { setBusy(false); }
  };

  const handleDelete = async (id: string) => {
    setBusy(true); setError(null);
    try { await removeBroadcast(id); setCampaigns((items) => items.filter((item) => item.id !== id)); setDeleteConfirm(null); showToast("Draft deleted"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Delete failed"); }
    finally { setBusy(false); }
  };

  const handleDuplicate = async (campaign: BroadcastCampaign) => {
    setBusy(true); setError(null);
    try {
      await createBroadcast({ title: campaign.contentTitle, subject: campaign.subject, preheader: campaign.preheader, body_html: campaign.body, content_id: campaign.contentId, content_kind: campaign.contentKind, cover_image: campaign.coverImage, audience: campaign.audience, target_groups: campaign.targetGroups, target_statuses: campaign.targetStatuses });
      setCampaigns(await listBroadcasts()); showToast("Draft duplicated");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Duplicate failed"); }
    finally { setBusy(false); }
  };

  const handleSendExisting = async (id: string) => {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const result = await sendBroadcast(id);
      showToast(result.totalFailed ? `Sent ${result.totalSent}; ${result.totalFailed} failed` : `Sent to ${result.totalSent} members`);
      setCampaigns(await listBroadcasts());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Broadcast failed");
      setCampaigns(await listBroadcasts().catch(() => campaigns));
    } finally { setBusy(false); }
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
      case "sending":
        return <span className="efsw-admin-status is-pending"><i aria-hidden /> Sending</span>;
      default:
        return null;
    }
  };

  /* ── Compose view ────────────────────────────────────────────── */

  if (view === "compose") {
    return (
      <div style={{ display: "grid", gap: "0.85rem" }}>
        {/* Header */}
        <div className="efsw-admin-toolbar" style={{ justifyContent: "space-between", marginBottom: 0 }}>
          <button onClick={resetComposer} className="efsw-admin-quiet-action">
            <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to broadcasts
          </button>
          <div className="efsw-admin-topbar__actions">
            <button
              onClick={resetComposer}
              className="efsw-admin-outline-action"
            >
              Discard
            </button>
            <button onClick={() => saveOrSend(false)} disabled={busy || !selectedContent} className="efsw-admin-outline-action">
              Save draft
            </button>
            <button onClick={() => saveOrSend(true)} disabled={busy || !selectedContent} className="efsw-admin-primary">
              <Send size={14} /> {busy ? "Working…" : "Send broadcast"}
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
        {error && <p role="alert" style={{ color: "var(--admin-danger)", margin: 0 }}>{error}</p>}

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
                    onChange={(e) => { setDraftBodyOverride(null); setCustomMessage(e.target.value); }}
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
                  <strong style={{ color: "var(--admin-ink)" }}>Estimated recipients: </strong>
                  <span style={{ color: "var(--admin-green)", fontWeight: 800 }}>{recipientCount ?? "…"}</span>
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
            Send email campaigns to members, sourced from published content.
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
      {error && <p role="alert" style={{ color: "var(--admin-danger)", margin: 0 }}>{error}</p>}
      {loading && <p style={{ color: "var(--admin-muted)" }}>Loading broadcasts…</p>}

      {/* Campaign list */}
      {!loading && campaigns.length === 0 ? (
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
                  {c.status === "draft" && <button
                    onClick={() => handleSendExisting(c.id)} disabled={busy}
                    title="Send draft" className="efsw-admin-icon-button"
                  ><Send size={12} /></button>}
                  {c.status === "draft" && publishedContent.some((item) => item.id === c.contentId) && <button
                    onClick={() => {
                      setSelectedContent(publishedContent.find((item) => item.id === c.contentId) || null);
                      setDraftId(c.id); setSubject(c.subject); setPreheader(c.preheader);
                      setTargetGroups(c.targetGroups); setTargetStatuses(c.targetStatuses);
                      setSelectedAudience(c.audience); setCustomMessage(""); setDraftBodyOverride(c.body); setView("compose");
                    }}
                    className="efsw-admin-icon-button" title="Edit draft"
                  >Edit</button>}
                  <button
                    onClick={() => handleDuplicate(c)}
                    disabled={busy}
                    title="Duplicate"
                    className="efsw-admin-icon-button"
                  >
                    <Copy size={12} />
                  </button>
                  {c.status === "draft" && <button
                    onClick={() => setDeleteConfirm(c.id)}
                    title="Delete"
                    className="efsw-admin-icon-button"
                    style={{ color: "var(--admin-danger)" }}
                  >
                    <Trash2 size={12} />
                  </button>}
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
                disabled={busy}
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
