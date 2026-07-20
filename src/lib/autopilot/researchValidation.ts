/**
 * Phase 2B research evidence validation and path helpers.
 * No external URL reachability checks.
 */

import {
  AUTOPILOT_RECOGNISED_SITE_HOSTS,
  AUTOPILOT_RESEARCH_LIMITS,
} from '../../data/autopilot/researchConfig.ts';
import {
  AUTOPILOT_EVIDENCE_QUALITY_VALUES,
  AUTOPILOT_RESEARCH_SOURCE_TYPES,
} from '../../data/autopilot/researchStatus.ts';
import type {
  AutopilotBusinessAlignment,
  AutopilotContentArchitecture,
  AutopilotRiskAssessment,
  AutopilotSearchIntent,
  AutopilotSerpEvidence,
  AutopilotSerpEvidenceRow,
} from '../../data/autopilot/types.ts';
import { validationError } from './apiErrors.ts';

const SEARCH_INTENT_KINDS = new Set([
  'informational',
  'commercial_investigation',
  'transactional',
  'navigational',
  'mixed',
  'unknown',
]);

const JOURNEY_STAGES = new Set([
  'problem_awareness',
  'solution_awareness',
  'vendor_evaluation',
  'purchase_decision',
  'post_purchase',
  'unknown',
]);

