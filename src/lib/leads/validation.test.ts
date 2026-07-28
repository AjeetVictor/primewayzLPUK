import assert from 'node:assert/strict';
import test from 'node:test';
import { validateLeadSubmission } from './validation';

test('flags example.com as invalid test lead', () => {
  const result = validateLeadSubmission({
    name: 'Jane Smith',
    workEmail: 'jane@example.com',
    company: 'Example Ltd',
    context: 'We need help with our website roadmap and support model.',
  });
  assert.equal(result.outcome, 'invalid_test');
  assert.ok(result.flags.includes('known_test_email_domain'));
});

test('flags HTTP validation pattern in context', () => {
  const result = validateLeadSubmission({
    name: 'API Tester',
    workEmail: 'tester@client.co.uk',
    company: 'Client Co',
    context: 'HTTP validation payload for endpoint testing only',
  });
  assert.equal(result.outcome, 'invalid_test');
  assert.ok(result.flags.includes('http_validation_pattern'));
});

test('valid business lead scores as valid', () => {
  const result = validateLeadSubmission({
    name: 'Sarah Jones',
    workEmail: 'sarah.jones@acmeconsulting.co.uk',
    company: 'Acme Consulting',
    website: 'https://acmeconsulting.co.uk',
    context: 'We need ongoing support for our website and CRM integration work.',
  });
  assert.equal(result.outcome, 'valid');
  assert.ok(result.score >= 75);
});
