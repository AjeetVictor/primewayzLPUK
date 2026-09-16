/**
 * Browser CORS for visitor-facing public Chat APIs only.
 * Allowed origins come from the active tenant registry (chat capability) — not a second hardcoded list.
 * CORS is transport permission only; tenant identity still comes from sourceResolver.
 */

import type { Request, Response } from 'express';
import { getTenantByOrigin, PRIMEWAYZ_TENANTS } from '../platform/tenantRegistry.ts';
import { tenantSupportsCapability } from '../platform/tenantCapabilities.ts';

const PUBLIC_CHAT_EXACT_PATHS = new Set([
  '/api/chat',
  '/api/chat/availability',
  '/api/chat/session',
  '/api/chat/heartbeat',
  '/api/chat/respond',
  '/api/chat/uploads',
  '/api/chat/appointments',
]);

export function getPublicChatAllowedOrigins(): readonly string[] {
  return PRIMEWAYZ_TENANTS
    .filter((tenant) => tenant.active && tenantSupportsCapability(tenant.tenantId, 'chat'))
    .flatMap((tenant) => [...tenant.allowedOrigins]);
}

/** Exact Origin match against active chat-capable tenant allowedOrigins. Missing Origin is allowed (S2S / same-host). */
export function isPublicChatOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  const normalized = origin.trim().replace(/\/$/, '');
  const tenant = getTenantByOrigin(normalized);
  return Boolean(tenant && tenantSupportsCapability(tenant.tenantId, 'chat'));
}

/** Visitor Chat paths under /api/chat — never /api/admin/*. */
export function isPublicChatCorsPath(pathname: string): boolean {
  const path = pathname.split('?')[0]?.replace(/\/$/, '') || '/';
  if (!path.startsWith('/api/chat')) return false;
  if (path.startsWith('/api/admin')) return false;
  if (PUBLIC_CHAT_EXACT_PATHS.has(path)) return true;
  // Visitor message history: GET /api/chat/:sessionId
  return /^\/api\/chat\/[^/]+$/.test(path);
}

type CorsHeaderSink = { setHeader(name: string, value: string): unknown };

export function applyPublicChatApiCors(req: Pick<Request, 'get'>, res: CorsHeaderSink): boolean {
  const origin = req.get('origin')?.trim().replace(/\/$/, '');
  if (!isPublicChatOriginAllowed(origin)) return false;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  return true;
}

/**
 * Express middleware scoped by isPublicChatCorsPath.
 * Allowed Origin: set CORS headers; OPTIONS => 204.
 * Unknown Origin: 403. No Origin: continue without ACAO.
 */
export function publicChatApiCorsMiddleware(req: Request, res: Response, next: () => void): void {
  if (!isPublicChatCorsPath(req.path)) {
    next();
    return;
  }
  if (!applyPublicChatApiCors(req, res)) {
    res.status(403).json({ error: 'Origin is not allowed.' });
    return;
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}
