"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Mail, MessageSquare, Plus, RefreshCw, Search, Send, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminAnnouncements from "@/components/member/AdminAnnouncements";
import styles from "./messages.module.css";

type Participant = { id: string; fullName: string };
type Conversation = { id: string; participants: Participant[]; unreadCount: number; lastMessage: { content: string; createdAt: string } | null };
type Message = { id: string; content: string; createdAt: string; isOwn: boolean; sender: Participant };
type SearchMember = Participant & { email: string };

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 ? "Please sign in to view your messages." : data.error || "Unable to load messages.");
  return data as T;
}

const conversationName = (item: Conversation) => item.participants.map((person) => person.fullName).join(", ") || "Conversation";
const notifyRead = () => window.dispatchEvent(new Event("efsw:messages-read"));
const dateLabel = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const selectedRef = useRef("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [listError, setListError] = useState("");
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [creating, setCreating] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await request<{ conversations: Conversation[] }>("/api/messages/conversations", { signal });
      if (signal?.aborted) return;
      setConversations(data.conversations);
      setAuthenticated(true);
      setListError("");
      setSelectedId((current) => current || data.conversations[0]?.id || "");
    } catch (error) { if (!signal?.aborted) setListError(error instanceof Error ? error.message : "Unable to load conversations."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);

  const loadMessages = useCallback(async (id: string, signal?: AbortSignal) => {
    const data = await request<{ messages: Message[] }>(`/api/messages/${encodeURIComponent(id)}`, { signal });
    if (signal?.aborted || selectedRef.current !== id) return;
    setMessages(data.messages);
    setThreadError("");
    setConversations((current) => current.map((item) => item.id === id ? { ...item, unreadCount: 0 } : item));
    notifyRead();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadConversations(controller.signal);
    const timer = window.setInterval(() => void loadConversations(controller.signal), 30000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [loadConversations]);

  useEffect(() => {
    selectedRef.current = selectedId;
    if (!selectedId) return;
    const controller = new AbortController();
    setMessages([]); setDraft(""); setThreadError(""); setThreadLoading(true);
    const refresh = async () => {
      try { await loadMessages(selectedId, controller.signal); }
      catch (error) { if (!controller.signal.aborted) setThreadError(error instanceof Error ? error.message : "Unable to load conversation."); }
      finally { if (!controller.signal.aborted) setThreadLoading(false); }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [selectedId, loadMessages]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [messages]);

  const findMembers = async (event: FormEvent) => {
    event.preventDefault(); setSearching(true); setSearchError(""); setSearched(false);
    try {
      const data = await request<{ members: SearchMember[] }>(`/api/messages/members/search?q=${encodeURIComponent(search.trim())}`);
      setSearchResults(data.members); setSearched(true);
    } catch (error) { setSearchError(error instanceof Error ? error.message : "Unable to search members."); }
    finally { setSearching(false); }
  };

  const startConversation = async (member: SearchMember) => {
    setCreating(member.id); setSearchError("");
    try {
      const data = await request<{ conversationId: string }>("/api/messages/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientMemberId: member.id }) });
      await loadConversations(); setSelectedId(data.conversationId); setShowSearch(false); setSearch(""); setSearchResults([]); setSearched(false);
    } catch (error) { setSearchError(error instanceof Error ? error.message : "Unable to start conversation."); }
    finally { setCreating(""); }
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const id = selectedId, content = draft.trim();
    if (!id || !content || sending) return;
    setSending(true); setThreadError("");
    try {
      await request("/api/messages/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: id, content }) });
      if (selectedRef.current === id) setDraft("");
      await loadMessages(id); await loadConversations();
    } catch (error) { setThreadError(error instanceof Error ? error.message : "Unable to send message."); }
    finally { setSending(false); }
  };

  const selected = conversations.find((item) => item.id === selectedId);
  const unread = conversations.reduce((count, item) => count + item.unreadCount, 0);

  return (
    <main className="efsw-interest-page">
      <header className="efsw-interest-page__head">
        <div><h1 className="efsw-interest-page__title">Messages</h1><p className="efsw-interest-page__lede">Conversations with forum members and announcements from EFSW.</p></div>
        <div className={styles.headerActions}><span className="efsw-interest-page__count"><Mail size={14} aria-hidden />{unread} unread</span><button type="button" className={styles.iconButton} onClick={() => router.back()} aria-label="Close messages"><X size={18} /></button></div>
      </header>
      {listError && <div role="alert" className={styles.error}>{listError} <Link href="/member/login">Sign in</Link> <button type="button" onClick={() => void loadConversations()}>Retry</button></div>}
      {loading ? <p role="status">Loading conversations…</p> : authenticated && (
        <div className={styles.inbox}>
          <aside className={styles.sidebar} aria-label="Conversations">
            <div className={styles.toolbar}><h2>Conversations</h2><button type="button" className={styles.iconButton} onClick={() => void loadConversations()} aria-label="Refresh conversations"><RefreshCw size={16} /></button></div>
            <button type="button" className={styles.primary} onClick={() => setShowSearch((current) => !current)} aria-expanded={showSearch}><Plus size={16} />New message</button>
            {showSearch && <div className={styles.search}><form onSubmit={findMembers}><label htmlFor="message-recipient-search">Find a member</label><div className={styles.searchRow}><input id="message-recipient-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or email" minLength={2} maxLength={100} required /><button type="submit" className={styles.iconButton} disabled={searching || search.trim().length < 2} aria-label="Search members"><Search size={17} /></button></div></form>{searching && <p role="status">Searching…</p>}{searchError && <p role="alert" className={styles.error}>{searchError}</p>}{searched && !searchResults.length && <p>No matching members.</p>}{searchResults.map((member) => <button key={member.id} type="button" className={styles.recipient} disabled={Boolean(creating)} onClick={() => void startConversation(member)}><strong>{member.fullName}</strong><small>{creating === member.id ? "Opening…" : member.email}</small></button>)}</div>}
            <div className={styles.conversations}>{!conversations.length && <p>No conversations yet. Find a member to send your first message.</p>}{conversations.map((item) => <button key={item.id} type="button" className={`${styles.conversation} ${item.id === selectedId ? styles.selected : ""}`} aria-pressed={item.id === selectedId} onClick={() => setSelectedId(item.id)}><span><strong>{conversationName(item)}</strong>{item.unreadCount > 0 && <span className={styles.badge}>{item.unreadCount}</span>}</span><small>{item.lastMessage?.content || "Start the conversation"}</small></button>)}</div>
          </aside>
          <section className={styles.thread} aria-label="Selected conversation">
            {!selectedId ? <div className={styles.empty}><MessageSquare size={28} aria-hidden /><p>Select a conversation or start a new message.</p></div> : <><div className={styles.toolbar}><h2>{selected ? conversationName(selected) : "Conversation"}</h2><button type="button" className={styles.iconButton} onClick={() => void loadMessages(selectedId).catch((error) => setThreadError(error.message))} aria-label="Refresh messages"><RefreshCw size={16} /></button></div>{threadError && <p role="alert" className={styles.error}>{threadError}</p>}<div className={styles.messages} aria-live="polite" aria-busy={threadLoading}>{threadLoading ? <p role="status">Loading messages…</p> : !messages.length && <p className={styles.empty}>No messages yet. Send a message below.</p>}{messages.map((message) => <article key={message.id} className={`${styles.message} ${message.isOwn ? styles.own : ""}`}><strong>{message.isOwn ? "You" : message.sender.fullName}</strong><p>{message.content}</p><time dateTime={message.createdAt}>{dateLabel(message.createdAt)}</time></article>)}<div ref={endRef} /></div><form className={styles.compose} onSubmit={sendMessage}><label htmlFor="message-content">Message</label><textarea id="message-content" value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={2000} placeholder="Write a message…" disabled={sending || threadLoading} required /><div><small>{draft.length}/2000 · Messages expire after 120 days.</small><button type="submit" className={styles.primary} disabled={sending || threadLoading || !draft.trim()}><Send size={15} />{sending ? "Sending…" : "Send"}</button></div></form></>}
          </section>
        </div>
      )}
      {authenticated && <AdminAnnouncements />}
    </main>
  );
}
