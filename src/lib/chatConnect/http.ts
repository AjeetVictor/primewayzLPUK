import { randomUUID } from 'node:crypto';
import type { ErrorRequestHandler, Request, RequestHandler, Response } from 'express';
import {
  CHAT_CONNECT_ACTIVATE_PATH,
  CHAT_CONNECT_ADMIN_COLLECTION_PATH,
  CHAT_CONNECT_API_VERSION,
  CHAT_CONNECT_CONNECTOR_TECHNOLOGIES,
  CHAT_CONNECT_CONNECTED_MAX_AGE_MS,
  CHAT_CONNECT_HEARTBEAT_INTERVAL_MS,
  CHAT_CONNECT_HEARTBEAT_PATH,
  CHAT_CONNECT_RATE_LIMITS,
  CHAT_CONNECT_STALE_MAX_AGE_MS,
  CHAT_CONNECT_TENANT_AUTHORITY_FIELDS,
} from './constants.ts';
import {
  activateInstallation,
  listInstallations,
  reactivateInstallation,
  recordVerifiedHeartbeat,
  registerInstallation,
  registrationTenantOptions,
  revokeInstallation,
  rotateInstallationCredential,
  suspendInstallation,
  authenticateInstallationCredential,
} from './lifecycle.ts';
import { parseInstallationBearer } from './credentials.ts';
import {
  ChatConnectError,
  type ChatConnectAdminPrincipal,
  type ChatConnectStore,
} from './types.ts';

export { CHAT_CONNECT_ACTIVATE_PATH, CHAT_CONNECT_ADMIN_COLLECTION_PATH, CHAT_CONNECT_HEARTBEAT_PATH };

const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const CONNECTOR_FIELDS = ['clientActionId', 'addonVersion', 'widgetVersion'] as const;
const REGISTER_FIELDS = ['tenantId', 'integrationTechnology', 'addonVersion', 'widgetVersion', 'frontendVisibility'] as const;

type RateRule = { limit: number; windowMs: number };
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function resetChatConnectRateLimitsForTests(): void {
  buckets.clear();
}

function consumeRateLimit(key: string, rule: RateRule, now: number): number | null {
  for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey);
  const current = buckets.get(key);
  if (!current) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return null;
  }
  if (current.count >= rule.limit) return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  current.count += 1;
  return null;
}

function enforceRateLimit(key: string, rule: RateRule, now: number): void {
  const retryAfterSeconds = consumeRateLimit(key, rule, now);
  if (retryAfterSeconds !== null) {
    throw new ChatConnectError(429, 'rate_limited', 'Too many Chat Connect requests.', retryAfterSeconds);
  }
}

export type ChatConnectHandlerDeps = {
  store: ChatConnectStore;
  getClientIp?: (req: Request) => string;
  now?: () => Date;
  log?: (entry: Record<string, unknown>) => void;
};

type AdminRequest = Request & { adminUser?: ChatConnectAdminPrincipal & { email?: string } };

function resolveRequestId(header: string | undefined): string {
  const value = header?.trim() ?? '';
  return REQUEST_ID_PATTERN.test(value) ? value : randomUUID();
}

function setConnectorHeaders(res: Response, requestId: string): void {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Request-ID', requestId);
  res.removeHeader('Access-Control-Allow-Origin');
}

function sendConnectorError(res: Response, requestId: string, error: ChatConnectError): void {
  if (error.retryAfterSeconds) res.setHeader('Retry-After', String(error.retryAfterSeconds));
  if (error.status === 401) res.setHeader('WWW-Authenticate', 'Bearer');
  res.status(error.status).json({
    ok: false,
    apiVersion: CHAT_CONNECT_API_VERSION,
    requestId,
    error: { code: error.code, message: error.message },
  });
}

function asChatConnectError(err: unknown): ChatConnectError {
  if (err instanceof ChatConnectError) return err;
  return new ChatConnectError(500, 'internal_error', 'The request could not be completed.');
}

function assertObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ChatConnectError(400, 'invalid_request', 'Request body must be a JSON object.');
  }
  return body as Record<string, unknown>;
}

function rejectUnexpected(body: Record<string, unknown>, allowed: readonly string[]): void {
  const unexpected = Object.keys(body).filter((key) => !allowed.includes(key));
  if (unexpected.length > 0) {
    throw new ChatConnectError(400, 'invalid_request', 'Request contains unsupported fields.');
  }
}

