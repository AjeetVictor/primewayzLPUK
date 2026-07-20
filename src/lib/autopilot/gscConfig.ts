/**
 * Safe Google Search Console configuration helpers.
 * Never expose client secrets, encryption keys, or state secrets.
 */

import { AutopilotError } from './apiErrors.ts';
import { GSC_TOKEN_KEY_BYTES } from './gscCrypto.ts';
import { GSC_OAUTH_STATE_SECRET_MIN_LENGTH } from './gscOAuthState.ts';

export const GSC_WEBMASTERS_READONLY_SCOPE =
  'https://www.googleapis.com/auth/webmasters.readonly';

export const GSC_DEFAULT_LOOKBACK_DAYS = 28;
export const GSC_DEFAULT_DATA_DELAY_DAYS = 3;

export type GscEnvConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tokenEncryptionKeyBase64: string;
  oauthStateSecret: string;
  lookbackDays: number;
  dataDelayDays: number;
};

export type GscPublicConfigStatus = {
  configured: boolean;
  missing: string[];
  redirectUriConfigured: boolean;
  lookbackDays: number;
  dataDelayDays: number;
  scope: string;
};

function readTrimmed(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
}

function parsePositiveInt(raw: string, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 1) return fallback;
  return n;
}

export function getGscConfigMissing(env: NodeJS.ProcessEnv = process.env): string[] {
  const missing: string[] = [];
  if (!readTrimmed(env, 'GOOGLE_SEARCH_CONSOLE_CLIENT_ID')) {
    missing.push('GOOGLE_SEARCH_CONSOLE_CLIENT_ID');
  }
  if (!readTrimmed(env, 'GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET')) {
    missing.push('GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET');
  }
  if (!readTrimmed(env, 'GOOGLE_SEARCH_CONSOLE_REDIRECT_URI')) {
    missing.push('GOOGLE_SEARCH_CONSOLE_REDIRECT_URI');
  }

  const encKey = readTrimmed(env, 'AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY');
  if (!encKey) {
    missing.push('AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY');
  } else {
    try {
      const decoded = Buffer.from(encKey, 'base64');
      if (decoded.length !== GSC_TOKEN_KEY_BYTES) {
        missing.push('AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY');
      }
    } catch {
      missing.push('AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY');
    }
  }

  const stateSecret = readTrimmed(env, 'AUTOPILOT_GSC_OAUTH_STATE_SECRET');
  if (stateSecret.length < GSC_OAUTH_STATE_SECRET_MIN_LENGTH) {
    missing.push('AUTOPILOT_GSC_OAUTH_STATE_SECRET');
  }

  return missing;
}

export function getGscPublicConfigStatus(
  env: NodeJS.ProcessEnv = process.env,
): GscPublicConfigStatus {
  const missing = getGscConfigMissing(env);
  const lookbackDays = parsePositiveInt(
    readTrimmed(env, 'AUTOPILOT_GSC_DEFAULT_LOOKBACK_DAYS'),
    GSC_DEFAULT_LOOKBACK_DAYS,
  );
  const dataDelayDays = parsePositiveInt(
    readTrimmed(env, 'AUTOPILOT_GSC_DATA_DELAY_DAYS'),
    GSC_DEFAULT_DATA_DELAY_DAYS,
  );

  return {
    configured: missing.length === 0,
    missing,
    redirectUriConfigured: Boolean(readTrimmed(env, 'GOOGLE_SEARCH_CONSOLE_REDIRECT_URI')),
    lookbackDays,
    dataDelayDays,
    scope: GSC_WEBMASTERS_READONLY_SCOPE,
  };
}

export function assertGscConfigured(env: NodeJS.ProcessEnv = process.env): GscEnvConfig {
  const missing = getGscConfigMissing(env);
  if (missing.length > 0) {
    throw new AutopilotError(
      'GSC_CONFIGURATION_REQUIRED',
      'Google Search Console is not fully configured.',
      503,
      { missing },
    );
  }

  return {
    clientId: readTrimmed(env, 'GOOGLE_SEARCH_CONSOLE_CLIENT_ID'),
    clientSecret: readTrimmed(env, 'GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET'),
    redirectUri: readTrimmed(env, 'GOOGLE_SEARCH_CONSOLE_REDIRECT_URI'),
    tokenEncryptionKeyBase64: readTrimmed(env, 'AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY'),
    oauthStateSecret: readTrimmed(env, 'AUTOPILOT_GSC_OAUTH_STATE_SECRET'),
    lookbackDays: parsePositiveInt(
      readTrimmed(env, 'AUTOPILOT_GSC_DEFAULT_LOOKBACK_DAYS'),
      GSC_DEFAULT_LOOKBACK_DAYS,
    ),
    dataDelayDays: parsePositiveInt(
      readTrimmed(env, 'AUTOPILOT_GSC_DATA_DELAY_DAYS'),
      GSC_DEFAULT_DATA_DELAY_DAYS,
    ),
  };
}

export function configurationRequiredError(missing?: string[]): AutopilotError {
  return new AutopilotError(
    'GSC_CONFIGURATION_REQUIRED',
    'Google Search Console is not fully configured.',
    503,
    { missing: missing ?? getGscConfigMissing() },
  );
}
