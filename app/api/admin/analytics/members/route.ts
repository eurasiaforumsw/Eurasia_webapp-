import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/api-auth";
import { analyticsError, analyticsRows, analyticsWindow } from "../_shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MemberRow = { id: string; full_name: string; email: string; country: string; membership_type: string; joined_at: string };

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const window = analyticsWindow(request);
    const [members, activity] = await Promise.all([
      analyticsRows<MemberRow>(() => supabaseAdmin.from("members")
        .select("id, full_name, email, country, membership_type, joined_at").order("id"), "Members"),
      analyticsRows<{ member_id: string }>(() => supabaseAdmin.from("member_activity")
        .select("member_id").gte("created_at", window.start.toISOString())
        .lte("created_at", window.now.toISOString()).order("id"), "Member activity"),
    ]);
    const activityCounts = new Map<string, number>();
    activity.forEach((row) => activityCounts.set(row.member_id, (activityCounts.get(row.member_id) || 0) + 1));
    const mostActiveMembers = members.filter((member) => activityCounts.has(member.id))
      .map((member) => ({ id: member.id, fullName: member.full_name, email: member.email,
        engagementCount: activityCounts.get(member.id)! }))
      .sort((a, b) => b.engagementCount - a.engagementCount || a.id.localeCompare(b.id)).slice(0, 10);
    const recentMembers = members.filter((member) => new Date(member.joined_at) >= window.start && new Date(member.joined_at) <= window.now);
    const typeCounts: Record<string, number> = { professional: 0, student: 0, institutional: 0 };
    const countryCounts: Record<string, number> = {};
    const monthlyGrowth: Record<string, number> = {};
    members.forEach((member) => {
      typeCounts[member.membership_type] = (typeCounts[member.membership_type] || 0) + 1;
      const country = member.country || "Unknown";
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });
    recentMembers.forEach((member) => {
      const month = member.joined_at.slice(0, 7);
      monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1;
    });
    const memberGrowth = [];
    const month = new Date(Date.UTC(window.start.getUTCFullYear(), window.start.getUTCMonth(), 1));
    while (month <= window.now) {
      const key = month.toISOString().slice(0, 7);
      memberGrowth.push({ month: key, count: monthlyGrowth[key] || 0 });
      month.setUTCMonth(month.getUTCMonth() + 1);
    }
    return NextResponse.json({ range: window.range, totalMembers: members.length, mostActiveMembers,
      newMembers: { count: recentMembers.length, members: recentMembers
        .sort((a, b) => b.joined_at.localeCompare(a.joined_at)).map((member) => ({ id: member.id,
          fullName: member.full_name, email: member.email, joinedAt: member.joined_at, country: member.country })) },
      membersByType: typeCounts, membersByCountry: Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 10), memberGrowth });
  } catch (error) {
    return analyticsError(error, "Analytics members error");
  }
}
