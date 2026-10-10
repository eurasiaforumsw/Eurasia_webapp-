import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/events/[id]/registration-settings
 * Get registration settings for an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch registration settings
    const { data: settings, error: settingsError } = await supabase
      .from("event_registration_settings")
      .select("*")
      .eq("event_id", params.id)
      .maybeSingle();

    if (settingsError) {
      console.error("Failed to fetch registration settings:", settingsError);
      return NextResponse.json(
        { error: "Failed to fetch registration settings" },
        { status: 500 }
      );
    }

    // If no settings found, registration is closed
    if (!settings) {
      return NextResponse.json({
        registrationEnabled: false,
        registrationStartsAt: null,
        registrationEndsAt: null,
        maxAttendees: null,
        currentRegistrations: 0,
      });
    }

    // Count current registrations
    const { count, error: countError } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", params.id)
      .eq("status", "confirmed");

    if (countError) {
      console.error("Failed to count registrations:", countError);
    }

    return NextResponse.json({
      registrationEnabled: settings.registration_enabled,
      registrationStartsAt: settings.registration_starts_at,
      registrationEndsAt: settings.registration_ends_at,
      maxAttendees: settings.max_attendees,
      currentRegistrations: count || 0,
    });
  } catch (error) {
    console.error("Registration settings fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
