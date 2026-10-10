"use client";

import { memo, useMemo, useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Share2,
  Users,
  FileText,
  Clock,
  Globe,
  ArrowUpRight,
  Activity,
  BarChart3,
  Calendar,
  ChevronDown,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type TimeRange = "7d" | "30d" | "90d";

interface OverviewData {
  members: { total: number; growth: number; newThisMonth: number };
  content: { total: number; news: number; events: number; announcements: number };
  engagement: {
    likes: { total: number; today: number; week: number; month: number };
    saves: { total: number; today: number; week: number; month: number };
    views: { total: number; today: number; week: number; month: number };
    shares: { today: number; week: number; month: number };
  };
  sessions: { active: number };
}

interface MembersData {
  totalMembers: number;
  mostActiveMembers: Array<{
    id: string;
    fullName: string;
    email: string;
    engagementCount: number;
  }>;
  newMembers: {
    count: number;
    members: Array<{
      id: string;
      fullName: string;
      email: string;
      joinedAt: string;
      country: string;
    }>;
  };
  membersByType: Record<string, number>;
  membersByCountry: Array<{ country: string; count: number }>;
  memberGrowth: Array<{ month: string; count: number }>;
}

interface ContentData {
  topLiked: Array<{
    id: string;
    title: string;
    kind: string;
    author: string | null;
    count: number;
  }>;
  topViewed: Array<{
    id: string;
    title: string;
    kind: string;
    count: number;
  }>;
  topSaved: Array<{
    id: string;
    title: string;
    kind: string;
    count: number;
  }>;
  byType: Array<{ kind: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
}

interface AnalyticsDashboardProps {
  timeRange?: TimeRange;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const CHART_COLORS = {
  primary: "#38BDF8",
  secondary: "#6EE7B7",
  tertiary: "#E9A568",
  quaternary: "#C084FC",
  success: "#6EE7B7",
  warning: "#FCD34D",
  danger: "#F87171",
  muted: "#64748B",
};

const MEMBERSHIP_COLORS: Record<string, string> = {
  professional: CHART_COLORS.primary,
  student: CHART_COLORS.secondary,
  institutional: CHART_COLORS.tertiary,
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: "var(--surface-3)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-3) var(--space-4)",
        boxShadow: "var(--shadow-xl)",
      }}
    >
      <p
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--text-tertiary)",
          marginBottom: "var(--space-2)",
          fontWeight: "var(--font-medium)",
        }}
      >
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginTop: "var(--space-1)",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "var(--radius-circle)",
              background: entry.color,
            }}
          />
          <span
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-primary)",
              fontWeight: "var(--font-medium)",
            }}
          >
            {entry.name}: {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const AnalyticsDashboard = memo(function AnalyticsDashboard({
  timeRange = "30d",
}: AnalyticsDashboardProps) {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [members, setMembers] = useState<MembersData | null>(null);
  const [content, setContent] = useState<ContentData | null>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>(timeRange);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const [overviewRes, membersRes, contentRes, engagementRes] = await Promise.all([
          fetch("/api/admin/analytics/overview"),
          fetch("/api/admin/analytics/members"),
          fetch("/api/admin/analytics/content"),
          fetch("/api/admin/analytics/engagement"),
        ]);

        if (!overviewRes.ok || !membersRes.ok || !contentRes.ok || !engagementRes.ok) {
          throw new Error("Failed to fetch analytics data");
        }

        const [overviewData, membersData, contentData, engagementData] = await Promise.all([
          overviewRes.json(),
          membersRes.json(),
          contentRes.json(),
          engagementRes.json(),
        ]);

        setOverview(overviewData);
        setMembers(membersData);
        setContent(contentData);
        setEngagement(engagementData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedRange]);

  const timeRangeLabel = useMemo(() => {
    switch (selectedRange) {
      case "7d":
        return "Last 7 days";
      case "30d":
        return "Last 30 days";
      case "90d":
        return "Last 90 days";
      default:
        return "Last 30 days";
    }
  }, [selectedRange]);

  const membershipPieData = useMemo(() => {
    if (!members) return [];
    return Object.entries(members.membersByType).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: MEMBERSHIP_COLORS[name] || CHART_COLORS.muted,
    }));
  }, [members]);

  const contentByTypeData = useMemo(() => {
    if (!content) return [];
    return content.byType.map((item) => ({
      name: item.kind.charAt(0).toUpperCase() + item.kind.slice(1),
      value: item.count,
    }));
  }, [content]);

  const memberGrowthData = useMemo(() => {
    if (!members) return [];
    return members.memberGrowth.map((item) => ({
      name: item.month,
      Members: item.count,
    }));
  }, [members]);

  const engagementTimelineData = useMemo(() => {
    if (!engagement) return [];
    return engagement.likes.map((item: any, idx: number) => ({
      date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Likes: item.value,
      Views: engagement.views[idx]?.value || 0,
      Saves: engagement.saves[idx]?.value || 0,
    }));
  }, [engagement]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2"
            style={{
              borderColor: "var(--accent-primary)",
              borderTopColor: "transparent",
            }}
          />
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-8)",
            background: "var(--surface-2)",
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-xl)",
          }}
        >
          <AlertCircle size={32} style={{ color: "var(--accent-danger)" }} />
          <p style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
            Failed to load analytics
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{error}</p>
          <button
            className="btn btn--primary"
            onClick={() => window.location.reload()}
            style={{
              marginTop: "var(--space-2)",
            }}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!overview || !members || !content) {
    return null;
  }

  const totalEngagement =
    overview.engagement.likes.total +
    overview.engagement.saves.total +
    overview.engagement.views.total;

  const weekEngagement =
    overview.engagement.likes.week +
    overview.engagement.saves.week +
    overview.engagement.views.week;

  const prevWeekEngagement = totalEngagement - weekEngagement;
  const engagementTrend =
    prevWeekEngagement > 0
      ? ((weekEngagement - prevWeekEngagement) / prevWeekEngagement) * 100
      : 0;

  return (
    <div className="admin-console">
      <link rel="stylesheet" href="/styles/admin-design-system.css" />

      {/* Header */}
      <div className="dashboard-section">
        <div className="dashboard-section__header">
          <div>
            <h1 className="dashboard-section__title">Analytics Overview</h1>
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-tertiary)",
                marginTop: "var(--space-2)",
              }}
            >
              Real-time insights into content performance and member engagement
            </p>
          </div>

          <div className="filter">
            <button
              className="filter__trigger filter__trigger--active"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Calendar size={14} />
              {timeRangeLabel}
              <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>
            {filterOpen && (
              <div className="filter__dropdown filter__dropdown--open">
                {(["7d", "30d", "90d"] as TimeRange[]).map((range) => (
                  <div
                    key={range}
                    className={`filter__option ${
                      selectedRange === range ? "filter__option--selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedRange(range);
                      setFilterOpen(false);
                    }}
                  >
                    {range === "7d"
                      ? "Last 7 days"
                      : range === "30d"
                      ? "Last 30 days"
                      : "Last 90 days"}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Total Views</span>
            </div>
            <div className="stat-card__value">{formatNumber(overview.engagement.views.total)}</div>
            <div className="stat-card__icon">
              <Eye size={20} />
            </div>
            <div className="stat-card__footer">
              <span className="stat-card__trend stat-card__trend--neutral">
                <Activity size={14} />
                {formatNumber(overview.engagement.views.week)} this week
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Total Engagement</span>
            </div>
            <div className="stat-card__value">{formatNumber(totalEngagement)}</div>
            <div className="stat-card__icon">
              <Heart size={20} />
            </div>
            <div className="stat-card__footer">
              <span
                className={`stat-card__trend ${
                  engagementTrend > 0
                    ? "stat-card__trend--up"
                    : engagementTrend < 0
                    ? "stat-card__trend--down"
                    : "stat-card__trend--neutral"
                }`}
              >
                {engagementTrend > 0 ? (
                  <TrendingUp size={14} />
                ) : engagementTrend < 0 ? (
                  <TrendingDown size={14} />
                ) : (
                  <Activity size={14} />
                )}
                {Math.abs(engagementTrend).toFixed(1)}%
              </span>
              <span>vs previous week</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Total Members</span>
            </div>
            <div className="stat-card__value">{formatNumber(overview.members.total)}</div>
            <div className="stat-card__icon">
              <Users size={20} />
            </div>
            <div className="stat-card__footer">
              <span
                className={`stat-card__trend ${
                  overview.members.growth > 0 ? "stat-card__trend--up" : "stat-card__trend--neutral"
                }`}
              >
                {overview.members.growth > 0 ? <TrendingUp size={14} /> : <Activity size={14} />}
                {overview.members.growth > 0 ? `+${overview.members.growth.toFixed(1)}%` : "0%"}
              </span>
              <span>{overview.members.newThisMonth} new this month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Published Content</span>
            </div>
            <div className="stat-card__value">{formatNumber(overview.content.total)}</div>
            <div className="stat-card__icon">
              <FileText size={20} />
            </div>
            <div className="stat-card__footer">
              <span className="stat-card__trend stat-card__trend--neutral">
                <Activity size={14} />
                {overview.content.news} news · {overview.content.events} events
              </span>
            </div>
          </div>
        </div>

        {/* Engagement Timeline Chart */}
        <div style={{ marginTop: "var(--space-6)" }}>
          <div className="chart-container">
            <div className="chart-container__header">
              <div>
                <h3 className="chart-container__title">Engagement Timeline</h3>
                <p className="chart-container__subtitle">Last 30 days activity</p>
              </div>
            </div>
            <div className="chart-container__body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-tertiary)"
                    style={{ fontSize: "var(--text-xs)" }}
                  />
                  <YAxis stroke="var(--text-tertiary)" style={{ fontSize: "var(--text-xs)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Views"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Likes"
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Saves"
                    stroke={CHART_COLORS.tertiary}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Grid: Content by Type & Member Growth */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "var(--space-6)",
            marginTop: "var(--space-6)",
          }}
        >
          <div className="chart-container">
            <div className="chart-container__header">
              <div>
                <h3 className="chart-container__title">Content by Type</h3>
                <p className="chart-container__subtitle">Distribution by category</p>
              </div>
            </div>
            <div className="chart-container__body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contentByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-tertiary)"
                    style={{ fontSize: "var(--text-xs)" }}
                  />
                  <YAxis stroke="var(--text-tertiary)" style={{ fontSize: "var(--text-xs)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-container__header">
              <div>
                <h3 className="chart-container__title">Member Growth</h3>
                <p className="chart-container__subtitle">Last 6 months</p>
              </div>
            </div>
            <div className="chart-container__body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={memberGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-tertiary)"
                    style={{ fontSize: "var(--text-xs)" }}
                  />
                  <YAxis stroke="var(--text-tertiary)" style={{ fontSize: "var(--text-xs)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Members"
                    stroke={CHART_COLORS.secondary}
                    fill={CHART_COLORS.secondary}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Membership Distribution & Top Content */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
            gap: "var(--space-6)",
            marginTop: "var(--space-6)",
          }}
        >
          <div className="chart-container">
            <div className="chart-container__header">
              <div>
                <h3 className="chart-container__title">Membership Types</h3>
                <p className="chart-container__subtitle">Distribution by type</p>
              </div>
            </div>
            <div className="chart-container__body">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={membershipPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {membershipPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-container__header">
              <div>
                <h3 className="chart-container__title">Top Performing Content</h3>
                <p className="chart-container__subtitle">Most viewed articles</p>
              </div>
            </div>
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {content.topViewed.slice(0, 5).map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: "var(--space-3)",
                    alignItems: "center",
                    padding: "var(--space-3)",
                    background: "var(--surface-3)",
                    borderRadius: "var(--radius-lg)",
                    transition: "background var(--duration-fast) var(--ease-out)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--surface-4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--surface-3)";
                  }}
                >
                  <span
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: "1.75rem",
                      height: "1.75rem",
                      borderRadius: "var(--radius-circle)",
                      background: idx === 0 ? "var(--accent-primary)" : "var(--surface-4)",
                      color: idx === 0 ? "var(--surface-0)" : "var(--text-tertiary)",
                      fontSize: "var(--text-xs)",
                      fontWeight: "var(--font-bold)",
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <p
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: "var(--font-medium)",
                        color: "var(--text-primary)",
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--text-tertiary)",
                        margin: "var(--space-1) 0 0",
                      }}
                    >
                      {formatNumber(item.count)} views · {item.kind}
                    </p>
                  </div>
                  <ArrowUpRight size={14} style={{ color: "var(--text-muted)" }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-6)",
            marginTop: "var(--space-6)",
          }}
        >
          <div className="chart-container">
            <div className="chart-container__header">
              <div>
                <h3 className="chart-container__title">Most Active Members</h3>
                <p className="chart-container__subtitle">By engagement count</p>
              </div>
            </div>
            <div className="data-table">
              <div
                className="data-table__header"
                style={{ gridTemplateColumns: "2fr 1fr auto" }}
              >
                <div>Member</div>
                <div>Email</div>
                <div>Actions</div>
              </div>
              {members.mostActiveMembers.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  className="data-table__row"
                  style={{ gridTemplateColumns: "2fr 1fr auto" }}
                >
                  <div className="data-table__cell">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                      }}
                    >
                      <div className="avatar avatar--sm">
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span>{member.fullName}</span>
                    </div>
                  </div>
                  <div className="data-table__cell data-table__cell--muted">{member.email}</div>
                  <div className="data-table__cell">
                    <span className="badge badge--primary">{member.engagementCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-container__header">
              <div>
                <h3 className="chart-container__title">New Members</h3>
                <p className="chart-container__subtitle">Last 7 days</p>
              </div>
            </div>
            <div className="data-table">
              <div className="data-table__header" style={{ gridTemplateColumns: "2fr 1fr auto" }}>
                <div>Name</div>
                <div>Country</div>
                <div>Joined</div>
              </div>
              {members.newMembers.members.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  className="data-table__row"
                  style={{ gridTemplateColumns: "2fr 1fr auto" }}
                >
                  <div className="data-table__cell">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                      }}
                    >
                      <div className="avatar avatar--sm">
                        {member.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span>{member.fullName}</span>
                    </div>
                  </div>
                  <div className="data-table__cell data-table__cell--muted">{member.country}</div>
                  <div className="data-table__cell data-table__cell--muted">
                    {new Date(member.joinedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div style={{ marginTop: "var(--space-6)" }}>
          <div className="chart-container">
            <div className="chart-container__header">
              <div>
                <h3 className="chart-container__title">Geographic Distribution</h3>
                <p className="chart-container__subtitle">Members by country</p>
              </div>
              <Globe size={16} style={{ color: "var(--accent-primary)" }} />
            </div>
            <div className="data-table">
              <div
                className="data-table__header"
                style={{ gridTemplateColumns: "1fr auto auto" }}
              >
                <div>Country</div>
                <div>Members</div>
                <div>Share</div>
              </div>
              {members.membersByCountry.map((item) => {
                const percentage = ((item.count / members.totalMembers) * 100).toFixed(1);
                return (
                  <div
                    key={item.country}
                    className="data-table__row"
                    style={{ gridTemplateColumns: "1fr auto auto" }}
                  >
                    <div className="data-table__cell">{item.country}</div>
                    <div className="data-table__cell data-table__cell--numeric">
                      {formatNumber(item.count)}
                    </div>
                    <div className="data-table__cell">
                      <span className="badge badge--primary">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
