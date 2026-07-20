import assert from 'node:assert/strict';
import test from 'node:test';
import { blogPosts } from '../../data/blog/utils.ts';
import {
  checkAutopilotSlugReservation,
  isAutopilotSlugAvailable,
  normaliseAutopilotSlugCandidate,
} from './slugReservation.ts';

const staticSlug = blogPosts[0]!.slug;
const staticId = blogPosts[0]!.id;

test('unique slug is available', () => {
  const result = checkAutopilotSlugReservation({
    candidate: 'brand-new-autopilot-topic-slug-2026',
  });
  assert.equal(result.ok, true);
  assert.equal(result.conflict, false);
  assert.equal(result.conflictSource, 'none');
  assert.equal(result.normalisedSlug, 'brand-new-autopilot-topic-slug-2026');
  assert.equal(isAutopilotSlugAvailable('brand-new-autopilot-topic-slug-2026'), true);
});

test('static slug collision is detected', () => {
  const result = checkAutopilotSlugReservation({ candidate: staticSlug });
  assert.equal(result.ok, false);
  assert.equal(result.conflictSource, 'static_blog');
  assert.equal(result.conflictValue, staticSlug);
});

test('collision by static id is detected where id differs from slug path usage', () => {
  const result = checkAutopilotSlugReservation({ candidate: staticId });
  assert.equal(result.ok, false);
  assert.equal(result.conflictSource, 'static_blog');
});

test('/blog/slug and trailing or leading slashes normalise to the same candidate', () => {
  assert.equal(normaliseAutopilotSlugCandidate(`/blog/${staticSlug}`), staticSlug);
  assert.equal(normaliseAutopilotSlugCandidate(`/blog/${staticSlug}/`), staticSlug);
  assert.equal(normaliseAutopilotSlugCandidate(`/${staticSlug}`), staticSlug);
  assert.equal(normaliseAutopilotSlugCandidate(`${staticSlug}/`), staticSlug);

  const withPrefix = checkAutopilotSlugReservation({ candidate: `/blog/${staticSlug}/` });
  assert.equal(withPrefix.ok, false);
  assert.equal(withPrefix.normalisedSlug, staticSlug);
  assert.equal(withPrefix.conflictSource, 'static_blog');
});

test('case handling matches current case-sensitive blog route behaviour', () => {
  const upper = staticSlug.toUpperCase();
  if (upper === staticSlug) {
    assert.ok(true);
    return;
  }

  const result = checkAutopilotSlugReservation({ candidate: upper });
  assert.equal(result.ok, true);
  assert.equal(result.normalisedSlug, upper);
});

test('empty or malformed candidates are rejected', () => {
  for (const candidate of ['', '   ', '/', '/blog', '/blog/', '/blog/a/b', 'a/b']) {
    const result = checkAutopilotSlugReservation({ candidate });
    assert.equal(result.ok, false, candidate);
    assert.equal(result.conflictSource, 'malformed', candidate);
  }
});

test('additional reserved paths can block a candidate', () => {
  const candidate = 'future-cms-only-slug';
  assert.equal(isAutopilotSlugAvailable(candidate), true);

  const result = checkAutopilotSlugReservation({
    candidate: `/blog/${candidate}/`,
    additionalReserved: ['/insights/example', candidate],
  });
  assert.equal(result.ok, false);
  assert.equal(result.conflictSource, 'additional_reserved');
  assert.equal(result.normalisedSlug, candidate);
});
