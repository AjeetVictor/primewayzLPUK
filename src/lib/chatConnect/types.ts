import type {
  CHAT_CONNECT_AUTHORIZATION_STATUSES,
  CHAT_CONNECT_CONNECTION_HEALTH,
  CHAT_CONNECT_FRONTEND_VISIBILITY,
} from './constants.ts';

export type ChatConnectAuthorizationStatus = (typeof CHAT_CONNECT_AUTHORIZATION_STATUSES)[number];
export type ChatConnectFrontendVisibility = (typeof CHAT_CONNECT_FRONTEND_VISIBILITY)[number];
export type ChatConnectConnectionHealth = (typeof CHAT_CONNECT_CONNECTION_HEALTH)[number];

export type ChatConnectInstallation = {
  id: string;
  tenantId: string;
  integrationTechnology: string;
  integrationId: string | null;
  authorizationStatus: ChatConnectAuthorizationStatus;
  frontendVisibility: ChatConnectFrontendVisibility;
  addonVersion: string | null;
  widgetVersion: string | null;
  legacyEnvBinding: boolean;
  heartbeatProtocolAdopted: boolean;
  credentialKeyId: string | null;
  credentialHash: string | null;
  credentialIssuedAt: Date | null;
  credentialRotatedAt: Date | null;
  registeredAt: Date | null;
  provisionedAt: Date | null;
  authorizedAt: Date | null;
  activatedAt: Date | null;
  lastVerifiedHeartbeatAt: Date | null;
  lastAuthenticatedActivityAt: Date | null;
  suspendedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatConnectInstallationPatch = Partial<Omit<ChatConnectInstallation, 'id' | 'createdAt'>>;

export type ChatConnectAuditEntry = {
  installationId: string;
  tenantId: string;
  actorUserId: number | null;
  action: string;
  details: Record<string, unknown>;
  createdAt: Date;
};

export type ChatConnectStore = {
  list(filter?: { tenantIds?: readonly string[] }): Promise<ChatConnectInstallation[]>;
  findById(id: string): Promise<ChatConnectInstallation | null>;
  findByCredentialKeyId(keyId: string): Promise<ChatConnectInstallation | null>;
  findLegacyBinding(integrationId: string, tenantId: string): Promise<ChatConnectInstallation | null>;
  insert(record: ChatConnectInstallation): Promise<ChatConnectInstallation>;
  update(id: string, patch: ChatConnectInstallationPatch): Promise<ChatConnectInstallation>;
  appendAudit(entry: ChatConnectAuditEntry): Promise<void>;
  /** True when this client action is new. False when it is a replay. */
  claimIdempotency(input: { installationId: string; action: string; clientActionId: string; at: Date }): Promise<boolean>;
  hasIdempotency(input: { installationId: string; action: string; clientActionId: string }): Promise<boolean>;
  /** Deletes expired keys for one action, oldest first, up to limit. Returns the number removed. */
  pruneIdempotency(input: { action: string; olderThan: Date; limit: number }): Promise<number>;
  listAudit(installationId: string): Promise<ChatConnectAuditEntry[]>;
};

export type ChatConnectAdminPrincipal = {
  id: number;
  role: string;
  isPlatformOwner: boolean;
  tenantIds: readonly string[];
};

export class ChatConnectError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds?: number;

  constructor(status: number, code: string, message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ChatConnectError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
