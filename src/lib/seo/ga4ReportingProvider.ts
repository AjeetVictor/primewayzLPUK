/**
 * Injectable GA4 Reporting API provider (aggregate page metrics only).
 */

import { google } from 'googleapis';
import { assertGa4Configured, GA4_READONLY_SCOPE } from './ga4Config.ts';

export type Ga4ReportingRow = {
  landingPage: string;
  source: string;
  medium: string;
  defaultChannelGroup: string;
  sessions: number;
  organicSessions: number;
  engagedSessions: number;
  engagementRate: number;
  averageEngagementTime: number;
  keyEvents: number;
  generateLeadEvents: number;
  contactFormConversions: number;
  bookingConversions: number;
};

export type Ga4ReportingQuery = {
  propertyId: string;
  dateFrom: string;
  dateTo: string;
};

export type Ga4ReportingProvider = {
  runLandingPageReport: (query: Ga4ReportingQuery) => Promise<Ga4ReportingRow[]>;
};

function toNumber(value: string | null | undefined): number {
  const n = Number.parseFloat(value ?? '0');
  return Number.isFinite(n) ? n : 0;
}

function mapReportRow(row: {
  dimensionValues?: Array<{ value?: string | null } | null> | null;
  metricValues?: Array<{ value?: string | null } | null> | null;
}): Ga4ReportingRow | null {
  const dims = row.dimensionValues ?? [];
  const metrics = row.metricValues ?? [];
  const landingPage = dims[0]?.value ?? '';
  if (!landingPage) return null;
  const source = dims[1]?.value ?? '(not set)';
  const medium = dims[2]?.value ?? '(not set)';
  const defaultChannelGroup = dims[3]?.value ?? '(not set)';
  const sessions = toNumber(metrics[0]?.value);
  const engagedSessions = toNumber(metrics[1]?.value);
  const engagementRate = toNumber(metrics[2]?.value);
  const averageEngagementTime = toNumber(metrics[3]?.value);
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

export function createDefaultGa4ReportingProvider(
  env: NodeJS.ProcessEnv = process.env,
): Ga4ReportingProvider {
  const cfg = assertGa4Configured(env);
  const auth = new google.auth.JWT({
    email: cfg.clientEmail,
    key: cfg.privateKey,
    scopes: [GA4_READONLY_SCOPE],
  });
  const analyticsData = google.analyticsdata({ version: 'v1beta', auth });

  return {
    async runLandingPageReport(query) {
      const property = query.propertyId.startsWith('properties/')
        ? query.propertyId
        : `properties/${query.propertyId}`;
      const response = await analyticsData.properties.runReport({
        property,
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
      const mapped: Ga4ReportingRow[] = [];
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
    .slice(0, 500);
}
