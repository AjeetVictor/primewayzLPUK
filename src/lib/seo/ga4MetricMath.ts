/**
 * Shared GA4 metric aggregation helpers — session-weighted engagement, safe decimals.
 */

export function decimalToNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    const n = (value as { toNumber: () => number }).toNumber();
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function safeEngagementRate(engagedSessions: number, sessions: number): number | null {
  if (sessions <= 0) return null;
  return engagedSessions / sessions;
}

export function safeWeightedAverageEngagementTime(
  engagementTimeSum: number,
  sessions: number,
): number | null {
  if (sessions <= 0) return null;
  return engagementTimeSum / sessions;
}

export function pctChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

export function absoluteChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null;
  return current - previous;
}

export type Ga4MetricAccumulator = {
  sessions: number;
  organicSessions: number;
  engagedSessions: number;
  engagementTimeSum: number;
  keyEvents: number;
  generateLeadEvents: number;
  contactFormConversions: number;
  bookingConversions: number;
  rowCount: number;
};

export function createGa4MetricAccumulator(): Ga4MetricAccumulator {
  return {
    sessions: 0,
    organicSessions: 0,
    engagedSessions: 0,
    engagementTimeSum: 0,
    keyEvents: 0,
    generateLeadEvents: 0,
    contactFormConversions: 0,
    bookingConversions: 0,
    rowCount: 0,
  };
}

export function addGa4RowToAccumulator(
  acc: Ga4MetricAccumulator,
  row: {
    sessions: unknown;
    organicSessions: unknown;
    engagedSessions: unknown;
    averageEngagementTime: unknown;
    keyEvents: unknown;
    generateLeadEvents: unknown;
    contactFormConversions: unknown;
    bookingConversions: unknown;
  },
): void {
  const sessions = decimalToNumber(row.sessions);
  const avgTime = decimalToNumber(row.averageEngagementTime);
  acc.sessions += sessions;
  acc.organicSessions += decimalToNumber(row.organicSessions);
  acc.engagedSessions += decimalToNumber(row.engagedSessions);
  acc.engagementTimeSum += avgTime * sessions;
  acc.keyEvents += decimalToNumber(row.keyEvents);
  acc.generateLeadEvents += decimalToNumber(row.generateLeadEvents);
  acc.contactFormConversions += decimalToNumber(row.contactFormConversions);
  acc.bookingConversions += decimalToNumber(row.bookingConversions);
  acc.rowCount += 1;
}

export function summariseGa4Accumulator(acc: Ga4MetricAccumulator): {
  sessions: number;
  organicSessions: number;
  engagedSessions: number;
  engagementRate: number | null;
  averageEngagementTime: number | null;
  keyEvents: number;
  generateLeadEvents: number;
  contactFormConversions: number;
  bookingConversions: number;
  metricRowCount: number;
} {
  return {
    sessions: acc.sessions,
    organicSessions: acc.organicSessions,
    engagedSessions: acc.engagedSessions,
    engagementRate: safeEngagementRate(acc.engagedSessions, acc.sessions),
    averageEngagementTime: safeWeightedAverageEngagementTime(acc.engagementTimeSum, acc.sessions),
    keyEvents: acc.keyEvents,
    generateLeadEvents: acc.generateLeadEvents,
    contactFormConversions: acc.contactFormConversions,
    bookingConversions: acc.bookingConversions,
    metricRowCount: acc.rowCount,
  };
}
