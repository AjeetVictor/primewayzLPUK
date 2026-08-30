/**
 * Tests for GA4 reporting provider error classification and mapping.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyGa4ProviderError,
  sanitizeGa4ErrorMessage,
  type Ga4ReportingProvider,
} from './ga4ReportingProvider.ts';

test('sanitizeGa4ErrorMessage redacts bearer tokens and private keys', () => {
  const message = sanitizeGa4ErrorMessage('Request failed Bearer ya29.secret-token private_key=abc');
  assert.equal(message.includes('ya29.secret-token'), false);
  assert.ok(message.includes('[REDACTED]'));
});

test('classifyGa4ProviderError maps access denied', () => {
  const result = classifyGa4ProviderError(new Error('User does not have sufficient permissions for this property.'));
  assert.equal(result.errorCode, 'GA4_ACCESS_DENIED');
});

test('mock provider remains deterministic without external API', async () => {
  const provider: Ga4ReportingProvider = {
    validateConfiguration: () => ({ ok: true }),
    validatePropertyAccess: async () => ({ ok: true }),
    testConnection: async () => ({ ok: true }),
    runLandingPageReport: async () => [
      {
        landingPage: '/contact',
        source: 'google',
        medium: 'organic',
        defaultChannelGroup: 'Organic Search',
        sessions: 3,
        organicSessions: 3,
        engagedSessions: 2,
        engagementRate: 0.66,
        averageEngagementTime: 30,
        keyEvents: 1,
        generateLeadEvents: 1,
        contactFormConversions: 1,
        bookingConversions: 0,
      },
    ],
  };

  const rows = await provider.runLandingPageReport({
    propertyId: '123',
    dateFrom: '2026-07-01',
    dateTo: '2026-07-01',
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].organicSessions, 3);
});