function rejectTenantOverride(body: Record<string, unknown>): void {
  for (const field of CHAT_CONNECT_TENANT_AUTHORITY_FIELDS) {
    if (field in body) {
      throw new ChatConnectError(400, 'tenant_override_rejected', 'Tenant identity is taken from the installation credential.');
    }
  }
}

function parseConnectorBody(body: unknown): { clientActionId: unknown; addonVersion: unknown; widgetVersion: unknown } {
  const record = assertObject(body);
  rejectTenantOverride(record);
  rejectUnexpected(record, CONNECTOR_FIELDS);
  return {
    clientActionId: record.clientActionId,
    addonVersion: record.addonVersion,
    widgetVersion: record.widgetVersion,
  };
}

function principalOf(req: Request): ChatConnectAdminPrincipal {
  const user = (req as AdminRequest).adminUser;
  if (!user) throw new ChatConnectError(401, 'admin_access_required', 'Authenticated admin access is required.');
  const operations = user.role === 'super_admin' || user.role === 'admin' || user.role === 'editor' || user.role === 'viewer';
  if (!user.isPlatformOwner && !operations) {
    throw new ChatConnectError(403, 'admin_access_required', 'Authenticated admin access is required.');
  }
  return user;
}

function sendAdminError(res: Response, err: unknown): void {
  const error = asChatConnectError(err);
  if (error.retryAfterSeconds) res.setHeader('Retry-After', String(error.retryAfterSeconds));
  res.status(error.status).json({ success: false, error: error.message, code: error.code });
}

export function createChatConnectAdminHandlers(deps: ChatConnectHandlerDeps) {
  const now = () => deps.now?.() ?? new Date();

  const list: RequestHandler = async (req, res) => {
    try {
      const principal = principalOf(req);
      const requested = req.query.tenantId;
      if (Array.isArray(requested)) throw new ChatConnectError(400, 'invalid_request', 'tenantId must be a single value.');
      const tenantId = typeof requested === 'string' && requested.length > 0 ? requested : null;
      const installations = await listInstallations(deps.store, principal, tenantId, now());
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        success: true,
        heartbeatIntervalSeconds: CHAT_CONNECT_HEARTBEAT_INTERVAL_MS / 1000,
        connectedWindowSeconds: CHAT_CONNECT_CONNECTED_MAX_AGE_MS / 1000,
        staleWindowSeconds: CHAT_CONNECT_STALE_MAX_AGE_MS / 1000,
        connectorTechnologies: [...CHAT_CONNECT_CONNECTOR_TECHNOLOGIES],
        tenants: registrationTenantOptions(principal),
        installations,
      });
    } catch (err) {
      sendAdminError(res, err);
    }
  };

  const register: RequestHandler = async (req, res) => {
    try {
      const principal = principalOf(req);
      enforceRateLimit(`admin|${principal.id}`, CHAT_CONNECT_RATE_LIMITS.adminMutation, now().getTime());
      const body = assertObject(req.body);
      rejectUnexpected(body, REGISTER_FIELDS);
      const result = await registerInstallation(deps.store, principal, {
        tenantId: body.tenantId,
        integrationTechnology: body.integrationTechnology,
        addonVersion: body.addonVersion,
        widgetVersion: body.widgetVersion,
        frontendVisibility: body.frontendVisibility,
      }, now());
      res.status(201).json({ success: true, installation: result.installation, credential: result.credential });
    } catch (err) {
      sendAdminError(res, err);
    }
  };

  const action = (
    run: (store: ChatConnectStore, principal: ChatConnectAdminPrincipal, id: string, at: Date) => Promise<unknown>,
  ): RequestHandler => async (req, res) => {
    try {
      const principal = principalOf(req);
      enforceRateLimit(`admin|${principal.id}`, CHAT_CONNECT_RATE_LIMITS.adminMutation, now().getTime());
      if (req.body && typeof req.body === 'object' && !Array.isArray(req.body) && Object.keys(req.body).length > 0) {
        throw new ChatConnectError(400, 'invalid_request', 'This action does not accept a request body.');
      }
      const installationId = String(req.params.installationId ?? '');
      const result = await run(deps.store, principal, installationId, now());
      const credential = result && typeof result === 'object' && 'credential' in result
        ? (result as { credential: unknown }).credential
        : undefined;
      const installation = result && typeof result === 'object' && 'installation' in result
        ? (result as { installation: unknown }).installation
        : result;
      res.json({ success: true, installation, ...(credential ? { credential } : {}) });
    } catch (err) {
      sendAdminError(res, err);
    }
  };

  return {
    list,
    register,
    suspend: action(suspendInstallation),
    reactivate: action(reactivateInstallation),
    revoke: action(revokeInstallation),
    rotate: action(rotateInstallationCredential),
  };
}

