/**
 * Deterministic bucket identity for SeoPageConversionDaily rows.
 * No PII, timestamps, or random values enter the hash input.
 */

import { createHash } from 'node:crypto';
import type { SeoAttributionModel } from './conversionTaxonomies.ts';

const UNKNOWN_PAGE_SENTINEL = 'unknown';

export function normalizeConversionChannelGroup(channelGroup: string): string {
  return channelGroup.trim().toLowerCase();
}

export function buildConversionBucketKeyInput(input: {
  seoPageId: number | null;
  attributionModel: SeoAttributionModel | string;
  channelGroup: string;
}): string {
  const pagePart =
    input.seoPageId === null || input.seoPageId === undefined
      ? UNKNOWN_PAGE_SENTINEL
      : String(input.seoPageId);
  const channelPart = normalizeConversionChannelGroup(input.channelGroup);
  return [pagePart, input.attributionModel, channelPart].join('\0');
}

export function computeConversionBucketKeyHash(input: {
  seoPageId: number | null;
  attributionModel: SeoAttributionModel | string;
  channelGroup: string;
}): string {
  const payload = buildConversionBucketKeyInput(input);
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}
