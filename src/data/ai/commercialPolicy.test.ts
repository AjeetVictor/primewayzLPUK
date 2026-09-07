import assert from 'node:assert/strict';
import test from 'node:test';
import { AI_COMMERCIAL_POLICY as policy } from './commercialPolicy';

test('AI commercial policy preserves approved C006 boundaries', () => {
  assert.equal(policy.commercialModel.discoveryLed, true);
  assert.equal(policy.commercialModel.publicFixedSkuApproved, false);
  assert.equal(policy.thirdPartyCosts.includedByDefault, false);
  assert.equal(policy.controlLevels.length, 3);
  assert.equal(policy.productionBoundaries.highImpactActionsRequireScopedControls, true);
  assert.equal(policy.prohibitedClaims.includes('100% AI accuracy'), true);
  assert.equal(policy.prohibitedClaims.includes('Zero hallucinations'), true);
  assert.equal(policy.prohibitedClaims.includes('Unlimited AI, model, API or infrastructure usage'), true);
});
