import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyMemberToken } from "@/lib/auth/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Get member_id from cookie if available for session logging
    const session = await verifyMemberToken(request);
    const memberId = session?.memberId;

    // Record logout in member_sessions table if configured
    const token = request.cookies.get("member_token")?.value;
    if (memberId && token && supabaseAdmin) {
      try {
        const tokenHash = createHash("sha256").update(token).digest("hex");
        await supabaseAdmin
          .from("member_sessions")
          .update({ is_active: false, last_activity_at: new Date().toISOString() })
          .eq("member_id", memberId)
          .eq("token", tokenHash)
          .eq("is_active", true);
      } catch {
        // Session logging is optional, don't fail logout if it errors
      }
    }

    // Clear member_token cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("member_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Logout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
