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
 *
 * Identity: never trust a client-supplied central User id. Bind presence to the authorised
 * integration/installation/admin session + tenant-local operatorRef.
 */

import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
import {
  ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
  type ChatPresencePolicy,
} from './chatPresence.ts';
import type { TenantPresenceEventStore } from './tenantPresenceEvents.ts';
import { pruneTenantPresenceArtifacts } from './tenantPresenceRetention.ts';
import {
  lookupPresencePolicy,
  type TenantPresencePolicyMode,
  type TenantPresencePolicyStore,
} from '../platform/tenantPresencePolicy.ts';

export const OPERATOR_PRESENCE_INGESTION_VERSION = 'v1' as const;

export const OPERATOR_PRESENCE_HEARTBEAT_PATH = '/api/v1/operator-presence/heartbeat';
/**
 * Explicit offline / session invalidation.
 * WS-2: authenticated Admin (UK) principals only.
 * WP / Silver installation & integration principals remain deferred (WS-3 / WS-4).
 */
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
  /** Tenant-local operator reference asserted by the authenticated adapter (not a password/token). */
  operatorRef: string;
  correlationId?: string;
};

export type OperatorPresenceHeartbeatResponse = {
  success: true;
  version: typeof OPERATOR_PRESENCE_INGESTION_VERSION;
  tenantId: string;
  operatorRef: string;
  expiresInMs: number;
  presencePolicy: TenantPresencePolicyMode;
  /** True when policy came from fail-closed outage handling (not a durable row read). */
  presencePolicyDegraded?: boolean;
  duplicated: boolean;
};

export type OperatorPresenceIngestionErrorCode =
  | 'unauthorized'
  | 'forbidden_scope'
  | 'tenant_mismatch'
  | 'invalid_request'
  | 'replay'
  | 'store_unavailable'
  | 'reserved';

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

export type PresenceIdempotencyKeyInput = {
  tenantId: string;
  action: string;
  clientActionId: string;
  at: Date;
};

export type PresenceIdempotencyStore = {
  claim(input: PresenceIdempotencyKeyInput): Promise<'claimed' | 'duplicate'>;
  /**
   * Release a previously claimed key so a failed write can be retried.
   * Must not throw away successful duplicate semantics for completed writes.
   */
  release(input: Omit<PresenceIdempotencyKeyInput, 'at'>): Promise<void>;
  prune(now?: Date): Promise<number>;
};

export type ResolvedOperatorPresenceIdentity = {
  userId: number;
  operatorRef: string;
  binding: 'admin_session' | 'adapter_synthetic';
  /** True when userId is outside the positive User.id space (AdminPresence has no User FK). */
  synthetic: boolean;
};

/**
 * Deterministic negative AdminPresence.userId for adapter-bound operators.
 * Scoped by tenant + credential (integration or installation) + operatorRef so:
 * - operators cannot collide across tenants or installations
 * - client cannot choose a central User id
 *
 * Collision risk: 31-bit space (~2e9); birthday collisions are rare at tenant scale.
 * Compatible with AdminPresence (Int, no FK). Positive User ids remain reserved for real users.
 */
export function syntheticPresenceUserId(
  tenantId: string,
  credentialKey: string,
  operatorRef: string,
): number {
  const digest = createHash('sha256')
    .update(`presence-v1\0${tenantId}\0${credentialKey}\0${operatorRef}`, 'utf8')
    .digest();
  const positive = digest.readUInt32BE(0) & 0x7fffffff;
  return positive === 0 ? -1 : -positive;
}

/**
 * Bind operator presence to the authorised principal. Never trusts a client-supplied User id.
 */
export function resolveOperatorPresenceIdentity(
  principal: OperatorPresenceIngestionPrincipal,
  body: Pick<OperatorPresenceHeartbeatRequest, 'operatorRef'>,
): ResolvedOperatorPresenceIdentity {
  if (principal.kind === 'admin') {
    if (!Number.isInteger(principal.adminUserId) || (principal.adminUserId as number) < 1) {
      throw new OperatorPresenceIngestionError(401, 'unauthorized', 'Authenticated admin access is required.');
    }
    return {
      userId: principal.adminUserId as number,
      operatorRef: body.operatorRef,
      binding: 'admin_session',
      synthetic: false,
    };
  }

  const credentialKey = principal.integrationId ?? principal.installationId;
  if (!credentialKey) {
    throw new OperatorPresenceIngestionError(
      401,
      'unauthorized',
      'Presence writes require a tenant-bound integration or installation credential.',
    );
  }

  return {
    userId: syntheticPresenceUserId(principal.tenantId, credentialKey, body.operatorRef),
    operatorRef: body.operatorRef,
    binding: 'adapter_synthetic',
    synthetic: true,
  };
}

/** @deprecated Use resolveOperatorPresenceIdentity — kept name for call-site greps during review. */
export function resolveIngestionHeartbeatUserId(
  principal: OperatorPresenceIngestionPrincipal,
  body: Pick<OperatorPresenceHeartbeatRequest, 'operatorRef'>,
): number {
  return resolveOperatorPresenceIdentity(principal, body).userId;
}

