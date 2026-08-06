import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

const source = fs.readFileSync(
  path.join(root, 'src/lib/calendly.ts'),
  'utf8',
);

test('completed booking is emitted once after a trusted Calendly message', () => {
  const trustedOrigin = source.indexOf(
    "if (event.origin !== 'https://calendly.com') return;",
  );
  const scheduledCondition = source.indexOf(
    "if (calendlyEventName === 'calendly.event_scheduled')",
  );
  const scheduledConversion = source.indexOf(
    "trackConversionEvent('calendly_event_scheduled', basePayload);",
  );

  assert.ok(trustedOrigin >= 0);
  assert.ok(scheduledCondition > trustedOrigin);
  assert.ok(scheduledConversion > scheduledCondition);

  const calls =
    source.match(
      /trackConversionEvent\('calendly_event_scheduled'/g,
    ) ?? [];

  assert.equal(calls.length, 1);
});

test('date selection remains separate and message listener is cleaned up', () => {
  const dateCondition = source.indexOf(
    "if (calendlyEventName === 'calendly.date_and_time_selected')",
  );
  const dateEvent = source.indexOf(
    "trackConversionEvent('calendly_date_selected', basePayload);",
  );

  assert.ok(dateCondition >= 0);
  assert.ok(dateEvent > dateCondition);

  assert.match(
    source,
    /window\.addEventListener\('message', handleCalendlyEvent\);/,
  );
  assert.match(
    source,
    /return \(\) => window\.removeEventListener\('message', handleCalendlyEvent\);/,
  );
});

test('completed-booking payload contains non-PII context only', () => {
  const payload = source.match(
    /const basePayload = \{[\s\S]*?\r?\n    \};/,
  )?.[0];

  assert.ok(payload);
  assert.match(payload, /calendly_url:/);
  assert.match(payload, /lead_type:/);
  assert.match(payload, /cta_location:/);
  assert.match(payload, /source_page:/);

  assert.doesNotMatch(
    payload,
    /event\.data|\b(?:invitee|email|name|phone|uri|token|publicToken|reportToken)\s*:/i,
  );
});
