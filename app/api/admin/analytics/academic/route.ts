import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/api-auth";
import { analyticsError, analyticsRows } from "../_shared";
import { academicEngagement } from "./_data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DocumentRow = { id: string; title: string; author: string | null; file_name: string | null;
  file_size: number | null; publish_at: string | null; created_at: string };

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    const documents = await analyticsRows<DocumentRow>(() => supabaseAdmin.from("content")
      .select("id, title, author, file_name, file_size, publish_at, created_at")
      .in("kind", ["academic", "document"]).eq("status", "published").order("id"), "Academic documents");
    const engagement = await academicEngagement(documents.map((document) => document.id));
    return NextResponse.json({ documents: documents.map((document) => ({
      id: document.id, title: document.title, author: document.author || "Unknown",
      downloads: engagement[document.id].downloadCount, views: engagement[document.id].viewCount,
      likes: engagement[document.id].likeCount, fileName: document.file_name,
      fileSize: document.file_size, publishedAt: document.publish_at || document.created_at,
    })) });
  } catch (error) {
    return analyticsError(error, "Academic analytics error");
  }
}
