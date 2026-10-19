import type { Request, RequestHandler, Response } from 'express';
import { deriveConnectionHealth } from '../chatConnect/connectionHealth.ts';
import type { ChatConnectStore } from '../chatConnect/types.ts';
import type { TenantChatEntitlementStore } from './tenantChatEntitlement.ts';
import { probeOriginOwnership, type OriginProbe } from './tenantOriginVerification.ts';
import {
  changeTenantLifecycle,
  linkInstallationToSite,
  listSitesForPrincipal,
  listTenantAccountViews,
  listTenantAudits,
  loadPlatformOverview,
  openCommercialRecord,
  registerDatabaseTenant,
  reissueOriginChallenge,
  addSiteOrigin,
  addTenantSite,
  setSiteStatus,
  TenantAccountError,
  updateTenantAccount,
  verifySiteOrigin,
  type TenantAccountPrincipal,
} from './tenantAccountService.ts';
import type { LifecycleAction } from './tenantAccountModel.ts';
import type { TenantAccountStore } from './tenantAccountStore.ts';

export const CHAT_PLATFORM_ADMIN_PREFIX = '/api/admin/chat-platform';

type AdminRequest = Request & { adminUser?: TenantAccountPrincipal };

function principalOf(req: Request): TenantAccountPrincipal {
  const user = (req as AdminRequest).adminUser;
  if (!user || !Number.isInteger(user.id)) {
    throw new TenantAccountError(401, 'admin_access_required', 'Authenticated admin access is required.');
  }
  return {
    id: user.id,
    role: user.role,
    isPlatformOwner: Boolean(user.isPlatformOwner),
    tenantIds: user.tenantIds ?? [],
  };
}

function sendError(res: Response, err: unknown): void {
  const error = err instanceof TenantAccountError
    ? err
    : new TenantAccountError(500, 'internal_error', 'The request could not be completed.');
  res.status(error.status).json({ success: false, error: error.message, code: error.code });
}

function assertObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new TenantAccountError(400, 'invalid_request', 'Request body must be a JSON object.');
  }
  return body as Record<string, unknown>;
}

