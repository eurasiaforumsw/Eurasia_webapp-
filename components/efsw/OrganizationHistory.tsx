"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { AdminHistoryItem, defaultLayoutConfig, getAdminLayout } from "@/lib/admin-data";

const ordered = (items: AdminHistoryItem[]) => [...items].sort((a, b) => a.year - b.year);

export function OrganizationHistory() {
  const [items, setItems] = useState<AdminHistoryItem[]>(defaultLayoutConfig.historyItems);
  const [sectionTitle, setSectionTitle] = useState(defaultLayoutConfig.historySectionTitle);
  const [sectionIntro, setSectionIntro] = useState(defaultLayoutConfig.historySectionIntro);

  useEffect(() => {
    const layout = getAdminLayout();
    setItems(ordered(layout.historyItems));
    setSectionTitle(layout.historySectionTitle);
    setSectionIntro(layout.historySectionIntro);
  }, []);

  const current = items.find((item) => item.isCurrent) || items[items.length - 1];

  if (!items.length) return null;

  return (
    <section className="efsw-org-history" id="history" aria-labelledby="history-title">
      <div className="efsw-org-history__inner">
        <div className="efsw-org-history__intro" data-reveal="fade">
          <h2 id="history-title">{sectionTitle}</h2>
          <p>{sectionIntro}</p>
        </div>

        <div className="efsw-org-history__timeline" aria-label="Organisation history timeline">
          {items.map((item, index) => (
            <article key={item.id} className={`efsw-history-item${item.id === current?.id ? " is-current" : ""}`} data-reveal="slide">
              <div className="efsw-history-item__year"><span>{item.year}</span></div>
              <div className="efsw-history-item__body">
                <span className="efsw-history-item__eyebrow">{item.id === current?.id ? "Current chapter" : `Milestone ${String(index + 1).padStart(2, "0")}`}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              {item.image ? (
                <figure className="efsw-history-item__media">
                  <img src={item.image} alt={item.imageAlt || item.title} loading="lazy" />
                  {item.id === current?.id && <figcaption><ArrowUpRight size={14} aria-hidden /> EFSW today</figcaption>}
                </figure>
              ) : (
                <div className="efsw-history-item__media efsw-history-item__media--empty" aria-hidden="true">
                  <span>{String(item.year).slice(-2)}</span>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
