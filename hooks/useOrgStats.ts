"use client";

import { useEffect, useState } from "react";
import { buildOrgStats, type OrgStats } from "@/lib/org-stats";
import { getAdminContent, getAdminMembers } from "@/lib/admin-data";

/** Same aggregation as the API, computed from this browser's prototype data. */
const localStats = (): OrgStats =>
  buildOrgStats(
    getAdminMembers()
      .filter((m) => m.status === "active")
      .map((m) => ({ country: m.country, membershipType: m.membershipType, joinedAt: m.joinedAt })),
    getAdminContent()
      .filter((c) => c.status === "published")
      .map((c) => ({
        id: c.id,
        kind: c.kind,
        category: c.category,
        title: c.title,
        updatedAt: c.updatedAt,
        startsAt: c.startsAt,
        publishAt: c.publishAt,
        expiresAt: c.expiresAt,
      })),
    "local",
  );

const isOrgStats = (value: unknown): value is OrgStats =>
  !!value && typeof value === "object" && "totals" in value && "countries" in value;

/**
 * Loads network statistics from the member database (/api/stats/organization).
 * Falls back to this browser's prototype data when the database is not
 * reachable, and says so via `stats.source` so the UI never passes local
 * numbers off as live ones.
 */
export function useOrgStats() {
  const [stats, setStats] = useState<OrgStats | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/stats/organization", { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok || !isOrgStats(body)) throw new Error("stats unavailable");
        setStats(body);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.warn("Organization stats fell back to local data:", err);
        setStats(localStats());
      });
    return () => controller.abort();
  }, []);

  return { stats, loading: stats === null };
}
