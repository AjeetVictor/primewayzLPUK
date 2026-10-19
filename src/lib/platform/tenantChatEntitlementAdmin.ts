import type { Request, RequestHandler, Response } from 'express';
import { getTenantById, isTenantActive, PLATFORM_TENANTS, type PlatformTenantConfig } from './tenantRegistry.ts';
import {
  decideEffectiveTenantChat,
  isTenantChatEntitlementStatus,
  TENANT_CHAT_ENTITLEMENT_REASON_MAX,
  type EffectiveTenantChatDecision,
  type TenantChatEntitlementRecord,
  type TenantChatEntitlementStatus,
  type TenantChatEntitlementStore,
} from './tenantChatEntitlement.ts';

export const TENANT_CHAT_ENTITLEMENT_ADMIN_PATH = '/api/admin/tenant-chat-entitlements';

export type TenantChatAdminPrincipal = {
  id: number;
  role: string;
  isPlatformOwner: boolean;
  tenantIds: readonly string[];
};

export class TenantChatEntitlementAdminError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'TenantChatEntitlementAdminError';
    this.status = status;
    this.code = code;
  }
}

export type TenantChatEntitlementAdminView = {
  tenantId: string;
  displayName: string;
  brand: string;
  market: string;
  registryActive: boolean;
  activationControlled: boolean;
  compileTimeChat: boolean;
  entitlement: null | {
    status: TenantChatEntitlementStatus;
    reason: string;
    updatedAt: string;
    updatedByUserId: number | null;
  };
  effective: EffectiveTenantChatDecision;
  recentChanges: Array<{
    status: TenantChatEntitlementStatus;
    reason: string;
    actorUserId: number | null;
    createdAt: string;
  }>;
};

const OPERATIONS_ROLES = new Set(['super_admin', 'admin', 'editor', 'viewer']);

function fail(status: number, code: string, message: string): never {
  throw new TenantChatEntitlementAdminError(status, code, message);
}

function assertReader(principal: TenantChatAdminPrincipal): void {
  if (!principal.isPlatformOwner && !OPERATIONS_ROLES.has(principal.role)) {
    fail(403, 'admin_access_required', 'Authenticated admin access is required.');
  }
}

export function visibleEntitlementTenants(principal: TenantChatAdminPrincipal): PlatformTenantConfig[] {
  assertReader(principal);
  if (principal.isPlatformOwner) return [...PLATFORM_TENANTS];
  const allowed = new Set(principal.tenantIds);
  return PLATFORM_TENANTS.filter((tenant) => allowed.has(tenant.tenantId));
}

export function parseEntitlementReason(value: unknown): string {
  if (typeof value !== 'string') fail(400, 'invalid_request', 'A reason is required.');
  const reason = value.trim();
  if (!reason || reason.length > TENANT_CHAT_ENTITLEMENT_REASON_MAX) {
    fail(400, 'invalid_request', `Reason must be 1 to ${TENANT_CHAT_ENTITLEMENT_REASON_MAX} characters.`);
  }
  if (/[\u0000-\u001F]/.test(reason)) fail(400, 'invalid_request', 'Reason must be a single line of text.');
  return reason;
}

function entitlementView(record: TenantChatEntitlementRecord | null) {
  if (!record) return null;
  return {
    status: record.status,
    reason: record.reason,
    updatedAt: record.updatedAt.toISOString(),
    updatedByUserId: record.updatedByUserId,
  };
}

