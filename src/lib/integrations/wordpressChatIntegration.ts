/**
 * POST /api/integrations/wordpress/chat
 *
 * The single server-to-server operational endpoint used by the Primewayz Integration
 * WordPress plugin (PHP only, never browser JavaScript).
 * Read: dashboard, conversation, diagnostics.
 * Delegated write: reply (text only), resolve, reopen — idempotent per clientActionId and
 * attributed to the WordPress operator for audit (wordpressChatDelegatedActions).
 *
 * Authority comes only from the bearer credential, which maps server-side to one
 * integration, one tenant (pw-infotech) and fixed scopes. Tenant / source fields in
 * the body are rejected, query strings are rejected, no CORS headers are emitted and
 * every response is no-store. Presence is read-only; notes, edits, deletes, spam,
 * assignment, attachments and appointments are not exposed.
 */

import { randomUUID } from 'node:crypto';
import type { ErrorRequestHandler, Request, RequestHandler, Response } from 'express';
import {
  INTEGRATION_REGISTRY,
  integrationHasScope,
  parseBearerToken,
  resolveIntegrationPrincipal,
  type IntegrationDefinition,
  type IntegrationPrincipal,
  type IntegrationScope,
} from './integrationRegistry.ts';
import {
  getOperationalChatDashboard,
  getOperationalConversation,
  getOperationalConversationSummary,
  getOperationalTeamPresence,
  OperationalChatNotFoundError,
  RECENT_CONVERSATIONS_DEFAULT_LIMIT,
  TRANSCRIPT_MESSAGE_LIMIT,
  type OperationalChatStore,
  type OperationalTeamPresence,
} from '../admin/operationalChatService.ts';
import { toVisitorReference } from '../chat/chatOperationalSemantics.ts';
import { ChatConversationConflictError, type ChatConversationStore } from '../chat/chatConversationService.ts';
import { CHAT_SESSION_ID_MAX_LENGTH, PUBLIC_CHAT_INPUT_LIMITS } from '../chat/publicChatGuards.ts';
import { getTenantById, type PlatformTenantConfig } from '../platform/tenantRegistry.ts';
import { tenantSupportsCapability } from '../platform/tenantCapabilities.ts';
import {
  DELEGATED_CHAT_WRITE_ACTIONS,
  DelegatedChatActionError,
  executeDelegatedChatAction,
  type DelegatedActor,
  type DelegatedChatWriteAction,
  type DelegatedChatWriteRequest,
} from './wordpressChatDelegatedActions.ts';

export const WORDPRESS_CHAT_INTEGRATION_PATH = '/api/integrations/wordpress/chat';
export const WORDPRESS_CHAT_API_VERSION = '1';

export const WORDPRESS_CHAT_ACTIONS = ['dashboard', 'conversation', 'diagnostics', ...DELEGATED_CHAT_WRITE_ACTIONS] as const;
export type WordPressChatAction = (typeof WORDPRESS_CHAT_ACTIONS)[number];

const ACTION_SCOPES: Readonly<Record<WordPressChatAction, IntegrationScope>> = {
  dashboard: 'chat:dashboard',
  conversation: 'chat:read',
  diagnostics: 'chat:diagnostics',
  reply: 'chat:reply',
  resolve: 'chat:resolve',
  reopen: 'chat:reopen',
};

const WRITE_FIELDS = ['action', 'sessionId', 'clientActionId', 'actor'] as const;

const ACTION_FIELDS: Readonly<Record<WordPressChatAction, readonly string[]>> = {
  dashboard: ['action'],
  conversation: ['action', 'sessionId'],
  diagnostics: ['action'],
  reply: [...WRITE_FIELDS, 'text'],
  resolve: WRITE_FIELDS,
  reopen: WRITE_FIELDS,
};

/** Admin-only reply features that delegated replies do not support in this phase. */
const UNSUPPORTED_REPLY_FIELDS = ['attachmentIds', 'replyToId', 'isInternalNote', 'sender'] as const;

export const DELEGATED_REPLY_TEXT_MAX_LENGTH = PUBLIC_CHAT_INPUT_LIMITS.message;
export const ACTOR_DISPLAY_NAME_MAX_LENGTH = 80;
const CLIENT_ACTION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{35,63}$/;
const ACTOR_EXTERNAL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;
const ACTOR_FIELDS = ['externalUserId', 'displayName'] as const;

/** Authority / attribution fields that only the credential binding may decide. */
export const TENANT_AUTHORITY_FIELDS = [
  'tenantId',
  'tenant',
  'tenantKey',
  'market',
  'sourceSite',
  'sourceOrigin',
  'sourceChannel',
] as const;

