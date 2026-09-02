/**
 * Tests for conversion taxonomies and attribution helpers.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyChannelGroup } from './conversionAttribution.ts';
import {
  mapLeadStatusToLeadQuality,
  mapLeadQualityToConversionSignal,
} from './conversionTaxonomies.ts';

test('direct source is not classified as organic', () => {
  assert.equal(classifyChannelGroup('(direct)', '(none)'), 'direct');
  assert.notEqual(classifyChannelGroup('(direct)', '(none)'), 'organic');
});

test('owned organic-social medium is classified as social, not organic', () => {
  assert.equal(classifyChannelGroup('linkedin', 'organic-social'), 'social');
  assert.notEqual(classifyChannelGroup('linkedin', 'organic-social'), 'organic');
});

test('won lead quality maps to opportunity conversion signal', () => {
  assert.equal(mapLeadQualityToConversionSignal(mapLeadStatusToLeadQuality('WON')), 'opportunity_won');
});

test('new lead quality does not emit qualified conversion signal', () => {
  assert.equal(mapLeadQualityToConversionSignal(mapLeadStatusToLeadQuality('NEW')), null);
});
