/**
 * Phase 2B research UI helpers — labels, filters, payload allowlists.
 */

import {
  AUTOPILOT_RESEARCH_READY_MIN_COMPLETENESS,
} from '../../data/autopilot/researchConfig.ts';
import {
  AUTOPILOT_EVIDENCE_QUALITY_VALUES,
  AUTOPILOT_RESEARCH_SNAPSHOT_STATUSES,
  AUTOPILOT_RESEARCH_SOURCE_TYPES,
  type AutopilotResearchSnapshotStatus,
} from '../../data/autopilot/researchStatus.ts';
import type {
  AutopilotOverlapMatchType,
  AutopilotSerpEvidence,
  AutopilotSerpEvidenceRow,
} from '../../data/autopilot/types.ts';
import { RESEARCH_SNAPSHOT_UPDATE_ALLOWLIST } from './researchValidation.ts';
import { isValidInternalPathOrSiteUrl } from './researchValidation.ts';

export const RESEARCH_CONFIRMATION_COPY =
  'Confirm this research snapshot and mark the topic’s research as complete? This copies the confirmed evidence to the topic record. It does not score, approve, generate, or publish an article.';

export const SERP_EVIDENCE_MANUAL_NOTICE =
  'SERP evidence is entered manually in this phase and is not verified automatically.';

export type AutopilotResearchQueueFilters = {
  q: string;
  topicStatus: string;
  snapshotStatus: string;
  primaryCategory: string;
  minCompleteness: string;
  maxCompleteness: string;
  hasExactConflict: boolean;
  hasHighOverlap: boolean;
  needsMoreResearch: boolean;
  limit: number;
  offset: number;
};

export const DEFAULT_RESEARCH_QUEUE_FILTERS: AutopilotResearchQueueFilters = {
  q: '',
  topicStatus: '',
  snapshotStatus: '',
  primaryCategory: '',
  minCompleteness: '',
  maxCompleteness: '',
  hasExactConflict: false,
  hasHighOverlap: false,
  needsMoreResearch: false,
  limit: 25,
  offset: 0,
};

const SNAPSHOT_STATUS_LABELS: Record<AutopilotResearchSnapshotStatus, string> = {
  draft: 'Draft',
  ready_for_confirmation: 'Ready for confirmation',
  confirmed: 'Confirmed',
  superseded: 'Superseded',
};

const INTENT_LABELS: Record<string, string> = {
  informational: 'Informational',
  commercial_investigation: 'Commercial investigation',
  transactional: 'Transactional',
  navigational: 'Navigational',
  mixed: 'Mixed',
  unknown: 'Unknown',
};

const JOURNEY_LABELS: Record<string, string> = {
  problem_awareness: 'Problem awareness',
  solution_awareness: 'Solution awareness',
  vendor_evaluation: 'Vendor evaluation',
  purchase_decision: 'Purchase decision',
  post_purchase: 'Post purchase',
  unknown: 'Unknown',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  service_page: 'Service page',
  blog_article: 'Blog article',
  guide: 'Guide',
  comparison: 'Comparison',
  category_page: 'Category page',
  tool: 'Tool',
  forum: 'Forum',
  video: 'Video',
  other: 'Other',
  unknown: 'Unknown',
};

const OVERLAP_LABELS: Record<AutopilotOverlapMatchType, string> = {
  exact_keyword_match: 'Exact keyword match',
  exact_title_match: 'Exact title match',
  exact_slug_match: 'Exact slug conflict',
  exact_route_match: 'Exact route match',
  phrase_containment: 'Phrase containment advisory',
  high_lexical_overlap: 'High lexical-overlap advisory',
  moderate_lexical_overlap: 'Moderate lexical-overlap advisory',
  same_category_advisory: 'Same-category advisory',
  same_cluster_advisory: 'Same-cluster advisory',
  internal_link_opportunity: 'Internal-link opportunity',
};

function titleCaseFallback(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getResearchSnapshotStatusLabel(status: string | null | undefined): string {
  if (!status) return 'No snapshot';
  if ((AUTOPILOT_RESEARCH_SNAPSHOT_STATUSES as readonly string[]).includes(status)) {
    return SNAPSHOT_STATUS_LABELS[status as AutopilotResearchSnapshotStatus];
  }
  return titleCaseFallback(status);
}

export function getSearchIntentLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return INTENT_LABELS[value] || titleCaseFallback(value);
}

export function getJourneyStageLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return JOURNEY_LABELS[value] || titleCaseFallback(value);
}

