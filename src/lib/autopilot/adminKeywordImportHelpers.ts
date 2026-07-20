/**
 * Frontend helpers for Autopilot keyword import UI (Phase 2A).
 */

import {
  AUTOPILOT_CSV_MAX_BYTES,
  AUTOPILOT_CSV_MAX_ROWS,
  parseAutopilotCsv,
  csvRowsToObjects,
  sanitiseCellForDisplay,
} from './csvParser.ts';
import { detectColumnMapping, formatMetricDisplay, type AutopilotColumnMapping } from './keywordImportMapping.ts';
import { normaliseAutopilotKeyword } from './keywordNormalisation.ts';

export const KEYWORD_IMPORT_CONVERSION_COPY =
  'This creates a topic candidate for editorial research. It does not generate or publish an article.';

export function formatNotSupplied(value: unknown): string {
  if (value == null || value === '') return 'Not supplied';
  return String(value);
}

export function formatCtrDisplay(value: number | null | undefined): string {
  return formatMetricDisplay(value ?? null, 'ctr');
}

export function suggestWorkingTitleFromKeyword(keyword: string): string {
  const trimmed = keyword.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  return trimmed.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function buildConversionPayload(input: Record<string, unknown>): Record<string, unknown> {
  const allowed = [
    'workingTitle',
    'userProblem',
    'audience',
    'supportingKeywords',
    'market',
    'language',
    'location',
    'proposedSlug',
  ] as const;
  const payload: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in input) payload[key] = input[key];
  }
  // Never include privileged or source-metric fields
  for (const forbidden of [
    'id',
    'status',
    'primaryKeyword',
    'impressions',
    'clicks',
    'ctr',
    'searchVolume',
    'keywordDifficulty',
    'createdById',
    'topicStatus',
    'decisionStatus',
    'rawScore',
    'totalScore',
  ]) {
    delete payload[forbidden];
  }
  return payload;
}

export function conversionCopyImpliesGenerationOrPublication(copy: string): boolean {
  const lower = copy.toLowerCase();
  if (lower.includes('does not generate') || lower.includes('does not publish')) {
    return false;
  }
  return /\b(generate|publish|schedule)\b/.test(lower);
}

export type CandidateListFilters = {
  q: string;
  status: string;
  batchId: string;
  sourceType: string;
  duplicatesOnly: boolean;
  unconvertedOnly: boolean;
  minImpressions: string;
  minClicks: string;
  limit: number;
  offset: number;
};

export const DEFAULT_CANDIDATE_FILTERS: CandidateListFilters = {
  q: '',
  status: '',
  batchId: '',
  sourceType: '',
  duplicatesOnly: false,
  unconvertedOnly: false,
  minImpressions: '',
  minClicks: '',
  limit: 25,
  offset: 0,
};

export function serialiseCandidateFilters(filters: CandidateListFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.status) params.set('status', filters.status);
  if (filters.batchId.trim()) params.set('batchId', filters.batchId.trim());
  if (filters.sourceType) params.set('sourceType', filters.sourceType);
  if (filters.duplicatesOnly) params.set('duplicatesOnly', 'true');
  if (filters.unconvertedOnly) params.set('unconvertedOnly', 'true');
  if (filters.minImpressions.trim()) params.set('minImpressions', filters.minImpressions.trim());
  if (filters.minClicks.trim()) params.set('minClicks', filters.minClicks.trim());
  params.set('limit', String(filters.limit));
  params.set('offset', String(filters.offset));
  return params;
}

export function validateImportFileSize(byteLength: number): string | null {
  if (byteLength > AUTOPILOT_CSV_MAX_BYTES) {
    return `File exceeds maximum size of ${AUTOPILOT_CSV_MAX_BYTES} bytes.`;
  }
  return null;
}

export function parseCsvFileText(text: string): {
  headers: string[];
  rows: Array<Record<string, string>>;
  mapping: AutopilotColumnMapping;
  errors: Array<{ rowNumber: number; message: string }>;
} {
  const parsed = parseAutopilotCsv(text);
  const objects = csvRowsToObjects(
    parsed.headers,
    parsed.rows.map((row) => row.map((cell) => sanitiseCellForDisplay(cell))),
  );
  const { mapping } = detectColumnMapping(parsed.headers);
  return {
    headers: parsed.headers,
    rows: objects.slice(0, AUTOPILOT_CSV_MAX_ROWS),
    mapping,
    errors: parsed.errors,
  };
}

export function parseJsonCandidates(text: string): Array<Record<string, unknown>> {
  const parsed = JSON.parse(text) as unknown;
  if (Array.isArray(parsed)) {
    return parsed.filter((item) => item && typeof item === 'object') as Array<
      Record<string, unknown>
    >;
  }
  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>;
    if (Array.isArray(record.rows)) {
      return record.rows.filter((item) => item && typeof item === 'object') as Array<
        Record<string, unknown>
      >;
    }
    if (Array.isArray(record.keywords)) {
      return (record.keywords as unknown[]).map((keyword) => ({
        keyword: String(keyword),
      }));
    }
  }
  throw new Error('JSON must be an array of objects or { rows: [] }.');
}

export function manualKeywordRow(keyword: string): Record<string, string> {
  const { original } = normaliseAutopilotKeyword(keyword);
  return { keyword: original };
}