export function createChatConnectConnectorHandlers(deps: ChatConnectHandlerDeps) {
  const now = () => deps.now?.() ?? new Date();
  const log = deps.log ?? ((entry: Record<string, unknown>) => {
    console.info(`[chat-connect] ${JSON.stringify(entry)}`);
  });
  const getClientIp = deps.getClientIp ?? (() => 'unknown');

  const handle = (kind: 'activate' | 'heartbeat'): RequestHandler => async (req, res) => {
    const requestId = resolveRequestId(req.get('x-request-id'));
    setConnectorHeaders(res, requestId);
    let status = 200;
    let code: string | null = null;
    let installationId: string | null = null;
    try {
      if (req.originalUrl.includes('?')) throw new ChatConnectError(400, 'invalid_request', 'Query parameters are not accepted.');
      const presented = parseInstallationBearer(req.get('authorization'));
      const installation = await authenticateInstallationCredential(deps.store, presented);
      if (!installation) {
        enforceRateLimit(`invalid|${getClientIp(req)}`, CHAT_CONNECT_RATE_LIMITS.invalidCredential, now().getTime());
        throw new ChatConnectError(401, 'credential_unauthorized', 'Missing or invalid installation credential.');
      }
      installationId = installation.id;
      enforceRateLimit(`${kind}|${installation.id}`, CHAT_CONNECT_RATE_LIMITS[kind], now().getTime());
      const body = parseConnectorBody(req.body);
      const input = {
        clientActionId: body.clientActionId,
        addonVersion: body.addonVersion,
        widgetVersion: body.widgetVersion,
      };
      const result = kind === 'activate'
        ? await activateInstallation(deps.store, installation, input, now())
        : await recordVerifiedHeartbeat(deps.store, installation, input, now());
      res.status(200).json({
        ok: true,
        apiVersion: CHAT_CONNECT_API_VERSION,
        requestId,
        replayed: result.replayed,
        tenantOperational: result.tenantOperational,
        heartbeatIntervalSeconds: CHAT_CONNECT_HEARTBEAT_INTERVAL_MS / 1000,
        installation: result.installation,
      });
    } catch (err) {
      const error = asChatConnectError(err);
      status = error.status;
      code = error.code;
      if (status >= 500) log({ requestId, installationId, status, code });
      sendConnectorError(res, requestId, error);
    }
  };

  return { activate: handle('activate'), heartbeat: handle('heartbeat') };
}

export const chatConnectMethodNotAllowed: RequestHandler = (req, res) => {
  const requestId = resolveRequestId(req.get('x-request-id'));
  setConnectorHeaders(res, requestId);
  res.setHeader('Allow', 'POST');
  sendConnectorError(res, requestId, new ChatConnectError(405, 'method_not_allowed', 'Only POST is supported.'));
};

export const chatConnectBodyErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const requestId = resolveRequestId(req.get('x-request-id'));
  setConnectorHeaders(res, requestId);
  const tooLarge = (err as { type?: string })?.type === 'entity.too.large';
  sendConnectorError(
    res,
    requestId,
    tooLarge
      ? new ChatConnectError(413, 'invalid_request', 'Request body is too large.')
      : new ChatConnectError(400, 'invalid_request', 'Request body must be valid JSON.'),
  );
};

export const CHAT_CONNECT_ROUTE_PATHS = {
  activate: CHAT_CONNECT_ACTIVATE_PATH,
  heartbeat: CHAT_CONNECT_HEARTBEAT_PATH,
  adminCollection: CHAT_CONNECT_ADMIN_COLLECTION_PATH,
} as const;