export type WordPressChatErrorCode =
  | 'invalid_request'
  | 'tenant_override_rejected'
  | 'integration_unauthorized'
  | 'integration_forbidden'
  | 'conversation_not_found'
  | 'conversation_closed'
  | 'invalid_transition'
  | 'idempotency_key_conflict'
  | 'method_not_allowed'
  | 'rate_limited'
  | 'tenant_unavailable'
  | 'chat_service_unavailable'
  | 'database_unavailable'
  | 'internal_error';

type RateLimitRule = { limit: number; windowMs: number };
const MINUTE_MS = 60 * 1000;

export const WORDPRESS_CHAT_RATE_LIMITS = {
  /** All authenticated calls of one integration, before action parsing. */
  integration: { limit: 240, windowMs: MINUTE_MS },
  dashboard: { limit: 60, windowMs: MINUTE_MS },
  conversation: { limit: 120, windowMs: MINUTE_MS },
  diagnostics: { limit: 30, windowMs: MINUTE_MS },
  reply: { limit: 30, windowMs: MINUTE_MS },
  resolve: { limit: 30, windowMs: MINUTE_MS },
  reopen: { limit: 30, windowMs: MINUTE_MS },
  /** Failed credential attempts per client IP. */
  invalidCredential: { limit: 30, windowMs: MINUTE_MS },
} as const satisfies Record<string, RateLimitRule>;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function consumeRateLimit(key: string, rule: RateLimitRule, now: number): number | null {
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

export function resetWordPressChatRateLimitsForTests(): void {
  buckets.clear();
}

export class WordPressChatIntegrationError extends Error {
  readonly status: number;
  readonly code: WordPressChatErrorCode;
  readonly retryAfterSeconds?: number;

  constructor(status: number, code: WordPressChatErrorCode, message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'WordPressChatIntegrationError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const invalidRequest = (message: string) => new WordPressChatIntegrationError(400, 'invalid_request', message);

function enforceRateLimit(key: string, rule: RateLimitRule, now: number): void {
  const retryAfterSeconds = consumeRateLimit(key, rule, now);
  if (retryAfterSeconds !== null) {
    throw new WordPressChatIntegrationError(429, 'rate_limited', 'Too many integration requests.', retryAfterSeconds);
  }
}

export type WordPressChatRequest =
  | { action: 'dashboard' }
  | { action: 'diagnostics' }
  | { action: 'conversation'; sessionId: string }
  | DelegatedChatWriteRequest;

export function isDelegatedWriteAction(action: WordPressChatAction): action is DelegatedChatWriteAction {
  return (DELEGATED_CHAT_WRITE_ACTIONS as readonly string[]).includes(action);
}

function parseSessionId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > CHAT_SESSION_ID_MAX_LENGTH) {
    throw invalidRequest('sessionId must be a non-empty string of at most 191 characters.');
  }
  return value;
}

function parseClientActionId(value: unknown): string {
  if (typeof value !== 'string' || !CLIENT_ACTION_ID_PATTERN.test(value)) {
    throw invalidRequest('clientActionId must be a UUID or a 36-64 character identifier (letters, digits, . _ : -).');
  }
  return value;
}

/** Audit context only: never an email, never a role, never authority. */
function parseActor(value: unknown): DelegatedActor {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidRequest('actor must be an object with externalUserId.');
  }
  const actor = value as Record<string, unknown>;
  if (Object.keys(actor).some((key) => !(ACTOR_FIELDS as readonly string[]).includes(key))) {
    throw invalidRequest('actor accepts only externalUserId and displayName.');
  }
  const { externalUserId, displayName } = actor;
  if (typeof externalUserId !== 'string' || !ACTOR_EXTERNAL_ID_PATTERN.test(externalUserId)) {
    throw invalidRequest('actor.externalUserId must be 1-64 characters (letters, digits, . _ : -).');
  }
  if (displayName === undefined || displayName === null) return { externalUserId, displayName: null };
  if (typeof displayName !== 'string') throw invalidRequest('actor.displayName must be a string.');
  const name = displayName.replace(/\s+/g, ' ').trim();
  if (
    !name
    || name.length > ACTOR_DISPLAY_NAME_MAX_LENGTH
    || name.includes('@')
    || /[\u0000-\u001f\u007f<>]/.test(displayName.replace(/[\t\n\r]/g, ' '))
  ) {
    throw invalidRequest(`actor.displayName must be 1-${ACTOR_DISPLAY_NAME_MAX_LENGTH} plain characters and not an email address.`);
  }
  return { externalUserId, displayName: name };
}

