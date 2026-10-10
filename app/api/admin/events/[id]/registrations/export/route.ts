import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import jwt from "jsonwebtoken";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production";

interface JWTPayload {
  email: string;
  role: string;
  name: string;
}

type RegistrationWithDetails = {
  id: string;
  event_id: string;
  member_id: string;
  status: "confirmed" | "pending" | "cancelled";
  registered_at: string;
  member: {
    full_name: string;
    email: string;
    phone?: string;
  };
  answers: Array<{
    field_id: string;
    answer_value: string;
    field: {
      field_label: string;
      field_type: string;
      sort_order: number;
    };
  }>;
};

type EventDetails = {
  id: string;
  title: string;
  type: string;
};

/** Verify admin authentication */
async function verifyAdmin(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/** Run query with timeout */
const withTimeout = <T extends PromiseLike<any>>(run: () => T, label = "query"): Promise<any> =>
  Promise.race([
    Promise.resolve(run()),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), 15_000)
    ),
  ]);

/** Format date to Thai locale */
function formatThaiDate(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Generate Excel export */
async function generateExcel(
  eventDetails: EventDetails,
  registrations: RegistrationWithDetails[]
): Promise<Buffer> {
  // Prepare headers
  const baseHeaders = ["#", "Registration ID", "Full Name", "Email", "Phone", "Status", "Registered At"];

  // Collect all unique fields
  const fieldMap = new Map<string, { label: string; order: number }>();
  registrations.forEach((reg) => {
    reg.answers.forEach((ans) => {
      if (!fieldMap.has(ans.field_id)) {
        fieldMap.set(ans.field_id, {
          label: ans.field.field_label,
          order: ans.field.sort_order,
        });
      }
    });
  });

  const sortedFields = Array.from(fieldMap.entries())
    .sort((a, b) => a[1].order - b[1].order)
    .map(([id, data]) => ({ id, label: data.label }));

  const headers = [...baseHeaders, ...sortedFields.map((f) => f.label)];

  // Prepare data rows
  const rows = registrations.map((reg, index) => {
    const baseRow = [
      index + 1,
      reg.id,
      reg.member.full_name,
      reg.member.email,
      reg.member.phone || "-",
      reg.status.toUpperCase(),
      formatThaiDate(reg.registered_at),
    ];

    const answerMap = new Map(reg.answers.map((a) => [a.field_id, a.answer_value]));
    const fieldAnswers = sortedFields.map((f) => answerMap.get(f.id) || "-");

    return [...baseRow, ...fieldAnswers];
  });

  // Create workbook
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  const colWidths = headers.map((h, i) => {
    if (i === 0) return { wch: 5 };
    if (i === 1) return { wch: 35 };
    if (i === 2) return { wch: 25 };
    if (i === 3) return { wch: 30 };
    if (i === 6) return { wch: 25 };
    return { wch: 20 };
  });
  ws["!cols"] = colWidths;

  // Style header row
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    ws[address].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E3A8A" } },
      alignment: { vertical: "center", horizontal: "center" },
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Registrations");

  // Add summary sheet
  const summaryData = [
    ["Event Registration Export"],
    [""],
    ["Event:", eventDetails.title],
    ["Type:", eventDetails.type],
    ["Total Registrations:", registrations.length],
    ["Confirmed:", registrations.filter((r) => r.status === "confirmed").length],
    ["Pending:", registrations.filter((r) => r.status === "pending").length],
    ["Cancelled:", registrations.filter((r) => r.status === "cancelled").length],
    [""],
    ["Exported At:", formatThaiDate(new Date().toISOString())],
    ["Exported By:", "Admin Console"],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Generate buffer
  const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.from(excelBuffer);
}

/** Generate PDF export */
async function generatePDF(
  eventDetails: EventDetails,
  registrations: RegistrationWithDetails[]
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Header
  doc.setFillColor(5, 7, 12);
  doc.rect(0, 0, doc.internal.pageSize.width, 35, "F");

  doc.setTextColor(56, 189, 248);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Event Registration Report", 14, 15);

  doc.setTextColor(156, 163, 175);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Event: ${eventDetails.title}`, 14, 23);
  doc.text(`Type: ${eventDetails.type} | Total: ${registrations.length}`, 14, 29);

  // Collect fields
  const fieldMap = new Map<string, { label: string; order: number }>();
  registrations.forEach((reg) => {
    reg.answers.forEach((ans) => {
      if (!fieldMap.has(ans.field_id)) {
        fieldMap.set(ans.field_id, {
          label: ans.field.field_label,
          order: ans.field.sort_order,
        });
      }
    });
  });

  const sortedFields = Array.from(fieldMap.entries())
    .sort((a, b) => a[1].order - b[1].order)
    .map(([id, data]) => ({ id, label: data.label }));

  // Table headers
  const headers = [
    "#",
    "Full Name",
    "Email",
    "Status",
    ...sortedFields.map((f) => f.label),
  ];

  // Table body
  const body = registrations.map((reg, index) => {
    const answerMap = new Map(reg.answers.map((a) => [a.field_id, a.answer_value]));
    return [
      (index + 1).toString(),
      reg.member.full_name,
      reg.member.email,
      reg.status.toUpperCase(),
      ...sortedFields.map((f) => answerMap.get(f.id) || "-"),
    ];
  });

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: body,
    startY: 40,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [232, 234, 237],
      lineColor: [30, 38, 54],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 19, 28],
      textColor: [56, 189, 248],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [10, 13, 18],
    },
    bodyStyles: {
      fillColor: [15, 19, 28],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 40 },
      2: { cellWidth: 50 },
      3: { cellWidth: 25, halign: "center" },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Exported: ${formatThaiDate(new Date().toISOString())} | Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}

/** GET /api/admin/events/[id]/registrations/export */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // Verify admin authentication
  const admin = await verifyAdmin(request);
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  const eventId = params.id;
  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "excel";

  if (!["excel", "pdf"].includes(format)) {
    return NextResponse.json(
      { error: 'Invalid format. Use "excel" or "pdf"' },
      { status: 400 }
    );
  }

  try {
    // Get event details
    const { data: eventData, error: eventError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("content")
          .select("id, title, type")
          .eq("id", eventId)
          .single(),
      "getEvent"
    );

    if (eventError || !eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventDetails = eventData as EventDetails;

    // Get registrations with member details and answers
    const { data: registrations, error: regError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("event_registrations")
          .select(
            `
            id,
            event_id,
            member_id,
            status,
            registered_at,
            members:member_id (
              full_name,
              email,
              phone
            )
          `
          )
          .eq("event_id", eventId)
          .order("registered_at", { ascending: false }),
      "getRegistrations"
    );

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json(
        { error: "No registrations found for this event" },
        { status: 404 }
      );
    }

    // Get all registration answers with field details
    const registrationIds = registrations.map((r: any) => r.id);
    const { data: answers, error: answersError } = await withTimeout(
      () =>
        supabaseAdmin!
          .from("event_registration_answers")
          .select(
            `
            registration_id,
            field_id,
            answer_value,
            event_registration_fields:field_id (
              field_label,
              field_type,
              sort_order
            )
          `
          )
          .in("registration_id", registrationIds),
      "getAnswers"
    );

    if (answersError) {
      console.error("[export] Failed to fetch answers:", answersError);
    }

    // Map answers to registrations
    const answersByReg = new Map<string, any[]>();
    (answers || []).forEach((ans: any) => {
      if (!answersByReg.has(ans.registration_id)) {
        answersByReg.set(ans.registration_id, []);
      }
      answersByReg.get(ans.registration_id)!.push({
        field_id: ans.field_id,
        answer_value: ans.answer_value,
        field: ans.event_registration_fields,
      });
    });

    const registrationsWithDetails: RegistrationWithDetails[] = registrations.map((reg: any) => ({
      id: reg.id,
      event_id: reg.event_id,
      member_id: reg.member_id,
      status: reg.status,
      registered_at: reg.registered_at,
      member: reg.members,
      answers: answersByReg.get(reg.id) || [],
    }));

    // Generate export file
    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    if (format === "excel") {
      buffer = await generateExcel(eventDetails, registrationsWithDetails);
      filename = `event-registrations-${eventId}-${Date.now()}.xlsx`;
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else {
      buffer = await generatePDF(eventDetails, registrationsWithDetails);
      filename = `event-registrations-${eventId}-${Date.now()}.pdf`;
      contentType = "application/pdf";
    }

    // Return file download
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("[export] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
