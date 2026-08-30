/**
 * Safe GA4 reporting configuration helpers.
 * Separate boundary from GSC OAuth — service account credentials only.
 */

import { AutopilotError } from '../autopilot/apiErrors.ts';

export const GA4_READONLY_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
export const GA4_DEFAULT_LOOKBACK_DAYS = 28;
export const GA4_DEFAULT_DATA_DELAY_DAYS = 1;

export type Ga4PublicConfigStatus = {
  configured: boolean;
  propertyConfigured: boolean;
  missing: string[];
  propertyId: string | null;
  latestSafeDate: string | null;
  defaultLookback: number;
  dataDelayDays: number;
  lastSuccessfulSync: string | null;
  currentErrorCode: string | null;
  currentErrorMessage: string | null;
  syncLocked: boolean;
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

export function getGa4PublicConfigStatus(
  env: NodeJS.ProcessEnv = process.env,
  runtime?: {
    latestSafeDate?: string | null;
    lastSuccessfulSync?: string | null;
    currentErrorCode?: string | null;
    currentErrorMessage?: string | null;
    syncLocked?: boolean;
  },
): Ga4PublicConfigStatus {
  const missing = getGa4ConfigMissing(env);
  const propertyId = readTrimmed(env, 'GA4_PROPERTY_ID') || null;
  return {
    configured: missing.length === 0,
    propertyConfigured: Boolean(propertyId),
    missing,
    propertyId,
    latestSafeDate: runtime?.latestSafeDate ?? null,
    defaultLookback: parsePositiveInt(readTrimmed(env, 'GA4_DEFAULT_LOOKBACK_DAYS'), GA4_DEFAULT_LOOKBACK_DAYS),
    dataDelayDays: parsePositiveInt(readTrimmed(env, 'GA4_DATA_DELAY_DAYS'), GA4_DEFAULT_DATA_DELAY_DAYS),
    lastSuccessfulSync: runtime?.lastSuccessfulSync ?? null,
    currentErrorCode: runtime?.currentErrorCode ?? null,
    currentErrorMessage: runtime?.currentErrorMessage ?? null,
    syncLocked: runtime?.syncLocked ?? false,
  };
}
