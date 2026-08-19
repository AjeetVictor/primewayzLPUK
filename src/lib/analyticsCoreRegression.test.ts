import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

const tracker = fs.readFileSync(
  path.join(root, 'src/components/AnalyticsTracker.tsx'),
  'utf8',
);

const analytics = fs.readFileSync(
  path.join(root, 'src/lib/analytics.ts'),
  'utf8',
);

const entryClient = fs.readFileSync(
  path.join(root, 'src/entry-client.tsx'),
  'utf8',
);

test('SPA page_view ignores hash-only navigation', () => {
  assert.match(
    tracker,
    /const path = `\$\{location\.pathname\}\$\{location\.search\}`;/,
  );

  assert.match(
    tracker,
    /\}, \[location\.pathname, location\.search\]\);/,
  );

  assert.doesNotMatch(tracker, /location\.hash/);
});

test('conversion events send full attribution payload to GA4', () => {
  const start = analytics.indexOf('export function trackConversionEvent');
  const end = analytics.indexOf('export function trackBookCallClick', start);

  assert.ok(start >= 0);
  assert.ok(end > start);

  const block = analytics.slice(start, end);

  assert.match(block, /\.\.\.getFullUtmAnalyticsPayload\(\)/);
  assert.match(block, /trackEvent\(eventName, payload\);/);
  assert.doesNotMatch(block, /trackEvent\(eventName, params\);/);
});

test('chat_message_sent is emitted once', () => {
  const start = analytics.indexOf('export function trackChatMessageSent');
  const end = analytics.indexOf(
    'export function trackChatAppointmentRequested',
    start,
  );

  assert.ok(start >= 0);
  assert.ok(end > start);

  const block = analytics.slice(start, end);

  assert.equal(
    (block.match(/trackConversionEvent\('chat_message_sent'/g) || []).length,
    1,
  );

  assert.equal(
    (block.match(/trackEvent\('chat_message_sent'/g) || []).length,
    0,
  );
});

test('UTM attribution is captured before React client bootstrap', () => {
  assert.match(
    entryClient,
    /import \{ captureUtmParams \} from '\.\/lib\/utm';/,
  );

  assert.match(
    entryClient,
    /captureUtmParams\(window\.location\.search\);/,
  );

  const captureIndex = entryClient.indexOf(
    'captureUtmParams(window.location.search);',
  );

  const renderIndex = Math.min(
    ...[
      entryClient.indexOf('hydrateRoot('),
      entryClient.indexOf('createRoot('),
    ].filter((index) => index >= 0),
  );

  assert.ok(captureIndex >= 0, 'bootstrap UTM capture was not found');
  assert.ok(renderIndex >= 0, 'React client bootstrap was not found');
  assert.ok(
    captureIndex < renderIndex,
    'UTM attribution must be captured before React renders',
  );
});
