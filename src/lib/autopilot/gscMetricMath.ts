/**
 * Shared GSC metric aggregation helpers — impression-weighted position, CTR, safe decimals.
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

export function safeCtr(clicks: number, impressions: number): number | null {
  if (impressions <= 0) return null;
  return clicks / impressions;
}

export function safeAveragePosition(positionImpressionSum: number, impressions: number): number | null {
  if (impressions <= 0) return null;
  return positionImpressionSum / impressions;
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

export type MetricAccumulator = {
  clicks: number;
  impressions: number;
  positionImpressionSum: number;
  rowCount: number;
};

export function createMetricAccumulator(): MetricAccumulator {
  return { clicks: 0, impressions: 0, positionImpressionSum: 0, rowCount: 0 };
}

export function addRowToAccumulator(
  acc: MetricAccumulator,
  row: { clicks: unknown; impressions: unknown; position: unknown },
): void {
  const impressions = decimalToNumber(row.impressions);
  const clicks = decimalToNumber(row.clicks);
  const position = decimalToNumber(row.position);
  acc.clicks += clicks;
  acc.impressions += impressions;
  acc.positionImpressionSum += position * impressions;
  acc.rowCount += 1;
}

export function summariseAccumulator(acc: MetricAccumulator): {
  clicks: number;
  impressions: number;
  ctr: number | null;
  averagePosition: number | null;
  metricRowCount: number;
} {
  return {
    clicks: acc.clicks,
    impressions: acc.impressions,
    ctr: safeCtr(acc.clicks, acc.impressions),
    averagePosition: safeAveragePosition(acc.positionImpressionSum, acc.impressions),
    metricRowCount: acc.rowCount,
  };
}
