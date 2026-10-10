import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Get member_id from cookie if available for session logging
    const memberToken = request.cookies.get("member_token")?.value;
    let memberId: string | null = null;

    if (memberToken && supabaseAdmin) {
      try {
        // Decode token to get member_id (basic parsing, adjust if using JWT)
        const payload = JSON.parse(Buffer.from(memberToken.split(".")[1], "base64").toString());
        memberId = payload.id;
      } catch {
        // Token parsing failed, continue with logout anyway
      }
    }

    // Record logout in member_sessions table if configured
    if (memberId && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from("member_sessions")
          .update({ logged_out_at: new Date().toISOString() })
          .eq("member_id", memberId)
          .is("logged_out_at", null)
          .order("logged_in_at", { ascending: false })
          .limit(1);
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
