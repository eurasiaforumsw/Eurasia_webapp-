import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyRequestToken } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegistrationStatus = "open" | "closed" | "full";

type EventRegistrationSettings = {
  id: string;
  event_id: string;
  is_enabled: boolean;
  registration_status: RegistrationStatus;
  max_attendees: number | null;
  current_attendees: number;
  starts_at: string | null;
  ends_at: string | null;
  confirmation_message: string;
  require_approval: boolean;
  created_at: string;
  updated_at: string;
};

type RegistrationField = {
  id: string;
  event_id: string;
  field_name: string;
  field_type: "text" | "textarea" | "email" | "tel" | "select" | "radio" | "checkbox" | "number";
  field_label: string;
  field_placeholder: string;
  is_required: boolean;
  options: string[] | null;
  sort_order: number;
};

type EventRegistration = {
  id: string;
  event_id: string;
  member_id: string;
  status: "confirmed" | "pending" | "cancelled";
  registered_at: string;
};

/** Run Supabase query with timeout */
const withTimeout = <T extends PromiseLike<any>>(run: () => T, label = "query"): Promise<any> =>
  Promise.race([
    Promise.resolve(run()),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), 10_000),
    ),
  ]);

/** Send confirmation email without blocking registration */
async function sendConfirmationEmailAsync(
  to: string,
  fullName: string,
  eventTitle: string,
  confirmationMessage: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "EFSW <no-reply@efsw.local>";

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/v1/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: `Registration confirmed: ${eventTitle}`,
          html: buildConfirmationEmailHtml(fullName, eventTitle, confirmationMessage),
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[event-registration] Resend ${res.status}: ${text.slice(0, 200)}`);
      }
    } catch (err) {
      console.error("[event-registration] Resend fetch failed:", err);
    }
  } else {
    console.info(
      "[event-registration] Dev mode delivery\n" +
        `  email: ${to}\n` +
        `  event: ${eventTitle}`,
    );
  }
}

function buildConfirmationEmailHtml(
  fullName: string,
  eventTitle: string,
  confirmationMessage: string,
): string {
  return `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0A0D12; padding: 2rem; color: #e8eaed;">
  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 36rem; background: #0F131C; border: 1px solid #1E2636; border-radius: 12px; padding: 2.5rem;">
    <tr><td>
      <h1 style="margin: 0 0 0.5rem; font-size: 1.5rem; color: #38BDF8;">Registration Confirmed!</h1>
      <p style="margin: 0 0 1.5rem; color: #9ca3af; font-size: 0.95rem;">Hi ${fullName},</p>
      <p style="margin: 0 0 1.5rem; color: #e8eaed; font-size: 0.95rem;">Your registration for <strong>${eventTitle}</strong> has been confirmed.</p>
      ${confirmationMessage ? `<div style="background: #161D2B; border-left: 3px solid #38BDF8; padding: 1rem; margin: 0 0 1.5rem; border-radius: 4px;"><p style="margin: 0; color: #e8eaed; font-size: 0.9rem;">${confirmationMessage}</p></div>` : ""}
      <p style="margin: 0; font-size: 0.85rem; color: #6b7280;">We look forward to seeing you at the event!</p>
    </td></tr>
  </table>
</body></html>`;
}

/** POST /api/events/[id]/register - Register for event */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  // Verify authentication
  const payload = await verifyRequestToken(request);
  if (!payload || payload.role !== "member") {
    return NextResponse.json({ error: "Authentication required. Please log in as a member." }, { status: 401 });
  }

  const eventId = params.id;
  const memberId = payload.id;

  try {
    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Check if registration settings exist and are enabled
    const { data: settings, error: settingsError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("event_registration_settings")
          .select("*")
          .eq("event_id", eventId)
          .maybeSingle(),
      "getRegistrationSettings",
    );

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    if (!settings) {
      return NextResponse.json({ error: "Registration is not available for this event." }, { status: 404 });
    }

    const regSettings = settings as EventRegistrationSettings;

    // Check if registration is enabled
    if (!regSettings.is_enabled) {
      return NextResponse.json({ error: "Registration is currently closed for this event." }, { status: 403 });
    }

    // Check registration status
    if (regSettings.registration_status === "closed") {
      return NextResponse.json({ error: "Registration has closed for this event." }, { status: 403 });
    }

    if (regSettings.registration_status === "full") {
      return NextResponse.json({ error: "This event is fully booked." }, { status: 403 });
    }

    // Check time window
    const now = new Date();
    if (regSettings.starts_at && new Date(regSettings.starts_at) > now) {
      return NextResponse.json(
        { error: "Registration has not opened yet." },
        { status: 403 },
      );
    }

    if (regSettings.ends_at && new Date(regSettings.ends_at) < now) {
      return NextResponse.json({ error: "Registration period has ended." }, { status: 403 });
    }

    // Check max attendees
    if (regSettings.max_attendees && regSettings.current_attendees >= regSettings.max_attendees) {
      return NextResponse.json({ error: "This event has reached maximum capacity." }, { status: 403 });
    }

    // Check if already registered
    const { data: existing, error: existingError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("event_registrations")
          .select("id, status")
          .eq("event_id", eventId)
          .eq("member_id", memberId)
          .maybeSingle(),
      "checkExistingRegistration",
    );

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existing && (existing as any).status !== "cancelled") {
      return NextResponse.json(
        { error: "You are already registered for this event." },
        { status: 409 },
      );
    }

    // Get required fields
    const { data: fields, error: fieldsError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("event_registration_fields")
          .select("*")
          .eq("event_id", eventId)
          .order("sort_order"),
      "getRegistrationFields",
    );

    if (fieldsError) {
      return NextResponse.json({ error: fieldsError.message }, { status: 500 });
    }

    const regFields = (fields as RegistrationField[]) || [];

    // Validate required fields
    const answers = body.answers as Record<string, any> | undefined;
    if (!answers) {
      return NextResponse.json({ error: "Registration answers are required." }, { status: 400 });
    }

    const missingFields: string[] = [];
    for (const field of regFields) {
      if (field.is_required && !answers[field.id]) {
        missingFields.push(field.field_label);
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Please fill in all required fields: ${missingFields.join(", ")}`,
          missingFields,
        },
        { status: 400 },
      );
    }

    // Create registration with confirmed or pending status
    const registrationStatus = regSettings.require_approval ? "pending" : "confirmed";
    const registrationId = `reg-${eventId}-${memberId}-${Date.now().toString(36)}`;

    const { data: registration, error: registrationError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("event_registrations")
          .insert({
            id: registrationId,
            event_id: eventId,
            member_id: memberId,
            status: registrationStatus,
            registered_at: new Date().toISOString(),
          })
          .select()
          .single(),
      "createRegistration",
    );

    if (registrationError) {
      return NextResponse.json({ error: registrationError.message }, { status: 500 });
    }

    // Create answer records
    const answerRecords = Object.entries(answers).map(([fieldId, value]) => ({
      id: `ans-${registrationId}-${fieldId}-${Date.now().toString(36)}`,
      registration_id: registrationId,
      field_id: fieldId,
      answer_value: typeof value === "string" ? value : JSON.stringify(value),
      created_at: new Date().toISOString(),
    }));

    if (answerRecords.length > 0) {
      const { error: answersError } = await withTimeout(
        () => supabaseAdmin!.from("event_registration_answers").insert(answerRecords),
        "createAnswers",
      );

      if (answersError) {
        console.error("[event-registration] Failed to save answers:", answersError);
      }
    }

    // Increment current_attendees
    const { error: updateError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("event_registration_settings")
          .update({
            current_attendees: regSettings.current_attendees + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("event_id", eventId),
      "incrementAttendees",
    );

    if (updateError) {
      console.error("[event-registration] Failed to increment attendees:", updateError);
    }

    // Get event details for email
    const { data: eventData } = await withTimeout(
      () => supabaseAdmin!.from("content").select("title").eq("id", eventId).single(),
      "getEventTitle",
    );

    const eventTitle = (eventData as any)?.title || "Event";

    // Get member details for email
    const { data: memberData } = await withTimeout(
      () => supabaseAdmin!.from("members").select("full_name, email").eq("id", memberId).single(),
      "getMemberDetails",
    );

    const memberName = (memberData as any)?.full_name || "Member";
    const memberEmail = (memberData as any)?.email || payload.email;

    // Send confirmation email (don't block response)
    if (registrationStatus === "confirmed") {
      sendConfirmationEmailAsync(
        memberEmail,
        memberName,
        eventTitle,
        regSettings.confirmation_message,
      ).catch((err) => {
        console.error("[event-registration] Email failed:", err);
      });
    }

    return NextResponse.json({
      success: true,
      registration: {
        id: registrationId,
        eventId,
        memberId,
        status: registrationStatus,
        registeredAt: (registration as EventRegistration).registered_at,
      },
      message:
        registrationStatus === "confirmed"
          ? "Registration confirmed! A confirmation email has been sent."
          : "Registration received. Your registration is pending approval.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[event-registration] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** GET /api/events/[id]/register - Check registration status */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  // Verify authentication
  const payload = await verifyRequestToken(request);
  if (!payload) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const eventId = params.id;
  const memberId = payload.id;

  try {
    // Get registration settings
    const { data: settings, error: settingsError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("event_registration_settings")
          .select("*")
          .eq("event_id", eventId)
          .maybeSingle(),
      "getRegistrationSettings",
    );

    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }

    // Check user's registration
    const { data: registration, error: regError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("event_registrations")
          .select("id, status, registered_at")
          .eq("event_id", eventId)
          .eq("member_id", memberId)
          .maybeSingle(),
      "getUserRegistration",
    );

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    const regSettings = settings as EventRegistrationSettings | null;
    const userReg = registration as EventRegistration | null;

    return NextResponse.json({
      isRegistered: !!userReg && userReg.status !== "cancelled",
      registration: userReg
        ? {
            id: userReg.id,
            status: userReg.status,
            registeredAt: userReg.registered_at,
          }
        : null,
      settings: regSettings
        ? {
            isEnabled: regSettings.is_enabled,
            registrationStatus: regSettings.registration_status,
            maxAttendees: regSettings.max_attendees,
            currentAttendees: regSettings.current_attendees,
            spotsAvailable:
              regSettings.max_attendees
                ? Math.max(0, regSettings.max_attendees - regSettings.current_attendees)
                : null,
            startsAt: regSettings.starts_at,
            endsAt: regSettings.ends_at,
            requireApproval: regSettings.require_approval,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[event-registration] GET error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
