import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFunnelConversion } from './dashboardService';

test('calculateFunnelConversion computes step and overall rates', () => {
  const steps = calculateFunnelConversion([100, 40, 10, 2]);
  assert.equal(steps[0].count, 100);
  assert.equal(steps[1].conversionFromPrevious, 0.4);
  assert.equal(steps[3].overallConversion, 0.02);
});

test('handles zero base safely', () => {
  const steps = calculateFunnelConversion([0, 0]);
  assert.equal(steps[0].overallConversion, null);
});
