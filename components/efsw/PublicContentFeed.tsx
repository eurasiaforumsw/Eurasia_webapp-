/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V4 */
"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  ADMIN_CONTENT_KEY,
  getPublishedAdminContent,
  type AdminContentKind,
} from "@/lib/admin-data";

export type PublicContentItem = {
  id: string;
  category: string;
  title: string;
  summary: string;
};

type PublicContentFeedProps = {
  kind: AdminContentKind;
  initialItems: PublicContentItem[];
  linkLabel: string;
};

const itemNumber = (index: number) => String(index + 1).padStart(2, "0");

export default function PublicContentFeed({
  kind,
  initialItems,
  linkLabel,
}: PublicContentFeedProps) {
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    const refresh = () => {
      const published = getPublishedAdminContent(kind).map((item) => ({
        id: item.id,
        category: item.category,
        title: item.title,
        summary: item.summary,
      }));
      setItems(published);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_CONTENT_KEY) refresh();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [kind]);

  const emptyItem = kind === "news"
    ? { category: "Newsroom", title: "ยังไม่มีข่าวที่เผยแพร่", summary: "ข่าวที่ผู้ดูแลกำหนดสถานะเผยแพร่แล้วจะปรากฏในพื้นที่นี้" }
    : { category: "Resources", title: "ยังไม่มีเอกสารที่เผยแพร่", summary: "เอกสารที่ผู้ดูแลกำหนดสถานะเผยแพร่แล้วจะปรากฏในพื้นที่นี้" };

  if (kind === "news") {
    return (
      <section className="efsw-news-page-list" aria-live="polite">
        {items.length ? items.map((item, index) => (
          <article key={item.id}>
            <div>
              <span>{itemNumber(index)}</span>
              <small>{item.category}</small>
            </div>
            <div>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <a href="mailto:support@eurasiaforumsw.org" className="efsw-text-link">
                {linkLabel} <ArrowUpRight size={16} />
              </a>
            </div>
          </article>
        )) : (
          <article>
            <div><span aria-hidden="true">--</span><small>{emptyItem.category}</small></div>
            <div><h2>{emptyItem.title}</h2><p>{emptyItem.summary}</p></div>
          </article>
        )}
      </section>
    );
  }

  return (
    <section className="efsw-resource-list" aria-live="polite">
      {items.length ? items.map((item, index) => (
        <article key={item.id}>
          <div className="efsw-resource-list__label">
            <span>{itemNumber(index)}</span>
            <small>{item.category}</small>
          </div>
          <div>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <a href="mailto:support@eurasiaforumsw.org" className="efsw-text-link">
              {linkLabel} <ArrowUpRight size={16} />
            </a>
          </div>
        </article>
      )) : (
        <article>
          <div className="efsw-resource-list__label"><span aria-hidden="true">--</span><small>{emptyItem.category}</small></div>
          <div><h2>{emptyItem.title}</h2><p>{emptyItem.summary}</p></div>
        </article>
      )}
    </section>
  );
}
