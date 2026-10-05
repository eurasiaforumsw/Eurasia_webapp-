"use client";

import { memo, useState, useMemo, type CSSProperties } from "react";
import {
  MessageSquare,
  Send,
  Trash2,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  User,
  Plus,
  X,
  ChevronDown,
} from "lucide-react";
import { AdminMember } from "@/lib/admin-data";

/* ── Types ──────────────────────────────────────────────────────── */

export interface InAppMessage {
  id: string;
  subject: string;
  body: string;
  recipientType: "all" | "individual";
  recipientIds?: string[]; // member IDs when recipientType is "individual"
  createdAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp (120 days from createdAt)
  status: "active" | "expired";
  readBy: string[]; // member IDs who have read the message
}

/* ── Helpers ────────────────────────────────────────────────────── */

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function calculateExpiryDate(createdAt: string): string {
  const created = new Date(createdAt);
  const expiry = new Date(created);
  expiry.setDate(expiry.getDate() + 120);
  return expiry.toISOString();
}

function getMessages(): InAppMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("efsw_messages");
    if (!stored) return [];
    const messages: InAppMessage[] = JSON.parse(stored);
    // Mark expired messages
    const now = Date.now();
    return messages.map((msg) => ({
      ...msg,
      status: new Date(msg.expiresAt).getTime() < now ? "expired" : "active",
    }));
  } catch {
    return [];
  }
}

function saveMessages(messages: InAppMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("efsw_messages", JSON.stringify(messages));
  } catch (error) {
    console.error("Failed to save messages:", error);
  }
}

function deleteMessage(messageId: string): void {
  const messages = getMessages();
  const updated = messages.filter((m) => m.id !== messageId);
  saveMessages(updated);
}

function createMessage(draft: Omit<InAppMessage, "id" | "createdAt" | "expiresAt" | "status" | "readBy">): InAppMessage {
  const createdAt = new Date().toISOString();
  const message: InAppMessage = {
    ...draft,
    id: generateMessageId(),
    createdAt,
    expiresAt: calculateExpiryDate(createdAt),
    status: "active",
    readBy: [],
  };
  const messages = getMessages();
  saveMessages([message, ...messages]);
  return message;
}

/* ── Styles ─────────────────────────────────────────────────────── */

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid var(--admin-line)",
  borderRadius: "0.5rem",
  background: "var(--admin-surface)",
  color: "var(--admin-ink)",
  padding: "0.55rem 0.7rem",
  fontSize: "0.78rem",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "8rem",
  resize: "vertical" as const,
  fontFamily: "inherit",
  lineHeight: "1.5",
};

/* ── Props ──────────────────────────────────────────────────────── */

interface AdminMessagesViewProps {
  members: AdminMember[];
}

/* ── Component ──────────────────────────────────────────────────── */

