import { PRIMEWAYZ_TENANTS } from '../../platform/tenantRegistry.ts';

const DEFAULT_ALLOWED_ORIGINS = PRIMEWAYZ_TENANTS
  .filter((tenant) => tenant.active)
  .flatMap((tenant) => [...tenant.allowedOrigins]);
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function getAuditApiAllowedOrigins(env: NodeJS.ProcessEnv = process.env): Set<string> {
  const configured = (env.AUDIT_API_ALLOWED_ORIGINS || '').split(',')
    .map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);
  return new Set(configured.length ? configured : DEFAULT_ALLOWED_ORIGINS);
}

export function isAuditApiOriginAllowed(origin: string | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!origin) return true;
  return getAuditApiAllowedOrigins(env).has(origin.replace(/\/$/, ''));
}

export function isAuditApiKeyAllowed(value: string | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  const configured = env.AUDIT_API_TOKEN?.trim();
  if (!configured) return true;
  return typeof value === 'string' && value.length === configured.length && value === configured;
}

export type AuditApiRateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

export function checkAuditApiRateLimit(
  key: string,
  now: number = Date.now(),
  limit: number = 10,
): AuditApiRateLimitResult {
  const windowMs = 15 * 60 * 1000;
  for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
  const current = buckets.get(key);
  if (!current) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1) };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - current.count) };
}

export function resetAuditApiRateLimitForTests(): void { buckets.clear(); }
