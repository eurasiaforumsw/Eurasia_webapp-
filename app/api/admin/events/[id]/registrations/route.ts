import { NextRequest, NextResponse } from "next/server";
import pool, { query } from "@/lib/db";
import { requireRole } from "@/lib/api-auth";
import { ADMIN_ROLES } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function authorize(request: NextRequest) {
  try { await requireRole(request, ADMIN_ROLES); return null; }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const rejected = await authorize(request);
  if (rejected) return rejected;
  const offset = Number(request.nextUrl.searchParams.get("offset") || 0);
  if (!Number.isSafeInteger(offset) || offset < 0) return NextResponse.json({ error: "Invalid offset" }, { status: 400 });
  try {
    const { rows } = await query(
      `SELECT r.id, r.status, r.registered_at, r.confirmation_number, m.full_name, m.email,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('label', f.field_label, 'value', a.answer_value) ORDER BY f.display_order)
          FROM event_registration_answers a JOIN event_registration_fields f ON f.id = a.field_id
          WHERE a.registration_id = r.id), '[]'::jsonb) AS answers
       FROM event_registrations r LEFT JOIN members m ON m.id = r.member_id
       WHERE r.event_id = $1 ORDER BY r.registered_at DESC LIMIT 101 OFFSET $2`, [params.id, offset],
    );
    return NextResponse.json({ registrations: rows.slice(0,100), hasMore: rows.length > 100 });
  } catch (error) {
    console.error("Registration list failed:", error);
    return NextResponse.json({ error: "Failed to load registrations" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const rejected = await authorize(request);
  if (rejected) return rejected;
  const body = await request.json().catch(() => null);
  if (typeof body?.registrationId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.registrationId) ||
      !["confirmed", "cancelled", "waitlist"].includes(body.status)) return NextResponse.json({ error: "Invalid registration status" }, { status: 400 });
  let client;
  try { client = await pool.connect(); }
  catch { return NextResponse.json({ error: "Failed to update registration" }, { status: 500 }); }
  try {
    await client.query("BEGIN");
    const reject = async (error: string, status: number) => { await client.query("ROLLBACK"); return NextResponse.json({ error }, { status }); };
    const { rows: events } = await client.query("SELECT id, title FROM content WHERE id = $1 AND kind = 'event' FOR UPDATE", [params.id]);
    if (!events.length) return reject("Event not found",404);
    const { rows: registrations } = await client.query(
      "SELECT r.*, m.email, m.full_name, m.status AS member_status FROM event_registrations r LEFT JOIN members m ON m.id = r.member_id WHERE r.id = $1 AND r.event_id = $2 FOR UPDATE OF r", [body.registrationId, params.id],
    );
    const registration = registrations[0];
    if (!registration) return reject("Registration not found",404);
    if (body.status === "confirmed" && registration.status !== "confirmed") {
      if (registration.member_status !== "active") return reject("An active membership is required",409);
      const { rows: duplicate } = await client.query("SELECT id FROM event_registrations WHERE event_id = $1 AND member_id = $2 AND id <> $3 AND status <> 'cancelled'", [params.id, registration.member_id, registration.id]);
      if (duplicate.length) return reject("Member already has an active registration",409);
      if (registration.status !== "pending") {
        const { rows: settings } = await client.query("SELECT max_attendees FROM event_registration_settings WHERE event_id = $1", [params.id]);
        const { rows: count } = await client.query("SELECT COUNT(*)::int AS count FROM event_registrations WHERE event_id = $1 AND status IN ('confirmed','pending')", [params.id]);
        if (settings[0]?.max_attendees != null && Number(count[0].count) >= settings[0].max_attendees) return reject("Event has reached maximum capacity",409);
      }
    }
    const { rows } = await client.query(
      "UPDATE event_registrations SET status = $1, cancelled_at = CASE WHEN $1 = 'cancelled' THEN now() ELSE NULL END, updated_at = now() WHERE id = $2 AND event_id = $3 RETURNING id, status, confirmation_number", [body.status, body.registrationId, params.id],
    );
    await client.query("COMMIT");
    let emailSent = false;
    if (body.status === "confirmed" && registration.status !== "confirmed") {
      const text = `Your registration for ${events[0].title} has been confirmed. Confirmation: ${registration.confirmation_number}`;
      const escaped = text.replace(/[&<>"']/g,(character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[character]!));
      try { emailSent = (await sendEmail({ to: registration.email, subject: `Registration confirmed: ${events[0].title}`, text, html: `<p>${escaped}</p>` })).success; }
      catch (error) { console.error("Registration approval email failed:", error); }
    }
    return NextResponse.json({ registration: rows[0], emailSent });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Registration status update failed:", error);
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  } finally { client.release(); }
}
