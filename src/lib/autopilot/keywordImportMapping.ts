/**
 * Column mapping and metric parsing for Autopilot keyword imports.
 */

export const AUTOPILOT_KEYWORD_FIELD_ALIASES = {
  keyword: ['keyword', 'query', 'search query', 'search term', 'term', 'phrase'],
  clicks: ['clicks'],
  impressions: ['impressions'],
  ctr: ['ctr'],
  averagePosition: ['position', 'average position', 'avg position'],
  searchVolume: ['search volume', 'volume'],
  keywordDifficulty: ['keyword difficulty', 'difficulty', 'kd'],
  currentUrl: ['page', 'url', 'landing page'],
  country: ['country'],
  language: ['language'],
} as const;

export type AutopilotKeywordMappedField = keyof typeof AUTOPILOT_KEYWORD_FIELD_ALIASES;

export type AutopilotColumnMapping = Partial<Record<AutopilotKeywordMappedField, string>>;

export type MetricParseResult<T> =
  | { ok: true; value: T; display: string; inputWasExplicit: boolean }
  | { ok: false; error: string; value: null; display: string };

function normaliseHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function detectColumnMapping(headers: string[]): {
  mapping: AutopilotColumnMapping;
  detectedColumns: string[];
  unmappedColumns: string[];
} {
  const mapping: AutopilotColumnMapping = {};
  const usedHeaders = new Set<string>();
  const detectedColumns = headers.map((h) => h.trim()).filter(Boolean);

  for (const [field, aliases] of Object.entries(AUTOPILOT_KEYWORD_FIELD_ALIASES) as Array<
    [AutopilotKeywordMappedField, readonly string[]]
  >) {
    for (const header of headers) {
      const normalised = normaliseHeader(header);
      if (aliases.includes(normalised) && !usedHeaders.has(header)) {
        mapping[field] = header;
        usedHeaders.add(header);
        break;
      }
    }
  }

  const unmappedColumns = headers.filter((header) => header.trim() && !usedHeaders.has(header));
  return { mapping, detectedColumns, unmappedColumns };
}

export function mappingHasKeywordColumn(mapping: AutopilotColumnMapping): boolean {
  return Boolean(mapping.keyword && mapping.keyword.trim());
}

function emptyExplicitNull<T>(): MetricParseResult<T> {
  return { ok: true, value: null as T, display: 'Not supplied', inputWasExplicit: false };
}

export function parseNonNegativeIntegerMetric(
  raw: unknown,
  fieldLabel: string,
): MetricParseResult<number | null> {
  if (raw == null) return emptyExplicitNull();
  const text = String(raw).trim();
  if (text === '') return emptyExplicitNull();

  if (!/^\d+$/.test(text)) {
    return {
      ok: false,
      error: `${fieldLabel} must be a non-negative integer.`,
      value: null,
      display: text,
    };
  }
  const value = Number.parseInt(text, 10);
  return { ok: true, value, display: String(value), inputWasExplicit: true };
}

/**
 * CTR canonical storage: decimal fraction in [0, 1] (e.g. 0.125 for 12.5%).
 * Accepts explicit percentage ("12.5%") or fraction ("0.125").
 * Ambiguous values like "12.5" without % are rejected.
 */
export function parseCtrMetric(raw: unknown): MetricParseResult<number | null> {
  if (raw == null) return emptyExplicitNull();
  const text = String(raw).trim();
  if (text === '') return emptyExplicitNull();

  if (/%\s*$/.test(text)) {
    const numeric = Number.parseFloat(text.replace(/%\s*$/, '').trim());
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
      return {
        ok: false,
        error: 'CTR percentage must be a number between 0 and 100.',
        value: null,
        display: text,
      };
    }
    const value = Number((numeric / 100).toFixed(6));
    return {
      ok: true,
      value,
      display: `${value} (from ${numeric}%)`,
      inputWasExplicit: true,
    };
  }

  if (!/^\d+(\.\d+)?$/.test(text)) {
    return {
      ok: false,
      error: 'CTR must be a fraction (0–1) or percentage ending with %.',
      value: null,
      display: text,
    };
  }

  const numeric = Number.parseFloat(text);
  if (numeric > 1) {
    return {
      ok: false,
      error: 'Ambiguous CTR value. Use a fraction such as 0.125 or a percentage such as 12.5%.',
      value: null,
      display: text,
    };
  }
  if (numeric < 0) {
    return {
      ok: false,
      error: 'CTR cannot be negative.',
      value: null,
      display: text,
    };
  }

  const value = Number(numeric.toFixed(6));
  return { ok: true, value, display: String(value), inputWasExplicit: true };
}

export function parseAveragePositionMetric(raw: unknown): MetricParseResult<number | null> {
  if (raw == null) return emptyExplicitNull();
  const text = String(raw).trim();
  if (text === '') return emptyExplicitNull();
  if (!/^\d+(\.\d+)?$/.test(text)) {
    return {
      ok: false,
      error: 'Average position must be a positive number.',
      value: null,
      display: text,
    };
  }
  const numeric = Number.parseFloat(text);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return {
      ok: false,
      error: 'Average position must be greater than zero.',
      value: null,
      display: text,
    };
  }
  const value = Number(numeric.toFixed(4));
  return { ok: true, value, display: String(value), inputWasExplicit: true };
}

export function parseKeywordDifficultyMetric(raw: unknown): MetricParseResult<number | null> {
  if (raw == null) return emptyExplicitNull();
  const text = String(raw).trim();
  if (text === '') return emptyExplicitNull();
  if (!/^\d+(\.\d+)?$/.test(text)) {
    return {
      ok: false,
      error: 'Keyword difficulty must be a number between 0 and 100.',
      value: null,
      display: text,
    };
  }
  const numeric = Number.parseFloat(text);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
    return {
      ok: false,
      error: 'Keyword difficulty must be between 0 and 100.',
      value: null,
      display: text,
    };
  }
  const value = Number(numeric.toFixed(2));
  return { ok: true, value, display: String(value), inputWasExplicit: true };
}

export function getMappedCell(
  row: Record<string, unknown>,
  mapping: AutopilotColumnMapping,
  field: AutopilotKeywordMappedField,
): unknown {
  const header = mapping[field];
  if (!header) return undefined;
  return row[header];
}

export function collectUnmappedSourceData(
  row: Record<string, unknown>,
  mapping: AutopilotColumnMapping,
): Record<string, unknown> {
  const mappedHeaders = new Set(
    Object.values(mapping).filter((value): value is string => Boolean(value)),
  );
  const sourceData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!mappedHeaders.has(key)) {
      sourceData[key] = value;
    }
  }
  return sourceData;
}

export function formatMetricDisplay(value: number | null | undefined, kind?: 'ctr'): string {
  if (value == null) return 'Not supplied';
  if (kind === 'ctr') return String(value);
  return String(value);
}
