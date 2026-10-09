import assert from 'node:assert/strict';
import test from 'node:test';
import { submissionIdForPayload, type SubmissionIdentity } from './submissionId';

test('submission retries reuse the key only for the same immutable enquiry content', () => {
  const identity: { current: SubmissionIdentity | null } = { current: null };
  const first = submissionIdForPayload(identity, ['Ava', 'ava@example.co.uk', 'Help', null]);
  const retry = submissionIdForPayload(identity, ['Ava', 'ava@example.co.uk', 'Help', null]);
  const changed = submissionIdForPayload(identity, ['Ava', 'ava@example.co.uk', 'Different', null]);
  assert.match(first, /^[a-f0-9]{32}$/);
  assert.equal(retry, first);
  assert.notEqual(changed, first);
});
