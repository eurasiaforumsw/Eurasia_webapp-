import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAdminRequest as verifyAdmin, ADMIN_ROLES } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Run query with timeout */
const withTimeout = <T extends PromiseLike<any>>(run: () => T, label = "query"): Promise<any> =>
  Promise.race([
    Promise.resolve(run()),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), 15_000)
    ),
  ]);

/** GET /api/admin/events/registration-stats */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const admin = await verifyAdmin(request);
  if (!admin || !ADMIN_ROLES.includes(admin.role)) {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  try {
    // Get current month boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get total active events with registration enabled
    const { data: activeEventsData, error: activeEventsError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("event_registration_settings")
          .select("event_id, registration_enabled, registration_end_date")
          .eq("registration_enabled", true),
      "getActiveEvents"
    );

    if (activeEventsError) {
      console.error("[registration-stats] Error fetching active events:", activeEventsError);
      return NextResponse.json(
        { totalActiveEvents: 0, totalRegistrationsThisMonth: 0 },
        { status: 200 }
      );
    }

    // Filter events where registration hasn't ended yet
    const currentlyActiveEvents = (activeEventsData || []).filter((event: any) => {
      if (!event.registration_end_date) return true;
      const endDate = new Date(event.registration_end_date);
      return endDate >= now;
    });

    const totalActiveEvents = currentlyActiveEvents.length;

    // Get total registrations this month
    const { count: totalRegistrationsThisMonth, error: registrationsError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("event_registrations")
          .select("*", { count: "exact", head: true })
          .gte("registered_at", monthStart.toISOString())
          .lte("registered_at", monthEnd.toISOString()),
      "getRegistrationsThisMonth"
    );

    if (registrationsError) {
      console.error("[registration-stats] Error fetching registrations:", registrationsError);
      return NextResponse.json(
        { totalActiveEvents, totalRegistrationsThisMonth: 0 },
        { status: 200 }
      );
    }

    return NextResponse.json({
      totalActiveEvents,
      totalRegistrationsThisMonth: totalRegistrationsThisMonth || 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[registration-stats] Error:", error);
    return NextResponse.json(
      { totalActiveEvents: 0, totalRegistrationsThisMonth: 0 },
      { status: 200 }
    );
  }
}
