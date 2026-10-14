import { NextRequest, NextResponse } from "next/server";
import { verifyMemberToken } from "@/lib/auth/jwt";
import { query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Simple in-memory rate limiter for search
 * Limits: 10 searches per minute per member
 */
const searchRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkSearchRateLimit(memberId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const limit = searchRateLimits.get(memberId);

  // Clean up expired entries
  if (limit && now > limit.resetAt) {
    searchRateLimits.delete(memberId);
  }

  const current = searchRateLimits.get(memberId);

  if (!current) {
    // First request in this window
    searchRateLimits.set(memberId, {
      count: 1,
      resetAt: now + 60000, // 1 minute from now
    });
    return { allowed: true };
  }

  if (current.count >= 10) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  current.count += 1;
  return { allowed: true };
}

/**
 * GET /api/messages/members/search?q=query
 * Search members to start a conversation
 *
 * Features:
 * - Search by full_name or email (case-insensitive)
 * - Exclude requester from results
 * - Exclude suspended members
 * - Rate limiting: 10 searches per minute
 * - Returns max 20 results
 */
export async function GET(request: NextRequest) {
  // Check authentication
  const payload = await verifyMemberToken(request);
  if (!payload) {
    return NextResponse.json(
      { error: "Authentication required. Please log in." },
      { status: 401 }
    );
  }

  const memberId = payload.memberId;

  // Rate limiting check
  const rateLimitCheck = checkSearchRateLimit(memberId);
  if (!rateLimitCheck.allowed) {
    return NextResponse.json(
      {
        error: `Too many search requests. Please wait ${rateLimitCheck.retryAfter} seconds.`,
        rateLimited: true,
        retryAfter: rateLimitCheck.retryAfter,
      },
      { status: 429 }
    );
  }

  // Get search query
  const searchQuery = request.nextUrl.searchParams.get("q");

  if (!searchQuery || searchQuery.trim().length === 0) {
    return NextResponse.json(
      { error: "Search query parameter 'q' is required" },
      { status: 400 }
    );
  }

  const trimmedQuery = searchQuery.trim();

  if (trimmedQuery.length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const searchPattern = `%${trimmedQuery}%`;
    const { rows: members } = await query(`SELECT member.id, member.full_name, member.email, (to_jsonb(member)->>'avatar_url') AS avatar_url
      FROM members member WHERE member.id != $1 AND member.status = 'active'
      AND (member.full_name ILIKE $2 OR member.email ILIKE $2)
      AND NOT EXISTS (SELECT 1 FROM member_suspensions suspension
        WHERE suspension.member_id = member.id AND suspension.is_active = true
        AND (suspension.expires_at IS NULL OR suspension.expires_at > NOW()))
      ORDER BY member.full_name LIMIT 20`, [memberId, searchPattern]);
    const filteredMembers = members.map((member: any) => ({
      id: member.id, fullName: member.full_name, email: member.email, avatar: member.avatar_url || null,
    }));

    return NextResponse.json({
      success: true,
      members: filteredMembers,
      count: filteredMembers.length,
    });
  } catch (error) {
    console.error("Unexpected search error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
