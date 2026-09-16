/**
 * Deterministic bucket identity for SeoPageConversionDaily rows.
 * No PII, timestamps, campaign IDs, or random values enter the hash input.
 *
 * Tenant semantics (post shared-platform):
 * - Known tenantId → first segment is that tenantId (pw-uk / pw-infotech / …).
 * - Null/unknown tenant → first segment is the sentinel `legacy` (never silently `pw-uk`).
 *
 * Historical note:
 * Pre-tenant hardening migration `20260830160000_seo_conversion_daily_hardening`
 * hashed `page\0model\0channel` only. Those stored hashes remain untouched by the
 * additive source-context migration. Aligning historical daily rows to this helper
 * is an explicit, idempotent post-migration rebuild via:
 *   npm run seo:conversions:rebuild
 *   npm run seo:conversions:rebuild:write
 * Never run that rebuild automatically on application startup.
 */

import { createHash } from 'node:crypto';
import type { SeoAttributionModel } from './conversionTaxonomies.ts';

const UNKNOWN_PAGE_SENTINEL = 'unknown';
/** Deterministic identity for null/unknown tenant provenance. Must not equal any real tenantId. */
export const CONVERSION_LEGACY_TENANT_SENTINEL = 'legacy';

export function normalizeConversionChannelGroup(channelGroup: string): string {
  return channelGroup.trim().toLowerCase();
}

export function resolveConversionBucketTenantSegment(tenantId?: string | null): string {
  const trimmed = tenantId?.trim();
  return trimmed ? trimmed : CONVERSION_LEGACY_TENANT_SENTINEL;
}

export function buildConversionBucketKeyInput(input: {
  tenantId?: string | null;
  seoPageId: number | null;
  attributionModel: SeoAttributionModel | string;
  channelGroup: string;
}): string {
  const pagePart =
    input.seoPageId === null || input.seoPageId === undefined
      ? UNKNOWN_PAGE_SENTINEL
      : String(input.seoPageId);
  const channelPart = normalizeConversionChannelGroup(input.channelGroup);
  return [
    resolveConversionBucketTenantSegment(input.tenantId),
    pagePart,
    input.attributionModel,
    channelPart,
  ].join('\0');
}

export function computeConversionBucketKeyHash(input: {
  tenantId?: string | null;
  seoPageId: number | null;
  attributionModel: SeoAttributionModel | string;
  channelGroup: string;
}): string {
  const payload = buildConversionBucketKeyInput(input);
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}
