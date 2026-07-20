/**
 * Pure keyword-import preview engine (no persistence).
 */

import {
  AUTOPILOT_KEYWORD_IMPORT_MAX_ROWS,
  type AutopilotKeywordDuplicateHandling,
  type AutopilotKeywordImportSourceType,
  type AutopilotKeywordMatchType,
} from '../../data/autopilot/keywordImportStatus.ts';
import {
  collectUnmappedSourceData,
  detectColumnMapping,
  getMappedCell,
  mappingHasKeywordColumn,
  parseAveragePositionMetric,
  parseCtrMetric,
  parseKeywordDifficultyMetric,
  parseNonNegativeIntegerMetric,
  type AutopilotColumnMapping,
} from './keywordImportMapping.ts';
import { normaliseAutopilotKeyword } from './keywordNormalisation.ts';
import {
  matchCmsSignals,
  matchSdaasSignals,
  matchStaticBlogSignals,
  type KeywordExactMatch,
} from './keywordMatchRegistry.ts';

export type PreviewRowInput = {
  sourceRowNumber?: number;
  values: Record<string, unknown>;
};

export type PreviewMatch = KeywordExactMatch & {
  relatedId?: number | string;
};

export type PreviewRowResult = {
  sourceRowNumber: number | null;
  originalKeyword: string;
  normalisedKeyword: string;
  valid: boolean;
  status: 'valid' | 'invalid' | 'duplicate';
  errors: string[];
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  ctrDisplay: string;
  averagePosition: number | null;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  currentUrl: string | null;
  country: string | null;
  language: string | null;
  sourceData: Record<string, unknown>;
  matches: PreviewMatch[];
  duplicateReason: string | null;
};

export type KeywordImportPreviewResult = {
  detectedColumns: string[];
  proposedMapping: AutopilotColumnMapping;
  mapping: AutopilotColumnMapping;
  unmappedColumns: string[];
  hasKeywordColumn: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  rows: PreviewRowResult[];
  examples: Array<{ original: string; normalised: string }>;
};

export type PreviewContext = {
  existingCandidateKeywords?: Array<{ id: number; normalisedKeyword: string }>;
  existingTopicKeywords?: Array<{ id: number; primaryKeyword: string }>;
  cmsPosts?: Array<{ title: string; slug: string }>;
};

function asOptionalString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

