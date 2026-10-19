/**
 * Browser CORS for visitor-facing public Chat APIs only.
 * Allowed origins come from the active tenant registry (chat capability) — not a second hardcoded list.
 * CORS is transport permission only; tenant identity still comes from sourceResolver.
 */

import type { Request, Response } from 'express';
import { getTenantAllowedOrigins, getTenantByOrigin, isTenantActive, PRIMEWAYZ_TENANTS } from '../platform/tenantRegistry.ts';
import { tenantSupportsCapability } from '../platform/tenantCapabilities.ts';
import type { EffectiveTenantChatDecision } from '../platform/tenantChatEntitlement.ts';

/** Excludes POST /api/chat: that is the authenticated, same-origin admin reply endpoint. */
const PUBLIC_CHAT_EXACT_PATHS = new Set([
  '/api/chat/availability',
  '/api/chat/session',
  '/api/chat/heartbeat',
  '/api/chat/respond',
  '/api/chat/uploads',
  '/api/chat/appointments',
]);

export function getPublicChatAllowedOrigins(): readonly string[] {
  return PRIMEWAYZ_TENANTS
    .filter((tenant) => isTenantActive(tenant) && tenantSupportsCapability(tenant.tenantId, 'chat'))
    .flatMap((tenant) => [...getTenantAllowedOrigins(tenant)]);
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

export type VerifiedChatOrigin =
  | { availability: 'ready'; tenantId: string }
  | { availability: 'unavailable' }
  | null;

export type VerifiedChatOriginDirectory = (origin: string) => Promise<VerifiedChatOrigin>;

export function applyPublicChatApiCors(
  req: Pick<Request, 'get'>,
  res: CorsHeaderSink,
  trustedOrigin?: string,
): boolean {
  const origin = trustedOrigin ?? req.get('origin')?.trim().replace(/\/$/, '');
  if (!trustedOrigin && !isPublicChatOriginAllowed(origin)) return false;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Retry-After');
  res.setHeader('Access-Control-Max-Age', '86400');
  return true;
}

export type PublicChatEntitlementGate = (tenantId: string) => Promise<EffectiveTenantChatDecision>;

const CHAT_TEMPORARILY_UNAVAILABLE = { error: 'Chat is temporarily unavailable.' };
const ORIGIN_NOT_ALLOWED = { error: 'Origin is not allowed.' };

/**
 * Express middleware scoped by isPublicChatCorsPath.
 * Allowed Origin: set CORS headers; OPTIONS => 204.
 * Unknown Origin: 403. No Origin: continue without ACAO.
 * An optional entitlement gate runs only after the registry allow, and only when Origin is present.
 * Store failure denies the origin. It does not fall through to the no-row allow.
 */
export function createPublicChatApiCorsMiddleware(
  gate?: PublicChatEntitlementGate,
  verifiedOrigins?: VerifiedChatOriginDirectory,
) {
  return async (req: Request, res: Response, next: () => void): Promise<void> => {
    try {
      if (!isPublicChatCorsPath(req.path)) {
        next();
        return;
      }
      const origin = req.get('origin')?.trim().replace(/\/$/, '');
      let trustedOrigin: string | undefined;
      let verifiedTenantId: string | undefined;
      if (!isPublicChatOriginAllowed(origin)) {
        if (!origin || !verifiedOrigins) {
          res.status(403).json(ORIGIN_NOT_ALLOWED);
          return;
        }
        const verified = await verifiedOrigins(origin);
        if (!verified) {
          res.status(403).json(ORIGIN_NOT_ALLOWED);
          return;
        }
        if (verified.availability === 'unavailable') {
          res.status(503).json(CHAT_TEMPORARILY_UNAVAILABLE);
          return;
        }
        trustedOrigin = origin;
        verifiedTenantId = verified.tenantId;
      }
      if (gate && origin) {
        const tenant = getTenantByOrigin(origin);
        const tenantId = tenant?.tenantId ?? verifiedTenantId;
        if (!tenantId) {
          res.status(403).json(ORIGIN_NOT_ALLOWED);
          return;
        }
        let decision: EffectiveTenantChatDecision;
        try {
          decision = await gate(tenantId);
        } catch {
          decision = { allowed: false, basis: 'store_unavailable' };
        }
        if (decision.basis === 'store_unavailable') {
          res.status(503).json(CHAT_TEMPORARILY_UNAVAILABLE);
          return;
        }
        if (!decision.allowed) {
          res.status(403).json(ORIGIN_NOT_ALLOWED);
          return;
        }
      }
      if (!applyPublicChatApiCors(req, res, trustedOrigin)) {
        res.status(403).json(ORIGIN_NOT_ALLOWED);
        return;
      }
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
      next();
    } catch {
      if (!res.headersSent) res.status(503).json(CHAT_TEMPORARILY_UNAVAILABLE);
    }
  };
}

/** Registry-only CORS. Production passes an entitlement gate at the server mount. */
export const publicChatApiCorsMiddleware = createPublicChatApiCorsMiddleware();
