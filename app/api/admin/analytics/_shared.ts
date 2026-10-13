import { NextRequest, NextResponse } from "next/server";

export type AnalyticsRange = "7d" | "30d" | "90d";

export function analyticsWindow(request: NextRequest, now = new Date()) {
  const range = request.nextUrl.searchParams.get("range") || "30d";
  if (!["7d", "30d", "90d"].includes(range)) throw new Error("Invalid analytics range");
  const days = Number(range.slice(0, -1));
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - days + 1);
  const previousStart = new Date(start);
  previousStart.setUTCDate(previousStart.getUTCDate() - days);
  return { range: range as AnalyticsRange, days, start, previousStart, now };
}

// Page through Supabase responses so larger catalogs do not stop at 1,000 rows.
export async function analyticsRows<T>(query: () => any, label: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await query().range(offset, offset + 999);
    if (error) throw new Error(`${label}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < 1000) return rows;
  }
}

export async function analyticsCount(query: any, label: string): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
  return count ?? 0;
}

export function analyticsError(error: unknown, label: string) {
  const message = error instanceof Error ? error.message : "Failed to fetch analytics";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403
    : message === "Invalid analytics range" ? 400 : 500;
  console.error(`${label}:`, error);
  return NextResponse.json({ error: message }, { status });
}
