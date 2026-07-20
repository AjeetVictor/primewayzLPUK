import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStaticContentInventoryForTests } from './contentInventoryService.ts';
import { blogPosts } from '../../data/blog/utils.ts';

test('static inventory includes static blog posts with source type', () => {
  const inventory = buildStaticContentInventoryForTests();
  const staticItems = inventory.items.filter((item) => item.sourceType === 'static_blog');
  assert.ok(staticItems.length >= blogPosts.length);
  const sample = staticItems[0];
  assert.ok(sample.slug);
  assert.ok(sample.route?.startsWith('/blog/'));
  assert.ok(sample.title);
  assert.equal(sample.publicationStatus, 'static_published');
  assert.ok(!('inventedField' in sample));
});

test('SDaaS insights routes are included without inventing titles', () => {
  const inventory = buildStaticContentInventoryForTests();
  const sdaas = inventory.items.filter((item) => item.sourceType === 'sdaas_insights');
  assert.ok(sdaas.length > 0);
  assert.ok(sdaas.every((item) => item.route?.startsWith('/insights/') || item.route?.startsWith('/')));
  assert.ok(sdaas.every((item) => item.title == null || typeof item.title === 'string'));
  assert.ok(inventory.counts.sdaas_insights > 0);
  assert.ok(inventory.counts.static_blog > 0);
});

test('source types are preserved and identity signal is stable', () => {
  const a = buildStaticContentInventoryForTests();
  const b = buildStaticContentInventoryForTests();
  assert.equal(a.identitySignal, b.identitySignal);
  const types = new Set(a.items.map((item) => item.sourceType));
  assert.ok(types.has('static_blog'));
  assert.ok(types.has('sdaas_insights'));
});
