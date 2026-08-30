import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { safeAveragePosition, safeCtr } from './gscPerformanceService.ts';

describe('gscPerformanceService helpers', () => {
  it('calculates CTR safely', () => {
    assert.equal(safeCtr(25, 1000), 0.025);
    assert.equal(safeCtr(0, 0), null);
  });

  it('calculates impression-weighted position', () => {
    assert.equal(safeAveragePosition(450, 100), 4.5);
    assert.equal(safeAveragePosition(0, 0), null);
  });
});

describe('gscPerformanceService aggregation (unit)', () => {
  it('aggregates query totals with weighted position', () => {
    const rows = [
      { metricDate: new Date('2026-07-01'), rawQuery: 'test query', normalisedQuery: 'test query', page: 'https://example.com/a', clicks: 5, impressions: 100, position: 4 },
      { metricDate: new Date('2026-07-02'), rawQuery: 'test query', normalisedQuery: 'test query', page: 'https://example.com/a', clicks: 5, impressions: 100, position: 8 },
    ];

    const acc = { clicks: 0, impressions: 0, positionImpressionSum: 0, rowCount: 0 };
    for (const row of rows) {
      acc.clicks += Number(row.clicks);
      acc.impressions += Number(row.impressions);
      acc.positionImpressionSum += Number(row.position) * Number(row.impressions);
      acc.rowCount += 1;
    }

    assert.equal(acc.clicks, 10);
    assert.equal(acc.impressions, 200);
    assert.equal(safeAveragePosition(acc.positionImpressionSum, acc.impressions), 6);
    assert.equal(safeCtr(acc.clicks, acc.impressions), 0.05);
  });
});
