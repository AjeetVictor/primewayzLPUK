/**
 * Safe GA4 reporting configuration helpers.
 * Separate boundary from GSC OAuth — service account credentials only.
 */

import { AutopilotError } from '../autopilot/apiErrors.ts';
import { computeDefaultGscDateWindow } from '../autopilot/gscDateUtils.ts';

export const GA4_SYNC_MAX_RANGE_DAYS = 400;

export const GA4_READONLY_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
export const GA4_DEFAULT_LOOKBACK_DAYS = 28;
export const GA4_DEFAULT_DATA_DELAY_DAYS = 1;
export const GA4_AUTHENTICATION_TYPE = 'service_account' as const;

export type Ga4PublicConfigStatus = {
  configured: boolean;
  missing: string[];
  propertyIdConfigured: boolean;
  authenticationConfigured: boolean;
  authenticationType: typeof GA4_AUTHENTICATION_TYPE | null;
  propertyId: string | null;
  lookbackDays: number;
  dataDelayDays: number;
  defaultDateFrom: string | null;
  defaultDateTo: string | null;
  latestSafeDate: string | null;
  maxRangeDays: number;
  lastSuccessfulSync: string | null;
  currentErrorCode: string | null;
  currentErrorMessage: string | null;
  syncLocked: boolean;
  /** @deprecated use lookbackDays */
  defaultLookback: number;
  /** @deprecated use propertyIdConfigured */
  propertyConfigured: boolean;
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

export function getGa4ConfigMissing(env: NodeJS.ProcessEnv = process.env): string[] {
  const missing: string[] = [];
  if (!readTrimmed(env, 'GA4_PROPERTY_ID')) missing.push('GA4_PROPERTY_ID');
  if (!readTrimmed(env, 'GA4_SERVICE_ACCOUNT_CLIENT_EMAIL')) {
    missing.push('GA4_SERVICE_ACCOUNT_CLIENT_EMAIL');
  }
  const privateKey = readTrimmed(env, 'GA4_SERVICE_ACCOUNT_PRIVATE_KEY');
  if (!privateKey) missing.push('GA4_SERVICE_ACCOUNT_PRIVATE_KEY');
  return missing;
}

export function assertGa4Configured(env: NodeJS.ProcessEnv = process.env): {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
  lookbackDays: number;
  dataDelayDays: number;
} {
  const missing = getGa4ConfigMissing(env);
  if (missing.length > 0) {
    throw new AutopilotError(
      'GA4_CONFIGURATION_REQUIRED',
      'Google Analytics 4 reporting is not fully configured.',
      503,
      { missing },
    );
  }
  return {
    propertyId: readTrimmed(env, 'GA4_PROPERTY_ID'),
    clientEmail: readTrimmed(env, 'GA4_SERVICE_ACCOUNT_CLIENT_EMAIL'),
    privateKey: readTrimmed(env, 'GA4_SERVICE_ACCOUNT_PRIVATE_KEY').replace(/\\n/g, '\n'),
    lookbackDays: parsePositiveInt(readTrimmed(env, 'GA4_DEFAULT_LOOKBACK_DAYS'), GA4_DEFAULT_LOOKBACK_DAYS),
    dataDelayDays: parsePositiveInt(readTrimmed(env, 'GA4_DATA_DELAY_DAYS'), GA4_DEFAULT_DATA_DELAY_DAYS),
  };
}

export function maskGa4PropertyId(propertyId: string | null): string | null {
  if (!propertyId) return null;
  if (propertyId.length <= 4) return '****';
  return `${'*'.repeat(Math.max(propertyId.length - 4, 4))}${propertyId.slice(-4)}`;
}

export function getGa4PublicConfigStatus(
  env: NodeJS.ProcessEnv = process.env,
  runtime?: {
    latestSafeDate?: string | null;
    lastSuccessfulSync?: string | null;
    currentErrorCode?: string | null;
    currentErrorMessage?: string | null;
    syncLocked?: boolean;
    now?: Date;
  },
): Ga4PublicConfigStatus {
  const missing = getGa4ConfigMissing(env);
  const propertyId = readTrimmed(env, 'GA4_PROPERTY_ID') || null;
  const authConfigured =
    !missing.includes('GA4_SERVICE_ACCOUNT_CLIENT_EMAIL') &&
    !missing.includes('GA4_SERVICE_ACCOUNT_PRIVATE_KEY');
  const lookbackDays = parsePositiveInt(readTrimmed(env, 'GA4_DEFAULT_LOOKBACK_DAYS'), GA4_DEFAULT_LOOKBACK_DAYS);
  const dataDelayDays = parsePositiveInt(readTrimmed(env, 'GA4_DATA_DELAY_DAYS'), GA4_DEFAULT_DATA_DELAY_DAYS);
  const window = computeDefaultGscDateWindow(runtime?.now ?? new Date(), {
    lookbackDays,
    dataDelayDays,
  });

  return {
    configured: missing.length === 0,
    missing,
    propertyIdConfigured: Boolean(propertyId),
    authenticationConfigured: authConfigured,
    authenticationType: authConfigured ? GA4_AUTHENTICATION_TYPE : null,
    propertyId: propertyId ? maskGa4PropertyId(propertyId) : null,
    lookbackDays,
    dataDelayDays,
    defaultDateFrom: window.dateFrom,
    defaultDateTo: window.dateTo,
    latestSafeDate: runtime?.latestSafeDate ?? window.dateTo,
    maxRangeDays: GA4_SYNC_MAX_RANGE_DAYS,
    lastSuccessfulSync: runtime?.lastSuccessfulSync ?? null,
    currentErrorCode: runtime?.currentErrorCode ?? null,
    currentErrorMessage: runtime?.currentErrorMessage ?? null,
    syncLocked: runtime?.syncLocked ?? false,
    defaultLookback: lookbackDays,
    propertyConfigured: Boolean(propertyId),
  };
}
