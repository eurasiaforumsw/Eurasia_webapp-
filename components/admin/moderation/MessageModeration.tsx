"use client";

import { memo, useState, useMemo, useCallback, useEffect, CSSProperties } from "react";
import {
  Search,
  Link as LinkIcon,
  MessageSquare,
  Trash2,
  Ban,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Filter,
  Calendar,
  Loader,
  Flag,
} from "lucide-react";

interface AdminMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  conversation_id: string;
  recipient_name?: string;
  recipient_email?: string;
  content: string;
  created_at: string;
  read_at: string | null;
  deleted_at: string | null;
  contains_link: boolean;
  is_flagged: boolean;
}

interface MessageStats {
  total_today: number;
  with_links: number;
  flagged: number;
}

interface MessageModerationProps {
  onSuspendMember?: (memberId: string) => void;
}

const ITEMS_PER_PAGE = 50;

const styles = {
  container: {
    display: "grid",
    gap: "1.5rem",
  } as CSSProperties,
  header: {
    display: "flex",
    alignItems: "start",
    justifyContent: "space-between",
    gap: "1rem",
  } as CSSProperties,
  title: {
    fontSize: "1.4rem",
    fontWeight: 700,
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "var(--admin-ink)",
  } as CSSProperties,
  lede: {
    fontSize: "0.78rem",
    color: "var(--admin-muted)",
    margin: "0.3rem 0 0",
  } as CSSProperties,
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))",
    gap: "1rem",
  } as CSSProperties,
  statCard: {
    display: "grid",
    gap: "0.5rem",
    padding: "1rem",
    background: "var(--admin-surface-deep)",
    borderRadius: "0.75rem",
    border: "1px solid var(--admin-line)",
  } as CSSProperties,
  statValue: {
    fontSize: "1.8rem",
    fontWeight: 750,
    color: "var(--admin-ink)",
  } as CSSProperties,
  statLabel: {
    fontSize: "0.72rem",
    color: "var(--admin-muted)",
  } as CSSProperties,
  filterBar: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    alignItems: "center",
  } as CSSProperties,
  input: {
    border: "1px solid var(--admin-line)",
    borderRadius: "0.5rem",
    background: "var(--admin-surface)",
    color: "var(--admin-ink)",
    padding: "0.55rem 0.7rem",
    fontSize: "0.78rem",
    fontFamily: "inherit",
  } as CSSProperties,
  select: {
    border: "1px solid var(--admin-line)",
    borderRadius: "0.5rem",
    background: "var(--admin-surface)",
    color: "var(--admin-ink)",
    padding: "0.55rem 0.7rem",
    fontSize: "0.78rem",
    fontFamily: "inherit",
  } as CSSProperties,
  tableContainer: {
    borderRadius: "0.75rem",
    border: "1px solid var(--admin-line)",
    overflow: "hidden",
  } as CSSProperties,
  table: {
    width: "100%",
    borderCollapse: "collapse",
  } as CSSProperties,
  thead: {
    background: "var(--admin-surface-deep)",
    borderBottom: "1px solid var(--admin-line)",
  } as CSSProperties,
  th: {
    padding: "0.75rem",
    textAlign: "left",
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "var(--admin-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  } as CSSProperties,
  tbody: {
    borderCollapse: "collapse" as const,
  } as CSSProperties,
  tr: {
    borderBottom: "1px solid var(--admin-line)",
    transition: "background-color 150ms",
    cursor: "pointer",
  } as CSSProperties,
  trHover: {
    background: "var(--admin-surface-deep)",
  } as CSSProperties,
  td: {
    padding: "0.75rem",
    fontSize: "0.75rem",
    color: "var(--admin-ink)",
  } as CSSProperties,
  badge: {
    display: "inline-block",
    padding: "0.2rem 0.5rem",
    borderRadius: "0.3rem",
    fontSize: "0.65rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
  } as CSSProperties,
  linkBadge: {
    background: "var(--admin-blue-soft)",
    color: "var(--admin-blue)",
  } as CSSProperties,
  flagBadge: {
    background: "var(--admin-red-soft)",
    color: "var(--admin-red)",
  } as CSSProperties,
  actionButton: {
    padding: "0.4rem",
    border: 0,
    background: "transparent",
    color: "var(--admin-muted)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.7rem",
    transition: "color 150ms",
  } as CSSProperties,
  paginationContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem",
    background: "var(--admin-surface-deep)",
    borderTop: "1px solid var(--admin-line)",
    borderRadius: "0 0 0.75rem 0.75rem",
    fontSize: "0.75rem",
    color: "var(--admin-muted)",
  } as CSSProperties,
  paginationButtons: {
    display: "flex",
    gap: "0.5rem",
  } as CSSProperties,
  paginationButton: {
    padding: "0.4rem 0.6rem",
    border: "1px solid var(--admin-line)",
    background: "var(--admin-surface)",
    color: "var(--admin-ink)",
    borderRadius: "0.3rem",
    cursor: "pointer",
    fontSize: "0.7rem",
    fontWeight: 600,
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
    maxWidth: "48rem",
    maxHeight: "85vh",
    overflowY: "auto",
    padding: "1.5rem",
    borderRadius: "1rem",
    background: "var(--admin-surface)",
    boxShadow: "0 8px 24px var(--color-shadow-soft)",
  } as CSSProperties,
  emptyState: {
    padding: "3rem 1.5rem",
    textAlign: "center",
    color: "var(--admin-muted)",
  } as CSSProperties,
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem",
    color: "var(--admin-muted)",
  } as CSSProperties,
};

