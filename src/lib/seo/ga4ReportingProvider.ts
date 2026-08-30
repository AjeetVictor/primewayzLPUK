/**
 * Injectable GA4 Reporting API provider (aggregate page metrics only).
 *
 * Aggregation grain: daily landing page + session default channel group + source + medium.
 */

import { google } from 'googleapis';
import { AutopilotError } from '../autopilot/apiErrors.ts';
import { assertGa4Configured, GA4_READONLY_SCOPE } from './ga4Config.ts';

export type Ga4ReportRequest = {
  propertyId: string;
  dateFrom: string;
  dateTo: string;
};

export type Ga4ReportRow = {
  landingPage: string;
  source: string;
  medium: string;
  defaultChannelGroup: string;
  sessions: number;
  organicSessions: number;
  engagedSessions: number;
  engagementRate: number | null;
  averageEngagementTime: number | null;
  keyEvents: number;
  generateLeadEvents: number;
  contactFormConversions: number;
  bookingConversions: number;
};

export type Ga4ProviderValidation = {
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
};

export type Ga4ReportingProvider = {
  validateConfiguration: () => Ga4ProviderValidation;
  validatePropertyAccess: (propertyId: string) => Promise<Ga4ProviderValidation>;
  testConnection: (propertyId: string) => Promise<Ga4ProviderValidation>;
  runLandingPageReport: (query: Ga4ReportRequest) => Promise<Ga4ReportRow[]>;
};

/** @deprecated use Ga4ReportRow */
export type Ga4ReportingRow = Ga4ReportRow;
/** @deprecated use Ga4ReportRequest */
export type Ga4ReportingQuery = Ga4ReportRequest;

function toNumber(value: string | null | undefined): number {
  const n = Number.parseFloat(value ?? '0');
  return Number.isFinite(n) ? n : 0;
}

function toNullableRate(value: string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function mapReportRow(row: {
  dimensionValues?: Array<{ value?: string | null } | null> | null;
  metricValues?: Array<{ value?: string | null } | null> | null;
}): Ga4ReportRow | null {
  const dims = row.dimensionValues ?? [];
  const metrics = row.metricValues ?? [];
  const landingPage = dims[0]?.value ?? '';
  if (!landingPage) return null;
  const source = dims[1]?.value ?? '(not set)';
  const medium = dims[2]?.value ?? '(not set)';
  const defaultChannelGroup = dims[3]?.value ?? '(not set)';
  const sessions = toNumber(metrics[0]?.value);
  const engagedSessions = toNumber(metrics[1]?.value);
  const engagementRate = toNullableRate(metrics[2]?.value);
  const averageEngagementTime = toNullableRate(metrics[3]?.value);
  const keyEvents = toNumber(metrics[4]?.value);
  const generateLeadEvents = toNumber(metrics[5]?.value);
  const contactFormConversions = toNumber(metrics[6]?.value);
  const bookingConversions = toNumber(metrics[7]?.value);
  const organicSessions =
    defaultChannelGroup.toLowerCase() === 'organic search' ? sessions : 0;

  return {
    landingPage,
    source,
    medium,
    defaultChannelGroup,
    sessions,
    organicSessions,
    engagedSessions,
    engagementRate,
    averageEngagementTime,
    keyEvents,
    generateLeadEvents,
    contactFormConversions,
    bookingConversions,
  };
}

export function classifyGa4ProviderError(error: unknown): Ga4ProviderValidation {
  const message = sanitizeGa4ErrorMessage(error);
  const lower = message.toLowerCase();
  if (lower.includes('permission') || lower.includes('denied') || lower.includes('403')) {
    return { ok: false, errorCode: 'GA4_ACCESS_DENIED', errorMessage: message };
  }
  if (lower.includes('not found') || lower.includes('invalid property') || lower.includes('404')) {
    return { ok: false, errorCode: 'GA4_INVALID_PROPERTY', errorMessage: message };
  }
  if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('429')) {
    return { ok: false, errorCode: 'GA4_QUOTA_EXCEEDED', errorMessage: message };
  }
  return { ok: false, errorCode: 'GA4_PROVIDER_ERROR', errorMessage: message };
}

export function createDefaultGa4ReportingProvider(
  env: NodeJS.ProcessEnv = process.env,
): Ga4ReportingProvider {
  let cfg: ReturnType<typeof assertGa4Configured> | null = null;
  let analyticsData: ReturnType<typeof google.analyticsdata> | null = null;

  function getClient() {
    if (!cfg) cfg = assertGa4Configured(env);
    if (!analyticsData) {
      const auth = new google.auth.JWT({
        email: cfg.clientEmail,
        key: cfg.privateKey,
        scopes: [GA4_READONLY_SCOPE],
      });
      analyticsData = google.analyticsdata({ version: 'v1beta', auth });
    }
    return { cfg, analyticsData };
  }

  function propertyResource(propertyId: string): string {
    return propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
  }

  return {
    validateConfiguration() {
      try {
        assertGa4Configured(env);
        return { ok: true };
      } catch (error) {
        if (error instanceof AutopilotError) {
          return {
            ok: false,
            errorCode: error.code,
            errorMessage: error.message,
          };
        }
        return classifyGa4ProviderError(error);
      }
    },

    async validatePropertyAccess(propertyId) {
      const validation = this.validateConfiguration();
      if (!validation.ok) return validation;
      try {
        const { analyticsData: client } = getClient();
        await client.properties.runReport({
          property: propertyResource(propertyId),
          requestBody: {
            dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
            metrics: [{ name: 'sessions' }],
            limit: '1',
          },
        });
        return { ok: true };
      } catch (error) {
        return classifyGa4ProviderError(error);
      }
    },

    async testConnection(propertyId) {
      return this.validatePropertyAccess(propertyId);
    },

    async runLandingPageReport(query) {
      const { analyticsData: client } = getClient();
      const response = await client.properties.runReport({
        property: propertyResource(query.propertyId),
        requestBody: {
          dateRanges: [{ startDate: query.dateFrom, endDate: query.dateTo }],
          dimensions: [
            { name: 'landingPagePlusQueryString' },
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
            { name: 'sessionDefaultChannelGroup' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'engagedSessions' },
            { name: 'engagementRate' },
            { name: 'averageSessionDuration' },
            { name: 'keyEvents' },
            { name: 'generate_lead' },
            { name: 'contact_form_submit' },
            { name: 'booking_completed' },
          ],
          limit: '100000',
        },
      });

      const rows = response.data.rows ?? [];
      const mapped: Ga4ReportRow[] = [];
      for (const row of rows) {
        const parsed = mapReportRow(row);
        if (parsed) mapped.push(parsed);
      }
      return mapped;
    },
  };
}

export function sanitizeGa4ErrorMessage(raw: unknown): string {
  const text =
    raw instanceof Error
      ? raw.message
      : typeof raw === 'string'
        ? raw
        : 'Google Analytics 4 request failed.';
  return text
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/private_key[^\s]*/gi, 'private_key=[REDACTED]')
    .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/gi, '[REDACTED_PRIVATE_KEY]')
    .slice(0, 500);
}
