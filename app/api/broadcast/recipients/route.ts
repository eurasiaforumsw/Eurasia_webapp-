import { NextRequest, NextResponse } from "next/server";
import { db, query } from "@/lib/db";
import { broadcastActor } from "../_auth";

const AUDIENCES = new Set(["all", "professional", "student", "institutional"]);
const STATUSES = new Set(["active", "pending", "suspended"]);

export async function POST(req: NextRequest) {
  if (!await broadcastActor(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = await req.json().catch(() => null);
  const audience = input?.audience || "all";
  const groups = input?.targetGroups || [];
  const statuses = input?.targetStatuses || ["active"];
  if (typeof audience !== "string" || !AUDIENCES.has(audience) || !Array.isArray(groups) || groups.length > 100 ||
      groups.some((group: unknown) => typeof group !== "string" || group.length > 120) ||
      !Array.isArray(statuses) || !statuses.length || statuses.some((status: unknown) => !STATUSES.has(String(status)))) {
    return NextResponse.json({ error: "Invalid target filters" }, { status: 400 });
  }

  // Build WHERE conditions
  const conditions: string[] = [`status = ANY($1)`];
  const params: any[] = [statuses];

  if (audience !== "all") {
    conditions.push(`membership_type = $${params.length + 1}`);
    params.push(audience);
  }

  if (groups.length) {
    conditions.push(`target_groups && $${params.length + 1}`);
    params.push(groups);
  }

  const whereClause = conditions.join(' AND ');

  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM members WHERE ${whereClause}`,
      params
    );
    return NextResponse.json({ count: parseInt(result.rows[0].count) || 0 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to count recipients" }, { status: 500 });
  }
}
