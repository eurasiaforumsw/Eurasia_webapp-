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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.JWT_SECRET;
  if (!url || !serviceKey || !secret) throw new Error("Rate limit store is not configured");
  const signingKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", signingKey, new TextEncoder().encode(key));
  const hashedKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/consume_security_rate_limit`, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(3000),
    headers: { "Content-Type": "application/json", apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    body: JSON.stringify({ p_key: hashedKey, p_limit: limit, p_window_seconds: windowMs / 1000 }),
  });
  if (!response.ok) throw new Error("Rate limit store is unavailable");
  const result = await response.json();
  if (typeof result.allowed !== "boolean" || typeof result.remaining !== "number" ||
      typeof result.retryAfter !== "number") throw new Error("Invalid rate limit result");
  return result;
}
