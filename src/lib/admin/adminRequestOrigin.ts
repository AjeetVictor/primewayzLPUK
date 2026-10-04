/**
 * Request-origin protection for authenticated, state-changing Admin operations.
 *
 * primewayz.com (WordPress) and uk.primewayz.com are same-site, so the SameSite=Lax
 * admin cookie can accompany requests started on another Primewayz property.
 * Admin writes therefore also require the browser-supplied Origin (or, when absent,
 * Sec-Fetch-Site / Referer) to be the Primewayz UK admin application itself.
 *
 * The Admin UI calls same-origin relative URLs (apiUrl), and browsers always send
 * Origin on same-origin POST / PUT / PATCH / DELETE fetches. A request with no
 * Origin, no Sec-Fetch-Site and no Referer is not a browser-initiated cross-site
 * request (curl, server scripts) and still has to pass requireAdmin.
 *
 * Trust inputs: the tenant registry (pw-uk allowedOrigins) and SITE_URL only.
 * Host / X-Forwarded-Host are never used to derive the expected origin.
 */

import type { NextFunction, Request, Response } from 'express';
import { getTenantById } from '../platform/tenantRegistry.ts';

export const ADMIN_ORIGIN_REJECTED_CODE = 'admin_origin_rejected';

const ADMIN_APP_TENANT_ID = 'pw-uk';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const LOCAL_DEVELOPMENT_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/;

export type AdminOriginPolicy = {
  allowedOrigins: readonly string[];
  allowLocalDevelopment: boolean;
};

export type AdminOriginDecision =
  | { allowed: true; via: 'origin' | 'sec-fetch-site' | 'referer' | 'non-browser' }
  | { allowed: false; reason: string };

function normalizeOrigin(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

export function getAdminAllowedOrigins(input: { siteUrl?: string | null }): string[] {
  const origins = new Set<string>();
  for (const origin of getTenantById(ADMIN_APP_TENANT_ID)?.allowedOrigins ?? []) {
    const normalized = normalizeOrigin(origin);
    if (normalized) origins.add(normalized);
  }
  const siteOrigin = normalizeOrigin(input.siteUrl);
  if (siteOrigin) origins.add(siteOrigin);
  return [...origins];
}

function isTrustedOrigin(origin: string, policy: AdminOriginPolicy): boolean {
  if (policy.allowedOrigins.includes(origin)) return true;
  return policy.allowLocalDevelopment && LOCAL_DEVELOPMENT_ORIGIN.test(origin);
}

/** POST /api/chat (admin reply) and every non-safe method under /api/admin/*. */
export function isAdminStateChangingRequest(method: string, pathname: string): boolean {
  const verb = method.toUpperCase();
  if (SAFE_METHODS.has(verb)) return false;
  const path = (pathname.split('?')[0] || '/').toLowerCase().replace(/\/+$/, '') || '/';
  if (path === '/api/chat') return verb === 'POST';
  return path === '/api/admin' || path.startsWith('/api/admin/');
}

export function evaluateAdminRequestOrigin(
  headers: { origin?: string; secFetchSite?: string; referer?: string },
  policy: AdminOriginPolicy,
): AdminOriginDecision {
  const rawOrigin = headers.origin?.trim();
  if (rawOrigin) {
    const origin = normalizeOrigin(rawOrigin);
    if (origin && isTrustedOrigin(origin, policy)) return { allowed: true, via: 'origin' };
    return { allowed: false, reason: 'Untrusted Origin.' };
  }

  const secFetchSite = headers.secFetchSite?.trim().toLowerCase();
  if (secFetchSite) {
    if (secFetchSite === 'same-origin' || secFetchSite === 'none') {
      return { allowed: true, via: 'sec-fetch-site' };
    }
    return { allowed: false, reason: 'Cross-site admin request.' };
  }

  const rawReferer = headers.referer?.trim();
  if (rawReferer) {
    const refererOrigin = normalizeOrigin(rawReferer);
    if (refererOrigin && isTrustedOrigin(refererOrigin, policy)) return { allowed: true, via: 'referer' };
    return { allowed: false, reason: 'Untrusted Referer.' };
  }

  return { allowed: true, via: 'non-browser' };
}

export function assertAdminRequestOrigin(req: Pick<Request, 'get'>, policy: AdminOriginPolicy): AdminOriginDecision {
  return evaluateAdminRequestOrigin(
    {
      origin: req.get('origin'),
      secFetchSite: req.get('sec-fetch-site'),
      referer: req.get('referer'),
    },
    policy,
  );
}

export function createAdminRequestOriginMiddleware(policy: AdminOriginPolicy) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isAdminStateChangingRequest(req.method, req.path)) return next();
    const decision = assertAdminRequestOrigin(req, policy);
    if (decision.allowed) return next();
    return res.status(403).json({
      error: 'This admin action must be made from the Primewayz UK admin application.',
      code: ADMIN_ORIGIN_REJECTED_CODE,
    });
  };
}
