import assert from 'node:assert/strict';
import test from 'node:test';
import { REMOTE_IT_COMMERCIAL_POLICY as policy } from './commercialPolicy';

test('Remote IT commercial policy preserves approved C004 terms', () => {
  const partTime = policy.engagementModels.find((model) => model.id === 'part-time-specialist');
  const dedicated = policy.engagementModels.find((model) => model.id === 'dedicated-specialist');

  assert.ok(partTime);
  assert.ok(dedicated);

  assert.equal(partTime.allocationHoursPerMonth, 80);
  assert.equal(dedicated.allocationHoursPerMonth, 160);
  assert.equal(policy.ukOverlap.minimumHoursPerScheduledWorkingDay, 4);
  assert.equal(policy.commercialTerms.initialCommitmentMonths, 3);
  assert.equal(policy.commercialTerms.cancellationNoticeDays, 30);
  assert.equal(policy.commercialTerms.reservedCapacityRollover, false);
  assert.equal(policy.continuity.targetsAreGuaranteedSla, false);
  assert.equal(policy.pricing.publicRateCardApproved, false);
});
