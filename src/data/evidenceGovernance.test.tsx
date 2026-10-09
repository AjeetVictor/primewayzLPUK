import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthorityStoryDetailPage } from '../components/AuthorityStoryDetailPage';
import { SuccessStoriesPage } from '../components/SuccessStoriesPage';
import { APPROVED_PUBLIC_STORY_SLUGS, getPublishedSuccessStoryBySlug } from './successStories';
import {
  INDEXED_STATIC_ROBOTS,
  resolveRouteMetadataSnapshot,
} from '../lib/seo/routeMetadataHelpers';

const ROOT = process.cwd();

function renderStory(pathname: string): string {
  return renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: [pathname] },
      createElement(
        Routes,
        null,
        createElement(Route, {
          path: '/success-stories/:slug',
          element: createElement(AuthorityStoryDetailPage),
        }),
      ),
    ),
  );
}

test('listing and all published story routes SSR with exactly one H1', () => {
  const listing = renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: ['/success-stories'] }, createElement(SuccessStoriesPage)),
  );
  assert.equal((listing.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.match(listing, /Delivery highlight/);

  for (const slug of APPROVED_PUBLIC_STORY_SLUGS) {
    const html = renderStory(`/success-stories/${slug}`);
    assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, slug);
    assert.match(html, /Evidence basis and limitations/);
    assert.match(html, /Visual provenance/);
  }
});

test('published story metadata keeps canonical article SSR ownership', () => {
  for (const slug of APPROVED_PUBLIC_STORY_SLUGS) {
    const story = getPublishedSuccessStoryBySlug(slug);
    const snapshot = resolveRouteMetadataSnapshot(`/success-stories/${slug}`);
    assert.ok(story);
    assert.ok(snapshot);
    assert.equal(snapshot!.title, story!.seoTitle);
    assert.equal(snapshot!.canonical, `https://uk.primewayz.com/success-stories/${slug}`);
    assert.equal(snapshot!.ogType, 'article');
    assert.equal(snapshot!.robots, INDEXED_STATIC_ROBOTS);
  }
});

test('story CTA tracking and attribution contracts remain unchanged', () => {
  const genericDetail = readFileSync(path.join(ROOT, 'src', 'components', 'AuthorityStoryDetailPage.tsx'), 'utf8');
  const wholesaleDetail = readFileSync(
    path.join(ROOT, 'src', 'components', 'successStories', 'WholesaleOrderManagementCaseStudyPage.tsx'),
    'utf8',
  );
  const listing = readFileSync(path.join(ROOT, 'src', 'components', 'SuccessStoriesPage.tsx'), 'utf8');

  for (const source of [genericDetail, wholesaleDetail]) {
    assert.match(source, /sourceLocation="success_story"/);
    assert.match(source, /primaryPlacement="success_story_hero_primary"/);
    assert.match(source, /secondaryPlacement="success_story_hero_secondary"/);
    assert.match(source, /primaryPlacement="success_story_final_primary"/);
    assert.match(source, /secondaryPlacement="success_story_final_secondary"/);
    assert.match(source, /serviceArea=\{story\.reviewServiceArea\}/);
  }

  assert.match(listing, /primaryPlacement="success_stories_listing_primary"/);
  assert.match(listing, /secondaryPlacement="success_stories_listing_secondary"/);
  assert.match(listing, /serviceArea="Not sure yet"/);
});

test('success-story structured data remains Article schema without fabricated dates', () => {
  const server = readFileSync(path.join(ROOT, 'server.ts'), 'utf8');
  const start = server.indexOf('function buildSuccessStoryStructuredData');
  const end = server.indexOf('function buildSdaasStructuredData', start);
  const builder = server.slice(start, end);

  assert.notEqual(start, -1);
  assert.match(builder, /'@type': 'Article'/);
  assert.match(builder, /name: 'Primewayz Infotech'/);
  assert.doesNotMatch(builder, /datePublished|dateModified/);
});
