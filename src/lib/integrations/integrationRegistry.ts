/**
 * Server-to-server integration credentials.
 *
 * Each registered integration maps a server-side secret (environment only) to a fixed
 * integration id, a fixed tenant and a fixed set of scopes. The tenant is never
 * taken from the request. Missing or too-short secrets disable the integration
 * (fail closed). A second "_PREVIOUS" secret may be set temporarily during rotation.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import type { PlatformTenantId } from '../platform/sourceContext.ts';

/**
 * Read: chat:dashboard, chat:read, chat:diagnostics.
 * Delegated write: chat:reply, chat:resolve, chat:reopen (text replies and close / reopen only).
 */
export type IntegrationScope =
  | 'chat:dashboard'
  | 'chat:read'
  | 'chat:diagnostics'
  | 'chat:reply'
  | 'chat:resolve'
  | 'chat:reopen';

export type IntegrationDefinition = {
  integrationId: string;
  tenantId: PlatformTenantId;
  scopes: readonly IntegrationScope[];
  tokenEnv: string;
  previousTokenEnv: string;
};

export type IntegrationPrincipal = {
  integrationId: string;
  tenantId: PlatformTenantId;
  scopes: readonly IntegrationScope[];
};

export const INTEGRATION_TOKEN_MIN_LENGTH = 32;
export const INTEGRATION_TOKEN_MAX_LENGTH = 512;

export const INTEGRATION_REGISTRY: readonly IntegrationDefinition[] = [
  {
    integrationId: 'primewayz-wordpress',
    tenantId: 'pw-infotech',
    scopes: ['chat:dashboard', 'chat:read', 'chat:diagnostics', 'chat:reply', 'chat:resolve', 'chat:reopen'],
    tokenEnv: 'WORDPRESS_CHAT_INTEGRATION_TOKEN',
    previousTokenEnv: 'WORDPRESS_CHAT_INTEGRATION_TOKEN_PREVIOUS',
  },
] as const;

const BEARER_PATTERN = /^Bearer[ \t]+([A-Za-z0-9._~+/=-]+)[ \t]*$/i;

/** Extracts a well-formed bearer token from the Authorization header, or null. */
export function parseBearerToken(header: string | undefined | null): string | null {
  if (typeof header !== 'string' || header.length > INTEGRATION_TOKEN_MAX_LENGTH + 16) return null;
  const match = BEARER_PATTERN.exec(header);
  const token = match?.[1];
  if (!token || token.length < INTEGRATION_TOKEN_MIN_LENGTH || token.length > INTEGRATION_TOKEN_MAX_LENGTH) return null;
  return token;
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

function configuredSecrets(definition: IntegrationDefinition, env: NodeJS.ProcessEnv): string[] {
  return [env[definition.tokenEnv], env[definition.previousTokenEnv]]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length >= INTEGRATION_TOKEN_MIN_LENGTH && value.length <= INTEGRATION_TOKEN_MAX_LENGTH);
}

/** Constant-time match of a presented token against every configured integration secret. */
export function resolveIntegrationPrincipal(
  token: string | null,
  env: NodeJS.ProcessEnv = process.env,
  registry: readonly IntegrationDefinition[] = INTEGRATION_REGISTRY,
): IntegrationPrincipal | null {
  if (!token) return null;
  const presented = digest(token);
  let matched: IntegrationDefinition | null = null;
  for (const definition of registry) {
    for (const secret of configuredSecrets(definition, env)) {
      if (timingSafeEqual(presented, digest(secret)) && !matched) matched = definition;
    }
  }
  if (!matched) return null;
  return { integrationId: matched.integrationId, tenantId: matched.tenantId, scopes: matched.scopes };
}

export function integrationHasScope(principal: IntegrationPrincipal, scope: IntegrationScope): boolean {
  return principal.scopes.includes(scope);
}

export function isIntegrationConfigured(
  integrationId: string,
  env: NodeJS.ProcessEnv = process.env,
  registry: readonly IntegrationDefinition[] = INTEGRATION_REGISTRY,
): boolean {
  const definition = registry.find((entry) => entry.integrationId === integrationId);
  return Boolean(definition && configuredSecrets(definition, env).length > 0);
}
