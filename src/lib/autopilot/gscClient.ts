/**
 * Google Search Console OAuth + API client wrappers.
 * Live Google calls are injectable for tests.
 */

import { google } from 'googleapis';
import { AutopilotError, AUTOPILOT_ERROR_CODES } from './apiErrors.ts';
import {
  assertGscConfigured,
  GSC_WEBMASTERS_READONLY_SCOPE,
  type GscEnvConfig,
} from './gscConfig.ts';
import { decryptGscRefreshToken, encryptGscRefreshToken } from './gscCrypto.ts';

export type GscSiteEntry = {
  siteUrl: string;
  permissionLevel: string | null;
};

export type GscSearchAnalyticsRow = {
  keys?: string[] | null;
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  position?: number | null;
};

export type GscSearchAnalyticsQueryInput = {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions: string[];
  type?: string;
  dataState?: string;
  aggregationType?: string;
  rowLimit: number;
  startRow: number;
};

export type GscTokenExchangeResult = {
  refreshToken: string | null;
  accessToken: string | null;
  scope: string | null;
  expiryDate: number | null;
};

export type GscGoogleApi = {
  generateAuthUrl: (state: string) => string;
  exchangeCode: (code: string) => Promise<GscTokenExchangeResult>;
  listSites: (refreshToken: string) => Promise<GscSiteEntry[]>;
  querySearchAnalytics: (
    refreshToken: string,
    input: GscSearchAnalyticsQueryInput,
  ) => Promise<GscSearchAnalyticsRow[]>;
};

type GscOAuth2Client = InstanceType<typeof google.auth.OAuth2>;

const SENSITIVE_FRAGMENT =
  /(?:refresh[_-]?token|access[_-]?token|client[_-]?secret|authorization[_-]?code|bearer\s+[a-z0-9._-]+)/gi;

export function sanitizeGscErrorMessage(raw: unknown): string {
  if (raw == null) return 'Google Search Console request failed.';
  let text =
    typeof raw === 'string'
      ? raw
      : raw instanceof Error
        ? raw.message
        : typeof raw === 'object' &&
            raw !== null &&
            'message' in raw &&
            typeof (raw as { message: unknown }).message === 'string'
          ? (raw as { message: string }).message
          : 'Google Search Console request failed.';

  text = text.replace(SENSITIVE_FRAGMENT, '[REDACTED]');
  if (text.length > 400) {
    text = `${text.slice(0, 400)}…`;
  }
  return text || 'Google Search Console request failed.';
}

export function classifyGscGoogleError(error: unknown): {
  code: string;
  message: string;
  needsReauth: boolean;
} {
  const message = sanitizeGscErrorMessage(error);
  const blob =
    typeof error === 'object' && error !== null
      ? JSON.stringify(error).toLowerCase()
      : String(error).toLowerCase();

  const needsReauth =
    blob.includes('invalid_grant') ||
    blob.includes('invalid credentials') ||
    blob.includes('token has been expired or revoked') ||
    blob.includes('unauthorized');

  return {
    code: needsReauth
      ? AUTOPILOT_ERROR_CODES.GSC_REAUTHORISATION_REQUIRED
      : 'GSC_GOOGLE_API_ERROR',
    message,
    needsReauth,
  };
}

export function createGscOAuth2Client(config: GscEnvConfig = assertGscConfigured()): GscOAuth2Client {
  return new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
}

