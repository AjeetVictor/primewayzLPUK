/**
 * Phase 2A keyword import status/source constants.
 */

export const AUTOPILOT_KEYWORD_IMPORT_SOURCE_TYPES = [
  'manual',
  'csv',
  'json',
  'gsc_export',
] as const;

export type AutopilotKeywordImportSourceType =
  (typeof AUTOPILOT_KEYWORD_IMPORT_SOURCE_TYPES)[number];

export const AUTOPILOT_KEYWORD_IMPORT_BATCH_STATUSES = [
  'previewed',
  'importing',
  'completed',
  'completed_with_errors',
  'failed',
  'cancelled',
] as const;

export type AutopilotKeywordImportBatchStatus =
  (typeof AUTOPILOT_KEYWORD_IMPORT_BATCH_STATUSES)[number];

export const AUTOPILOT_KEYWORD_CANDIDATE_STATUSES = [
  'new',
  'reviewing',
  'accepted',
  'rejected',
  'duplicate',
  'converted',
  'deferred',
] as const;

export type AutopilotKeywordCandidateStatus =
  (typeof AUTOPILOT_KEYWORD_CANDIDATE_STATUSES)[number];

export const AUTOPILOT_KEYWORD_DUPLICATE_HANDLING = [
  'import_and_mark',
  'skip_exact_duplicates',
] as const;

export type AutopilotKeywordDuplicateHandling =
  (typeof AUTOPILOT_KEYWORD_DUPLICATE_HANDLING)[number];

export const AUTOPILOT_KEYWORD_IMPORT_MAX_ROWS = 500;

export const AUTOPILOT_KEYWORD_MATCH_TYPES = [
  'exact_normalised_keyword',
  'exact_existing_topic_primary_keyword',
  'exact_static_title',
  'exact_slug_derived_phrase',
  'exact_current_url',
  'same_import_duplicate',
  'exact_persisted_candidate',
  'exact_cms_title',
  'exact_cms_slug',
  'exact_sdaas_title',
  'exact_sdaas_path',
] as const;

export type AutopilotKeywordMatchType = (typeof AUTOPILOT_KEYWORD_MATCH_TYPES)[number];
