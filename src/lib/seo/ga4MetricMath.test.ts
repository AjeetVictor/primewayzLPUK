/**
 * Tests for GA4 metric math helpers.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addGa4RowToAccumulator,
  createGa4MetricAccumulator,
  pctChange,
  safeEngagementRate,
  safeWeightedAverageEngagementTime,
  summariseGa4Accumulator,
} from './ga4MetricMath.ts';

test('engagement rate derives from session totals', () => {
  assert.equal(safeEngagementRate(8, 12), 8 / 12);
  assert.equal(safeEngagementRate(0, 0), null);
});

test('average engagement time is session-weighted', () => {
  const acc = createGa4MetricAccumulator();
  addGa4RowToAccumulator(acc, {
    sessions: 10,
    organicSessions: 10,
    engagedSessions: 8,
    averageEngagementTime: 40,
    keyEvents: 1,
    generateLeadEvents: 0,
    contactFormConversions: 0,
    bookingConversions: 0,
  });
  addGa4RowToAccumulator(acc, {
    sessions: 5,
    organicSessions: 5,
    engagedSessions: 3,
    averageEngagementTime: 10,
    keyEvents: 0,
    generateLeadEvents: 0,
    contactFormConversions: 0,
    bookingConversions: 0,
  });
  const summary = summariseGa4Accumulator(acc);
  assert.equal(summary.sessions, 15);
  assert.equal(summary.averageEngagementTime, (10 * 40 + 5 * 10) / 15);
  assert.equal(safeWeightedAverageEngagementTime(10 * 40 + 5 * 10, 15), summary.averageEngagementTime);
});

test('pctChange handles zero denominator safely', () => {
  assert.equal(pctChange(5, 0), null);
  assert.equal(pctChange(0, 0), 0);
});
