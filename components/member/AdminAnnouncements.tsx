"use client";

import { useEffect, useState } from "react";

type Announcement = { id: string; subject: string; body: string; createdAt: string; readAt: string | null };

export default function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/announcements?inbox=true", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load announcements");
        setItems(data.announcements || []);
      }).catch((error) => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const markRead = async (id: string) => {
    setReading(id);
    setError("");
    try {
      const response = await fetch("/api/announcements", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId: id, read: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to mark announcement as read");
      setItems((current) => current.map((item) => item.id === id ? { ...item, readAt: data.readAt } : item));
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to mark announcement as read"); }
    finally { setReading(null); }
  };

  return (
    <section aria-labelledby="member-announcements" style={{ padding: "1.5rem", border: "1px solid var(--profile-line, #d8d2c4)", borderRadius: "0.75rem", margin: "1.5rem 0" }}>
      <h2 id="member-announcements">Announcements from EFSW</h2>
      {loading && <p role="status">Loading announcements…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && items.length === 0 && <p>No announcements at the moment.</p>}
      {items.map((item) => (
        <article key={item.id} style={{ borderTop: "1px solid var(--profile-line, #d8d2c4)", padding: "1rem 0" }}>
          <h3>{item.subject}</h3>
          <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time>
          <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{item.body}</p>
          {item.readAt ? <span>Read</span> : <button type="button" disabled={reading !== null} onClick={() => void markRead(item.id)}>{reading === item.id ? "Saving…" : "Mark as read"}</button>}
        </article>
      ))}
    </section>
  );
}
