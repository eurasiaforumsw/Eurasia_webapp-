import { NextRequest, NextResponse } from "next/server";
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
