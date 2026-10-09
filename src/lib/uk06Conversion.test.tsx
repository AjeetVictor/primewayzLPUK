import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { ContactBookingStrip } from '../components/ContactBookingStrip';
import {
  getCalendlyCompletionKey,
  resetCalendlyCompletionGuardForTests,
  shouldProcessCalendlyCompletion,
} from './calendly';

test('Calendly duplicate completions are suppressed and distinct bookings remain countable', () => {
  resetCalendlyCompletionGuardForTests();
  const first = { payload: { event: { uri: 'https://api.calendly.com/scheduled_events/booking_one' } } };
  const second = { payload: { event: { uri: 'https://api.calendly.com/scheduled_events/booking_two' } } };
  assert.match(getCalendlyCompletionKey(first), /booking_one$/);
  assert.equal(shouldProcessCalendlyCompletion(first), true);
  assert.equal(shouldProcessCalendlyCompletion(first), false);
  assert.equal(shouldProcessCalendlyCompletion(second), true);
});

test('existing Calendly event names and trusted-origin check remain intact', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/lib/calendly.ts'), 'utf8');
  for (const eventName of ['calendly_widget_view', 'calendly_date_selected', 'calendly_event_scheduled', 'generate_lead']) {
    assert.match(source, new RegExp(eventName));
  }
  assert.match(source, /event\.origin !== 'https:\/\/calendly\.com'/);
});

test('contact form keeps attribution, non-PII analytics and accessible error focus', () => {
  const source = fs.readFileSync(path.join(process.cwd(), 'src/components/ContactForm.tsx'), 'utf8');
  assert.match(source, /sourcePagePath: bookingContext\.sourceRoute \|\| window\.location\.pathname/);
  assert.match(source, /submissionPagePath: window\.location\.pathname/);
  assert.match(source, /errorSummaryRef\.current\?\.focus/);
  assert.match(source, /tabIndex=\{-1\}/);
  assert.match(source, /role="alert"/);
  assert.doesNotMatch(source, /one UK business day/i);
  const analytics = source.match(/const conversionPayload = \{[\s\S]*?\n        \};/)?.[0] || '';
  assert.doesNotMatch(analytics, /(?:^|\s)(?:name|email|phone|message)\s*:/i);
});

test('relevant mobile CTA and Calendly layout contracts remain responsive', () => {
  const group = fs.readFileSync(path.join(process.cwd(), 'src/components/conversion/DigitalSystemsReviewCtaGroup.tsx'), 'utf8');
  const strip = fs.readFileSync(path.join(process.cwd(), 'src/components/ContactBookingStrip.tsx'), 'utf8');
  assert.match(group, /min-h-\[48px\]/);
  assert.match(group, /w-full[\s\S]*sm:w-auto/);
  assert.match(strip, /minWidth: 0/);
  assert.match(strip, /width: '100%'/);
});

test('contact booking experience remains SSR-safe with a direct-contact fallback', () => {
  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/contact-us'] },
      createElement(ContactBookingStrip),
    ),
  );
  assert.match(html, /id="book-call"/);
  assert.match(html, /Open booking calendar/);
  assert.doesNotMatch(html, /primewayz-calendly-inline/);
});