const SERP_CONTENT_TYPES = new Set([
  'service_page',
  'blog_article',
  'guide',
  'comparison',
  'category_page',
  'tool',
  'forum',
  'video',
  'other',
  'unknown',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertMaxDepth(value: unknown, depth: number, maxDepth: number, field: string) {
  if (depth > maxDepth) {
    throw validationError(`${field} exceeds maximum JSON depth.`, { field, maxDepth });
  }
  if (Array.isArray(value)) {
    for (const item of value) assertMaxDepth(item, depth + 1, maxDepth, field);
    return;
  }
  if (isPlainObject(value)) {
    for (const nested of Object.values(value)) {
      assertMaxDepth(nested, depth + 1, maxDepth, field);
    }
  }
}

function optionalString(
  value: unknown,
  field: string,
  maxLen: number,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string.`, { field });
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLen) {
    throw validationError(`${field} exceeds maximum length of ${maxLen}.`, {
      field,
      maxLen,
    });
  }
  return trimmed.length ? trimmed : undefined;
}

function optionalStringArray(
  value: unknown,
  field: string,
  maxItems: number,
  maxItemLen: number,
): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw validationError(`${field} must be an array.`, { field });
  }
  if (value.length > maxItems) {
    throw validationError(`${field} exceeds maximum of ${maxItems} items.`, {
      field,
      maxItems,
    });
  }
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      throw validationError(`${field} items must be strings.`, { field });
    }
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.length > maxItemLen) {
      throw validationError(`${field} item exceeds maximum length.`, { field });
    }
    out.push(trimmed);
  }
  return out;
}

/**
 * Validate an internal path or recognised site URL.
 * Returns a normalised internal path beginning with `/`.
 */
export function validateInternalPathOrSiteUrl(raw: unknown, field: string): string {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw validationError(`${field} must be a non-empty path or site URL.`, { field });
  }
  const trimmed = raw.trim();
  if (trimmed.length > AUTOPILOT_RESEARCH_LIMITS.maxUrlLength) {
    throw validationError(`${field} exceeds maximum URL length.`, { field });
  }

  if (trimmed.startsWith('/')) {
    if (trimmed.includes('://') || trimmed.includes('\\')) {
      throw validationError(`${field} path is invalid.`, { field });
    }
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw validationError(`${field} must start with / or be a recognised site URL.`, {
      field,
    });
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw validationError(`${field} URL protocol is not allowed.`, { field });
  }

  const host = url.hostname.toLowerCase();
  if (
    !(AUTOPILOT_RECOGNISED_SITE_HOSTS as readonly string[]).includes(host)
  ) {
    throw validationError(
      `${field} must be an internal path or a recognised Primewayz site URL.`,
      { field, host },
    );
  }

  return `${url.pathname}${url.search}${url.hash}` || '/';
}

export function isValidInternalPathOrSiteUrl(raw: unknown): boolean {
  try {
    validateInternalPathOrSiteUrl(raw, 'path');
    return true;
  } catch {
    return false;
  }
}

function validateOptionalExternalUrl(raw: unknown, field: string): string | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw !== 'string') {
    throw validationError(`${field} must be a string URL.`, { field });
  }
  const trimmed = raw.trim();
  if (trimmed.length > AUTOPILOT_RESEARCH_LIMITS.maxUrlLength) {
    throw validationError(`${field} exceeds maximum URL length.`, { field });
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('bad protocol');
    }
  } catch {
    throw validationError(`${field} must be a syntactically valid http(s) URL.`, {
      field,
    });
  }
  return trimmed;
}

function validateObservedDate(raw: unknown, field: string): string | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (typeof raw !== 'string') {
    throw validationError(`${field} must be an ISO date string.`, { field });
  }
  const trimmed = raw.trim();
  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) {
    throw validationError(`${field} must be a valid date.`, { field });
  }
  return trimmed;
}

export function parseSearchIntent(value: unknown): AutopilotSearchIntent | null {
  if (value === undefined || value === null) return null;
  if (!isPlainObject(value)) {
    throw validationError('searchIntent must be an object.', { field: 'searchIntent' });
  }
  assertMaxDepth(value, 0, 6, 'searchIntent');

  const primaryIntent = optionalString(value.primaryIntent, 'searchIntent.primaryIntent', 64);
  const dominantIntent = optionalString(
    value.dominantIntent,
    'searchIntent.dominantIntent',
    64,
  );
  for (const [field, intent] of [
    ['primaryIntent', primaryIntent],
    ['dominantIntent', dominantIntent],
  ] as const) {
    if (intent && !SEARCH_INTENT_KINDS.has(intent)) {
      throw validationError(`Invalid search intent value for ${field}.`, { field });
    }
  }

  const journeyStage = optionalString(value.journeyStage, 'searchIntent.journeyStage', 64);
  if (journeyStage && !JOURNEY_STAGES.has(journeyStage)) {
    throw validationError('Invalid journeyStage value.', { field: 'journeyStage' });
  }

  const secondaryIntents = optionalStringArray(
    value.secondaryIntents,
    'searchIntent.secondaryIntents',
    10,
    64,
  );
  if (secondaryIntents) {
    for (const intent of secondaryIntents) {
      if (!SEARCH_INTENT_KINDS.has(intent)) {
        throw validationError('Invalid secondaryIntent value.', {
          field: 'secondaryIntents',
        });
      }
    }
  }

  const result: AutopilotSearchIntent = {};
  if (primaryIntent) result.primaryIntent = primaryIntent as AutopilotSearchIntent['primaryIntent'];
  if (dominantIntent)
    result.dominantIntent = dominantIntent as AutopilotSearchIntent['dominantIntent'];
  if (secondaryIntents) result.secondaryIntents = secondaryIntents as AutopilotSearchIntent['secondaryIntents'];
  const secondaryIntent = optionalString(
    value.secondaryIntent,
    'searchIntent.secondaryIntent',
    64,
  );
  if (secondaryIntent) {
    if (!SEARCH_INTENT_KINDS.has(secondaryIntent)) {
      throw validationError('Invalid secondaryIntent value.', { field: 'secondaryIntent' });
    }
    result.secondaryIntent = secondaryIntent as AutopilotSearchIntent['secondaryIntent'];
  }
  if (journeyStage) result.journeyStage = journeyStage as AutopilotSearchIntent['journeyStage'];
  const funnelStage = optionalString(value.funnelStage, 'searchIntent.funnelStage', 64);
  if (funnelStage) result.funnelStage = funnelStage as AutopilotSearchIntent['funnelStage'];
  const userNeed = optionalString(
    value.userNeed,
    'searchIntent.userNeed',
    AUTOPILOT_RESEARCH_LIMITS.maxNotesLength,
  );
  if (userNeed) result.userNeed = userNeed;
  const expectedAnswerFormat = optionalString(
    value.expectedAnswerFormat,
    'searchIntent.expectedAnswerFormat',
    500,
  );
  if (expectedAnswerFormat) result.expectedAnswerFormat = expectedAnswerFormat;
  const decisionContext = optionalString(
    value.decisionContext,
    'searchIntent.decisionContext',
    AUTOPILOT_RESEARCH_LIMITS.maxNotesLength,
  );
  if (decisionContext) result.decisionContext = decisionContext;
  const notes = optionalString(
    value.notes,
    'searchIntent.notes',
    AUTOPILOT_RESEARCH_LIMITS.maxNotesLength,
  );
  if (notes) result.notes = notes;
  const intents = optionalStringArray(value.intents, 'searchIntent.intents', 10, 64);
  if (intents) result.intents = intents as AutopilotSearchIntent['intents'];

  return result;
}

export function parseSerpEvidence(value: unknown): AutopilotSerpEvidence | null {
  if (value === undefined || value === null) return null;
  if (!isPlainObject(value)) {
    throw validationError('serpEvidence must be an object.', { field: 'serpEvidence' });
  }
  assertMaxDepth(value, 0, 6, 'serpEvidence');

  const result: AutopilotSerpEvidence = {};
  if (Array.isArray(value.rows)) {
    if (value.rows.length > AUTOPILOT_RESEARCH_LIMITS.maxSerpRows) {
      throw validationError(
        `serpEvidence.rows exceeds maximum of ${AUTOPILOT_RESEARCH_LIMITS.maxSerpRows}.`,
        { field: 'serpEvidence.rows' },
      );
    }
    const rows: AutopilotSerpEvidenceRow[] = [];
    for (let i = 0; i < value.rows.length; i += 1) {
      const row = value.rows[i];
      if (!isPlainObject(row)) {
        throw validationError(`serpEvidence.rows[${i}] must be an object.`, {
          field: `serpEvidence.rows[${i}]`,
        });
      }
      const parsed: AutopilotSerpEvidenceRow = {};
      if (row.position !== undefined && row.position !== null && row.position !== '') {
        const position =
          typeof row.position === 'number'
            ? row.position
            : Number.parseInt(String(row.position), 10);
        if (!Number.isInteger(position) || position < 1) {
          throw validationError(`serpEvidence.rows[${i}].position must be a positive integer.`, {
            field: `serpEvidence.rows[${i}].position`,
          });
        }
        parsed.position = position;
      }
      const title = optionalString(
        row.title,
        `serpEvidence.rows[${i}].title`,
        AUTOPILOT_RESEARCH_LIMITS.maxTitleLength,
      );
      if (title) parsed.title = title;
      const url = validateOptionalExternalUrl(row.url, `serpEvidence.rows[${i}].url`);
      if (url) parsed.url = url;
      const domain = optionalString(row.domain, `serpEvidence.rows[${i}].domain`, 253);
      if (domain) parsed.domain = domain;
      const contentType = optionalString(
        row.contentType,
        `serpEvidence.rows[${i}].contentType`,
        64,
      );
      if (contentType) {
        if (!SERP_CONTENT_TYPES.has(contentType)) {
          throw validationError(`Invalid SERP content type at rows[${i}].`, {
            field: `serpEvidence.rows[${i}].contentType`,
          });
        }
        parsed.contentType = contentType as AutopilotSerpEvidenceRow['contentType'];
      }
      const observedAt = validateObservedDate(
        row.observedAt,
        `serpEvidence.rows[${i}].observedAt`,
      );
      if (observedAt) parsed.observedAt = observedAt;
      const notes = optionalString(
        row.notes,
        `serpEvidence.rows[${i}].notes`,
        AUTOPILOT_RESEARCH_LIMITS.maxNotesLength,
      );
      if (notes) parsed.notes = notes;
      const source = optionalString(row.source, `serpEvidence.rows[${i}].source`, 120);
      if (source) parsed.source = source;
      const serpFeatures = optionalStringArray(
        row.serpFeatures,
        `serpEvidence.rows[${i}].serpFeatures`,
        AUTOPILOT_RESEARCH_LIMITS.maxSerpFeaturesPerRow,
        120,
      );
      if (serpFeatures) parsed.serpFeatures = serpFeatures;
      rows.push(parsed);
    }
    result.rows = rows;
  }

  const evidenceLimitation = optionalString(
    value.evidenceLimitation,
    'serpEvidence.evidenceLimitation',
    AUTOPILOT_RESEARCH_LIMITS.maxNotesLength,
  );
  if (evidenceLimitation) result.evidenceLimitation = evidenceLimitation;

  // Preserve common legacy summary fields when present
  for (const key of [
    'researchedAt',
    'freshnessNotes',
    'aiOverviewNotes',
    'notes',
  ] as const) {
    const text = optionalString(
      value[key],
      `serpEvidence.${key}`,
      AUTOPILOT_RESEARCH_LIMITS.maxNotesLength,
    );
    if (text) (result as Record<string, unknown>)[key] = text;
  }
  for (const key of [
    'observedResultTypes',
    'commonContentFormats',
    'commonHeadings',
    'competitorDomains',
    'peopleAlsoAsk',
  ] as const) {
    const list = optionalStringArray(value[key], `serpEvidence.${key}`, 50, 300);
    if (list) (result as Record<string, unknown>)[key] = list;
  }
  if (typeof value.featuredSnippets === 'boolean') result.featuredSnippets = value.featuredSnippets;
  if (typeof value.videoOrImagePresence === 'boolean') {
    result.videoOrImagePresence = value.videoOrImagePresence;
  }
  if (typeof value.localIntent === 'boolean') result.localIntent = value.localIntent;

  return result;
}

export function parseBusinessAlignment(value: unknown): AutopilotBusinessAlignment | null {
  if (value === undefined || value === null) return null;
  if (!isPlainObject(value)) {
    throw validationError('businessAlignment must be an object.', {
      field: 'businessAlignment',
    });
  }
  assertMaxDepth(value, 0, 6, 'businessAlignment');
  const result: AutopilotBusinessAlignment = {};

  for (const key of [
    'serviceRelevanceNotes',
    'businessValueNotes',
    'buyerIntentNotes',
    'commercialPageSupportNotes',
    'internalLinkOpportunityNotes',
    'noSuitablePathReason',
    'relevantService',
    'relevantMoneyPage',
    'serviceFit',
    'buyerFit',
    'authorityFit',
    'conversionOpportunity',
    'internalLinkingOpportunity',
    'commercialValue',
    'notes',
  ] as const) {
    const text = optionalString(
      value[key],
      `businessAlignment.${key}`,
      AUTOPILOT_RESEARCH_LIMITS.maxNotesLength,
    );
    if (text) (result as Record<string, unknown>)[key] = text;
  }

  for (const key of ['targetServicePaths', 'targetCommercialPaths'] as const) {
    if (value[key] === undefined || value[key] === null) continue;
    if (!Array.isArray(value[key])) {
      throw validationError(`${key} must be an array.`, { field: key });
    }
    if ((value[key] as unknown[]).length > AUTOPILOT_RESEARCH_LIMITS.maxInternalPaths) {
      throw validationError(`${key} exceeds maximum paths.`, { field: key });
    }
    const paths = (value[key] as unknown[]).map((item, index) =>
      validateInternalPathOrSiteUrl(item, `${key}[${index}]`),
    );
    result[key] = paths;
  }

  return result;
}

export function parseContentArchitecture(
  value: unknown,
): AutopilotContentArchitecture | null {
  if (value === undefined || value === null) return null;
  if (!isPlainObject(value)) {
    throw validationError('contentArchitecture must be an object.', {
      field: 'contentArchitecture',
    });
  }
  assertMaxDepth(value, 0, 6, 'contentArchitecture');
  const result: AutopilotContentArchitecture = {};

  for (const key of [
    'proposedPageType',
    'topicCluster',
    'contentRole',
    'differentiationAngle',
    'directAnswerOpportunity',
    'pillarSupportingRelationship',
    'intendedPageType',
    'suggestedCanonicalRoute',
    'proposedSlug',
    'contentGap',
    'primaryCategory',
    'notes',
  ] as const) {
    const text = optionalString(
      value[key],
      `contentArchitecture.${key}`,
      AUTOPILOT_RESEARCH_LIMITS.maxNotesLength,
    );
    if (text) (result as Record<string, unknown>)[key] = text;
  }

  const requiredSections = optionalStringArray(
    value.requiredSections,
    'contentArchitecture.requiredSections',
    AUTOPILOT_RESEARCH_LIMITS.maxRequiredSections,
    300,
  );
  if (requiredSections) result.requiredSections = requiredSections;

  const supportingQuestions = optionalStringArray(
    value.supportingQuestions,
    'contentArchitecture.supportingQuestions',
    AUTOPILOT_RESEARCH_LIMITS.maxSupportingQuestions,
    300,
  );
  if (supportingQuestions) result.supportingQuestions = supportingQuestions;

  const secondaryCategories = optionalStringArray(
    value.secondaryCategories,
    'contentArchitecture.secondaryCategories',
    20,
    120,
  );
  if (secondaryCategories) result.secondaryCategories = secondaryCategories;

  const relatedExistingArticles = optionalStringArray(
    value.relatedExistingArticles,
    'contentArchitecture.relatedExistingArticles',
    50,
    300,
  );
  if (relatedExistingArticles) result.relatedExistingArticles = relatedExistingArticles;

  return result;
}

export function parseRiskAssessment(value: unknown): AutopilotRiskAssessment | null {
  if (value === undefined || value === null) return null;
  if (!isPlainObject(value)) {
    throw validationError('riskAssessment must be an object.', { field: 'riskAssessment' });
  }
  assertMaxDepth(value, 0, 6, 'riskAssessment');
  const result: AutopilotRiskAssessment = {};

  for (const key of [
    'cannibalisationNotes',
    'unsupportedClaimRisks',
    'legalOrComplianceNotes',
    'evidenceLimitations',
    'freshnessRisks',
    'cannibalisationRisk',
    'duplicateTopicRisk',
    'unsupportedClaimRisk',
    'outdatedEvidenceRisk',
    'legalComplianceNotes',
    'notes',
  ] as const) {
    const text = optionalString(
      value[key],
      `riskAssessment.${key}`,
      AUTOPILOT_RESEARCH_LIMITS.maxNotesLength,
    );
    if (text) (result as Record<string, unknown>)[key] = text;
  }

  const overlappingPages = optionalStringArray(
    value.overlappingPages,
    'riskAssessment.overlappingPages',
    50,
    300,
  );
  if (overlappingPages) result.overlappingPages = overlappingPages;

  return result;
}

export function parseEvidenceQuality(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'not_assessed';
  if (typeof value !== 'string') {
    throw validationError('evidenceQuality must be a string.', { field: 'evidenceQuality' });
  }
  const trimmed = value.trim();
  if (!(AUTOPILOT_EVIDENCE_QUALITY_VALUES as readonly string[]).includes(trimmed)) {
    throw validationError('Invalid evidenceQuality value.', { field: 'evidenceQuality' });
  }
  return trimmed;
}

export function parseResearchSourceType(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'manual';
  if (typeof value !== 'string') {
    throw validationError('sourceType must be a string.', { field: 'sourceType' });
  }
  const trimmed = value.trim();
  if (!(AUTOPILOT_RESEARCH_SOURCE_TYPES as readonly string[]).includes(trimmed)) {
    throw validationError('Invalid research sourceType.', { field: 'sourceType' });
  }
  if (trimmed === 'future_provider') {
    throw validationError(
      'future_provider is reserved and cannot be used until Phase 2C.',
      { field: 'sourceType' },
    );
  }
  return trimmed;
}

export const RESEARCH_SNAPSHOT_UPDATE_ALLOWLIST = [
  'query',
  'market',
  'language',
  'location',
  'searchIntent',
  'serpEvidence',
  'businessAlignment',
  'contentArchitecture',
  'riskAssessment',
  'researchNotes',
  'evidenceQuality',
  'sourceType',
] as const;

export type ResearchSnapshotUpdateAllowlist =
  (typeof RESEARCH_SNAPSHOT_UPDATE_ALLOWLIST)[number];
