/** Target connector heartbeat interval. */
export const CHAT_CONNECT_HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

/** Last verified heartbeat at or newer than this age is Connected. */
export const CHAT_CONNECT_CONNECTED_MAX_AGE_MS = 10 * 60 * 1000;

/** Older than the connected window, up to this age, is Stale. Beyond it is Disconnected. */
export const CHAT_CONNECT_STALE_MAX_AGE_MS = 60 * 60 * 1000;

export const CHAT_CONNECT_API_VERSION = '1';

export const CHAT_CONNECT_ACTIVATE_PATH = '/api/integrations/chat-connect/activate';
export const CHAT_CONNECT_HEARTBEAT_PATH = '/api/integrations/chat-connect/heartbeat';
export const CHAT_CONNECT_ADMIN_COLLECTION_PATH = '/api/admin/chat-connect/installations';

/** Established WordPress binding. Not a second tenant. */
export const LEGACY_PW_INFOTECH_INSTALLATION_ID = 'cci_pw_infotech_wordpress';
export const LEGACY_PW_INFOTECH_INTEGRATION_ID = 'primewayz-wordpress';
export const LEGACY_PW_INFOTECH_TENANT_ID = 'pw-infotech';

/**
 * Primewayz UK visitor chat is the in-app React LiveChat component.
 * It is first-party: same application, Origin-resolved public chat APIs.
 * It is not an INTEGRATION_REGISTRY server-to-server credential.
 * `react` is the implementation technology already in src/components/LiveChat.tsx.
 */
export const FIRST_PARTY_PW_UK_INSTALLATION_ID = 'cci_pw_uk_first_party';
export const FIRST_PARTY_PW_UK_TENANT_ID = 'pw-uk';
export const FIRST_PARTY_PW_UK_INTEGRATION_TECHNOLOGY = 'react';

/**
 * Heartbeat retries of the same clientActionId stay replays inside this window.
 * Older heartbeat keys are eligible for deletion. Activation keys are not pruned:
 * a late activation retry must still replay instead of returning a conflict.
 */
export const CHAT_CONNECT_HEARTBEAT_IDEMPOTENCY_RETENTION_MS = 24 * 60 * 60 * 1000;

/** Per-process cap so cleanup is not a delete on every heartbeat. No shared store. */
export const CHAT_CONNECT_HEARTBEAT_IDEMPOTENCY_PRUNE_INTERVAL_MS = 10 * 60 * 1000;

/** Bounds one cleanup statement. Steady-state size is installations × retention / interval. */
export const CHAT_CONNECT_HEARTBEAT_IDEMPOTENCY_PRUNE_BATCH = 5000;

export const CHAT_CONNECT_AUTHORIZATION_STATUSES = ['registered', 'active', 'suspended', 'revoked'] as const;
export const CHAT_CONNECT_FRONTEND_VISIBILITY = ['unset', 'visible', 'hidden'] as const;
export const CHAT_CONNECT_CONNECTION_HEALTH = ['unknown', 'connected', 'stale', 'disconnected'] as const;

/**
 * Connector technologies that share one registration, credential, activation,
 * and heartbeat contract. Routes do not branch by technology.
 * First-party `react` is the UK LiveChat surface and is intentionally absent.
 */
export const CHAT_CONNECT_CONNECTOR_TECHNOLOGIES = ['wordpress', 'shopify', 'custom'] as const;

/** Technologies a Host/Owner may register. Same list as the connector contract. */
export const CHAT_CONNECT_REGISTRATION_TECHNOLOGIES = CHAT_CONNECT_CONNECTOR_TECHNOLOGIES;

export const CHAT_CONNECT_RATE_LIMITS = {
  invalidCredential: { limit: 30, windowMs: 60 * 1000 },
  activate: { limit: 10, windowMs: 60 * 1000 },
  heartbeat: { limit: 8, windowMs: 10 * 60 * 1000 },
  adminMutation: { limit: 30, windowMs: 60 * 1000 },
} as const;

/** Body fields that must never select or override the credential's installation tenant. */
export const CHAT_CONNECT_TENANT_AUTHORITY_FIELDS = [
  'tenantId',
  'tenant',
  'tenantKey',
  'market',
  'sourceSite',
  'sourceOrigin',
  'sourceChannel',
  'installationId',
  'integrationId',
] as const;
