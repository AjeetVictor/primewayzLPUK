/**
 * Versioned operator-presence ingestion contract (WS-1).
 *
 * Supports future adapters for:
 * - Primewayz UK administration (also keeps legacy Admin heartbeat path)
 * - Primewayz Infotech WordPress Chat Connect
 * - RentReadBuy Silver Campaign
 * - Future tenants
 *
 * Credentials are tenant-bound server secrets (integration Bearer or Chat Connect installation).
 * Presence-write credentials must never ship in frontend JavaScript.
 * Existing WordPress / Silver ops scopes do not include presence write until WS-3 / WS-4.
 */

import type { RequestHandler } from 'express';
import {
  ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
  type ChatPresencePolicy,
} from './chatPresence.ts';
import type { TenantPresenceEventStore } from './tenantPresenceEvents.ts';
import {
  DEFAULT_TENANT_PRESENCE_POLICY,
  effectivePresencePolicy,
  type TenantPresencePolicyMode,
  type TenantPresencePolicyStore,
} from '../platform/tenantPresencePolicy.ts';

export const OPERATOR_PRESENCE_INGESTION_VERSION = 'v1' as const;

export const OPERATOR_PRESENCE_HEARTBEAT_PATH = '/api/v1/operator-presence/heartbeat';
export const OPERATOR_PRESENCE_OFFLINE_PATH = '/api/v1/operator-presence/offline';

/** Scope required for integration-credential presence writes. Not granted to WP/Silver yet. */
export const OPERATOR_PRESENCE_WRITE_SCOPE = 'chat:presence:write' as const;

export const OPERATOR_PRESENCE_CLIENT_ACTION_ID_MAX = 64;
export const OPERATOR_PRESENCE_OPERATOR_REF_MAX = 64;
export const OPERATOR_PRESENCE_CORRELATION_ID_MAX = 64;
export const OPERATOR_PRESENCE_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
export const OPERATOR_PRESENCE_HEARTBEAT_EXPIRES_MS = ADMIN_PRESENCE_ACTIVE_WINDOW_MS;

export type OperatorPresenceIngestionPrincipal = {
  kind: 'integration' | 'installation' | 'admin';
  tenantId: string;
  integrationId?: string;
  installationId?: string;
  adminUserId?: number;
  scopes: readonly string[];
};

export type OperatorPresenceHeartbeatRequest = {
  clientActionId: string;
  /** Tenant-local operator reference (not a password/token). */
  operatorRef: string;
  /** Optional platform user id when the adapter maps to a central User. */
  operatorUserId?: number;
  correlationId?: string;
};

export type OperatorPresenceHeartbeatResponse = {
  success: true;
  version: typeof OPERATOR_PRESENCE_INGESTION_VERSION;
  tenantId: string;
  operatorRef: string;
  expiresInMs: number;
  presencePolicy: TenantPresencePolicyMode;
  duplicated: boolean;
};

export type OperatorPresenceIngestionErrorCode =
  | 'unauthorized'
  | 'forbidden_scope'
  | 'tenant_mismatch'
  | 'invalid_request'
  | 'replay'
  | 'store_unavailable';

export class OperatorPresenceIngestionError extends Error {
  readonly status: number;
  readonly code: OperatorPresenceIngestionErrorCode;

  constructor(status: number, code: OperatorPresenceIngestionErrorCode, message: string) {
    super(message);
    this.name = 'OperatorPresenceIngestionError';
    this.status = status;
    this.code = code;
  }
}

export type PresenceIdempotencyStore = {
  claim(input: {
    tenantId: string;
    action: string;
    clientActionId: string;
    at: Date;
  }): Promise<'claimed' | 'duplicate'>;
  prune(now?: Date): Promise<number>;
};

