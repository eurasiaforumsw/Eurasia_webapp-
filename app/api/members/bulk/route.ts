import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Validation schemas
const BulkApproveSchema = z.object({
  action: z.literal("approve"),
  ids: z.array(z.string().min(1)).min(1).max(100),
});

const BulkDeleteSchema = z.object({
  action: z.literal("delete"),
  ids: z.array(z.string().min(1)).min(1).max(100),
});

const BulkUpdateStatusSchema = z.object({
  action: z.literal("updateStatus"),
  ids: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum(["pending", "active", "suspended"]),
});

const BulkRequestSchema = z.discriminatedUnion("action", [
  BulkApproveSchema,
  BulkDeleteSchema,
  BulkUpdateStatusSchema,
]);

type BulkRequest = z.infer<typeof BulkRequestSchema>;

type OperationResult = {
  id: string;
  success: boolean;
  error?: string;
};

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10; // 10 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // per minute

function checkRateLimit(identifier: string): { allowed: boolean; resetIn?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, resetIn: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count += 1;
  return { allowed: true };
}

// Timeout wrapper
const withTimeout = <T extends PromiseLike<any>>(run: () => T, label = "query"): Promise<any> =>
  Promise.race([
    Promise.resolve(run()),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), 15_000),
    ),
  ]);

// Bulk approve: set status to 'active'
async function bulkApprove(ids: string[]): Promise<OperationResult[]> {
  const results: OperationResult[] = [];

  for (const id of ids) {
    try {
      const { error } = await withTimeout(
        () => supabaseAdmin!.from("members").update({ status: "active" }).eq("id", id),
        `approve-${id}`,
      );

      if (error) {
        results.push({ id, success: false, error: error.message });
      } else {
        results.push({ id, success: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({ id, success: false, error: message });
    }
  }

  return results;
}

// Bulk delete: remove members from database
async function bulkDelete(ids: string[]): Promise<OperationResult[]> {
  const results: OperationResult[] = [];

  for (const id of ids) {
    try {
      const { error } = await withTimeout(
        () => supabaseAdmin!.from("members").delete().eq("id", id),
        `delete-${id}`,
      );

      if (error) {
        results.push({ id, success: false, error: error.message });
      } else {
        results.push({ id, success: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({ id, success: false, error: message });
    }
  }

  return results;
}

// Bulk update status
async function bulkUpdateStatus(
  ids: string[],
  status: "pending" | "active" | "suspended",
): Promise<OperationResult[]> {
  const results: OperationResult[] = [];

  for (const id of ids) {
    try {
      const { error } = await withTimeout(
        () => supabaseAdmin!.from("members").update({ status }).eq("id", id),
        `updateStatus-${id}`,
      );

      if (error) {
        results.push({ id, success: false, error: error.message });
      } else {
        results.push({ id, success: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({ id, success: false, error: message });
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  // Check Supabase configuration
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 503 },
    );
  }

  // Rate limiting (using IP or a session identifier)
  const identifier = request.headers.get("x-forwarded-for") || "anonymous";
  const rateLimit = checkRateLimit(identifier);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        retryAfter: rateLimit.resetIn,
      },
      { status: 429 },
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = BulkRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request format",
          details: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const bulkRequest = validation.data as BulkRequest;
    let results: OperationResult[];

    // Execute the appropriate bulk operation
    switch (bulkRequest.action) {
      case "approve":
        results = await bulkApprove(bulkRequest.ids);
        break;

      case "delete":
        results = await bulkDelete(bulkRequest.ids);
        break;

      case "updateStatus":
        results = await bulkUpdateStatus(bulkRequest.ids, bulkRequest.status);
        break;

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 },
        );
    }

    // Summarize results
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        succeeded: successCount,
        failed: failureCount,
      },
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      {
        error: "Bulk operation failed",
        message,
      },
      { status: 500 },
    );
  }
}
