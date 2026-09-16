/**
 * CORS for public platform capability / scheduling availability APIs.
 * Allowed origins come from the active tenant registry — not a duplicated hardcoded list.
 * Webhooks are excluded (provider → server, not browser).
 */

import type { Request, Response } from 'express';
import { getTenantByOrigin, PLATFORM_TENANTS } from './tenantRegistry.ts';

const PUBLIC_PLATFORM_EXACT_PATHS = new Set([
  '/api/platform/capabilities',
  '/api/scheduling/availability',
]);

export function getPublicPlatformAllowedOrigins(): readonly string[] {
  return PLATFORM_TENANTS.filter((tenant) => tenant.active).flatMap((tenant) => [
    ...tenant.allowedOrigins,
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

export function applyPublicPlatformApiCors(req: Pick<Request, 'get'>, res: CorsHeaderSink): boolean {
  const origin = req.get('origin')?.trim().replace(/\/$/, '');
  if (!isPublicPlatformOriginAllowed(origin)) return false;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  return true;
}

export function publicPlatformApiCorsMiddleware(req: Request, res: Response, next: () => void): void {
  if (!isPublicPlatformCorsPath(req.path)) {
    next();
    return;
  }
  if (!applyPublicPlatformApiCors(req, res)) {
    res.status(403).json({ error: 'Origin is not allowed.' });
    return;
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}
