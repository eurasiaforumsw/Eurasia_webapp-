import { NextRequest, NextResponse } from "next/server";
import pool, { query } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { CONTENT_ROLES } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toClient(row: any, currentRegistrations = 0) {
  return {
    id: row?.id, event_id: row?.event_id,
    registrationEnabled: row?.registration_enabled === true,
    registrationStartsAt: row?.registration_starts_at ?? null,
    registrationEndsAt: row?.registration_ends_at ?? null,
    maxAttendees: row?.max_attendees ?? null,
    currentRegistrations: Number(currentRegistrations || 0),
    requireApproval: row?.require_approval === true,
    is_enabled: row?.registration_enabled === true,
    opens_at: row?.registration_starts_at ?? null,
    closes_at: row?.registration_ends_at ?? null,
    max_attendees: row?.max_attendees ?? null,
    require_approval: row?.require_approval === true,
    current_attendee_count: Number(currentRegistrations || 0),
    confirmation_email_template: row?.confirmation_email_template || "",
  };
}

/** GET /api/events/[id]/registration-settings */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [{ rows: settings }, { rows: count }] = await Promise.all([
      query("SELECT * FROM event_registration_settings WHERE event_id = $1", [params.id]),
      query("SELECT COUNT(*)::int AS count FROM event_registrations WHERE event_id = $1 AND status IN ('confirmed', 'pending')", [params.id]),
    ]);
    return NextResponse.json(toClient(settings[0], count[0]?.count));
  } catch (error) {
    console.error("Registration settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch registration settings" }, { status: 500 });
  }
}

/** POST /api/events/[id]/registration-settings — create or update settings. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(request, CONTENT_ROLES);
    const body = await request.json();
    const enabled = body?.registrationEnabled ?? body?.is_enabled;
    const startsAt = body?.registrationStartsAt ?? body?.opens_at ?? null;
    const endsAt = body?.registrationEndsAt ?? body?.closes_at ?? null;
    const limit = body?.maxAttendees ?? body?.max_attendees;
    const maxAttendees = limit == null || limit === "" ? null : Number(limit);
    const requireApproval = (body?.requireApproval ?? body?.require_approval) === true;
    const template = typeof body?.confirmation_email_template === "string"
      ? body.confirmation_email_template.slice(0, 20_000) : null;
    if (typeof enabled !== "boolean") return NextResponse.json({ error: "registrationEnabled must be boolean" }, { status: 400 });
    if (startsAt && (typeof startsAt !== "string" || Number.isNaN(Date.parse(startsAt)))) return NextResponse.json({ error: "Invalid opening date" }, { status: 400 });
    if (endsAt && (typeof endsAt !== "string" || Number.isNaN(Date.parse(endsAt)))) return NextResponse.json({ error: "Invalid closing date" }, { status: 400 });
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) return NextResponse.json({ error: "Closing date must be after opening date" }, { status: 400 });
    if (maxAttendees !== null && (!Number.isSafeInteger(maxAttendees) || maxAttendees < 1)) return NextResponse.json({ error: "maxAttendees must be a positive integer" }, { status: 400 });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: event } = await client.query("SELECT id FROM content WHERE id = $1 AND kind = 'event' FOR UPDATE", [params.id]);
      if (!event.length) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      const { rows: count } = await client.query("SELECT COUNT(*)::int AS count FROM event_registrations WHERE event_id = $1 AND status IN ('confirmed', 'pending')", [params.id]);
      const attendees = Number(count[0]?.count || 0);
      if (maxAttendees !== null && maxAttendees < attendees) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Maximum attendees cannot be below current registrations" }, { status: 409 });
      }
      const { rows } = await client.query(
        `INSERT INTO event_registration_settings
          (event_id, registration_enabled, registration_starts_at, registration_ends_at, max_attendees, require_approval, confirmation_email_template)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (event_id) DO UPDATE SET registration_enabled = EXCLUDED.registration_enabled,
           registration_starts_at = EXCLUDED.registration_starts_at, registration_ends_at = EXCLUDED.registration_ends_at,
           max_attendees = EXCLUDED.max_attendees, require_approval = EXCLUDED.require_approval,
           confirmation_email_template = EXCLUDED.confirmation_email_template, updated_at = now()
         RETURNING *`, [params.id, enabled, startsAt, endsAt, maxAttendees, requireApproval, template],
      );
      await client.query("COMMIT");
      return NextResponse.json(toClient(rows[0], attendees));
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save registration settings";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : error instanceof SyntaxError ? 400 : 500;
    console.error("Registration settings save error:", error);
    return NextResponse.json({ error: status === 500 ? "Failed to save registration settings" : message }, { status });
  }
}
