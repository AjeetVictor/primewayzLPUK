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

const contactUsPage = fs.readFileSync(
  path.join(root, 'src/components/ContactUsPage.tsx'),
  'utf8',
);

const trackPageViewStart = analytics.indexOf('export function trackPageView');
const trackPageViewEnd = analytics.indexOf('export function trackEvent', trackPageViewStart);

assert.ok(trackPageViewStart >= 0, 'trackPageView was not found');
assert.ok(trackPageViewEnd > trackPageViewStart, 'trackPageView block boundary was not found');

const trackPageViewBlock = analytics.slice(trackPageViewStart, trackPageViewEnd);

test('SPA page_view ignores hash-only navigation', () => {
  assert.match(tracker, /const path = location\.pathname;/);

  assert.match(tracker, /\}, \[location\.pathname, location\.search\]\);/);

  assert.doesNotMatch(tracker, /location\.hash/);
});

test('SPA page_view fires on initial direct load', () => {
  assert.match(
    tracker,
    /useEffect\(\(\) => \{[\s\S]*trackPageView\(path, getFullUtmAnalyticsPayload\(\)\);[\s\S]*\}, \[location\.pathname, location\.search\]\);/,
  );
});

test('SPA page_view fires on pathname navigation', () => {
  assert.match(tracker, /location\.pathname/);
  assert.match(tracker, /\}, \[location\.pathname, location\.search\]\);/);
});

test('SPA page_view fires on query-string navigation', () => {
  assert.match(tracker, /captureUtmParams\(location\.search\);/);
  assert.match(tracker, /\}, \[location\.pathname, location\.search\]\);/);
});

test('SPA page_view ignores hash removal on the same pathname and query', () => {
  assert.doesNotMatch(tracker, /location\.hash/);
  assert.match(tracker, /\}, \[location\.pathname, location\.search\]\);/);
});

test('SPA page_view follows router location changes for back and forward navigation', () => {
  assert.match(tracker, /const location = useLocation\(\);/);
  assert.doesNotMatch(tracker, /addEventListener\(['"]popstate['"]/);
  assert.match(tracker, /\}, \[location\.pathname, location\.search\]\);/);
});

test('page_view sends pathname-only page_path without UTM query noise', () => {
  assert.match(tracker, /const path = location\.pathname;/);
  assert.match(tracker, /trackPageView\(path, getFullUtmAnalyticsPayload\(\)\);/);
  assert.match(trackPageViewBlock, /page_path: path,/);
});

test('page_view sends full page_location from the browser URL', () => {
  assert.match(trackPageViewBlock, /page_location: window\.location\.href,/);
});

test('page_view sends the current document title', () => {
  assert.match(trackPageViewBlock, /page_title: document\.title,/);
});

test('AnalyticsTracker does not attach duplicate history listeners', () => {
  assert.doesNotMatch(tracker, /addEventListener\(/);
  assert.doesNotMatch(tracker, /removeEventListener\(/);
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

test('contact page sets the correct title during SPA navigation', () => {
  assert.match(
    contactUsPage,
    /return \(\s*<>\s*<title>Contact Primewayz UK \| Discuss Your Digital Priorities<\/title>/,
  );
});
