import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
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
  let query = supabaseAdmin.from("members").select("id", { count: "exact", head: true }).in("status", statuses);
  if (audience !== "all") query = query.eq("membership_type", audience);
  if (groups.length) query = query.overlaps("target_groups", groups);
  const { count, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to count recipients" }, { status: 500 });
  return NextResponse.json({ count: count || 0 });
}
