import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addRowToAccumulator,
  createMetricAccumulator,
  safeAveragePosition,
  safeCtr,
  summariseAccumulator,
} from './gscMetricMath.ts';

describe('gscMetricMath', () => {
  it('computes CTR from totals not averaged CTR values', () => {
    assert.equal(safeCtr(10, 100), 0.1);
    assert.equal(safeCtr(0, 0), null);
  });

  it('computes impression-weighted average position', () => {
    const acc = createMetricAccumulator();
    addRowToAccumulator(acc, { clicks: 1, impressions: 100, position: 5 });
    addRowToAccumulator(acc, { clicks: 1, impressions: 100, position: 15 });
    const summary = summariseAccumulator(acc);
    assert.equal(summary.averagePosition, 10);
  });

  it('returns null position when impressions are zero', () => {
    assert.equal(safeAveragePosition(0, 0), null);
  });
});
