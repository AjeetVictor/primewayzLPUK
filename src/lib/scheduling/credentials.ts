/**
 * Credential abstraction for Scheduling connections.
 *
 * Current Primewayz Calendly credentials remain environment-backed
 * (`CALENDLY_WEBHOOK_SIGNING_KEY` via each connection's webhookSigningSecretEnv).
 * Future Digiblend / SRH / other customers can point each connection at its own
 * env key (or later encrypted OAuth store) without rewriting the webhook processor.
 *
 * Do not persist raw OAuth access/refresh tokens until an encrypted store is wired.
 * The project already has AES-256-GCM for GSC (`gscCrypto`) — reuse that pattern later.
 * Never put secrets into public DTOs or logs.
 */

export type SchedulingCredentialKind = 'webhook_signing_secret' | 'oauth_access_token' | 'oauth_refresh_token';

export type SchedulingCredentialRef = {
  connectionKey: string;
  kind: SchedulingCredentialKind;
  /** Env var holding the secret for environment-backed connections. */
  envKey: string | null;
};

export interface SchedulingCredentialStore {
  /**
   * Resolve a secret for server-side use only.
   * Returns null when unset — callers must fail closed for verification.
   */
  resolveSecret(ref: SchedulingCredentialRef, env?: NodeJS.ProcessEnv): string | null;
}

export class EnvironmentSchedulingCredentialStore implements SchedulingCredentialStore {
  resolveSecret(ref: SchedulingCredentialRef, env: NodeJS.ProcessEnv = process.env): string | null {
    if (!ref.envKey) return null;
    const value = env[ref.envKey]?.trim();
    return value || null;
  }
}

export const defaultSchedulingCredentialStore = new EnvironmentSchedulingCredentialStore();

/**
 * Future OAuth tokens must use encrypted columns (ciphertext + iv + authTag + keyVersion)
 * mirroring GscConnection — never plaintext DB columns.
 */
export const SCHEDULING_ENCRYPTED_OAUTH_REQUIREMENT =
  'Future Scheduling OAuth credentials require AES-256-GCM encrypted storage (same pattern as Autopilot GSC). Do not store raw tokens.';
