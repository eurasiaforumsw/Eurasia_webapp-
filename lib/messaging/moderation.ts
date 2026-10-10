/**
 * Content moderation utilities for messaging system
 * Basic spam/profanity detection
 */

// Basic profanity word list (Thai + English common spam/abuse terms)
const PROFANITY_PATTERNS = [
  // English spam/abuse terms
  /\b(f[u\*]ck|sh[i\*]t|b[i\*]tch|damn|hell|ass|crap)\b/i,
  /\b(viagra|cialis|casino|lottery|prize|winner|click here|free money)\b/i,
  /\b(scam|phishing|hack|crack|pirate)\b/i,

  // Thai profanity (common examples - add more as needed)
  /\b(ควาย|ไอ้|เหี้ย|สัส|ดอก)\b/,

  // Excessive caps (more than 70% uppercase in messages over 20 chars)
  /^[A-Z\s]{20,}$/,
];

// Link detection regex
const LINK_PATTERN = /https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|co|io|dev|app)/i;

// Excessive repetition (same character 5+ times)
const REPETITION_PATTERN = /(.)\1{4,}/;

// Excessive punctuation (!!!!!!, ?????)
const EXCESSIVE_PUNCTUATION = /[!?]{5,}/;

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  flags?: string[];
}

/**
 * Check if message content passes basic moderation filters
 */
export function moderateMessage(content: string): ModerationResult {
  const flags: string[] = [];

  // Check length
  if (content.trim().length === 0) {
    return {
      allowed: false,
      reason: "Message content cannot be empty",
    };
  }

  if (content.length > 2000) {
    return {
      allowed: false,
      reason: "Message exceeds maximum length of 2000 characters",
    };
  }

  // Check for profanity/spam patterns
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(content)) {
      flags.push("profanity_or_spam");
      return {
        allowed: false,
        reason: "Message contains inappropriate or spam content",
        flags,
      };
    }
  }

  // Check for excessive repetition
  if (REPETITION_PATTERN.test(content)) {
    flags.push("excessive_repetition");
  }

  // Check for excessive punctuation
  if (EXCESSIVE_PUNCTUATION.test(content)) {
    flags.push("excessive_punctuation");
  }

  // Check if message is mostly uppercase (spam indicator)
  const alphaChars = content.replace(/[^a-zA-Z]/g, "");
  if (alphaChars.length > 20) {
    const upperCount = content.replace(/[^A-Z]/g, "").length;
    const upperRatio = upperCount / alphaChars.length;
    if (upperRatio > 0.7) {
      flags.push("excessive_caps");
    }
  }

  // If multiple flags, likely spam
  if (flags.length >= 2) {
    return {
      allowed: false,
      reason: "Message appears to be spam",
      flags,
    };
  }

  return {
    allowed: true,
    flags: flags.length > 0 ? flags : undefined,
  };
}

/**
 * Check if content contains links
 */
export function containsLinks(content: string): boolean {
  return LINK_PATTERN.test(content);
}

/**
 * Check if user is allowed to send links
 * Only admins can send links
 */
export function canSendLinks(role: string): boolean {
  return role === "admin";
}
