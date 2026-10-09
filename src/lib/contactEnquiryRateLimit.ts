const CONTACT_RATE_LIMIT = { maxAttempts: 5, windowMs: 15 * 60 * 1000 } as const;
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
export function checkContactEnquiryRateLimit(ip: string, now = Date.now()): { allowed: true; remaining: number } | { allowed: false; retryAfterSeconds: number } {
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  const bucket = buckets.get(ip);
  if (!bucket) { buckets.set(ip, { count: 1, resetAt: now + CONTACT_RATE_LIMIT.windowMs }); return { allowed: true, remaining: CONTACT_RATE_LIMIT.maxAttempts - 1 }; }
  if (bucket.count >= CONTACT_RATE_LIMIT.maxAttempts) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  bucket.count += 1; return { allowed: true, remaining: CONTACT_RATE_LIMIT.maxAttempts - bucket.count };
}
export function resetContactEnquiryRateLimitForTests(): void { buckets.clear(); }
