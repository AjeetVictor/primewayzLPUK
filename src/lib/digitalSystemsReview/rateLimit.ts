import { REVIEW_RATE_LIMIT } from '../../constants/digitalSystemsReview.ts';

type RateBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateBucket>();
let proxyAttributionWarningEmitted = false;

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Extract client IP using Express req.ip (honours trust proxy when configured),
 * otherwise the socket remote address. Never parses X-Forwarded-For directly.
 */
export function getClientIp(req: {
  ip?: string;
  socket?: { remoteAddress?: string | null };
}): string {
  const fromExpress = typeof req.ip === 'string' ? req.ip.trim() : '';
  if (fromExpress) return fromExpress;
  return req.socket?.remoteAddress?.trim() || 'unknown';
}

export function isLocalTestIp(ip: string): boolean {
  const normalized = ip.replace(/^::ffff:/, '').toLowerCase();
  return (
    normalized === '127.0.0.1'
    || normalized === '::1'
    || normalized === 'localhost'
  );
}

export type ReviewRateLimitOptions = {
  /** Explicit local/test bypass — never inferred from IP alone in production. */
  bypassLocal?: boolean;
};

export type ReviewRateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Endpoint-specific rate limit (~5 attempts / 15 minutes / IP).
 * Local bypass only when callers set bypassLocal explicitly.
 */
export function checkDigitalSystemsReviewRateLimit(
  ip: string,
  options: ReviewRateLimitOptions = {},
): ReviewRateLimitResult {
  if (options.bypassLocal && isLocalTestIp(ip)) {
    return { allowed: true, remaining: REVIEW_RATE_LIMIT.maxAttempts };
  }

  const now = Date.now();
  pruneExpired(now);

  const existing = buckets.get(ip);
  if (!existing || existing.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + REVIEW_RATE_LIMIT.windowMs });
    return { allowed: true, remaining: REVIEW_RATE_LIMIT.maxAttempts - 1 };
  }

  if (existing.count >= REVIEW_RATE_LIMIT.maxAttempts) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, remaining: REVIEW_RATE_LIMIT.maxAttempts - existing.count };
}

/**
 * Emit at most one fixed startup warning when production lacks TRUST_PROXY.
 * Does not disable the endpoint or print environment values.
 */
export function warnIfProductionProxyAttributionShared(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;
  const trustProxy = env.TRUST_PROXY === '1' || env.TRUST_PROXY === 'true';
  if (trustProxy || proxyAttributionWarningEmitted) return;
  proxyAttributionWarningEmitted = true;
  console.warn(
    '[digital-systems-review] TRUST_PROXY is not set; rate-limit attribution may be shared behind a reverse proxy.',
  );
}

/** Test helper — clears in-memory buckets. */
export function resetDigitalSystemsReviewRateLimitForTests(): void {
  buckets.clear();
  proxyAttributionWarningEmitted = false;
}