export function createDefaultGscGoogleApi(
  config: GscEnvConfig = assertGscConfigured(),
): GscGoogleApi {
  const oauth2 = createGscOAuth2Client(config);

  return {
    generateAuthUrl(state: string) {
      return oauth2.generateAuthUrl({
        access_type: 'offline',
        include_granted_scopes: true,
        prompt: 'consent',
        scope: [GSC_WEBMASTERS_READONLY_SCOPE],
        state,
      });
    },

    async exchangeCode(code: string) {
      try {
        const { tokens } = await oauth2.getToken(code);
        return {
          refreshToken: tokens.refresh_token ?? null,
          accessToken: tokens.access_token ?? null,
          scope: tokens.scope ?? null,
          expiryDate: tokens.expiry_date ?? null,
        };
      } catch (error) {
        const classified = classifyGscGoogleError(error);
        throw new AutopilotError(classified.code, classified.message, 400, {
          needsReauth: classified.needsReauth,
        });
      }
    },

    async listSites(refreshToken: string) {
      const client = createGscOAuth2Client(config);
      client.setCredentials({ refresh_token: refreshToken });
      const webmasters = google.webmasters({
        version: 'v3',
        auth: client as never,
      });
      try {
        const response = await webmasters.sites.list();
        const entries = response.data.siteEntry ?? [];
        return entries
          .map((entry) => ({
            siteUrl: entry.siteUrl ?? '',
            permissionLevel: entry.permissionLevel ?? null,
          }))
          .filter((entry) => Boolean(entry.siteUrl));
      } catch (error) {
        const classified = classifyGscGoogleError(error);
        throw new AutopilotError(
          classified.code,
          classified.message,
          classified.needsReauth ? 401 : 502,
          { needsReauth: classified.needsReauth },
        );
      }
    },

    async querySearchAnalytics(refreshToken, input) {
      const client = createGscOAuth2Client(config);
      client.setCredentials({ refresh_token: refreshToken });
      const searchconsole = google.searchconsole({
        version: 'v1',
        auth: client as never,
      });
      try {
        const response = await searchconsole.searchanalytics.query({
          siteUrl: input.siteUrl,
          requestBody: {
            startDate: input.startDate,
            endDate: input.endDate,
            dimensions: input.dimensions,
            type: input.type ?? 'web',
            dataState: input.dataState ?? 'final',
            aggregationType: input.aggregationType ?? 'auto',
            rowLimit: input.rowLimit,
            startRow: input.startRow,
          },
        });
        return (response.data.rows ?? []) as GscSearchAnalyticsRow[];
      } catch (error) {
        const classified = classifyGscGoogleError(error);
        throw new AutopilotError(
          classified.code,
          classified.message,
          classified.needsReauth ? 401 : 502,
          { needsReauth: classified.needsReauth },
        );
      }
    },
  };
}

export function encryptRefreshTokenForStorage(refreshToken: string) {
  return encryptGscRefreshToken(refreshToken);
}

export function decryptStoredRefreshToken(payload: {
  refreshTokenCiphertext: string;
  refreshTokenIv: string;
  refreshTokenAuthTag: string;
  tokenKeyVersion?: number;
}): string {
  return decryptGscRefreshToken({
    ciphertext: payload.refreshTokenCiphertext,
    iv: payload.refreshTokenIv,
    authTag: payload.refreshTokenAuthTag,
    keyVersion: payload.tokenKeyVersion,
  });
}

/**
 * Prefer a newly issued refresh token; otherwise keep an existing stored one.
 */
export function resolveRefreshTokenForPersistence(input: {
  exchangedRefreshToken: string | null | undefined;
  existingEncrypted?: {
    refreshTokenCiphertext: string;
    refreshTokenIv: string;
    refreshTokenAuthTag: string;
    tokenKeyVersion?: number;
  } | null;
}): string {
  if (input.exchangedRefreshToken && input.exchangedRefreshToken.trim()) {
    return input.exchangedRefreshToken.trim();
  }

  if (input.existingEncrypted?.refreshTokenCiphertext) {
    try {
      const existing = decryptStoredRefreshToken(input.existingEncrypted);
      if (existing) return existing;
    } catch {
      // fall through to reauth required
    }
  }

  throw new AutopilotError(
    AUTOPILOT_ERROR_CODES.GSC_REAUTHORISATION_REQUIRED,
    'Google did not return a refresh token. Disconnect and reconnect with consent, or ensure offline access is granted.',
    400,
  );
}
