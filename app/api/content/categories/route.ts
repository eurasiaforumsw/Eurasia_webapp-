import { NextResponse } from "next/server";
import { defaultContentCategories } from "@/lib/admin-data";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await db.from("admin_categories")
      .select("categories").eq("id", "default").maybeSingle();
    if (error) return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
    return NextResponse.json({ categories: data?.categories ?? defaultContentCategories });
  } catch (error) {
    console.error("/api/content/categories GET error:", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
