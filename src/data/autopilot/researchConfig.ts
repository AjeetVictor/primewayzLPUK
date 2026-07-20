/**
 * Article Autopilot 2.0 — Phase 2B research completeness and overlap config.
 * Git-tracked, versioned, deterministic. Completeness ≠ topic quality.
 */

export const AUTOPILOT_RESEARCH_COMPLETENESS_VERSION = 'research-completeness-v1' as const;

export const AUTOPILOT_OVERLAP_ANALYSIS_VERSION = 'overlap-analysis-v1' as const;

/** Minimum completeness (0–100) required to mark research ready for confirmation. */
export const AUTOPILOT_RESEARCH_READY_MIN_COMPLETENESS = 70;

export const AUTOPILOT_RESEARCH_SECTION_WEIGHTS = {
  searchIntent: 20,
  serpEvidence: 25,
  businessAlignment: 20,
  contentArchitecture: 20,
  riskAssessment: 15,
} as const;

export type AutopilotResearchSectionKey = keyof typeof AUTOPILOT_RESEARCH_SECTION_WEIGHTS;

/** Minimum SERP evidence rows unless an explicit evidence limitation is supplied. */
export const AUTOPILOT_SERP_MIN_ROWS = 3;

/** Minimum required sections or supporting questions for architecture completeness. */
export const AUTOPILOT_ARCHITECTURE_MIN_ITEMS = 3;

/**
 * Low-information English stop words removed before lexical token overlap.
 * Intentionally small and Git-tracked — no stemming.
 */
export const AUTOPILOT_OVERLAP_STOP_WORDS = [
  'a',
  'an',
  'and',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
] as const;

export const AUTOPILOT_LEXICAL_OVERLAP_THRESHOLDS = {
  /** High lexical overlap advisory. */
  high: { minJaccard: 0.75, minSharedTokens: 3 },
  /** Moderate lexical overlap advisory. */
  moderate: { minJaccard: 0.5, minSharedTokens: 3 },
} as const;

export const AUTOPILOT_RESEARCH_LIMITS = {
  maxSerpRows: 20,
  maxTitleLength: 300,
  maxUrlLength: 2000,
  maxNotesLength: 5000,
  maxSupportingQuestions: 50,
  maxRequiredSections: 50,
  maxInternalPaths: 50,
  maxSerpFeaturesPerRow: 20,
  maxQueryLength: 300,
  maxConfirmationNoteLength: 2000,
  maxResearchNotesLength: 10000,
} as const;

/** Recognised site hosts for internal URL path validation (no fetch). */
export const AUTOPILOT_RECOGNISED_SITE_HOSTS = [
  'uk.primewayz.com',
  'www.primewayz.com',
  'primewayz.com',
] as const;

export const AUTOPILOT_FORBIDDEN_CANNIBALISATION_PHRASES = [
  'guaranteed cannibalisation',
  'google will penalise',
  'google will penalize',
  'this page cannot rank',
  'duplicate content penalty',
  'confirmed seo conflict',
  'confirmed cannibalisation',
] as const;
