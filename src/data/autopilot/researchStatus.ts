/**
 * Article Autopilot 2.0 — Phase 2B research snapshot status vocabularies.
 * String-literal unions (project convention — no Prisma enums).
 */

export const AUTOPILOT_RESEARCH_SNAPSHOT_STATUSES = [
  'draft',
  'ready_for_confirmation',
  'confirmed',
  'superseded',
] as const;

export type AutopilotResearchSnapshotStatus =
  (typeof AUTOPILOT_RESEARCH_SNAPSHOT_STATUSES)[number];

export const AUTOPILOT_RESEARCH_SOURCE_TYPES = [
  'manual',
  'pasted_json',
  'keyword_import_context',
  'future_provider',
] as const;

export type AutopilotResearchSourceType =
  (typeof AUTOPILOT_RESEARCH_SOURCE_TYPES)[number];

export const AUTOPILOT_EVIDENCE_QUALITY_VALUES = [
  'not_assessed',
  'low',
  'medium',
  'high',
] as const;

export type AutopilotEvidenceQuality =
  (typeof AUTOPILOT_EVIDENCE_QUALITY_VALUES)[number];

export const AUTOPILOT_RESEARCH_EDITABLE_STATUSES = [
  'draft',
  'ready_for_confirmation',
] as const;

export type AutopilotResearchEditableStatus =
  (typeof AUTOPILOT_RESEARCH_EDITABLE_STATUSES)[number];

export function isAutopilotResearchEditableStatus(
  status: string | null | undefined,
): status is AutopilotResearchEditableStatus {
  return (
    status === 'draft' || status === 'ready_for_confirmation'
  );
}

export function isAutopilotResearchImmutableStatus(
  status: string | null | undefined,
): boolean {
  return status === 'confirmed' || status === 'superseded';
}