export const MessageModeration = memo(function MessageModeration({
  onSuspendMember,
}: MessageModerationProps) {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [stats, setStats] = useState<MessageStats>({
    total_today: 0,
    with_links: 0,
    flagged: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "with_links" | "flagged">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showSuspensionConfirm, setShowSuspensionConfirm] = useState(false);
  const [suspendingMemberId, setSuspendingMemberId] = useState<string | null>(null);

  // Fetch messages
  const fetchMessages = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", ITEMS_PER_PAGE.toString());
      if (search) params.set("search", search);
      if (filterType !== "all") params.set("filterType", filterType);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await fetch(`/api/admin/messages/all?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);
      setStats(data.stats);
      setTotalMessages(data.total);
      setHasMore(data.hasMore);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filterType, startDate, endDate]);

  // Initial load and filter changes
  useEffect(() => {
    fetchMessages(1);
  }, [search, filterType, startDate, endDate, fetchMessages]);

  // Handle delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Delete this message? This cannot be undone.")) return;

    try {
      const response = await fetch("/api/admin/messages/all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      if (!response.ok) throw new Error("Failed to delete message");

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setShowMessageModal(false);
    } catch (err) {
      alert("Failed to delete message: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  // Handle suspend sender
  const handleSuspendSender = (senderId: string) => {
    setSuspendingMemberId(senderId);
    setShowSuspensionConfirm(true);
  };

  const confirmSuspension = () => {
    if (suspendingMemberId && onSuspendMember) {
      onSuspendMember(suspendingMemberId);
      setShowSuspensionConfirm(false);
      setSuspendingMemberId(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Truncate message
  const truncateMessage = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const totalPages = Math.ceil(totalMessages / ITEMS_PER_PAGE);

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <MessageSquare size={28} strokeWidth={2.2} />
            Message Moderation
          </h1>
          <p style={styles.lede}>
            Monitor, search, and moderate all messages across conversations
          </p>
        </div>
      </header>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <MessageSquare size={20} style={{ color: "var(--admin-green)" }} />
          <div style={styles.statValue}>{stats.total_today}</div>
          <div style={styles.statLabel}>Messages today</div>
        </div>
        <div style={styles.statCard}>
          <LinkIcon size={20} style={{ color: "var(--admin-blue)" }} />
          <div style={styles.statValue}>{stats.with_links}</div>
          <div style={styles.statLabel}>Contains links</div>
        </div>
        <div style={styles.statCard}>
          <Flag size={20} style={{ color: "var(--admin-red)" }} />
          <div style={styles.statValue}>{stats.flagged}</div>
          <div style={styles.statLabel}>Flagged (spam)</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <div style={{ position: "relative", flex: "1 1 20rem" }}>
          <Search size={15} style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", color: "var(--admin-muted)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search by sender name or message content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...styles.input,
              paddingLeft: "2.2rem",
              width: "100%",
            }}
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          style={{ ...styles.select, minWidth: "12rem" }}
        >
          <option value="all">All messages</option>
          <option value="with_links">With links only</option>
          <option value="flagged">Flagged only</option>
        </select>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Calendar size={15} style={{ color: "var(--admin-muted)" }} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={styles.select}
            placeholder="Start date"
          />
          <span style={{ color: "var(--admin-muted)" }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={styles.select}
            placeholder="End date"
          />
        </div>

        {(search || filterType !== "all" || startDate || endDate) && (
          <button
            onClick={() => {
              setSearch("");
              setFilterType("all");
              setStartDate("");
              setEndDate("");
              setCurrentPage(1);
            }}
            style={{
              ...styles.actionButton,
              background: "var(--admin-surface-deep)",
              border: "1px solid var(--admin-line)",
              padding: "0.4rem 0.75rem",
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Messages Table */}
      {error && (
        <div
          style={{
            padding: "1rem",
            borderRadius: "0.5rem",
            background: "var(--admin-red-soft)",
            color: "var(--admin-red)",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            fontSize: "0.75rem",
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={styles.tableContainer}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <Loader size={20} style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ marginLeft: "0.75rem" }}>Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyState}>
            <MessageSquare size={40} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: "0.85rem" }}>
              {search || filterType !== "all" || startDate || endDate
                ? "No messages match your filters."
                : "No messages found."}
            </p>
          </div>
        ) : (
          <>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>Sender</th>
                  <th style={styles.th}>Message</th>
                  <th style={styles.th}>Links</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody style={styles.tbody}>
                {messages.map((msg) => (
                  <tr
                    key={msg.id}
                    style={styles.tr}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "var(--admin-surface-deep)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "";
                    }}
                  >
                    <td style={styles.td}>
                      <div style={{ fontWeight: 600 }}>{msg.sender_name}</div>
                      <div style={{ fontSize: "0.68rem", color: "var(--admin-muted)" }}>{msg.sender_email}</div>
                    </td>
                    <td style={{ ...styles.td, maxWidth: "30rem" }}>
                      <div
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          cursor: "pointer",
                          color: "var(--admin-blue)",
                        }}
                        onClick={() => {
                          setSelectedMessage(msg);
                          setShowMessageModal(true);
                        }}
                      >
                        {truncateMessage(msg.content)}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {msg.contains_link && (
                        <span style={{ ...styles.badge, ...styles.linkBadge }}>
                          <LinkIcon size={10} style={{ display: "inline", marginRight: "0.2rem" }} />
                          Link
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {msg.is_flagged && (
                        <span style={{ ...styles.badge, ...styles.flagBadge }}>
                          <Flag size={10} style={{ display: "inline", marginRight: "0.2rem" }} />
                          Flagged
                        </span>
                      )}
                      {msg.read_at && (
                        <div style={{ fontSize: "0.65rem", color: "var(--admin-muted)" }}>Read</div>
                      )}
                    </td>
                    <td style={styles.td}>{formatDate(msg.created_at)}</td>
                    <td style={{ ...styles.td, display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => {
                          setSelectedMessage(msg);
                          setShowMessageModal(true);
                        }}
                        style={styles.actionButton}
                        title="View full message"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        style={{ ...styles.actionButton, color: "var(--admin-red)" }}
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => handleSuspendSender(msg.sender_id)}
                        style={{ ...styles.actionButton, color: "var(--admin-orange)" }}
                        title="Suspend sender"
                      >
                        <Ban size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={styles.paginationContainer}>
                <span>
                  Page {currentPage} of {totalPages} ({totalMessages} total messages)
                </span>
                <div style={styles.paginationButtons}>
                  <button
                    onClick={() => fetchMessages(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    style={{
                      ...styles.paginationButton,
                      opacity: currentPage === 1 ? 0.5 : 1,
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => fetchMessages(Math.min(totalPages, currentPage + 1))}
                    disabled={!hasMore}
                    style={{
                      ...styles.paginationButton,
                      opacity: !hasMore ? 0.5 : 1,
                      cursor: !hasMore ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Message Detail Modal */}
      {showMessageModal && selectedMessage && (
        <div
          style={styles.modalBackdrop}
          onClick={() => setShowMessageModal(false)}
        >
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
                  Message Details
                </h2>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                  {formatDate(selectedMessage.created_at)}
                </p>
              </div>
              <button
                onClick={() => setShowMessageModal(false)}
                style={{
                  padding: "0.4rem",
                  border: 0,
                  background: "transparent",
                  color: "var(--admin-muted)",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "var(--admin-muted)", marginBottom: "0.3rem" }}>
                  Sender
                </label>
                <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  {selectedMessage.sender_name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>
                  {selectedMessage.sender_email}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, color: "var(--admin-muted)", marginBottom: "0.3rem" }}>
                  Message Content
                </label>
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    background: "var(--admin-surface-deep)",
                    border: "1px solid var(--admin-line)",
                    fontSize: "0.8rem",
                    lineHeight: "1.6",
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedMessage.content}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                {selectedMessage.contains_link && (
                  <div
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      background: "var(--admin-blue-soft)",
                      border: "1px solid var(--admin-blue)",
                    }}
                  >
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--admin-blue)" }}>
                      Contains Link
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--admin-blue)", marginTop: "0.2rem" }}>
                      Yes
                    </div>
                  </div>
                )}
                {selectedMessage.is_flagged && (
                  <div
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      background: "var(--admin-red-soft)",
                      border: "1px solid var(--admin-red)",
                    }}
                  >
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--admin-red)" }}>
                      Flagged as Spam
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--admin-red)", marginTop: "0.2rem" }}>
                      Yes
                    </div>
                  </div>
                )}
                {selectedMessage.read_at && (
                  <div
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.5rem",
                      background: "var(--admin-green-soft)",
                      border: "1px solid var(--admin-green)",
                    }}
                  >
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--admin-green)" }}>
                      Read Status
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--admin-green)", marginTop: "0.2rem" }}>
                      {formatDate(selectedMessage.read_at)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowMessageModal(false)}
                style={{
                  padding: "0.6rem 1rem",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "0.5rem",
                  background: "var(--admin-surface)",
                  color: "var(--admin-ink)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDeleteMessage(selectedMessage.id);
                }}
                style={{
                  padding: "0.6rem 1rem",
                  border: 0,
                  borderRadius: "0.5rem",
                  background: "var(--admin-red-soft)",
                  color: "var(--admin-red)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                <Trash2 size={14} style={{ display: "inline", marginRight: "0.4rem" }} />
                Delete Message
              </button>
              <button
                onClick={() => {
                  handleSuspendSender(selectedMessage.sender_id);
                }}
                style={{
                  padding: "0.6rem 1rem",
                  border: 0,
                  borderRadius: "0.5rem",
                  background: "var(--admin-orange-soft)",
                  color: "var(--admin-orange)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                <Ban size={14} style={{ display: "inline", marginRight: "0.4rem" }} />
                Suspend Sender
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Confirmation Modal */}
      {showSuspensionConfirm && (
        <div
          style={styles.modalBackdrop}
          onClick={() => setShowSuspensionConfirm(false)}
        >
          <div
            style={{
              ...styles.modalContent,
              maxWidth: "28rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              Suspend Member
            </h2>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--admin-muted)", marginBottom: "1.5rem", lineHeight: "1.5" }}>
              Are you sure you want to suspend this member? They will not be able to send messages until the suspension is lifted.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowSuspensionConfirm(false)}
                style={{
                  padding: "0.6rem 1rem",
                  border: "1px solid var(--admin-line)",
                  borderRadius: "0.5rem",
                  background: "var(--admin-surface)",
                  color: "var(--admin-ink)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSuspension}
                style={{
                  padding: "0.6rem 1rem",
                  border: 0,
                  borderRadius: "0.5rem",
                  background: "var(--admin-red-soft)",
                  color: "var(--admin-red)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                <Ban size={14} style={{ display: "inline", marginRight: "0.4rem" }} />
                Suspend Member
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
      `}</style>
    </div>
  );
});