function queryString(value: unknown): string | null {
  if (Array.isArray(value)) throw new TenantAccountError(400, 'invalid_request', 'Query parameters must be a single value.');
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function createChatPlatformAdminHandlers(deps: {
  accounts: TenantAccountStore;
  entitlements: TenantChatEntitlementStore;
  installations: ChatConnectStore;
  probe?: OriginProbe;
  now?: () => Date;
  env?: NodeJS.ProcessEnv;
}) {
  const now = () => deps.now?.() ?? new Date();
  const env = deps.env ?? process.env;
  const probe = deps.probe ?? probeOriginOwnership;

  const overview: RequestHandler = async (req, res) => {
    try {
      const principal = principalOf(req);
      const [entitlements, installations] = await Promise.all([
        deps.entitlements.list(),
        deps.installations.list(),
      ]);
      const body = await loadPlatformOverview({
        store: deps.accounts,
        principal,
        entitlements,
        installations,
        healthOf: (installation) => deriveConnectionHealth(installation, now()),
      });
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, ...body });
    } catch (err) {
      sendError(res, err);
    }
  };

  const listTenants: RequestHandler = async (req, res) => {
    try {
      const principal = principalOf(req);
      const page = Number(queryString(req.query.page) ?? '1');
      const pageSize = Number(queryString(req.query.pageSize) ?? '20');
      const body = await listTenantAccountViews(deps.accounts, principal, {
        q: queryString(req.query.q) ?? undefined,
        status: queryString(req.query.status) ?? undefined,
        tenantId: queryString(req.query.tenantId),
        page: Number.isFinite(page) ? page : 1,
        pageSize: Number.isFinite(pageSize) ? pageSize : 20,
      });
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, canManage: principal.isPlatformOwner, ...body });
    } catch (err) {
      sendError(res, err);
    }
  };

  const createTenant: RequestHandler = async (req, res) => {
    try {
      const record = await registerDatabaseTenant(deps.accounts, principalOf(req), assertObject(req.body), now());
      res.status(201).json({ success: true, tenant: record });
    } catch (err) {
      sendError(res, err);
    }
  };

  const openRecord: RequestHandler = async (req, res) => {
    try {
      const record = await openCommercialRecord(
        deps.accounts,
        principalOf(req),
        String(req.params.tenantId ?? ''),
        assertObject(req.body),
        now(),
        env,
      );
      res.status(201).json({ success: true, tenant: record });
    } catch (err) {
      sendError(res, err);
    }
  };

  const updateTenant: RequestHandler = async (req, res) => {
    try {
      const record = await updateTenantAccount(
        deps.accounts,
        principalOf(req),
        String(req.params.tenantId ?? ''),
        assertObject(req.body),
        now(),
      );
      res.json({ success: true, tenant: record });
    } catch (err) {
      sendError(res, err);
    }
  };

  const lifecycle = (action: LifecycleAction): RequestHandler => async (req, res) => {
    try {
      if (req.body && typeof req.body === 'object' && !Array.isArray(req.body) && Object.keys(req.body).length > 0) {
        throw new TenantAccountError(400, 'invalid_request', 'This action does not accept a request body.');
      }
      const record = await changeTenantLifecycle(
        deps.accounts,
        principalOf(req),
        String(req.params.tenantId ?? ''),
        action,
        now(),
        env,
      );
      res.json({ success: true, tenant: record });
    } catch (err) {
      sendError(res, err);
    }
  };

  const sites: RequestHandler = async (req, res) => {
    try {
      const rows = await listSitesForPrincipal(deps.accounts, principalOf(req), queryString(req.query.tenantId));
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, sites: rows });
    } catch (err) {
      sendError(res, err);
    }
  };

  const createSite: RequestHandler = async (req, res) => {
    try {
      const site = await addTenantSite(
        deps.accounts,
        principalOf(req),
        String(req.params.tenantId ?? ''),
        assertObject(req.body),
        now(),
      );
      res.status(201).json({ success: true, site });
    } catch (err) {
      sendError(res, err);
    }
  };

  const siteStatus: RequestHandler = async (req, res) => {
    try {
      const body = assertObject(req.body);
      const site = await setSiteStatus(deps.accounts, principalOf(req), String(req.params.siteId ?? ''), body.status, now());
      res.json({
        success: true,
        site: {
          id: site.id,
          tenantId: site.tenantId,
          displayName: site.displayName,
          technology: site.technology,
          status: site.status,
        },
      });
    } catch (err) {
      sendError(res, err);
    }
  };

  const createOrigin: RequestHandler = async (req, res) => {
    try {
      const origin = await addSiteOrigin(
        deps.accounts,
        principalOf(req),
        String(req.params.siteId ?? ''),
        assertObject(req.body),
        now(),
        env,
      );
      res.status(201).json({ success: true, origin });
    } catch (err) {
      sendError(res, err);
    }
  };

  const verifyOrigin: RequestHandler = async (req, res) => {
    try {
      const origin = await verifySiteOrigin(deps.accounts, principalOf(req), String(req.params.originId ?? ''), probe, now());
      res.json({ success: true, origin });
    } catch (err) {
      sendError(res, err);
    }
  };

  const reissue: RequestHandler = async (req, res) => {
    try {
      const origin = await reissueOriginChallenge(deps.accounts, principalOf(req), String(req.params.originId ?? ''), now());
      res.json({ success: true, origin });
    } catch (err) {
      sendError(res, err);
    }
  };

  const link: RequestHandler = async (req, res) => {
    try {
      const body = assertObject(req.body);
      const linked = await linkInstallationToSite(
        deps.accounts,
        principalOf(req),
        String(req.params.siteId ?? ''),
        body.installationId,
        now(),
        async (id) => (await deps.installations.findById(id))?.tenantId ?? null,
      );
      res.json({ success: true, link: linked });
    } catch (err) {
      sendError(res, err);
    }
  };

  const audits: RequestHandler = async (req, res) => {
    try {
      const entries = await listTenantAudits(deps.accounts, principalOf(req), queryString(req.query.tenantId));
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, entries });
    } catch (err) {
      sendError(res, err);
    }
  };

  return {
    overview,
    listTenants,
    createTenant,
    openRecord,
    updateTenant,
    activate: lifecycle('activate'),
    suspend: lifecycle('suspend'),
    reactivate: lifecycle('reactivate'),
    archive: lifecycle('archive'),
    restore: lifecycle('restore'),
    sites,
    createSite,
    siteStatus,
    createOrigin,
    verifyOrigin,
    reissue,
    link,
    audits,
  };
}
