import assert from 'node:assert/strict';
import test from 'node:test';
import { LeadTransitionError, validateLeadTransition } from './transitions';

test('allows NEW to VALIDATED', () => {
  assert.doesNotThrow(() => validateLeadTransition('NEW', 'VALIDATED'));
});

test('rejects arbitrary WON transition', () => {
  assert.throws(
    () => validateLeadTransition('NEW', 'WON'),
    LeadTransitionError,
  );
});

test('requires owner for ASSIGNED', () => {
  assert.throws(() => validateLeadTransition('VALIDATED', 'ASSIGNED', {}));
  assert.doesNotThrow(() =>
    validateLeadTransition('VALIDATED', 'ASSIGNED', { ownerId: 1 }),
  );
});

test('requires lost reason for LOST', () => {
  assert.throws(() => validateLeadTransition('CONTACTED', 'LOST', {}));
  assert.doesNotThrow(() =>
    validateLeadTransition('CONTACTED', 'LOST', {
      lostReason: 'not_a_fit',
      firstContactedAt: new Date(),
    }),
  );
});
