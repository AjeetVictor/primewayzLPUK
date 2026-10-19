/**
 * CORS for public platform capability / scheduling availability APIs.
 * Allowed origins come from the active tenant registry — not a duplicated hardcoded list.
 * Webhooks are excluded (provider → server, not browser).
 */

import type { Request, Response } from 'express';
import type { VerifiedChatOrigin, VerifiedChatOriginDirectory } from '../chat/publicChatApiCors.ts';
import { getTenantAllowedOrigins, getTenantByOrigin, isTenantActive, PLATFORM_TENANTS } from './tenantRegistry.ts';

const PUBLIC_PLATFORM_EXACT_PATHS = new Set([
  '/api/platform/capabilities',
  '/api/scheduling/availability',
]);

export function getPublicPlatformAllowedOrigins(): readonly string[] {
  return PLATFORM_TENANTS.filter((tenant) => isTenantActive(tenant)).flatMap((tenant) => [
    ...getTenantAllowedOrigins(tenant),
  ]);
}

export function isPublicPlatformOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  return Boolean(getTenantByOrigin(origin.trim().replace(/\/$/, '')));
}

export function isPublicPlatformCorsPath(pathname: string): boolean {
  const path = pathname.split('?')[0]?.replace(/\/$/, '') || '/';
  return PUBLIC_PLATFORM_EXACT_PATHS.has(path);
}

type CorsHeaderSink = { setHeader(name: string, value: string): unknown };

export function applyPublicPlatformApiCors(
  req: Pick<Request, 'get'>,
  res: CorsHeaderSink,
  trustedOrigin?: string,
): boolean {
  const origin = trustedOrigin ?? req.get('origin')?.trim().replace(/\/$/, '');
  if (!trustedOrigin && !isPublicPlatformOriginAllowed(origin)) return false;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  return true;
}

const ORIGIN_NOT_ALLOWED = { error: 'Origin is not allowed.' };
const CAPABILITIES_UNAVAILABLE = { error: 'Chat is temporarily unavailable.' };

/**
 * Catalog origins keep the previous allow. Capabilities may also accept a verified
 * database origin. Scheduling stays on the catalog. An unverified origin is rejected.
 * A failed registry read on that lookup is 503, not a pass.
 */
export function createPublicPlatformApiCorsMiddleware(verifiedOrigins?: VerifiedChatOriginDirectory) {
  return async (req: Request, res: Response, next: () => void): Promise<void> => {
    if (!isPublicPlatformCorsPath(req.path)) {
      next();
      return;
    }
    const origin = req.get('origin')?.trim().replace(/\/$/, '');
    const capabilitiesPath = (req.path.split('?')[0]?.replace(/\/$/, '') || '/') === '/api/platform/capabilities';
    let trustedOrigin: string | undefined;
    if (!isPublicPlatformOriginAllowed(origin) && capabilitiesPath) {
      if (!origin || !verifiedOrigins) {
        res.status(403).json(ORIGIN_NOT_ALLOWED);
        return;
      }
      let verified: VerifiedChatOrigin;
      try {
        verified = await verifiedOrigins(origin);
      } catch {
        res.status(503).json(CAPABILITIES_UNAVAILABLE);
        return;
      }
      if (!verified) {
        res.status(403).json(ORIGIN_NOT_ALLOWED);
        return;
      }
      if (verified.availability === 'unavailable') {
        res.status(503).json(CAPABILITIES_UNAVAILABLE);
        return;
      }
      trustedOrigin = origin;
    }
    if (!applyPublicPlatformApiCors(req, res, trustedOrigin)) {
      res.status(403).json(ORIGIN_NOT_ALLOWED);
      return;
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  };
}

export const publicPlatformApiCorsMiddleware = createPublicPlatformApiCorsMiddleware();