export function getSerpContentTypeLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return CONTENT_TYPE_LABELS[value] || titleCaseFallback(value);
}

export function getOverlapFindingLabel(matchType: string | null | undefined): string {
  if (!matchType) return 'Finding';
  if (matchType in OVERLAP_LABELS) {
    return OVERLAP_LABELS[matchType as AutopilotOverlapMatchType];
  }
  return titleCaseFallback(matchType);
}

export function getEvidenceQualityLabel(value: string | null | undefined): string {
  if (!value) return 'Not assessed';
  if ((AUTOPILOT_EVIDENCE_QUALITY_VALUES as readonly string[]).includes(value)) {
    return titleCaseFallback(value);
  }
  return titleCaseFallback(value);
}

export function formatCompletenessDisplay(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${Math.round(value * 10) / 10}%`;
}

export function formatReadinessSummary(ready: boolean, blockerCount: number, warningCount: number): string {
  if (ready) {
    return warningCount > 0
      ? `Ready for confirmation (${warningCount} warning${warningCount === 1 ? '' : 's'})`
      : 'Ready for confirmation';
  }
  return `${blockerCount} blocker${blockerCount === 1 ? '' : 's'} — needs more research`;
}

export function serializeResearchQueueFilters(
  filters: AutopilotResearchQueueFilters,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {
    limit: filters.limit,
    offset: filters.offset,
  };
  if (filters.q.trim()) out.q = filters.q.trim();
  if (filters.topicStatus) out.topicStatus = filters.topicStatus;
  if (filters.snapshotStatus) out.snapshotStatus = filters.snapshotStatus;
  if (filters.primaryCategory) out.primaryCategory = filters.primaryCategory;
  if (filters.minCompleteness !== '') out.minCompleteness = filters.minCompleteness;
  if (filters.maxCompleteness !== '') out.maxCompleteness = filters.maxCompleteness;
  if (filters.hasExactConflict) out.hasExactConflict = true;
  if (filters.hasHighOverlap) out.hasHighOverlap = true;
  if (filters.needsMoreResearch) out.needsMoreResearch = true;
  return out;
}

export function extractChangedResearchSections(
  previous: Record<string, unknown> | null | undefined,
  next: Record<string, unknown>,
): string[] {
  const keys = [
    'searchIntent',
    'serpEvidence',
    'businessAlignment',
    'contentArchitecture',
    'riskAssessment',
    'researchNotes',
    'evidenceQuality',
    'query',
  ];
  const changed: string[] = [];
  for (const key of keys) {
    if (!(key in next)) continue;
    if (JSON.stringify(previous?.[key] ?? null) !== JSON.stringify(next[key] ?? null)) {
      changed.push(key);
    }
  }
  return changed;
}

export function parseSerpEvidenceRows(value: unknown): AutopilotSerpEvidenceRow[] {
  if (!value || typeof value !== 'object') return [];
  const rows = (value as AutopilotSerpEvidence).rows;
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => row && typeof row === 'object') as AutopilotSerpEvidenceRow[];
}

export function buildResearchUpdatePayload(
  draft: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of RESEARCH_SNAPSHOT_UPDATE_ALLOWLIST) {
    if (key in draft) payload[key] = draft[key];
  }
  // Never include computed / actor / workflow fields
  for (const forbidden of [
    'version',
    'topicId',
    'status',
    'evidenceCompleteness',
    'completeness',
    'overlapAnalysis',
    'clusterHints',
    'internalLinkHints',
    'createdById',
    'updatedById',
    'confirmedById',
    'confirmedAt',
    'supersededAt',
    'createdAt',
    'updatedAt',
    'id',
  ]) {
    delete payload[forbidden];
  }
  return payload;
}

export function buildConfirmationPayload(confirmationNote: string): {
  confirmationNote: string;
} {
  return { confirmationNote: confirmationNote.trim() };
}

export function isResearchSnapshotReadOnly(status: string | null | undefined): boolean {
  return status === 'confirmed' || status === 'superseded';
}

export function meetsReadyCompletenessThreshold(completeness: number | null | undefined): boolean {
  return typeof completeness === 'number' && completeness >= AUTOPILOT_RESEARCH_READY_MIN_COMPLETENESS;
}

export {
  AUTOPILOT_RESEARCH_SNAPSHOT_STATUSES,
  AUTOPILOT_RESEARCH_SOURCE_TYPES,
  AUTOPILOT_EVIDENCE_QUALITY_VALUES,
  isValidInternalPathOrSiteUrl,
};
