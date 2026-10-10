import { NextRequest, NextResponse } from "next/server";
import { verifyMemberToken } from "@/lib/auth/jwt";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/events/[id]/registration-status
 * Check if current user is registered for this event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const payload = await verifyMemberToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("event_registrations")
      .select("id, status, created_at")
      .eq("event_id", params.id)
      .eq("member_id", payload.memberId)
      .maybeSingle();

    if (error) {
      console.error("Failed to check registration status:", error);
      return NextResponse.json(
        { error: "Failed to check registration status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      registered: !!data,
      registration: data || null,
    });
  } catch (error) {
    console.error("Registration status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
