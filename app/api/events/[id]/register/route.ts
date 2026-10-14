import { NextRequest, NextResponse } from "next/server";
import pool, { query } from "@/lib/db";
import { verifyRequestToken } from "@/lib/api-auth";
import { randomUUID } from "node:crypto";
import { sendEmail } from "@/lib/email";
import { canReadContent } from "@/lib/content-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validateAnswers(fields: any[], answers: Record<string, unknown>) {
  const known = new Set(fields.map((field) => field.id));
  if (Object.keys(answers).some((id) => !known.has(id))) return "Unknown registration field";
  for (const field of fields) {
    const value = answers[field.id];
    const empty = value === undefined || value === null || value === "" ||
      (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length);
    if (empty) {
      if (field.required) return `${field.field_label} is required`;
      continue;
    }
    if (field.field_type === "checkbox") {
      if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) return `Invalid ${field.field_label}`;
    } else if (typeof value !== "string" && typeof value !== "number") return `Invalid ${field.field_label}`;
    if (JSON.stringify(value).length > 10_000) return `${field.field_label} is too long`;
    if (field.field_type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return "Invalid email address";
    if (field.field_type === "number" && !Number.isFinite(Number(value))) return `Invalid ${field.field_label}`;
    if (["select", "radio", "checkbox"].includes(field.field_type)) {
      const options = Array.isArray(field.options) ? field.options : [];
      const selected = Array.isArray(value) ? value : [value];
      if (selected.some((item) => !options.includes(item))) return `Invalid option for ${field.field_label}`;
    }
  }
  return null;
}

/** Registration and answers commit together; the event lock serializes capacity checks. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const member = await verifyRequestToken(request);
  if (!member || member.role !== "member") return NextResponse.json({ error: "Please log in as a member" }, { status: 401 });
  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  if (!body?.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) {
    return NextResponse.json({ error: "Registration answers are required" }, { status: 400 });
  }
  let client;
  try { client = await pool.connect(); }
  catch (error) {
    console.error("Event registration connection failed:", error);
    return NextResponse.json({ error: "Failed to register for event" }, { status: 500 });
  }
  try {
    await client.query("BEGIN");
    const reject = async (error: string, status: number) => {
      await client.query("ROLLBACK");
      return NextResponse.json({ error }, { status });
    };
    const { rows: events } = await client.query(
      "SELECT id, title, starts_at, status, publish_at, expires_at, target_membership_types, target_groups FROM content WHERE id = $1 AND kind = 'event' AND status = 'published' FOR UPDATE", [params.id],
    );
    if (!events.length) return reject("Event not found", 404);
    const { rows: settingsRows } = await client.query("SELECT * FROM event_registration_settings WHERE event_id = $1", [params.id]);
    const settings = settingsRows[0];
    if (!settings?.registration_enabled) return reject("Registration is closed for this event", 403);
    const now = Date.now();
    if (settings.registration_starts_at && new Date(settings.registration_starts_at).getTime() > now) return reject("Registration has not opened yet", 403);
    if (settings.registration_ends_at && new Date(settings.registration_ends_at).getTime() < now) return reject("Registration period has ended", 403);
    const { rows: members } = await client.query("SELECT id, full_name, email, membership_type, target_groups FROM members WHERE id = $1 AND status = 'active'", [member.id]);
    if (!members.length) return reject("An active membership is required", 403);
    if (!canReadContent(events[0], { editor: false, membership: members[0].membership_type, groups: members[0].target_groups || [] })) {
      return reject("Event not found", 404);
    }
    const { rows: existing } = await client.query(
      "SELECT id FROM event_registrations WHERE event_id = $1 AND member_id = $2 AND status <> 'cancelled'", [params.id, member.id],
    );
    if (existing.length) return reject("You are already registered for this event", 409);
    const { rows: count } = await client.query(
      "SELECT COUNT(*)::int AS count FROM event_registrations WHERE event_id = $1 AND status IN ('confirmed', 'pending')", [params.id],
    );
    if (settings.max_attendees !== null && Number(count[0]?.count || 0) >= settings.max_attendees) return reject("This event has reached maximum capacity", 409);
    const { rows: fields } = await client.query("SELECT * FROM event_registration_fields WHERE event_id = $1 ORDER BY display_order ASC", [params.id]);
    const invalid = validateAnswers(fields, body.answers);
    if (invalid) return reject(invalid, 400);
    const id = randomUUID();
    const confirmationNumber = `REG-${randomUUID().toUpperCase()}`;
    const status = settings.require_approval ? "pending" : "confirmed";
    const { rows: registrations } = await client.query(
      `INSERT INTO event_registrations (id, event_id, member_id, confirmation_number, status)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, status, registered_at`, [id, params.id, member.id, confirmationNumber, status],
    );
    for (const field of fields) {
      const value = body.answers[field.id];
      if (value === undefined || value === null) continue;
      await client.query(
        "INSERT INTO event_registration_answers (registration_id, field_id, answer_value) VALUES ($1,$2,$3)",
        [id, field.id, typeof value === "string" ? value : JSON.stringify(value)],
      );
    }
    await client.query("COMMIT");
    let emailSent = false;
    if (status === "confirmed") {
      const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!));
      const message = (settings.confirmation_email_template || "Thank you for registering for {event_title}.")
        .replaceAll("{name}", members[0].full_name).replaceAll("{event_title}", events[0].title)
        .replaceAll("{registration_id}", confirmationNumber).replaceAll("{event_date}", events[0].starts_at ? new Date(events[0].starts_at).toISOString() : "To be announced");
      try {
        const email = await sendEmail({ to: members[0].email,
          subject: `Registration confirmed: ${events[0].title}`,
          text: message, html: `<p>${escape(message).replace(/\n/g, "<br>")}</p>` });
        emailSent = email.success;
      } catch (error) {
        console.error("Registration confirmation email failed:", error);
      }
    }
    return NextResponse.json({
      success: true, registrationId: id, confirmationNumber, emailSent,
      registration: { id, eventId: params.id, memberId: member.id, status, registeredAt: registrations[0].registered_at },
      message: status === "confirmed" ? "Registration confirmed" : "Registration received and pending approval",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Event registration failed:", error);
    return NextResponse.json({ error: "Failed to register for event" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const member = await verifyRequestToken(request);
  if (!member || member.role !== "member") return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { rows } = await query(
      `SELECT id, status, registered_at, confirmation_number FROM event_registrations
        WHERE event_id = $1 AND member_id = $2 ORDER BY registered_at DESC LIMIT 1`, [params.id, member.id],
    );
    const registration = rows[0] || null;
    return NextResponse.json({ isRegistered: !!registration && registration.status !== "cancelled", registration });
  } catch (error) {
    console.error("Registration status fetch failed:", error);
    return NextResponse.json({ error: "Failed to check registration" }, { status: 500 });
  }
}
