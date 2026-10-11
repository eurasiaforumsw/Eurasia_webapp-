"use client";

import { useState, useMemo } from "react";
import { Download, Eye, TrendingUp, Calendar } from "lucide-react";
import { getPublishedAdminContent } from "@/lib/admin-data";
import { getContentEngagement } from "@/lib/content-engagement";

interface DocumentStats {
  id: string;
  title: string;
  author: string;
  downloads: number;
  views: number;
  likes: number;
  fileName?: string;
  fileSize?: number;
  publishedAt?: string;
}

export function AdminAcademicAnalyticsView() {
  const [sortBy, setSortBy] = useState<"downloads" | "views" | "recent">("downloads");

  const documentStats = useMemo(() => {
    const docs = getPublishedAdminContent("academic");
    const stats: DocumentStats[] = docs.map((doc) => {
      const engagement = getContentEngagement(doc.id);
      return {
        id: doc.id,
        title: doc.title,
        author: doc.author || "Unknown",
        downloads: engagement.downloadCount || 0,
        views: engagement.viewCount || 0,
        likes: engagement.likeCount || 0,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        publishedAt: doc.publishAt,
      };
    });

    // Sort
    stats.sort((a, b) => {
      switch (sortBy) {
        case "downloads":
          return b.downloads - a.downloads;
        case "views":
          return b.views - a.views;
        case "recent":
          const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return dateB - dateA;
        default:
          return 0;
      }
    });

    return stats;
  }, [sortBy]);

  const totalStats = useMemo(() => {
    return documentStats.reduce(
      (acc, doc) => ({
        downloads: acc.downloads + doc.downloads,
        views: acc.views + doc.views,
        likes: acc.likes + doc.likes,
      }),
      { downloads: 0, views: 0, likes: 0 }
    );
  }, [documentStats]);

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "—";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="admin-academic-analytics">
      <header className="admin-academic-analytics__header">
        <div>
          <h2>Academic Document Analytics</h2>
          <p>Track downloads, views, and engagement for your academic library</p>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="admin-academic-analytics__summary">
        <div className="admin-academic-analytics__stat">
          <div className="admin-academic-analytics__stat-icon" style={{ background: "var(--admin-teal-alpha)" }}>
            <Download size={24} color="var(--admin-teal)" />
          </div>
          <div className="admin-academic-analytics__stat-content">
            <div className="admin-academic-analytics__stat-value">{totalStats.downloads.toLocaleString()}</div>
            <div className="admin-academic-analytics__stat-label">Total Downloads</div>
          </div>
        </div>

        <div className="admin-academic-analytics__stat">
          <div className="admin-academic-analytics__stat-icon" style={{ background: "var(--admin-blue-alpha)" }}>
            <Eye size={24} color="var(--admin-blue)" />
          </div>
          <div className="admin-academic-analytics__stat-content">
            <div className="admin-academic-analytics__stat-value">{totalStats.views.toLocaleString()}</div>
            <div className="admin-academic-analytics__stat-label">Total Views</div>
          </div>
        </div>

        <div className="admin-academic-analytics__stat">
          <div className="admin-academic-analytics__stat-icon" style={{ background: "var(--admin-pink-alpha)" }}>
            <TrendingUp size={24} color="var(--admin-pink)" />
          </div>
          <div className="admin-academic-analytics__stat-content">
            <div className="admin-academic-analytics__stat-value">{totalStats.likes.toLocaleString()}</div>
            <div className="admin-academic-analytics__stat-label">Total Likes</div>
          </div>
        </div>

        <div className="admin-academic-analytics__stat">
          <div className="admin-academic-analytics__stat-icon" style={{ background: "var(--admin-green-alpha)" }}>
            <TrendingUp size={24} color="var(--admin-green)" />
          </div>
          <div className="admin-academic-analytics__stat-content">
            <div className="admin-academic-analytics__stat-value">{documentStats.length}</div>
            <div className="admin-academic-analytics__stat-label">Documents</div>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="admin-academic-analytics__controls">
        <label>
          <span className="admin-academic-analytics__label">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="admin-academic-analytics__select"
          >
            <option value="downloads">Most Downloads</option>
            <option value="views">Most Views</option>
            <option value="recent">Recently Published</option>
          </select>
        </label>
      </div>

      {/* Documents Table */}
      <div className="admin-academic-analytics__table-wrapper">
        {documentStats.length === 0 ? (
          <div className="admin-academic-analytics__empty">
            <TrendingUp size={48} />
            <h3>No documents yet</h3>
            <p>Published documents will appear here with their engagement metrics</p>
          </div>
        ) : (
          <table className="admin-academic-analytics__table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Author</th>
                <th className="admin-academic-analytics__align-right">Downloads</th>
                <th className="admin-academic-analytics__align-right">Views</th>
                <th className="admin-academic-analytics__align-right">Likes</th>
                <th className="admin-academic-analytics__align-right">Size</th>
                <th className="admin-academic-analytics__align-right">Published</th>
              </tr>
            </thead>
            <tbody>
              {documentStats.map((doc) => (
                <tr key={doc.id} className="admin-academic-analytics__row">
                  <td className="admin-academic-analytics__title">{doc.title}</td>
                  <td className="admin-academic-analytics__author">{doc.author}</td>
                  <td className="admin-academic-analytics__stat-cell admin-academic-analytics__align-right">
                    <span className="admin-academic-analytics__badge admin-academic-analytics__badge--downloads">
                      <Download size={14} />
                      {doc.downloads}
                    </span>
                  </td>
                  <td className="admin-academic-analytics__stat-cell admin-academic-analytics__align-right">
                    <span className="admin-academic-analytics__badge admin-academic-analytics__badge--views">
                      <Eye size={14} />
                      {doc.views}
                    </span>
                  </td>
                  <td className="admin-academic-analytics__stat-cell admin-academic-analytics__align-right">
                    <span className="admin-academic-analytics__badge admin-academic-analytics__badge--likes">
                      {doc.likes}
                    </span>
                  </td>
                  <td className="admin-academic-analytics__size admin-academic-analytics__align-right">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="admin-academic-analytics__date admin-academic-analytics__align-right">
                    {doc.publishedAt
                      ? new Date(doc.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "2-digit",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .admin-academic-analytics {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 2rem;
        }

        .admin-academic-analytics__header {
          border-bottom: 1px solid var(--admin-line);
          padding-bottom: 1.5rem;
        }

        .admin-academic-analytics__header h2 {
          margin: 0 0 0.25rem;
          color: var(--admin-ink);
          font-size: 1.5rem;
        }

        .admin-academic-analytics__header p {
          margin: 0;
          color: var(--admin-muted);
          font-size: 0.9rem;
        }

        .admin-academic-analytics__summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .admin-academic-analytics__stat {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: var(--admin-surface-deep);
          border: 1px solid var(--admin-line);
          border-radius: 8px;
        }

        .admin-academic-analytics__stat-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-academic-analytics__stat-content {
          flex: 1;
        }

        .admin-academic-analytics__stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--admin-ink);
          line-height: 1;
        }

        .admin-academic-analytics__stat-label {
          font-size: 0.8rem;
          color: var(--admin-muted);
          font-weight: 500;
          margin-top: 0.25rem;
        }

        .admin-academic-analytics__controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .admin-academic-analytics__controls label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .admin-academic-analytics__label {
          color: var(--admin-ink);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .admin-academic-analytics__select {
          padding: 0.5rem 0.75rem;
          background: var(--admin-surface);
          border: 1px solid var(--admin-line);
          border-radius: 4px;
          color: var(--admin-ink);
          font-size: 0.85rem;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }

        .admin-academic-analytics__select:hover {
          border-color: var(--admin-teal);
        }

        .admin-academic-analytics__table-wrapper {
          overflow-x: auto;
          border: 1px solid var(--admin-line);
          border-radius: 8px;
          background: var(--admin-surface);
        }

        .admin-academic-analytics__table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .admin-academic-analytics__table thead {
          background: var(--admin-surface-deep);
          border-bottom: 2px solid var(--admin-line);
        }

        .admin-academic-analytics__table th {
          padding: 1rem;
          text-align: left;
          color: var(--admin-muted);
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .admin-academic-analytics__table td {
          padding: 1rem;
          border-bottom: 1px solid var(--admin-line);
          color: var(--admin-ink);
        }

        .admin-academic-analytics__row:hover {
          background: var(--admin-surface-deep);
        }

        .admin-academic-analytics__title {
          font-weight: 600;
          max-width: 300px;
        }

        .admin-academic-analytics__author {
          color: var(--admin-muted);
          font-size: 0.8rem;
        }

        .admin-academic-analytics__stat-cell {
          padding: 1rem;
        }

        .admin-academic-analytics__badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.8rem;
          white-space: nowrap;
        }

        .admin-academic-analytics__badge--downloads {
          background: var(--admin-teal-alpha);
          color: var(--admin-teal);
        }

        .admin-academic-analytics__badge--views {
          background: var(--admin-blue-alpha);
          color: var(--admin-blue);
        }

        .admin-academic-analytics__badge--likes {
          background: var(--admin-pink-alpha);
          color: var(--admin-pink);
        }

        .admin-academic-analytics__size,
        .admin-academic-analytics__date {
          color: var(--admin-muted);
          font-size: 0.8rem;
        }

        .admin-academic-analytics__align-right {
          text-align: right;
        }

        .admin-academic-analytics__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          text-align: center;
          color: var(--admin-muted);
        }

        .admin-academic-analytics__empty h3 {
          margin: 1rem 0 0.5rem;
          color: var(--admin-ink);
          font-size: 1.1rem;
        }

        .admin-academic-analytics__empty p {
          margin: 0;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .admin-academic-analytics {
            padding: 1rem;
            gap: 1.5rem;
          }

          .admin-academic-analytics__summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .admin-academic-analytics__stat {
            flex-direction: column;
            text-align: center;
          }

          .admin-academic-analytics__table {
            font-size: 0.75rem;
          }

          .admin-academic-analytics__table th,
          .admin-academic-analytics__table td {
            padding: 0.75rem 0.5rem;
          }

          .admin-academic-analytics__title {
            max-width: 150px;
          }
        }
      `}</style>
    </div>
  );
}