function parseReplyText(value: unknown): string {
  if (typeof value !== 'string') throw invalidRequest('text must be a string.');
  const text = value.trim();
  if (!text) throw invalidRequest('text must not be empty.');
  if (text.length > DELEGATED_REPLY_TEXT_MAX_LENGTH) {
    throw invalidRequest(`text must be at most ${DELEGATED_REPLY_TEXT_MAX_LENGTH} characters.`);
  }
  return text;
}

export function parseWordPressChatRequest(rawBody: unknown): WordPressChatRequest {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    throw invalidRequest('Request body must be a JSON object.');
  }
  const body = rawBody as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.some((key) => (TENANT_AUTHORITY_FIELDS as readonly string[]).includes(key))) {
    throw new WordPressChatIntegrationError(
      400,
      'tenant_override_rejected',
      'Tenant and source are bound to the integration credential and cannot be supplied.',
    );
  }
  const action = body.action;
  if (typeof action !== 'string' || !(WORDPRESS_CHAT_ACTIONS as readonly string[]).includes(action)) {
    throw invalidRequest('Unknown or missing action.');
  }
  const typedAction = action as WordPressChatAction;
  if (typedAction === 'reply' && keys.some((key) => (UNSUPPORTED_REPLY_FIELDS as readonly string[]).includes(key))) {
    throw invalidRequest('Delegated replies are text-only: attachments, reply quoting and internal notes are not supported.');
  }
  const unexpected = keys.filter((key) => !ACTION_FIELDS[typedAction].includes(key));
  if (unexpected.length > 0) throw invalidRequest('Request contains unsupported fields.');

  if (typedAction === 'conversation') return { action: 'conversation', sessionId: parseSessionId(body.sessionId) };
  if (isDelegatedWriteAction(typedAction)) {
    const base = {
      sessionId: parseSessionId(body.sessionId),
      clientActionId: parseClientActionId(body.clientActionId),
      actor: parseActor(body.actor),
    };
    if (typedAction === 'reply') return { action: 'reply', ...base, text: parseReplyText(body.text) };
    return { action: typedAction, ...base };
  }
  return { action: typedAction };
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

/** Accepts a well-formed caller X-Request-ID (8 to 128 safe characters), otherwise a new UUID. */
export function resolveRequestId(header: string | undefined | null): string {
  const value = typeof header === 'string' ? header.trim() : '';
  return REQUEST_ID_PATTERN.test(value) ? value : randomUUID();
}

export type WordPressChatAuditLogEntry = {
  requestId: string;
  integrationId: string | null;
  tenantId: string | null;
  action: WordPressChatAction | null;
  status: number;
  code: WordPressChatErrorCode | null;
  durationMs: number;
  sessionRef?: string;
  /** Delegated writes only: whether the response replayed an earlier committed action. */
  replayed?: boolean;
};

export type WordPressChatIntegrationDeps = {
  store: OperationalChatStore;
  /** Shared conversation write store (same implementation as the UK Admin reply path). */
  writes: ChatConversationStore;
  siteUrl: string;
  isDatabaseUnavailableError(err: unknown): boolean;
  getClientIp(req: Request): string;
  env?: NodeJS.ProcessEnv;
  registry?: readonly IntegrationDefinition[];
  now?: () => number;
  log?: (entry: WordPressChatAuditLogEntry) => void;
  logError?: (message: string) => void;
};

function defaultLog(entry: WordPressChatAuditLogEntry): void {
  console.info(`[wp-chat-integration] ${JSON.stringify(entry)}`);
}

function setResponseHeaders(res: Response, requestId: string): void {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Request-ID', requestId);
}

function sendError(res: Response, requestId: string, error: WordPressChatIntegrationError): void {
  if (error.retryAfterSeconds) res.setHeader('Retry-After', String(error.retryAfterSeconds));
  if (error.status === 401) res.setHeader('WWW-Authenticate', 'Bearer');
  res.status(error.status).json({
    ok: false,
    apiVersion: WORDPRESS_CHAT_API_VERSION,
    requestId,
    error: { code: error.code, message: error.message },
  });
}

export function buildFullAdminLinks(siteUrl: string) {
  const base = siteUrl.replace(/\/+$/, '');
  return {
    url: `${base}/admin`,
    mobileUrl: `${base}/admin/chat`,
    tenantPreselected: false,
  };
}

