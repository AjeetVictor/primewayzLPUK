/**
 * Host/Owner presence policy governance + read-only consolidated presence reporting.
 *
 * Reporting never mutates tenant staffing or availability. Policy SET is Host/Owner only,
 * requires a reason, and is audited. Tenant admins see only their granted tenants.
 */

import type { Request, RequestHandler, Response } from 'express';
import {
  ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
  resolveChatPresence,
  type ChatPresencePolicy,
} from '../chat/chatPresence.ts';
import {
  countActiveTenantOperators,
  listActiveTenantOperators,
  readTenantChatPresence,
  type TenantChatPresenceReadPrisma,
} from '../chat/tenantChatPresenceStore.ts';
import type { TenantPresenceEventStore } from '../chat/tenantPresenceEvents.ts';
import { getTenantById, isTenantActive, PLATFORM_TENANTS, type PlatformTenantConfig } from './tenantRegistry.ts';
import type { TenantAccountRecord } from './tenantAccountModel.ts';
import type { TenantAccountStore } from './tenantAccountStore.ts';
import {
  DEFAULT_TENANT_PRESENCE_POLICY,
  effectivePresencePolicy,
  isTenantPresencePolicyMode,
  TENANT_PRESENCE_POLICY_REASON_MAX,
  type TenantPresencePolicyMode,
  type TenantPresencePolicyRecord,
  type TenantPresencePolicyStore,
} from './tenantPresencePolicy.ts';

export const TENANT_PRESENCE_POLICY_ADMIN_PATH = '/api/admin/presence-policy';
export const TENANT_PRESENCE_REPORTING_ADMIN_PATH = '/api/admin/presence-reporting';

export type TenantPresenceAdminPrincipal = {
  id: number;
  role: string;
  isPlatformOwner: boolean;
  tenantIds: readonly string[];
};

export class TenantPresencePolicyAdminError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'TenantPresencePolicyAdminError';
    this.status = status;
    this.code = code;
  }
}

const OPERATIONS_ROLES = new Set(['super_admin', 'admin', 'editor', 'viewer']);

function fail(status: number, code: string, message: string): never {
  throw new TenantPresencePolicyAdminError(status, code, message);
}

function assertReader(principal: TenantPresenceAdminPrincipal): void {
  if (!principal.isPlatformOwner && !OPERATIONS_ROLES.has(principal.role)) {
    fail(403, 'admin_access_required', 'Authenticated admin access is required.');
  }
}

export function visiblePresenceTenants(principal: TenantPresenceAdminPrincipal): PlatformTenantConfig[] {
  assertReader(principal);
  if (principal.isPlatformOwner) return [...PLATFORM_TENANTS];
  const allowed = new Set(principal.tenantIds);
  return PLATFORM_TENANTS.filter((tenant) => allowed.has(tenant.tenantId));
}

export function parsePresencePolicyReason(value: unknown): string {
  if (typeof value !== 'string') fail(400, 'invalid_request', 'A reason is required.');
  const reason = value.trim();
  if (!reason || reason.length > TENANT_PRESENCE_POLICY_REASON_MAX) {
    fail(400, 'invalid_request', `Reason must be 1 to ${TENANT_PRESENCE_POLICY_REASON_MAX} characters.`);
  }
  if (/[\u0000-\u001F]/.test(reason)) fail(400, 'invalid_request', 'Reason must be a single line of text.');
  return reason;
}

export type TenantPresencePolicyAdminView = {
  tenantId: string;
  displayName: string;
  brand: string;
  market: string;
  registryActive: boolean;
  /** Effective policy used by resolveChatPresence (legacy when no row). */
  effectivePolicy: TenantPresencePolicyMode;
  policyRecord: null | {
    policy: TenantPresencePolicyMode;
    reason: string;
    updatedAt: string;
    updatedByUserId: number | null;
  };
  recentChanges: Array<{
    policy: TenantPresencePolicyMode;
    reason: string;
    actorUserId: number | null;
    createdAt: string;
  }>;
};

export type TenantPresenceReportingView = {
  tenantId: string;
  displayName: string;
  brand: string;
  market: string;
  presencePolicy: TenantPresencePolicyMode;
  mode: string;
  /** Effective human availability for visitors under the active policy. */
  humanAvailable: boolean;
  teamStatus: string;
  status: string;
  hasActiveAdmin: boolean;
  activeOperatorCount: number;
  latestAdminSeenAt: string | null;
  presenceExpiresAt: string | null;
  activeOperators: Array<{ userId: number; lastSeenAt: string; expiresAt: string }>;
  /** Reporting is observational only — no controls to change staffing/availability. */
  reportingOnly: true;
};

