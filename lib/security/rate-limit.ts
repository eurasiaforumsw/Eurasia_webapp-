import { queryNeonJson } from "../db-edge";

type Bucket = { count: number; resetAt: number };
export type RateResult = { allowed: boolean; remaining: number; retryAfter: number };

export class MemoryRateLimiter {
  private buckets = new Map<string, Bucket>();
  constructor(private maxBuckets = 10_000) {}

  consume(key: string, limit: number, windowMs: number, now = Date.now()): RateResult {
    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      for (const [id, entry] of this.buckets) {
        if (entry.resetAt <= now) this.buckets.delete(id);
      }
      // Do not evict active buckets: an attacker could use that to reset a limit.
      if (!this.buckets.has(key) && this.buckets.size >= this.maxBuckets) {
        return { allowed: false, remaining: 0, retryAfter: Math.ceil(windowMs / 1000) };
      }
      bucket = { count: 0, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
    }
    const allowed = bucket.count < limit;
    if (allowed) bucket.count++;
    return { allowed, remaining: Math.max(0, limit - bucket.count),
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
}

const memoryLimiter = new MemoryRateLimiter();

export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<RateResult> {
  const store = process.env.SECURITY_RATE_LIMIT_STORE ||
    (process.env.NODE_ENV === "production" ? "database" : "memory");
  if (store === "memory") return memoryLimiter.consume(key, limit, windowMs);
  if (store !== "database") throw new Error("Invalid rate limit store");
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Rate limit store is not configured");
  const signingKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", signingKey, new TextEncoder().encode(key));
  const hashedKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const [data] = await queryNeonJson<RateResult>(
    "SELECT public.consume_security_rate_limit($1::text, $2::integer, $3::integer) AS result",
    [hashedKey, limit, Math.ceil(windowMs / 1000)]
  );
  if (!data || typeof data.allowed !== "boolean" || typeof data.remaining !== "number" ||
      typeof data.retryAfter !== "number") throw new Error("Invalid rate limit result");
  return data;
}