export const AdminMessagesView = memo(function AdminMessagesView({
  members,
}: AdminMessagesViewProps) {
  const [messages, setMessages] = useState<InAppMessage[]>(() => getMessages());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("all");
  const [composing, setComposing] = useState(false);

  // Draft state
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftRecipientType, setDraftRecipientType] = useState<"all" | "individual">("all");
  const [draftRecipientIds, setDraftRecipientIds] = useState<string[]>([]);
  const [recipientSearchOpen, setRecipientSearchOpen] = useState(false);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState("");

  const filteredMessages = useMemo(() => {
    let result = messages;

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter((msg) => msg.status === filterStatus);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (msg) =>
          msg.subject.toLowerCase().includes(query) ||
          msg.body.toLowerCase().includes(query)
      );
    }

    return result;
  }, [messages, searchQuery, filterStatus]);

  const activeCount = messages.filter((m) => m.status === "active").length;
  const expiredCount = messages.filter((m) => m.status === "expired").length;

  const handleSendMessage = () => {
    if (!draftSubject.trim() || !draftBody.trim()) {
      alert("Subject and body are required.");
      return;
    }

    if (draftRecipientType === "individual" && draftRecipientIds.length === 0) {
      alert("Please select at least one recipient.");
      return;
    }

    const newMessage = createMessage({
      subject: draftSubject,
      body: draftBody,
      recipientType: draftRecipientType,
      recipientIds: draftRecipientType === "individual" ? draftRecipientIds : undefined,
    });

    setMessages([newMessage, ...messages]);
    setComposing(false);
    setDraftSubject("");
    setDraftBody("");
    setDraftRecipientType("all");
    setDraftRecipientIds([]);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!confirm("Delete this message? This cannot be undone.")) return;
    deleteMessage(messageId);
    setMessages(getMessages());
  };

  const handleToggleRecipient = (memberId: string) => {
    setDraftRecipientIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const filteredMembersForPicker = useMemo(() => {
    if (!recipientSearchQuery.trim()) return members;
    const query = recipientSearchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
    );
  }, [members, recipientSearchQuery]);

  const selectedMembers = useMemo(() => {
    return members.filter((m) => draftRecipientIds.includes(m.id));
  }, [members, draftRecipientIds]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="efsw-admin-view__title">
            <MessageSquare size={28} strokeWidth={2.2} />
            Messages
          </h1>
          <p className="efsw-admin-view__lede">
            Send in-app messages to members. Messages expire automatically after 120 days.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="efsw-admin-primary"
        >
          <Plus size={15} /> New message
        </button>
      </header>

      {/* Stats */}
      <div className="efsw-admin-quick-grid">
        <div style={{ display: "grid", gap: "0.5rem", padding: "1rem", background: "var(--admin-surface-deep)", borderRadius: "0.75rem" }}>
          <MessageSquare size={20} style={{ color: "var(--admin-green)" }} />
          <strong style={{ fontSize: "1.8rem", fontWeight: 750 }}>{activeCount}</strong>
          <span style={{ fontSize: "0.72rem", color: "var(--admin-muted)" }}>Active messages</span>
        </div>
        <div style={{ display: "grid", gap: "0.5rem", padding: "1rem", background: "var(--admin-surface-deep)", borderRadius: "0.75rem" }}>
          <Clock size={20} style={{ color: "var(--admin-muted)" }} />
          <strong style={{ fontSize: "1.8rem", fontWeight: 750 }}>{expiredCount}</strong>
          <span style={{ fontSize: "0.72rem", color: "var(--admin-muted)" }}>Expired (120d+)</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 20rem" }}>
          <Search size={15} style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--admin-muted)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, paddingLeft: "2.2rem" }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          style={{ ...inputStyle, width: "auto", minWidth: "10rem" }}
        >
          <option value="all">All messages</option>
          <option value="active">Active only</option>
          <option value="expired">Expired only</option>
        </select>
      </div>

      {/* Messages List */}
      <div className="efsw-admin-panel">
        <div className="efsw-admin-panel__head">
          <h2>All messages ({filteredMessages.length})</h2>
        </div>

        {filteredMessages.length === 0 ? (
          <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--admin-muted)" }}>
            <MessageSquare size={40} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: "0.85rem" }}>
              {searchQuery || filterStatus !== "all" ? "No messages match your filters." : "No messages yet. Create your first one above."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem", padding: "0.5rem" }}>
            {filteredMessages.map((msg) => {
              const recipientCount =
                msg.recipientType === "all"
                  ? members.length
                  : msg.recipientIds?.length ?? 0;
              const daysLeft = Math.max(
                0,
                Math.ceil((new Date(msg.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              );

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "grid",
                    gap: "0.6rem",
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: msg.status === "expired" ? "var(--admin-paper)" : "var(--admin-surface-deep)",
                    opacity: msg.status === "expired" ? 0.6 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                        <strong style={{ fontSize: "0.88rem", fontWeight: 750 }}>{msg.subject}</strong>
                        {msg.status === "expired" && (
                          <span style={{ padding: "0.15rem 0.5rem", borderRadius: "999px", background: "var(--admin-muted)", color: "white", fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase" }}>
                            Expired
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "0.5rem 0 0", fontSize: "0.76rem", color: "var(--admin-muted)", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {msg.body}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="efsw-admin-danger-action"
                      style={{ flexShrink: 0 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.68rem", color: "var(--admin-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      {msg.recipientType === "all" ? <Users size={13} /> : <User size={13} />}
                      {msg.recipientType === "all" ? "All members" : `${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}`}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Clock size={13} />
                      {msg.status === "active" ? `${daysLeft}d left` : "Expired"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <CheckCircle2 size={13} />
                      {msg.readBy.length} read
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {composing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            padding: "1rem",
            background: "color-mix(in oklch, var(--admin-ink) 40%, transparent)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setComposing(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "42rem",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.5rem",
              borderRadius: "1rem",
              background: "var(--admin-surface)",
              boxShadow: "0 8px 24px var(--color-shadow-soft)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <header style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>New message</h2>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.78rem", color: "var(--admin-muted)" }}>
                  Message expires in 120 days
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComposing(false)}
                style={{ padding: "0.4rem", border: 0, background: "transparent", color: "var(--admin-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </header>

            <div style={{ display: "grid", gap: "1rem" }}>
              {/* Recipients */}
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.74rem", fontWeight: 750, color: "var(--admin-muted)" }}>
                  Recipients
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setDraftRecipientType("all")}
                    style={{
                      flex: 1,
                      padding: "0.6rem",
                      border: `1px solid ${draftRecipientType === "all" ? "var(--admin-green)" : "var(--admin-line)"}`,
                      borderRadius: "0.5rem",
                      background: draftRecipientType === "all" ? "var(--admin-green-soft)" : "var(--admin-surface)",
                      color: "var(--admin-ink)",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Users size={15} style={{ verticalAlign: "middle", marginRight: "0.4rem" }} />
                    All members
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftRecipientType("individual");
                      setRecipientSearchOpen(true);
                    }}
                    style={{
                      flex: 1,
                      padding: "0.6rem",
                      border: `1px solid ${draftRecipientType === "individual" ? "var(--admin-green)" : "var(--admin-line)"}`,
                      borderRadius: "0.5rem",
                      background: draftRecipientType === "individual" ? "var(--admin-green-soft)" : "var(--admin-surface)",
                      color: "var(--admin-ink)",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <User size={15} style={{ verticalAlign: "middle", marginRight: "0.4rem" }} />
                    Select individuals
                  </button>
                </div>

                {draftRecipientType === "individual" && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={() => setRecipientSearchOpen(!recipientSearchOpen)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "0.6rem 0.8rem",
                        border: "1px solid var(--admin-line)",
                        borderRadius: "0.5rem",
                        background: "var(--admin-surface)",
                        color: "var(--admin-ink)",
                        fontSize: "0.76rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <span>{draftRecipientIds.length} selected</span>
                      <ChevronDown size={16} style={{ transform: recipientSearchOpen ? "rotate(180deg)" : "none", transition: "transform 180ms" }} />
                    </button>

                    {recipientSearchOpen && (
                      <div style={{ marginTop: "0.5rem", padding: "0.75rem", border: "1px solid var(--admin-line)", borderRadius: "0.5rem", background: "var(--admin-paper)" }}>
                        <input
                          type="text"
                          placeholder="Search members..."
                          value={recipientSearchQuery}
                          onChange={(e) => setRecipientSearchQuery(e.target.value)}
                          style={{ ...inputStyle, marginBottom: "0.75rem" }}
                        />
                        <div style={{ maxHeight: "12rem", overflowY: "auto", display: "grid", gap: "0.35rem" }}>
                          {filteredMembersForPicker.map((member) => {
                            const isSelected = draftRecipientIds.includes(member.id);
                            return (
                              <label
                                key={member.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.6rem",
                                  padding: "0.5rem",
                                  borderRadius: "0.4rem",
                                  background: isSelected ? "var(--admin-green-soft)" : "transparent",
                                  cursor: "pointer",
                                  fontSize: "0.74rem",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleRecipient(member.id)}
                                  style={{ cursor: "pointer" }}
                                />
                                <span style={{ fontWeight: 600 }}>{member.fullName}</span>
                                <span style={{ color: "var(--admin-muted)", fontSize: "0.7rem" }}>{member.email}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedMembers.length > 0 && (
                      <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {selectedMembers.map((member) => (
                          <span
                            key={member.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "0.3rem 0.6rem",
                              borderRadius: "999px",
                              background: "var(--admin-green-soft)",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                            }}
                          >
                            {member.fullName}
                            <button
                              type="button"
                              onClick={() => handleToggleRecipient(member.id)}
                              style={{ padding: 0, border: 0, background: "transparent", color: "var(--admin-muted)", cursor: "pointer", display: "flex" }}
                            >
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.74rem", fontWeight: 750, color: "var(--admin-muted)" }}>
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Message subject"
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Body */}
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.74rem", fontWeight: 750, color: "var(--admin-muted)" }}>
                  Message
                </label>
                <textarea
                  placeholder="Type your message..."
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  style={textareaStyle}
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setComposing(false)}
                  className="efsw-admin-outline-action"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="efsw-admin-primary"
                >
                  <Send size={15} /> Send message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