export async function listTenantChatEntitlementViews(
  store: TenantChatEntitlementStore,
  principal: TenantChatAdminPrincipal,
  requestedTenantId: string | null,
  env: NodeJS.ProcessEnv = process.env,
): Promise<TenantChatEntitlementAdminView[]> {
  let tenants = visibleEntitlementTenants(principal);
  if (requestedTenantId) {
    if (!getTenantById(requestedTenantId)) fail(400, 'invalid_tenant', 'Unknown tenant.');
    if (!tenants.some((tenant) => tenant.tenantId === requestedTenantId)) {
      fail(403, 'tenant_access_denied', 'This account is not assigned to the selected tenant.');
    }
    tenants = tenants.filter((tenant) => tenant.tenantId === requestedTenantId);
  }
  let records: TenantChatEntitlementRecord[];
  try {
    records = await store.list(tenants.map((tenant) => tenant.tenantId));
  } catch {
    fail(503, 'entitlement_store_unavailable', 'Tenant chat entitlements are temporarily unavailable.');
  }
  const byTenant = new Map(records.map((record) => [record.tenantId, record]));
  const views: TenantChatEntitlementAdminView[] = [];
  for (const tenant of tenants) {
    const record = byTenant.get(tenant.tenantId) ?? null;
    let recent: Awaited<ReturnType<TenantChatEntitlementStore['recentAudits']>>;
    try {
      recent = await store.recentAudits(tenant.tenantId, 5);
    } catch {
      fail(503, 'entitlement_store_unavailable', 'Tenant chat entitlements are temporarily unavailable.');
    }
    views.push({
      tenantId: tenant.tenantId,
      displayName: tenant.displayName,
      brand: tenant.brand,
      market: tenant.market,
      registryActive: tenant.active,
      activationControlled: Boolean(tenant.activationEnv),
      compileTimeChat: tenant.capabilities.chat,
      entitlement: entitlementView(record),
      effective: decideEffectiveTenantChat({
        known: true,
        active: isTenantActive(tenant, env),
        compileTimeChat: tenant.capabilities.chat,
        entitlement: { availability: 'ready', record },
      }),
      recentChanges: recent.map((entry) => ({
        status: entry.status,
        reason: entry.reason,
        actorUserId: entry.actorUserId,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  }
  return views;
}

export async function setTenantChatEntitlement(
  store: TenantChatEntitlementStore,
  principal: TenantChatAdminPrincipal,
  tenantId: string,
  status: unknown,
  reason: unknown,
  at: Date,
): Promise<TenantChatEntitlementRecord> {
  if (!principal.isPlatformOwner) {
    fail(403, 'platform_owner_required', 'Tenant chat entitlement changes are restricted to the platform Host/Owner.');
  }
  if (!getTenantById(tenantId)) fail(400, 'invalid_tenant', 'Unknown tenant.');
  if (!isTenantChatEntitlementStatus(status)) {
    fail(400, 'invalid_request', 'Status must be entitled, suspended, or revoked.');
  }
  const parsedReason = parseEntitlementReason(reason);
  try {
    return await store.set({
      tenantId,
      status,
      reason: parsedReason,
      actorUserId: principal.id,
      at,
    });
  } catch (err) {
    if (err instanceof TenantChatEntitlementAdminError) throw err;
    fail(503, 'entitlement_store_unavailable', 'Tenant chat entitlements are temporarily unavailable.');
  }
}

type AdminRequest = Request & { adminUser?: TenantChatAdminPrincipal };

function principalOf(req: Request): TenantChatAdminPrincipal {
  const user = (req as AdminRequest).adminUser;
  if (!user || !Number.isInteger(user.id)) {
    throw new TenantChatEntitlementAdminError(401, 'admin_access_required', 'Authenticated admin access is required.');
  }
  return user;
}

function sendError(res: Response, err: unknown): void {
  const error = err instanceof TenantChatEntitlementAdminError
    ? err
    : new TenantChatEntitlementAdminError(500, 'internal_error', 'The request could not be completed.');
  res.status(error.status).json({ success: false, error: error.message, code: error.code });
}

function assertObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    fail(400, 'invalid_request', 'Request body must be a JSON object.');
  }
  return body as Record<string, unknown>;
}

export function createTenantChatEntitlementAdminHandlers(deps: {
  store: TenantChatEntitlementStore;
  now?: () => Date;
  env?: NodeJS.ProcessEnv;
}) {
  const now = () => deps.now?.() ?? new Date();

  const list: RequestHandler = async (req, res) => {
    try {
      const principal = principalOf(req);
      const requested = req.query.tenantId;
      if (Array.isArray(requested)) fail(400, 'invalid_request', 'tenantId must be a single value.');
      const tenantId = typeof requested === 'string' && requested.length > 0 ? requested : null;
      const tenants = await listTenantChatEntitlementViews(deps.store, principal, tenantId, deps.env ?? process.env);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, canManage: principal.isPlatformOwner, tenants });
    } catch (err) {
      sendError(res, err);
    }
  };

  const set: RequestHandler = async (req, res) => {
    try {
      const principal = principalOf(req);
      const body = assertObject(req.body);
      const unexpected = Object.keys(body).filter((key) => key !== 'status' && key !== 'reason');
      if (unexpected.length > 0) fail(400, 'invalid_request', 'Request contains unsupported fields.');
      const tenantId = String(req.params.tenantId ?? '');
      const record = await setTenantChatEntitlement(deps.store, principal, tenantId, body.status, body.reason, now());
      res.json({
        success: true,
        entitlement: {
          tenantId: record.tenantId,
          status: record.status,
          reason: record.reason,
          updatedAt: record.updatedAt.toISOString(),
          updatedByUserId: record.updatedByUserId,
        },
      });
    } catch (err) {
      sendError(res, err);
    }
  };

  return { list, set };
}
