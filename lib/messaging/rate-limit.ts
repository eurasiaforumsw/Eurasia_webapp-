/**
 * Rate limiting for messaging system
 * Implements escalating delays: 5s -> 10s -> 30s -> 1m -> 5m -> 15m
 */

import { supabaseAdmin } from "@/lib/supabase";

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds to wait
  nextDelay?: number; // next delay if they send again too fast
}

const DELAY_LADDER = [5, 10, 30, 60, 300, 900]; // seconds

/**
 * Check if sender can send a message (rate limit check)
 * Returns allowed: true if they can send, or allowed: false with retryAfter seconds
 */
export async function checkMessageRateLimit(
  memberId: string
): Promise<RateLimitResult> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured");
  }

  try {
    // Get the most recent rate limit record for this member
    const { data: rateLimit, error } = await supabaseAdmin
      .from("message_rate_limits")
      .select("*")
      .eq("member_id", memberId)
      .order("last_attempt_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Rate limit check error:", error);
      // Allow on error to not block legitimate users
      return { allowed: true };
    }

    const now = new Date();

    // No previous record - allow
    if (!rateLimit) {
      return { allowed: true, nextDelay: DELAY_LADDER[0] };
    }

    const lastAttempt = new Date(rateLimit.last_attempt_at);
    const requiredDelay = rateLimit.current_delay_seconds;
    const secondsSinceLastAttempt = Math.floor((now.getTime() - lastAttempt.getTime()) / 1000);

    // Check if enough time has passed
    if (secondsSinceLastAttempt < requiredDelay) {
      // Still rate limited
      const retryAfter = requiredDelay - secondsSinceLastAttempt;
      return {
        allowed: false,
        retryAfter,
      };
    }

    // Reset delay if they waited long enough (5 minutes of good behavior)
    const shouldResetDelay = secondsSinceLastAttempt >= 300;
    const nextDelay = shouldResetDelay
      ? DELAY_LADDER[0]
      : Math.min(
          DELAY_LADDER[Math.min(rateLimit.violation_count, DELAY_LADDER.length - 1)],
          DELAY_LADDER[DELAY_LADDER.length - 1]
        );

    return {
      allowed: true,
      nextDelay,
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Allow on error
    return { allowed: true };
  }
}

/**
 * Record a message send attempt (updates rate limit tracking)
 */
export async function recordMessageAttempt(
  memberId: string,
  success: boolean
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured");
  }

  try {
    const now = new Date();

    // Get existing rate limit record
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("message_rate_limits")
      .select("*")
      .eq("member_id", memberId)
      .order("last_attempt_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to fetch rate limit:", fetchError);
      return;
    }

    if (success) {
      // Successful send - reset or reduce violation count
      if (existing) {
        const lastAttempt = new Date(existing.last_attempt_at);
        const secondsSince = Math.floor((now.getTime() - lastAttempt.getTime()) / 1000);

        // If they waited long enough (5+ minutes), fully reset
        if (secondsSince >= 300) {
          await supabaseAdmin
            .from("message_rate_limits")
            .update({
              last_attempt_at: now.toISOString(),
              current_delay_seconds: DELAY_LADDER[0],
              violation_count: 0,
              last_success_at: now.toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // Just update last attempt
          await supabaseAdmin
            .from("message_rate_limits")
            .update({
              last_attempt_at: now.toISOString(),
              last_success_at: now.toISOString(),
            })
            .eq("id", existing.id);
        }
      } else {
        // First successful message - create record
        await supabaseAdmin.from("message_rate_limits").insert({
          member_id: memberId,
          last_attempt_at: now.toISOString(),
          current_delay_seconds: DELAY_LADDER[0],
          violation_count: 0,
          last_success_at: now.toISOString(),
        });
      }
    } else {
      // Failed attempt (rate limited) - escalate
      if (existing) {
        const newViolationCount = existing.violation_count + 1;
        const delayIndex = Math.min(newViolationCount, DELAY_LADDER.length - 1);
        const newDelay = DELAY_LADDER[delayIndex];

        await supabaseAdmin
          .from("message_rate_limits")
          .update({
            last_attempt_at: now.toISOString(),
            current_delay_seconds: newDelay,
            violation_count: newViolationCount,
          })
          .eq("id", existing.id);
      } else {
        // First violation - create record
        await supabaseAdmin.from("message_rate_limits").insert({
          member_id: memberId,
          last_attempt_at: now.toISOString(),
          current_delay_seconds: DELAY_LADDER[1], // Start at second level for violations
          violation_count: 1,
          last_success_at: null,
        });
      }
    }
  } catch (error) {
    console.error("Failed to record message attempt:", error);
    // Don't throw - this shouldn't block the message
  }
}
