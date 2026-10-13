import { NextResponse } from "next/server";
import { defaultContentCategories } from "@/lib/admin-data";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("admin_categories")
    .select("categories").eq("id", "default").maybeSingle();
  if (error) return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  return NextResponse.json({ categories: data?.categories ?? defaultContentCategories });
}