export function parseOperatorPresenceHeartbeatBody(body: unknown): OperatorPresenceHeartbeatRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new OperatorPresenceIngestionError(400, 'invalid_request', 'Request body must be a JSON object.');
  }
  const record = body as Record<string, unknown>;
  // Reject any attempt to override tenant from the body before other validation.
  if ('tenantId' in record) {
    throw new OperatorPresenceIngestionError(400, 'tenant_mismatch', 'Tenant is bound to the credential and cannot be overridden.');
  }
  const allowed = new Set(['clientActionId', 'operatorRef', 'operatorUserId', 'correlationId']);
  const unexpected = Object.keys(record).filter((key) => !allowed.has(key));
  if (unexpected.length > 0) {
    throw new OperatorPresenceIngestionError(400, 'invalid_request', 'Request contains unsupported fields.');
  }

  const clientActionId = typeof record.clientActionId === 'string' ? record.clientActionId.trim() : '';
  if (!clientActionId || clientActionId.length > OPERATOR_PRESENCE_CLIENT_ACTION_ID_MAX) {
    throw new OperatorPresenceIngestionError(
      400,
      'invalid_request',
      `clientActionId must be 1 to ${OPERATOR_PRESENCE_CLIENT_ACTION_ID_MAX} characters.`,
    );
  }
  const operatorRef = typeof record.operatorRef === 'string' ? record.operatorRef.trim() : '';
  if (!operatorRef || operatorRef.length > OPERATOR_PRESENCE_OPERATOR_REF_MAX) {
    throw new OperatorPresenceIngestionError(
      400,
      'invalid_request',
      `operatorRef must be 1 to ${OPERATOR_PRESENCE_OPERATOR_REF_MAX} characters.`,
    );
  }
  let operatorUserId: number | undefined;
  if (record.operatorUserId !== undefined) {
    if (!Number.isInteger(record.operatorUserId) || (record.operatorUserId as number) < 1) {
      throw new OperatorPresenceIngestionError(400, 'invalid_request', 'operatorUserId must be a positive integer.');
    }
    operatorUserId = record.operatorUserId as number;
  }
  let correlationId: string | undefined;
  if (record.correlationId !== undefined) {
    if (typeof record.correlationId !== 'string' || !record.correlationId.trim()
      || record.correlationId.trim().length > OPERATOR_PRESENCE_CORRELATION_ID_MAX) {
      throw new OperatorPresenceIngestionError(
        400,
        'invalid_request',
        `correlationId must be 1 to ${OPERATOR_PRESENCE_CORRELATION_ID_MAX} characters.`,
      );
    }
    correlationId = record.correlationId.trim();
  }
  return { clientActionId, operatorRef, operatorUserId, correlationId };
}

export function assertPresenceWriteAuthorized(principal: OperatorPresenceIngestionPrincipal): void {
  if (principal.kind === 'admin') {
    if (!Number.isInteger(principal.adminUserId)) {
      throw new OperatorPresenceIngestionError(401, 'unauthorized', 'Authenticated admin access is required.');
    }
    return;
  }
  if (!principal.scopes.includes(OPERATOR_PRESENCE_WRITE_SCOPE)) {
    throw new OperatorPresenceIngestionError(
      403,
      'forbidden_scope',
      'This credential is not authorised to write operator presence.',
    );
  }
}

export function resolveIngestionHeartbeatUserId(
  principal: OperatorPresenceIngestionPrincipal,
  body: OperatorPresenceHeartbeatRequest,
): number {
  if (principal.kind === 'admin' && principal.adminUserId != null) {
    return principal.adminUserId;
  }
  if (body.operatorUserId != null) return body.operatorUserId;
  // Adapter heartbeats without a mapped User still need a stable synthetic id for AdminPresence.
  // Negative hash keeps them outside the real User id space.
  let hash = 0;
  const seed = `${principal.tenantId}:${body.operatorRef}`;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const synthetic = -Math.abs(hash || 1);
  return synthetic === 0 ? -1 : synthetic;
}

export type OperatorPresenceIngestionDeps = {
  policyStore: TenantPresencePolicyStore;
  eventStore: TenantPresenceEventStore;
  idempotency: PresenceIdempotencyStore;
  recordHeartbeat: (input: {
    tenantId: string;
    userId: number;
    now?: Date;
  }) => Promise<{ previousLastSeenAt: Date | null; becameActive: boolean } | void>;
  resolvePrincipal: (req: Parameters<RequestHandler>[0]) => Promise<OperatorPresenceIngestionPrincipal | null>;
  now?: () => Date;
};

