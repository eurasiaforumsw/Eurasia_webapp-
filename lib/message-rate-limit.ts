import { db } from '@/lib/db';

// Configurable profanity and spam patterns
const PROFANITY_LIST = [
  'spam', 'scam', 'fraud', 'fake', 'phishing',
  // Add more as needed - keeping basic for now
];

const SPAM_PATTERNS = [
  /buy now/i,
  /click here/i,
  /free money/i,
  /earn \$\d+/i,
  /limited time offer/i,
  /act now/i,
  /congratulations! you(?:'ve| have) won/i,
  /claim your prize/i,
  /verify your account/i,
  /urgent action required/i,
];

interface RateLimitResult {
  success: boolean;
  retryAfter?: number;
  violationCount?: number;
}

/**
 * Check rate limit for a member with exponential backoff
 * Returns success true if allowed to send, false with retryAfter seconds if rate limited
 */
export async function checkRateLimit(memberId: string): Promise<RateLimitResult> {
  const now = new Date();

  // Query existing rate limit record
  const { data: existingLimit, error: queryError } = await db
    .from('message_rate_limits')
    .select('*')
    .eq('member_id', memberId)
    .maybeSingle();

  if (queryError && queryError.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" - that's ok, other errors are not
    console.error('Rate limit query error:', queryError);
    throw new Error('Failed to check rate limit');
  }

  // No record exists - create one and allow message
  if (!existingLimit) {
    const nextAllowed = new Date(now.getTime() + 5000); // 5 seconds from now

    const { error: insertError } = await db
      .from('message_rate_limits')
      .insert({
        member_id: memberId,
        next_allowed_at: nextAllowed.toISOString(),
        violation_count: 0,
        last_message_at: now.toISOString(),
      });

    if (insertError) {
      console.error('Rate limit insert error:', insertError);
      throw new Error('Failed to create rate limit record');
    }

    return { success: true };
  }

  // Record exists - check if rate limited
  const nextAllowedAt = new Date(existingLimit.next_allowed_at);

  if (now < nextAllowedAt) {
    // Rate limited - calculate escalating delay
    const newViolationCount = (existingLimit.violation_count || 0) + 1;
    let delaySeconds: number;

    switch (newViolationCount) {
      case 1:
        delaySeconds = 10;
        break;
      case 2:
        delaySeconds = 30;
        break;
      case 3:
        delaySeconds = 60; // 1 minute
        break;
      case 4:
        delaySeconds = 300; // 5 minutes
        break;
      case 5:
        delaySeconds = 900; // 15 minutes
        break;
      default:
        delaySeconds = 1800; // 30 minutes for 6+ violations
    }

    const newNextAllowed = new Date(now.getTime() + delaySeconds * 1000);
    const retryAfter = Math.ceil((nextAllowedAt.getTime() - now.getTime()) / 1000);

    // Update violation count and next allowed time
    await db
      .from('message_rate_limits')
      .update({
        violation_count: newViolationCount,
        next_allowed_at: newNextAllowed.toISOString(),
      })
      .eq('member_id', memberId);

    return {
      success: false,
      retryAfter,
      violationCount: newViolationCount,
    };
  }

  // Not rate limited - reset and allow
  const nextAllowed = new Date(now.getTime() + 5000); // 5 seconds from now

  await db
    .from('message_rate_limits')
    .update({
      violation_count: 0,
      next_allowed_at: nextAllowed.toISOString(),
      last_message_at: now.toISOString(),
    })
    .eq('member_id', memberId);

  return { success: true };
}

/**
 * Detect spam patterns in message text
 * Returns true if spam detected
 */
export function detectSpam(messageText: string): boolean {
  if (!messageText || messageText.trim().length === 0) {
    return false;
  }

  // Check 1: Repeated characters (5+ times)
  if (/(.)\1{4,}/i.test(messageText)) {
    return true;
  }

  // Check 2: All caps message longer than 20 chars
  if (messageText.length > 20 && messageText === messageText.toUpperCase()) {
    const letterCount = (messageText.match(/[A-Z]/g) || []).length;
    if (letterCount > 15) {
      return true;
    }
  }

  // Check 3: Known spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(messageText)) {
      return true;
    }
  }

  // Check 4: Profanity list
  const lowerText = messageText.toLowerCase();
  for (const word of PROFANITY_LIST) {
    if (lowerText.includes(word.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Check if message length is within limits
 */
export function validateMessageLength(messageText: string): {
  valid: boolean;
  length: number;
  maxLength: number;
} {
  const MAX_LENGTH = 2000;
  const length = messageText.trim().length;

  return {
    valid: length > 0 && length <= MAX_LENGTH,
    length,
    maxLength: MAX_LENGTH,
  };
}
