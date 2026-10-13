import { NextRequest, NextResponse } from "next/server";
import { CONTENT_ROLES, verifyRequestSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import type { AdminContentCategory } from "@/lib/admin-data";

async function authorized(req: NextRequest) {
  const actor = await verifyRequestSession(req);
  return actor && CONTENT_ROLES.includes(actor.role) ? actor : null;
}

function validCategories(input: unknown): input is AdminContentCategory[] {
  if (!Array.isArray(input) || input.length > 200) return false;
  const ids = new Set<string>();
  for (const item of input) {
    if (!item || typeof item !== "object" ||
        typeof item.id !== "string" || !item.id.trim() || item.id.length > 120 || ids.has(item.id) ||
        !["news", "academic", "document", "event"].includes(item.kind) ||
        typeof item.label !== "string" || !item.label.trim() || item.label.length > 120 ||
        !Number.isInteger(item.order) || item.order < 0 || item.order > 10000 ||
        typeof item.enabled !== "boolean") return false;
    ids.add(item.id);
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!await authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabaseAdmin.from("admin_categories")
    .select("categories").eq("id", "default").maybeSingle();
  if (error) return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  return NextResponse.json({ categories: data?.categories ?? null });
}

export async function PUT(req: NextRequest) {
  if (!await authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = await req.json().catch(() => null);
  if (!validCategories(input?.categories)) return NextResponse.json({ error: "Invalid categories" }, { status: 400 });
  const { data, error } = await supabaseAdmin.from("admin_categories")
    .upsert({ id: "default", categories: input.categories }, { onConflict: "id" })
    .select("categories").single();
  if (error) return NextResponse.json({ error: "Failed to save categories" }, { status: 500 });
  return NextResponse.json({ categories: data.categories });
}