export function parseOperatorPresenceHeartbeatBody(body: unknown): OperatorPresenceHeartbeatRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new OperatorPresenceIngestionError(400, 'invalid_request', 'Request body must be a JSON object.');
  }
  const record = body as Record<string, unknown>;
  // Reject any attempt to override tenant from the body before other validation.
  if ('tenantId' in record) {
    throw new OperatorPresenceIngestionError(400, 'tenant_mismatch', 'Tenant is bound to the credential and cannot be overridden.');
  }
  if ('operatorUserId' in record) {
    throw new OperatorPresenceIngestionError(
      400,
      'invalid_request',
      'operatorUserId is not accepted; operator identity is bound to the authenticated credential and operatorRef.',
    );
  }
  const allowed = new Set(['clientActionId', 'operatorRef', 'correlationId']);
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
  return { clientActionId, operatorRef, correlationId };
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

export type OperatorPresenceOfflineRequest = {
  clientActionId: string;
  operatorRef: string;
  correlationId?: string;
};

export type OperatorPresenceOfflineResponse = {
  success: true;
  version: typeof OPERATOR_PRESENCE_INGESTION_VERSION;
  tenantId: string;
  operatorRef: string;
  cleared: number;
  duplicated: boolean;
};

export type OperatorPresenceIngestionDeps = {
  policyStore: TenantPresencePolicyStore;
  eventStore: TenantPresenceEventStore;
  idempotency: PresenceIdempotencyStore;
  recordHeartbeat: (input: {
    tenantId: string;
    userId: number;
    now?: Date;
  }) => Promise<{ previousLastSeenAt: Date | null; becameActive: boolean } | void>;
  /** WS-2+: clear one operator's heartbeat for the principal's tenant. */
  clearOperatorPresence?: (input: {
    tenantId: string;
    userId: number;
  }) => Promise<number>;
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
      const claimInput = {
        tenantId: principal.tenantId,
        action: 'heartbeat',
        clientActionId: body.clientActionId,
        at,
      };
      let claim: 'claimed' | 'duplicate';
      try {
        claim = await deps.idempotency.claim(claimInput);
      } catch {
        throw new OperatorPresenceIngestionError(503, 'store_unavailable', 'Presence ingestion is temporarily unavailable.');
      }
      const duplicated = claim === 'duplicate';
      if (!duplicated) {
        try {
          const identity = resolveOperatorPresenceIdentity(principal, body);
          const heartbeatResult = await deps.recordHeartbeat({
            tenantId: principal.tenantId,
            userId: identity.userId,
            now: at,
          });
          // Permanent events only on Online transition — not every heartbeat refresh.
          if (heartbeatResult && heartbeatResult.becameActive) {
            try {
              await deps.eventStore.append({
                tenantId: principal.tenantId,
                eventType: 'presence_available',
                actorRef: body.operatorRef,
                actorUserId: identity.synthetic ? null : identity.userId,
                correlationId: body.correlationId ?? body.clientActionId,
                details: {
                  source: principal.kind,
                  binding: identity.binding,
                  integrationId: principal.integrationId ?? null,
                  installationId: principal.installationId ?? null,
                },
                at,
              });
            } catch {
              // Heartbeat already recorded; event failure must not permanently suppress retries.
              // Transition events are deduped; a later successful beat may not re-emit — acceptable.
            }
          }
          void pruneTenantPresenceArtifacts(
            { events: deps.eventStore, idempotency: deps.idempotency },
            at,
          );
        } catch (err) {
          // Claimed key must not permanently suppress a heartbeat that failed before recording.
          try {
            await deps.idempotency.release({
              tenantId: claimInput.tenantId,
              action: claimInput.action,
              clientActionId: claimInput.clientActionId,
            });
          } catch {
            // Release best-effort; outer error still reported.
          }
          if (err instanceof OperatorPresenceIngestionError) throw err;
          throw new OperatorPresenceIngestionError(503, 'store_unavailable', 'Presence ingestion is temporarily unavailable.');
        }
      }
      const policyLookup = await lookupPresencePolicy(deps.policyStore, principal.tenantId);
      const payload: OperatorPresenceHeartbeatResponse = {
        success: true,
        version: OPERATOR_PRESENCE_INGESTION_VERSION,
        tenantId: principal.tenantId,
        operatorRef: body.operatorRef,
        expiresInMs: OPERATOR_PRESENCE_HEARTBEAT_EXPIRES_MS,
        presencePolicy: policyLookup.policy,
        ...(policyLookup.storeReadable ? {} : { presencePolicyDegraded: true }),
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

  /**
   * Explicit offline for authenticated Admin principals (UK WS-2).
   * Integration / installation adapters stay reserved until WS-3 / WS-4 grant presence write.
   */
  const offline: RequestHandler = async (req, res) => {
    try {
      const principal = await deps.resolvePrincipal(req);
      if (!principal) {
        throw new OperatorPresenceIngestionError(401, 'unauthorized', 'Valid presence credentials are required.');
      }
      if (principal.kind !== 'admin') {
        throw new OperatorPresenceIngestionError(
          501,
          'reserved',
          'Explicit offline for integration/installation adapters is reserved for WS-3/WS-4. UK Admin sessions use the Admin offline path or this endpoint with an Admin session.',
        );
      }
      assertPresenceWriteAuthorized(principal);
      if (!deps.clearOperatorPresence) {
        throw new OperatorPresenceIngestionError(
          501,
          'reserved',
          'Operator presence clear is not configured on this host.',
        );
      }
      const body = parseOperatorPresenceHeartbeatBody(req.body) as OperatorPresenceOfflineRequest;
      const at = now();
      const claimInput = {
        tenantId: principal.tenantId,
        action: 'offline',
        clientActionId: body.clientActionId,
        at,
      };
      let claim: 'claimed' | 'duplicate';
      try {
        claim = await deps.idempotency.claim(claimInput);
      } catch {
        throw new OperatorPresenceIngestionError(503, 'store_unavailable', 'Presence ingestion is temporarily unavailable.');
      }
      const duplicated = claim === 'duplicate';
      let cleared = 0;
      if (!duplicated) {
        try {
          const identity = resolveOperatorPresenceIdentity(principal, body);
          if (identity.synthetic || identity.userId !== principal.adminUserId) {
            throw new OperatorPresenceIngestionError(
              403,
              'forbidden_scope',
              'Admin offline may only clear the authenticated operator session.',
            );
          }
          cleared = await deps.clearOperatorPresence({
            tenantId: principal.tenantId,
            userId: identity.userId,
          });
          try {
            await deps.eventStore.append({
              tenantId: principal.tenantId,
              eventType: 'operator_session_ended',
              actorRef: body.operatorRef,
              actorUserId: identity.userId,
              correlationId: body.correlationId ?? body.clientActionId,
              details: { source: 'admin_offline_v1', cleared },
              at,
            });
          } catch {
            // Clear already applied.
          }
          void pruneTenantPresenceArtifacts(
            { events: deps.eventStore, idempotency: deps.idempotency },
            at,
          );
        } catch (err) {
          try {
            await deps.idempotency.release({
              tenantId: claimInput.tenantId,
              action: claimInput.action,
              clientActionId: claimInput.clientActionId,
            });
          } catch {
            // best-effort
          }
          if (err instanceof OperatorPresenceIngestionError) throw err;
          throw new OperatorPresenceIngestionError(503, 'store_unavailable', 'Presence ingestion is temporarily unavailable.');
        }
      }
      const payload: OperatorPresenceOfflineResponse = {
        success: true,
        version: OPERATOR_PRESENCE_INGESTION_VERSION,
        tenantId: principal.tenantId,
        operatorRef: body.operatorRef,
        cleared,
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

  return { heartbeat, offline };
}

/** Contract document for adapters — not served as HTML; used by tests and Docs. */
export const OPERATOR_PRESENCE_INGESTION_CONTRACT = {
  version: OPERATOR_PRESENCE_INGESTION_VERSION,
  paths: {
    heartbeat: {
      path: OPERATOR_PRESENCE_HEARTBEAT_PATH,
      status: 'available' as const,
    },
    offline: {
      path: OPERATOR_PRESENCE_OFFLINE_PATH,
      status: 'admin_only' as const,
      availableFor: ['admin'] as const,
      deferredAdapters: ['WS-3', 'WS-4'] as const,
      ttlFallback: 'Heartbeat TTL expiry (ADMIN_PRESENCE_ACTIVE_WINDOW_MS)',
    },
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
      operatorRef: 'string (1..64) — tenant-local operator id asserted by the adapter',
      correlationId: 'optional string (1..64)',
    },
    rejectedFields: ['tenantId', 'operatorUserId', 'token', 'password', 'secret'],
    expiresInMs: OPERATOR_PRESENCE_HEARTBEAT_EXPIRES_MS,
    idempotencyTtlMs: OPERATOR_PRESENCE_IDEMPOTENCY_TTL_MS,
  },
  notes: [
    'Tenant id is taken only from the credential binding.',
    'Operator identity is bound to the authorised credential + operatorRef; client-supplied central User ids are rejected.',
    'Do not embed presence-write credentials in frontend JavaScript.',
    'Existing WordPress and Silver API contracts are unchanged until adapters grant chat:presence:write.',
    'Heartbeats refresh AdminPresence TTL; permanent audit events are transitions only.',
    'Idempotency keys are released if the heartbeat write fails after claim, so retries remain safe.',
    'WS-2: Admin cookie offline clears the authenticated operator heartbeat for the bound tenant.',
    'WS-3/WS-4: integration/installation offline remains reserved until those adapters ship.',
  ],
} as const;

export type { ChatPresencePolicy };