function policyView(record: TenantPresencePolicyRecord | null) {
  if (!record) return null;
  return {
    policy: record.policy,
    reason: record.reason,
    updatedAt: record.updatedAt.toISOString(),
    updatedByUserId: record.updatedByUserId,
  };
}

async function commercialAccounts(store: TenantAccountStore | undefined): Promise<TenantAccountRecord[]> {
  if (!store) return [];
  const listed = await store.listAccounts();
  if (listed.availability === 'unavailable') {
    fail(503, 'tenant_registry_unavailable', 'The tenant registry is temporarily unavailable.');
  }
  return listed.accounts;
}

export async function listTenantPresencePolicyViews(
  store: TenantPresencePolicyStore,
  principal: TenantPresenceAdminPrincipal,
  requestedTenantId: string | null,
  env: NodeJS.ProcessEnv = process.env,
  commercial: readonly TenantAccountRecord[] = [],
): Promise<TenantPresencePolicyAdminView[]> {
  let tenants = visiblePresenceTenants(principal);
  if (requestedTenantId) {
    const compiled = getTenantById(requestedTenantId);
    const account = commercial.find((row) => row.tenantId === requestedTenantId);
    if (!compiled && !account) fail(400, 'invalid_tenant', 'Unknown tenant.');
    if (compiled) {
      if (!tenants.some((tenant) => tenant.tenantId === requestedTenantId)) {
        fail(403, 'tenant_access_denied', 'This account is not assigned to the selected tenant.');
      }
      tenants = tenants.filter((tenant) => tenant.tenantId === requestedTenantId);
    } else if (!principal.isPlatformOwner && !principal.tenantIds.includes(requestedTenantId)) {
      fail(403, 'tenant_access_denied', 'This account is not assigned to the selected tenant.');
    } else {
      tenants = [];
    }
  }

  const recordIds = [
    ...tenants.map((tenant) => tenant.tenantId),
    ...commercial.filter((account) => !getTenantById(account.tenantId)).map((account) => account.tenantId),
  ];
  let records: TenantPresencePolicyRecord[];
  try {
    records = await store.list(recordIds);
  } catch {
    fail(503, 'presence_policy_store_unavailable', 'Tenant presence policies are temporarily unavailable.');
  }
  const byTenant = new Map(records.map((record) => [record.tenantId, record]));
  const views: TenantPresencePolicyAdminView[] = [];

  for (const tenant of tenants) {
    void isTenantActive(tenant, env);
    const record = byTenant.get(tenant.tenantId) ?? null;
    let recent: Awaited<ReturnType<TenantPresencePolicyStore['recentAudits']>>;
    try {
      recent = await store.recentAudits(tenant.tenantId, 5);
    } catch {
      fail(503, 'presence_policy_store_unavailable', 'Tenant presence policies are temporarily unavailable.');
    }
    views.push({
      tenantId: tenant.tenantId,
      displayName: tenant.displayName,
      brand: tenant.brand,
      market: tenant.market,
      registryActive: tenant.active,
      effectivePolicy: effectivePresencePolicy(record),
      policyRecord: policyView(record),
      recentChanges: recent.map((entry) => ({
        policy: entry.policy,
        reason: entry.reason,
        actorUserId: entry.actorUserId,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  }

  for (const account of commercial) {
    if (getTenantById(account.tenantId)) continue;
    if (!principal.isPlatformOwner && !principal.tenantIds.includes(account.tenantId)) continue;
    if (requestedTenantId && account.tenantId !== requestedTenantId) continue;
    const record = byTenant.get(account.tenantId) ?? null;
    let recent: Awaited<ReturnType<TenantPresencePolicyStore['recentAudits']>>;
    try {
      recent = await store.recentAudits(account.tenantId, 5);
    } catch {
      fail(503, 'presence_policy_store_unavailable', 'Tenant presence policies are temporarily unavailable.');
    }
    views.push({
      tenantId: account.tenantId,
      displayName: account.displayName,
      brand: account.brand,
      market: account.market,
      registryActive: account.lifecycleStatus === 'active',
      effectivePolicy: effectivePresencePolicy(record),
      policyRecord: policyView(record),
      recentChanges: recent.map((entry) => ({
        policy: entry.policy,
        reason: entry.reason,
        actorUserId: entry.actorUserId,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  }

  return views;
}

export async function setTenantPresencePolicy(
  store: TenantPresencePolicyStore,
  eventStore: TenantPresenceEventStore | null,
  principal: TenantPresenceAdminPrincipal,
  tenantId: string,
  policy: unknown,
  reason: unknown,
  at: Date,
  knownDatabaseTenant = false,
): Promise<TenantPresencePolicyRecord> {
  if (!principal.isPlatformOwner) {
    fail(403, 'platform_owner_required', 'Presence policy changes are restricted to the platform Host/Owner.');
  }
  if (!getTenantById(tenantId) && !knownDatabaseTenant) {
    fail(400, 'invalid_tenant', 'Unknown tenant.');
  }
  if (!isTenantPresencePolicyMode(policy)) {
    fail(400, 'invalid_request', 'Policy must be legacy_forced_online or heartbeat_required_online.');
  }
  const parsedReason = parsePresencePolicyReason(reason);
  let record: TenantPresencePolicyRecord;
  try {
    record = await store.set({
      tenantId,
      policy,
      reason: parsedReason,
      actorUserId: principal.id,
      at,
    });
  } catch (err) {
    if (err instanceof TenantPresencePolicyAdminError) throw err;
    fail(503, 'presence_policy_store_unavailable', 'Tenant presence policies are temporarily unavailable.');
  }
  if (eventStore) {
    try {
      await eventStore.append({
        tenantId,
        eventType: 'policy_changed',
        actorUserId: principal.id,
        actorRef: `user:${principal.id}`,
        correlationId: `policy:${tenantId}:${at.toISOString()}`,
        details: { policy, reason: parsedReason },
        at,
      });
    } catch {
      // Policy write already committed; event failure must not roll back governance.
    }
  }
  return record;
}

export async function buildTenantPresenceReportingViews(
  deps: {
    policyStore: TenantPresencePolicyStore;
    presencePrisma: TenantChatPresenceReadPrisma;
    principal: TenantPresenceAdminPrincipal;
    requestedTenantId: string | null;
    now?: Date;
    env?: NodeJS.ProcessEnv;
    accounts?: readonly TenantAccountRecord[];
  },
): Promise<TenantPresenceReportingView[]> {
  const now = deps.now ?? new Date();
  const tenants = await listTenantPresencePolicyViews(
    deps.policyStore,
    deps.principal,
    deps.requestedTenantId,
    deps.env ?? process.env,
    deps.accounts ?? [],
  );
  const views: TenantPresenceReportingView[] = [];
  for (const tenant of tenants) {
    const state = await readTenantChatPresence(deps.presencePrisma, tenant.tenantId);
    const policy = tenant.effectivePolicy as ChatPresencePolicy;
    const resolved = resolveChatPresence({
      mode: state.setting?.mode,
      latestAdminSeenAt: state.latestAdminSeenAt,
      now: now.getTime(),
      presencePolicy: policy,
    });
    const activeOperators = await listActiveTenantOperators(deps.presencePrisma.adminPresence, tenant.tenantId, now);
    const activeOperatorCount = await countActiveTenantOperators(
      deps.presencePrisma.adminPresence,
      tenant.tenantId,
      now,
    );
    const latest = state.latestAdminSeenAt;
    views.push({
      tenantId: tenant.tenantId,
      displayName: tenant.displayName,
      brand: tenant.brand,
      market: tenant.market,
      presencePolicy: tenant.effectivePolicy,
      mode: resolved.mode,
      humanAvailable: resolved.status === 'online',
      teamStatus: resolved.teamStatus,
      status: resolved.status,
      hasActiveAdmin: resolved.hasActiveAdmin,
      activeOperatorCount,
      latestAdminSeenAt: latest?.toISOString() ?? null,
      presenceExpiresAt: latest
        ? new Date(latest.getTime() + ADMIN_PRESENCE_ACTIVE_WINDOW_MS).toISOString()
        : null,
      activeOperators: activeOperators.map((row) => ({
        userId: row.userId,
        lastSeenAt: row.lastSeenAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
      })),
      reportingOnly: true,
    });
  }
  return views;
}

type AdminRequest = Request & { adminUser?: TenantPresenceAdminPrincipal };

function principalOf(req: Request): TenantPresenceAdminPrincipal {
  const user = (req as AdminRequest).adminUser;
  if (!user || !Number.isInteger(user.id)) {
    throw new TenantPresencePolicyAdminError(401, 'admin_access_required', 'Authenticated admin access is required.');
  }
  return user;
}

function sendError(res: Response, err: unknown): void {
  const error = err instanceof TenantPresencePolicyAdminError
    ? err
    : new TenantPresencePolicyAdminError(500, 'internal_error', 'The request could not be completed.');
  res.status(error.status).json({ success: false, error: error.message, code: error.code });
}

function assertObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    fail(400, 'invalid_request', 'Request body must be a JSON object.');
  }
  return body as Record<string, unknown>;
}

export function createTenantPresencePolicyAdminHandlers(deps: {
  policyStore: TenantPresencePolicyStore;
  eventStore: TenantPresenceEventStore;
  presencePrisma: TenantChatPresenceReadPrisma;
  accounts?: TenantAccountStore;
  now?: () => Date;
  env?: NodeJS.ProcessEnv;
}) {
  const now = () => deps.now?.() ?? new Date();

  const listPolicies: RequestHandler = async (req, res) => {
    try {
      const principal = principalOf(req);
      const requested = req.query.tenantId;
      if (Array.isArray(requested)) fail(400, 'invalid_request', 'tenantId must be a single value.');
      const tenantId = typeof requested === 'string' && requested.length > 0 ? requested : null;
      const accounts = await commercialAccounts(deps.accounts);
      const tenants = await listTenantPresencePolicyViews(
        deps.policyStore,
        principal,
        tenantId,
        deps.env ?? process.env,
        accounts,
      );
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        success: true,
        canManage: principal.isPlatformOwner,
        defaultPolicy: DEFAULT_TENANT_PRESENCE_POLICY,
        tenants,
      });
    } catch (err) {
      sendError(res, err);
    }
  };

  const setPolicy: RequestHandler = async (req, res) => {
    try {
      const principal = principalOf(req);
      const body = assertObject(req.body);
      const unexpected = Object.keys(body).filter((key) => key !== 'policy' && key !== 'reason');
      if (unexpected.length > 0) fail(400, 'invalid_request', 'Request contains unsupported fields.');
      const tenantId = String(req.params.tenantId ?? '');
      let knownDatabaseTenant = false;
      if (!getTenantById(tenantId)) {
        const accounts = await commercialAccounts(deps.accounts);
        knownDatabaseTenant = accounts.some((account) => account.tenantId === tenantId);
        if (!knownDatabaseTenant) fail(400, 'invalid_tenant', 'Unknown tenant.');
      }
      const record = await setTenantPresencePolicy(
        deps.policyStore,
        deps.eventStore,
        principal,
        tenantId,
        body.policy,
        body.reason,
        now(),
        knownDatabaseTenant,
      );
      res.json({
        success: true,
        policy: {
          tenantId: record.tenantId,
          policy: record.policy,
          reason: record.reason,
          updatedAt: record.updatedAt.toISOString(),
          updatedByUserId: record.updatedByUserId,
        },
      });
    } catch (err) {
      sendError(res, err);
    }
  };

  const listReporting: RequestHandler = async (req, res) => {
    try {
      const principal = principalOf(req);
      const requested = req.query.tenantId;
      if (Array.isArray(requested)) fail(400, 'invalid_request', 'tenantId must be a single value.');
      const tenantId = typeof requested === 'string' && requested.length > 0 ? requested : null;
      const accounts = await commercialAccounts(deps.accounts);
      const tenants = await buildTenantPresenceReportingViews({
        policyStore: deps.policyStore,
        presencePrisma: deps.presencePrisma,
        principal,
        requestedTenantId: tenantId,
        now: now(),
        env: deps.env ?? process.env,
        accounts,
      });
      res.setHeader('Cache-Control', 'no-store');
      // Host sees all granted tenants; tenant admins only their own — never a control panel.
      res.json({
        success: true,
        reportingOnly: true,
        canManageAvailability: false,
        heartbeatWindowMs: ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
        tenants,
      });
    } catch (err) {
      sendError(res, err);
    }
  };

  const listEvents: RequestHandler = async (req, res) => {
    try {
      const principal = principalOf(req);
      const tenantId = String(req.params.tenantId ?? '');
      if (!tenantId) fail(400, 'invalid_tenant', 'tenantId is required.');
      if (principal.isPlatformOwner) {
        // Host may inspect any known registry or commercial tenant id.
      } else if (!principal.tenantIds.includes(tenantId)) {
        fail(403, 'tenant_access_denied', 'This account is not assigned to the selected tenant.');
      }
      const limitRaw = req.query.limit;
      const limit = typeof limitRaw === 'string' && /^\d+$/.test(limitRaw)
        ? Math.min(200, Math.max(1, Number(limitRaw)))
        : 50;
      const beforeRaw = req.query.beforeId;
      const beforeId = typeof beforeRaw === 'string' && /^\d+$/.test(beforeRaw) ? Number(beforeRaw) : undefined;
      const events = await deps.eventStore.list({ tenantId, limit, beforeId });
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        success: true,
        reportingOnly: true,
        tenantId,
        events: events.map((event) => ({
          id: event.id,
          eventType: event.eventType,
          actorRef: event.actorRef,
          actorUserId: event.actorUserId,
          correlationId: event.correlationId,
          details: event.details,
          createdAt: event.createdAt.toISOString(),
        })),
      });
    } catch (err) {
      sendError(res, err);
    }
  };

  return { listPolicies, setPolicy, listReporting, listEvents };
}
