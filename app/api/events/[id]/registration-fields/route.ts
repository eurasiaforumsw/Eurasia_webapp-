import { NextRequest, NextResponse } from "next/server";
import pool, { query } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { requireRole } from "@/lib/api-auth";
import { CONTENT_ROLES } from "@/lib/auth/session";

function toClientField(row: any) {
  return {
    ...row,
    placeholder: row.placeholder ?? "",
    required: row.required === true,
    display_order: Number(row.display_order ?? 0),
    options: Array.isArray(row.options) ? row.options : [],
    validation_rules: row.validation_rules ?? undefined,
  };
}

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
    const { rows: fields } = await query(
      `SELECT id, event_id, field_name, field_type, field_label, placeholder,
              required, options, validation_rules, display_order
         FROM event_registration_fields
        WHERE event_id = $1
        ORDER BY display_order ASC, created_at ASC`,
      [params.id],
    );

    // Return empty array if no fields found
    return NextResponse.json({ fields: fields.map(toClientField) });
  } catch (error) {
    console.error("Registration fields fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** POST /api/events/[id]/registration-fields — replace the form definition (admin/content role). */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireRole(request, CONTENT_ROLES);
    const body = await request.json();
    if (!body || !Array.isArray(body.fields) || body.fields.length > 50) {
      return NextResponse.json({ error: "fields must be an array of at most 50 items" }, { status: 400 });
    }
    const allowedTypes = new Set(["text", "textarea", "select", "radio", "checkbox", "date", "time", "email", "phone", "number"]);
    const fields = body.fields.map((field: any, index: number) => {
      const label = typeof field?.label === "string" ? field.label.trim() : "";
      const type = typeof field?.type === "string" ? field.type : "";
      if (!label || label.length > 200 || !allowedTypes.has(type)) throw new Error(`Invalid field at position ${index + 1}`);
      const options = Array.isArray(field.options)
        ? field.options.map((option: any) => typeof option === "string" ? option.trim() : typeof option?.label === "string" ? option.label.trim() : "")
        : null;
      if (["select", "radio", "checkbox"].includes(type) &&
          (!options?.length || options.length > 100 || options.some((option: string) => !option || option.length > 200) || new Set(options).size !== options.length)) {
        throw new Error(`Invalid field options at position ${index + 1}`);
      }
      return {
        id: typeof field.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(field.id) ? field.id : randomUUID(),
        field_name: typeof field.field_name === "string" && field.field_name.trim() ? field.field_name.trim().slice(0, 100) : `field_${index + 1}`,
        field_type: type,
        field_label: label,
        placeholder: typeof field.placeholder === "string" ? field.placeholder.slice(0, 300) : null,
        required: field.required === true,
        options: options && options.length ? JSON.stringify(options) : null,
        validation_rules: field.validation_rules && typeof field.validation_rules === "object" ? JSON.stringify(field.validation_rules) : null,
        display_order: index,
      };
    });
    if (new Set(fields.map((field: { id: string }) => field.id)).size !== fields.length) {
      return NextResponse.json({ error: "Duplicate field IDs" }, { status: 400 });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: event } = await client.query("SELECT id FROM content WHERE id = $1 AND kind = 'event' FOR UPDATE", [params.id]);
      if (!event.length) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      const ids = fields.map((field: { id: string }) => field.id);
      const { rows: usedFields } = await client.query(
        `SELECT f.id FROM event_registration_fields f
          WHERE f.event_id = $1 AND NOT (f.id = ANY($2::uuid[]))
            AND EXISTS (SELECT 1 FROM event_registration_answers a WHERE a.field_id = f.id)`, [params.id, ids],
      );
      if (usedFields.length) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Fields with submitted answers cannot be removed; their registration history must be preserved" }, { status: 409 });
      }
      const { rows: foreignFields } = await client.query(
        "SELECT id FROM event_registration_fields WHERE id = ANY($1::uuid[]) AND event_id <> $2", [ids, params.id],
      );
      if (foreignFields.length) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Field IDs belong to another event" }, { status: 400 });
      }
      await client.query("DELETE FROM event_registration_fields WHERE event_id = $1 AND NOT (id = ANY($2::uuid[]))", [params.id, ids]);
      for (const field of fields) {
        await client.query(
          `INSERT INTO event_registration_fields
            (id, event_id, field_name, field_type, field_label, placeholder, required, options, validation_rules, display_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10)
           ON CONFLICT (id) DO UPDATE SET field_name = EXCLUDED.field_name,
             field_type = EXCLUDED.field_type, field_label = EXCLUDED.field_label,
             placeholder = EXCLUDED.placeholder, required = EXCLUDED.required,
             options = EXCLUDED.options, validation_rules = EXCLUDED.validation_rules,
             display_order = EXCLUDED.display_order, updated_at = now()`,
          [field.id, params.id, field.field_name, field.field_type, field.field_label, field.placeholder,
            field.required, field.options, field.validation_rules, field.display_order],
        );
      }
      const { rows } = await client.query(
        `SELECT id, event_id, field_name, field_type, field_label, placeholder, required, options, validation_rules, display_order
           FROM event_registration_fields WHERE event_id = $1 ORDER BY display_order ASC`, [params.id],
      );
      await client.query("COMMIT");
      return NextResponse.json({ fields: rows.map(toClientField) });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save registration fields";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : message.startsWith("Invalid field") ? 400 : 500;
    console.error("Registration fields save error:", error);
    return NextResponse.json({ error: status === 500 ? "Failed to save registration fields" : message }, { status });
  }
}
