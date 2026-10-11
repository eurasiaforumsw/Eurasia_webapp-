import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/events/[id]/registration-fields
 * Get registration form fields for an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch registration fields for the event
    const { data: fields, error } = await supabase
      .from("event_registration_fields")
      .select("*")
      .eq("event_id", params.id)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Failed to fetch registration fields:", error);
      return NextResponse.json(
        { error: "Failed to fetch registration fields" },
        { status: 500 }
      );
    }

    // Return empty array if no fields found
    return NextResponse.json(fields || []);
  } catch (error) {
    console.error("Registration fields fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