type ServiceStatus = 'healthy' | 'degraded' | 'unavailable';

function serviceStatus(chatEnabled: boolean, canAcceptMessages: boolean): ServiceStatus {
  return chatEnabled && canAcceptMessages ? 'healthy' : 'degraded';
}

function classifyFailure(err: unknown, deps: WordPressChatIntegrationDeps): WordPressChatIntegrationError {
  if (err instanceof WordPressChatIntegrationError) return err;
  if (err instanceof OperationalChatNotFoundError) {
    return new WordPressChatIntegrationError(404, 'conversation_not_found', 'Conversation not found.');
  }
  if (err instanceof ChatConversationConflictError || err instanceof DelegatedChatActionError) {
    return new WordPressChatIntegrationError(409, err.code, err.message);
  }
  if (deps.isDatabaseUnavailableError(err)) {
    return new WordPressChatIntegrationError(503, 'database_unavailable', 'The chat database is temporarily unavailable.');
  }
  if (err instanceof Error && err.name.startsWith('PrismaClient')) {
    return new WordPressChatIntegrationError(503, 'chat_service_unavailable', 'The chat service is temporarily unavailable.');
  }
  return new WordPressChatIntegrationError(500, 'internal_error', 'The request could not be completed.');
}

export function createWordPressChatIntegrationHandler(deps: WordPressChatIntegrationDeps): RequestHandler {
  const now = deps.now ?? Date.now;
  const log = deps.log ?? defaultLog;
  const logError = deps.logError ?? ((message: string) => console.error(message));

  async function runDiagnostics(principal: IntegrationPrincipal, tenant: PlatformTenantConfig) {
    const chatEnabled = tenantSupportsCapability(tenant.tenantId, 'chat');
    let databaseReachable = true;
    let team: OperationalTeamPresence | null = null;
    try {
      await deps.store.checkDatabase();
      team = await getOperationalTeamPresence(deps.store, now());
    } catch (err) {
      if (!deps.isDatabaseUnavailableError(err) && !(err instanceof Error && err.name.startsWith('PrismaClient'))) throw err;
      databaseReachable = false;
    }
    const canAcceptMessages = chatEnabled && Boolean(team?.canAcceptMessages);
    return {
      status: (databaseReachable ? serviceStatus(chatEnabled, canAcceptMessages) : 'unavailable') as ServiceStatus,
      api: { status: 'ok', version: WORDPRESS_CHAT_API_VERSION },
      authentication: { valid: true, integrationId: principal.integrationId, scopes: [...principal.scopes] },
      tenantBinding: { tenantId: tenant.tenantId, valid: true, active: tenant.active },
      chat: { enabled: chatEnabled, canAcceptMessages },
      team,
      database: { status: databaseReachable ? 'reachable' : 'unreachable' },
      fullAdmin: buildFullAdminLinks(deps.siteUrl),
    };
  }

  async function runDashboard(tenant: PlatformTenantConfig) {
    const chatEnabled = tenantSupportsCapability(tenant.tenantId, 'chat');
    const [team, dashboard] = await Promise.all([
      getOperationalTeamPresence(deps.store, now()),
      getOperationalChatDashboard(deps.store, { tenantId: tenant.tenantId, limit: RECENT_CONVERSATIONS_DEFAULT_LIMIT }),
    ]);
    const canAcceptMessages = chatEnabled && team.canAcceptMessages;
    return {
      service: { status: serviceStatus(chatEnabled, canAcceptMessages), chatEnabled, canAcceptMessages },
      team,
      attention: dashboard.attention,
      recentConversations: dashboard.recentConversations,
      limits: { recentConversations: RECENT_CONVERSATIONS_DEFAULT_LIMIT, transcriptMessages: TRANSCRIPT_MESSAGE_LIMIT },
      fullAdmin: buildFullAdminLinks(deps.siteUrl),
    };
  }

  async function runDelegatedWrite(
    principal: IntegrationPrincipal,
    tenant: PlatformTenantConfig,
    requestId: string,
    request: DelegatedChatWriteRequest,
  ) {
    const outcome = await executeDelegatedChatAction(deps.writes, {
      integrationId: principal.integrationId,
      tenantId: tenant.tenantId,
      requestId,
      request,
      now: new Date(now()),
    });
    const conversation = await getOperationalConversationSummary(deps.store, {
      tenantId: tenant.tenantId,
      sessionId: request.sessionId,
    });
    return {
      outcome,
      data: {
        action: outcome.action,
        clientActionId: outcome.clientActionId,
        replayed: outcome.replayed,
        changed: outcome.changed,
        ...(outcome.action === 'reply' ? { message: outcome.message } : {}),
        conversation,
      },
    };
  }

  return async (req, res) => {
    const startedAt = now();
    const requestId = resolveRequestId(req.get('x-request-id'));
    setResponseHeaders(res, requestId);

    let principal: IntegrationPrincipal | null = null;
    let action: WordPressChatAction | null = null;
    let sessionRef: string | undefined;
    let replayed: boolean | undefined;
    let status = 200;
    let code: WordPressChatErrorCode | null = null;

    try {
      if (req.originalUrl.includes('?')) throw invalidRequest('Query parameters are not accepted.');

      principal = resolveIntegrationPrincipal(
        parseBearerToken(req.get('authorization')),
        deps.env ?? process.env,
        deps.registry ?? INTEGRATION_REGISTRY,
      );
      if (!principal) {
        enforceRateLimit(`invalid|${deps.getClientIp(req)}`, WORDPRESS_CHAT_RATE_LIMITS.invalidCredential, startedAt);
        throw new WordPressChatIntegrationError(401, 'integration_unauthorized', 'Missing or invalid integration credential.');
      }

      const tenant = getTenantById(principal.tenantId);
      if (!tenant?.active) {
        throw new WordPressChatIntegrationError(503, 'tenant_unavailable', 'The bound tenant is not available.');
      }

      enforceRateLimit(`integration|${principal.integrationId}`, WORDPRESS_CHAT_RATE_LIMITS.integration, startedAt);
      const input = parseWordPressChatRequest(req.body);
      action = input.action;
      if ('sessionId' in input) sessionRef = toVisitorReference(input.sessionId);
      enforceRateLimit(`${input.action}|${principal.integrationId}`, WORDPRESS_CHAT_RATE_LIMITS[input.action], startedAt);

      if (!integrationHasScope(principal, ACTION_SCOPES[input.action])) {
        throw new WordPressChatIntegrationError(403, 'integration_forbidden', 'The integration credential does not permit this action.');
      }

      let data: unknown;
      if (input.action === 'dashboard') data = await runDashboard(tenant);
      else if (input.action === 'diagnostics') data = await runDiagnostics(principal, tenant);
      else if (input.action === 'conversation') {
        data = await getOperationalConversation(deps.store, { tenantId: tenant.tenantId, sessionId: input.sessionId });
      } else {
        const write = await runDelegatedWrite(principal, tenant, requestId, input);
        replayed = write.outcome.replayed;
        data = write.data;
      }

      res.status(200).json({
        ok: true,
        apiVersion: WORDPRESS_CHAT_API_VERSION,
        requestId,
        tenant: { key: tenant.tenantId, market: tenant.market, displayName: tenant.displayName },
        generatedAt: new Date(now()).toISOString(),
        data,
      });
    } catch (err) {
      const failure = classifyFailure(err, deps);
      status = failure.status;
      code = failure.code;
      if (failure.status >= 500) {
        logError(`[wp-chat-integration] requestId=${requestId} failure=${failure.code} cause=${err instanceof Error ? err.name : typeof err}`);
      }
      sendError(res, requestId, failure);
    } finally {
      log({
        requestId,
        integrationId: principal?.integrationId ?? null,
        tenantId: principal?.tenantId ?? null,
        action,
        status,
        code,
        durationMs: Math.max(0, now() - startedAt),
        ...(sessionRef ? { sessionRef } : {}),
        ...(replayed !== undefined ? { replayed } : {}),
      });
    }
  };
}

/** Any method other than POST. */
export const wordpressChatMethodNotAllowed: RequestHandler = (req, res) => {
  const requestId = resolveRequestId(req.get('x-request-id'));
  setResponseHeaders(res, requestId);
  res.setHeader('Allow', 'POST');
  sendError(res, requestId, new WordPressChatIntegrationError(405, 'method_not_allowed', 'Only POST is supported.'));
};

/** Body-parser failures (malformed JSON, oversized body) on this path keep the envelope. */
export const wordpressChatBodyErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const requestId = resolveRequestId(req.get('x-request-id'));
  setResponseHeaders(res, requestId);
  const tooLarge = (err as { type?: string })?.type === 'entity.too.large';
  sendError(
    res,
    requestId,
    tooLarge
      ? new WordPressChatIntegrationError(413, 'invalid_request', 'Request body is too large.')
      : invalidRequest('Request body must be valid JSON.'),
  );
};