export function createOperatorPresenceIngestionHandlers(deps: OperatorPresenceIngestionDeps) {
  const now = () => deps.now?.() ?? new Date();

  const heartbeat: RequestHandler = async (req, res) => {
    try {
      const principal = await deps.resolvePrincipal(req);
      if (!principal) {
        throw new OperatorPresenceIngestionError(401, 'unauthorized', 'Valid presence credentials are required.');
      }
      assertPresenceWriteAuthorized(principal);
      const body = parseOperatorPresenceHeartbeatBody(req.body);
      const at = now();
      const claim = await deps.idempotency.claim({
        tenantId: principal.tenantId,
        action: 'heartbeat',
        clientActionId: body.clientActionId,
        at,
      });
      const duplicated = claim === 'duplicate';
      if (!duplicated) {
        const userId = resolveIngestionHeartbeatUserId(principal, body);
        const heartbeat = await deps.recordHeartbeat({ tenantId: principal.tenantId, userId, now: at });
        // Permanent events only on Online transition — not every heartbeat refresh.
        if (heartbeat && heartbeat.becameActive) {
          await deps.eventStore.append({
            tenantId: principal.tenantId,
            eventType: 'presence_available',
            actorRef: body.operatorRef,
            actorUserId: body.operatorUserId ?? principal.adminUserId ?? null,
            correlationId: body.correlationId ?? body.clientActionId,
            details: {
              source: principal.kind,
              integrationId: principal.integrationId ?? null,
              installationId: principal.installationId ?? null,
            },
            at,
          });
        }
      }
      let policy: TenantPresencePolicyMode = DEFAULT_TENANT_PRESENCE_POLICY;
      try {
        policy = effectivePresencePolicy(await deps.policyStore.find(principal.tenantId));
      } catch {
        policy = DEFAULT_TENANT_PRESENCE_POLICY;
      }
      const payload: OperatorPresenceHeartbeatResponse = {
        success: true,
        version: OPERATOR_PRESENCE_INGESTION_VERSION,
        tenantId: principal.tenantId,
        operatorRef: body.operatorRef,
        expiresInMs: OPERATOR_PRESENCE_HEARTBEAT_EXPIRES_MS,
        presencePolicy: policy,
        duplicated,
      };
      res.setHeader('Cache-Control', 'no-store');
      res.json(payload);
    } catch (err) {
      const error = err instanceof OperatorPresenceIngestionError
        ? err
        : new OperatorPresenceIngestionError(503, 'store_unavailable', 'Presence ingestion is temporarily unavailable.');
      res.status(error.status).json({ success: false, error: error.message, code: error.code });
    }
  };

  return { heartbeat };
}

/** Contract document for adapters — not served as HTML; used by tests and Docs. */
export const OPERATOR_PRESENCE_INGESTION_CONTRACT = {
  version: OPERATOR_PRESENCE_INGESTION_VERSION,
  paths: {
    heartbeat: OPERATOR_PRESENCE_HEARTBEAT_PATH,
    offline: OPERATOR_PRESENCE_OFFLINE_PATH,
  },
  auth: {
    integrationBearer: 'Authorization: Bearer <server-side integration token>',
    installationBearer: 'Authorization: Bearer cck_…ccs_…',
    adminCookie: 'Existing Admin JWT cookie (UK path); prefer dedicated adapter tokens for WP/Silver',
  },
  requiredScope: OPERATOR_PRESENCE_WRITE_SCOPE,
  heartbeat: {
    method: 'POST',
    body: {
      clientActionId: 'string (1..64) — replay protection',
      operatorRef: 'string (1..64) — tenant-local operator id',
      operatorUserId: 'optional positive integer when mapped to central User',
      correlationId: 'optional string (1..64)',
    },
    rejectedFields: ['tenantId', 'token', 'password', 'secret'],
    expiresInMs: OPERATOR_PRESENCE_HEARTBEAT_EXPIRES_MS,
    idempotencyTtlMs: OPERATOR_PRESENCE_IDEMPOTENCY_TTL_MS,
  },
  notes: [
    'Tenant id is taken only from the credential binding.',
    'Do not embed presence-write credentials in frontend JavaScript.',
    'Existing WordPress and Silver API contracts are unchanged until adapters grant chat:presence:write.',
    'Heartbeats refresh AdminPresence TTL; permanent audit events are transitions only.',
  ],
} as const;

export type { ChatPresencePolicy };
