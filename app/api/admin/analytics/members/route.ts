import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MembershipType = "professional" | "student" | "institutional";

export async function GET(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 503 },
    );
  }

  // Admin only
  try {
    await requireRole(request, ["admin"]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    // 1. Most active members (by engagement count)
    const { data: engagementData } = await supabaseAdmin
      .from("activity_log")
      .select("member_id")
      .not("member_id", "is", null);

    const engagementMap = new Map<string, number>();
    if (engagementData) {
      for (const row of engagementData) {
        const count = engagementMap.get(row.member_id) || 0;
        engagementMap.set(row.member_id, count + 1);
      }
    }

    const topMemberIds = Array.from(engagementMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    let mostActiveMembers: Array<{ id: string; fullName: string; email: string; engagementCount: number }> = [];
    if (topMemberIds.length > 0) {
      const { data: memberData } = await supabaseAdmin
        .from("members")
        .select("id, full_name, email")
        .in("id", topMemberIds);

      if (memberData) {
        mostActiveMembers = memberData.map((m: any) => ({
          id: m.id,
          fullName: m.full_name,
          email: m.email,
          engagementCount: engagementMap.get(m.id) || 0,
        })).sort((a, b) => b.engagementCount - a.engagementCount);
      }
    }

    // 2. New members (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: newMembersData, count: newMembersCount } = await supabaseAdmin
      .from("members")
      .select("id, full_name, email, joined_at, country", { count: "exact" })
      .gte("joined_at", sevenDaysAgo.toISOString())
      .order("joined_at", { ascending: false });

    const newMembers = (newMembersData || []).map((m: any) => ({
      id: m.id,
      fullName: m.full_name,
      email: m.email,
      joinedAt: m.joined_at,
      country: m.country,
    }));

    // 3. Member distribution by membership_type
    const { data: membersByType } = await supabaseAdmin
      .from("members")
      .select("membership_type");

    const typeDistribution: Record<string, number> = {
      professional: 0,
      student: 0,
      institutional: 0,
    };

    if (membersByType) {
      for (const row of membersByType) {
        const type = row.membership_type as MembershipType;
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      }
    }

    // 4. Member distribution by country (top 10)
    const { data: membersByCountry } = await supabaseAdmin
      .from("members")
      .select("country");

    const countryMap = new Map<string, number>();
    if (membersByCountry) {
      for (const row of membersByCountry) {
        const country = row.country || "Unknown";
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      }
    }

    const countryDistribution = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 5. Member growth trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: growthData } = await supabaseAdmin
      .from("members")
      .select("joined_at")
      .gte("joined_at", sixMonthsAgo.toISOString())
      .order("joined_at", { ascending: true });

    // Group by month
    const monthlyGrowth: Record<string, number> = {};
    if (growthData) {
      for (const row of growthData) {
        const date = new Date(row.joined_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + 1;
      }
    }

    // Fill in missing months with 0
    const months: Array<{ month: string; count: number }> = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        month: monthKey,
        count: monthlyGrowth[monthKey] || 0,
      });
    }

    // Total member count
    const { count: totalMembers } = await supabaseAdmin
      .from("members")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      totalMembers: totalMembers || 0,
      mostActiveMembers,
      newMembers: {
        count: newMembersCount || 0,
        members: newMembers,
      },
      membersByType: typeDistribution,
      membersByCountry: countryDistribution,
      memberGrowth: months,
    });
  } catch (error) {
    console.error("[analytics/members] Error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