export function buildKeywordImportPreview(options: {
  sourceType: AutopilotKeywordImportSourceType | string;
  rows: PreviewRowInput[];
  columnMapping?: AutopilotColumnMapping | null;
  headers?: string[];
  context?: PreviewContext;
  duplicateHandling?: AutopilotKeywordDuplicateHandling;
}): KeywordImportPreviewResult {
  const headers =
    options.headers && options.headers.length > 0
      ? options.headers
      : options.rows[0]
        ? Object.keys(options.rows[0].values)
        : [];

  const detected = detectColumnMapping(headers);
  const mapping: AutopilotColumnMapping = {
    ...detected.mapping,
    ...(options.columnMapping || {}),
  };

  const hasKeyword = mappingHasKeywordColumn(mapping);
  const limitedRows = options.rows.slice(0, AUTOPILOT_KEYWORD_IMPORT_MAX_ROWS);
  const seenInImport = new Map<string, number>();
  const results: PreviewRowResult[] = [];

  for (let index = 0; index < limitedRows.length; index += 1) {
    const input = limitedRows[index];
    const sourceRowNumber =
      typeof input.sourceRowNumber === 'number' && input.sourceRowNumber > 0
        ? input.sourceRowNumber
        : index + 1;
    const errors: string[] = [];
    const matches: PreviewMatch[] = [];

    if (!hasKeyword) {
      errors.push('A keyword/query column must be mapped before import.');
    }

    const keywordRaw = getMappedCell(input.values, mapping, 'keyword');
    const { original, normalised } = normaliseAutopilotKeyword(keywordRaw);
    if (!original) {
      errors.push('Keyword is required.');
    }

    const impressions = parseNonNegativeIntegerMetric(
      getMappedCell(input.values, mapping, 'impressions'),
      'Impressions',
    );
    const clicks = parseNonNegativeIntegerMetric(
      getMappedCell(input.values, mapping, 'clicks'),
      'Clicks',
    );
    const ctr = parseCtrMetric(getMappedCell(input.values, mapping, 'ctr'));
    const averagePosition = parseAveragePositionMetric(
      getMappedCell(input.values, mapping, 'averagePosition'),
    );
    const searchVolume = parseNonNegativeIntegerMetric(
      getMappedCell(input.values, mapping, 'searchVolume'),
      'Search volume',
    );
    const keywordDifficulty = parseKeywordDifficultyMetric(
      getMappedCell(input.values, mapping, 'keywordDifficulty'),
    );

    for (const metric of [
      impressions,
      clicks,
      ctr,
      averagePosition,
      searchVolume,
      keywordDifficulty,
    ]) {
      if (!metric.ok && metric.error) errors.push(metric.error);
    }

    const currentUrl = asOptionalString(getMappedCell(input.values, mapping, 'currentUrl'));
    const country = asOptionalString(getMappedCell(input.values, mapping, 'country'));
    const language = asOptionalString(getMappedCell(input.values, mapping, 'language'));
    const sourceData = collectUnmappedSourceData(input.values, mapping);

    let duplicateReason: string | null = null;

    if (normalised) {
      const priorIndex = seenInImport.get(normalised);
      if (priorIndex != null) {
        matches.push({
          matchType: 'same_import_duplicate',
          label: `Duplicate of row ${priorIndex} in this import`,
          value: normalised,
          relatedId: priorIndex,
        });
        duplicateReason = `Exact normalised keyword matches row ${priorIndex} in this import.`;
      } else {
        seenInImport.set(normalised, sourceRowNumber);
      }

      for (const candidate of options.context?.existingCandidateKeywords || []) {
        if (candidate.normalisedKeyword === normalised) {
          matches.push({
            matchType: 'exact_persisted_candidate',
            label: `Existing keyword candidate #${candidate.id}`,
            value: normalised,
            relatedId: candidate.id,
          });
          duplicateReason =
            duplicateReason ||
            `Exact normalised keyword matches existing candidate #${candidate.id}.`;
        }
      }

      for (const topic of options.context?.existingTopicKeywords || []) {
        if (normaliseAutopilotKeyword(topic.primaryKeyword).normalised === normalised) {
          matches.push({
            matchType: 'exact_existing_topic_primary_keyword',
            label: `Existing Autopilot topic #${topic.id} primary keyword`,
            value: topic.primaryKeyword,
            relatedId: topic.id,
          });
        }
      }

      matches.push(...matchStaticBlogSignals(normalised));
      matches.push(...matchSdaasSignals(normalised));
      matches.push(...matchCmsSignals(normalised, options.context?.cmsPosts || []));

      if (currentUrl) {
        const urlNorm = normaliseAutopilotKeyword(currentUrl).normalised;
        for (const match of matches) {
          if (
            match.matchType === 'exact_sdaas_path' ||
            match.matchType === 'exact_cms_slug' ||
            match.matchType === 'exact_slug_derived_phrase'
          ) {
            // already captured
          }
        }
        // Exact current URL against known paths is already covered via registries when keyword matches.
        // Additionally flag when the current URL string equals the keyword normalisation itself.
        if (urlNorm === normalised) {
          matches.push({
            matchType: 'exact_current_url',
            label: 'Current URL matches normalised keyword text',
            value: currentUrl,
          });
        }
      }
    }

    const valid = errors.length === 0;
    const isDuplicate = Boolean(duplicateReason);
    const status: PreviewRowResult['status'] = !valid
      ? 'invalid'
      : isDuplicate
        ? 'duplicate'
        : 'valid';

    results.push({
      sourceRowNumber,
      originalKeyword: original,
      normalisedKeyword: normalised,
      valid,
      status,
      errors,
      impressions: impressions.ok ? impressions.value : null,
      clicks: clicks.ok ? clicks.value : null,
      ctr: ctr.ok ? ctr.value : null,
      ctrDisplay: ctr.display,
      averagePosition: averagePosition.ok ? averagePosition.value : null,
      searchVolume: searchVolume.ok ? searchVolume.value : null,
      keywordDifficulty: keywordDifficulty.ok ? keywordDifficulty.value : null,
      currentUrl,
      country,
      language,
      sourceData,
      matches,
      duplicateReason,
    });
  }

  const validRows = results.filter((row) => row.valid && row.status !== 'duplicate').length;
  const invalidRows = results.filter((row) => !row.valid).length;
  const duplicateRows = results.filter((row) => row.valid && row.status === 'duplicate').length;

  return {
    detectedColumns: detected.detectedColumns,
    proposedMapping: detected.mapping,
    mapping,
    unmappedColumns: detected.unmappedColumns,
    hasKeywordColumn: hasKeyword,
    totalRows: results.length,
    validRows,
    invalidRows,
    duplicateRows,
    rows: results,
    examples: results
      .filter((row) => row.originalKeyword)
      .slice(0, 5)
      .map((row) => ({ original: row.originalKeyword, normalised: row.normalisedKeyword })),
  };
}

export function filterRowsForCommit(
  preview: KeywordImportPreviewResult,
  duplicateHandling: AutopilotKeywordDuplicateHandling = 'import_and_mark',
): PreviewRowResult[] {
  return preview.rows.filter((row) => {
    if (!row.valid) return false;
    if (row.status === 'duplicate' && duplicateHandling === 'skip_exact_duplicates') {
      return false;
    }
    return true;
  });
}

export function summariseMatchTypes(matches: PreviewMatch[]): AutopilotKeywordMatchType[] {
  return [...new Set(matches.map((match) => match.matchType))];
}
