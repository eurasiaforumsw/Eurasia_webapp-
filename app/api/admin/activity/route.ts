import { NextRequest, NextResponse } from "next/server";
import { CONSOLE_ROLES, verifyRequestSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";

async function actorFor(req: NextRequest) {
  const actor = await verifyRequestSession(req);
  return actor && CONSOLE_ROLES.includes(actor.role) ? actor : null;
}

function mapActivity(row: Record<string, any>) {
  return { id: row.id, action: row.action, detail: row.detail, at: row.created_at, tone: row.tone };
}

export async function GET(req: NextRequest) {
  if (!await actorFor(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = Math.max(1, Math.min(100, Number(req.nextUrl.searchParams.get("limit")) || 30));
  const { data, error } = await supabaseAdmin.from("admin_activity")
    .select("id, action, detail, tone, created_at").order("created_at", { ascending: false }).limit(limit);
  if (error) return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
  return NextResponse.json({ activity: (data || []).map(mapActivity) });
}

export async function POST(req: NextRequest) {
  const actor = await actorFor(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = await req.json().catch(() => null);
  if (typeof input?.action !== "string" || !input.action.trim() || input.action.length > 120 ||
      typeof input?.detail !== "string" || input.detail.length > 2000 ||
      !["neutral", "success", "warning"].includes(input?.tone)) return NextResponse.json({ error: "Invalid activity" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("admin_activity").insert({
    actor_id: actor.memberId || actor.id, actor_email: actor.email,
    action: input.action.trim(), detail: input.detail, tone: input.tone,
  }).select("id, action, detail, tone, created_at").single();
  if (error) return NextResponse.json({ error: "Failed to record activity" }, { status: 500 });
  return NextResponse.json({ activity: mapActivity(data) }, { status: 201 });
}
