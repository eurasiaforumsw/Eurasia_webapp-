"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  Eye,
  Heart,
  Download,
  FileText,
  BarChart3,
  Calendar,
  Users,
} from "lucide-react";
import { AdminContentItem } from "@/lib/admin-data";
import { getAllEngagement } from "@/lib/content-engagement";

interface AnalyticsDashboardProps {
  content: AdminContentItem[];
}

export function AnalyticsDashboard({ content }: AnalyticsDashboardProps) {
  const engagement = getAllEngagement();

  // Calculate total stats
  const totalStats = useMemo(() => {
    const total = {
      views: 0,
      downloads: 0,
      likes: 0,
      content: content.length,
    };

    engagement.forEach((item) => {
      total.views += item.viewCount || 0;
      total.downloads += item.downloadCount || 0;
      total.likes += item.likeCount || 0;
    });

    return total;
  }, [engagement, content]);

  // Get popular content
  const popularContent = useMemo(() => {
    const contentMap = new Map(content.map((c) => [c.id, c]));

    return engagement
      .map((eng) => ({
        ...eng,
        content: contentMap.get(eng.contentId),
      }))
      .filter((item) => item.content)
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10);
  }, [engagement, content]);

  // Calculate engagement rate
  const engagementRate = useMemo(() => {
    if (totalStats.views === 0) return 0;
    return ((totalStats.likes + totalStats.downloads) / totalStats.views * 100).toFixed(1);
  }, [totalStats]);

  // Get content by type
  const contentByType = useMemo(() => {
    const types: Record<string, number> = {};
    content.forEach((item) => {
      types[item.kind] = (types[item.kind] || 0) + 1;
    });
    return types;
  }, [content]);

  // Get recent activity (last 30 days)
  const recentActivity = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return content
      .filter((item) => new Date(item.updatedAt) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [content]);

  return (
    <div className="analytics-dashboard">
      <div className="analytics-dashboard__header">
        <h2>
          <BarChart3 size={24} />
          Analytics Dashboard
        </h2>
        <p>Overview of content performance and engagement</p>
      </div>

      {/* Stats Grid */}
      <div className="analytics-stats">
        <div className="analytics-stat">
          <div className="analytics-stat__icon" style={{ background: "#eff6ff", color: "#3b82f6" }}>
            <Eye size={24} />
          </div>
          <div className="analytics-stat__content">
            <div className="analytics-stat__value">{totalStats.views.toLocaleString()}</div>
            <div className="analytics-stat__label">Total Views</div>
          </div>
        </div>

        <div className="analytics-stat">
          <div className="analytics-stat__icon" style={{ background: "#fef2f2", color: "#ef4444" }}>
            <Heart size={24} />
          </div>
          <div className="analytics-stat__content">
            <div className="analytics-stat__value">{totalStats.likes.toLocaleString()}</div>
            <div className="analytics-stat__label">Total Likes</div>
          </div>
        </div>

        <div className="analytics-stat">
          <div className="analytics-stat__icon" style={{ background: "#f0fdf4", color: "#22c55e" }}>
            <Download size={24} />
          </div>
          <div className="analytics-stat__content">
            <div className="analytics-stat__value">{totalStats.downloads.toLocaleString()}</div>
            <div className="analytics-stat__label">Total Downloads</div>
          </div>
        </div>

        <div className="analytics-stat">
          <div className="analytics-stat__icon" style={{ background: "#fef3c7", color: "#f59e0b" }}>
            <FileText size={24} />
          </div>
          <div className="analytics-stat__content">
            <div className="analytics-stat__value">{totalStats.content}</div>
            <div className="analytics-stat__label">Total Content</div>
          </div>
        </div>

        <div className="analytics-stat">
          <div className="analytics-stat__icon" style={{ background: "#f5f3ff", color: "#8b5cf6" }}>
            <TrendingUp size={24} />
          </div>
          <div className="analytics-stat__content">
            <div className="analytics-stat__value">{engagementRate}%</div>
            <div className="analytics-stat__label">Engagement Rate</div>
          </div>
        </div>

        <div className="analytics-stat">
          <div className="analytics-stat__icon" style={{ background: "#fdf2f8", color: "#ec4899" }}>
            <Users size={24} />
          </div>
          <div className="analytics-stat__content">
            <div className="analytics-stat__value">{engagement.length}</div>
            <div className="analytics-stat__label">Engaged Content</div>
          </div>
        </div>
      </div>

      {/* Popular Content */}
      <div className="analytics-section">
        <h3>
          <TrendingUp size={20} />
          Most Popular Content
        </h3>
        <div className="analytics-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Views</th>
                <th>Likes</th>
                <th>Downloads</th>
              </tr>
            </thead>
            <tbody>
              {popularContent.map((item) => (
                <tr key={item.contentId}>
                  <td>
                    <div className="analytics-table__title">
                      {item.content?.title || "Untitled"}
                    </div>
                  </td>
                  <td>
                    <span className="analytics-badge">{item.content?.kind}</span>
                  </td>
                  <td>
                    <div className="analytics-table__stat">
                      <Eye size={14} />
                      {item.viewCount || 0}
                    </div>
                  </td>
                  <td>
                    <div className="analytics-table__stat">
                      <Heart size={14} />
                      {item.likeCount || 0}
                    </div>
                  </td>
                  <td>
                    <div className="analytics-table__stat">
                      <Download size={14} />
                      {item.downloadCount || 0}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {popularContent.length === 0 && (
            <div className="analytics-empty">
              <p>No engagement data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Content by Type */}
      <div className="analytics-section">
        <h3>
          <FileText size={20} />
          Content by Type
        </h3>
        <div className="analytics-chart">
          {Object.entries(contentByType).map(([type, count]) => {
            const percentage = (count / totalStats.content * 100).toFixed(1);
            return (
              <div key={type} className="analytics-chart__item">
                <div className="analytics-chart__label">
                  <span>{type}</span>
                  <span>{count} ({percentage}%)</span>
                </div>
                <div className="analytics-chart__bar">
                  <div
                    className="analytics-chart__fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="analytics-section">
        <h3>
          <Calendar size={20} />
          Recent Activity (Last 30 Days)
        </h3>
        <div className="analytics-activity">
          {recentActivity.map((item) => (
            <div key={item.id} className="analytics-activity__item">
              <div className="analytics-activity__icon">
                <FileText size={16} />
              </div>
              <div className="analytics-activity__content">
                <div className="analytics-activity__title">{item.title}</div>
                <div className="analytics-activity__meta">
                  <span className="analytics-badge">{item.kind}</span>
                  <span>•</span>
                  <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className={`analytics-status analytics-status--${item.status}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="analytics-empty">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
