/**
 * Authoritative Google Search Console sync date-range validation.
 * Single source for max range, latest safe date, and supported search types.
 */

import { validationError } from './apiErrors.ts';
import { getGscPublicConfigStatus } from './gscConfig.ts';
import {
  addDaysToDateString,
  computeDefaultGscDateWindow,
  enumerateDateStringsInclusive,
  getPacificDateString,
} from './gscDateUtils.ts';

export const GSC_SYNC_MAX_RANGE_DAYS = 400;

/** Search types accepted by the sync API (GSC Search Analytics). */
export const GSC_SUPPORTED_SEARCH_TYPES = ['web', 'image', 'video', 'news'] as const;

export type GscSupportedSearchType = (typeof GSC_SUPPORTED_SEARCH_TYPES)[number];

export type GscSyncDateBounds = {
  latestSafeDate: string;
  maxRangeDays: number;
  defaultDateFrom: string;
  defaultDateTo: string;
  lookbackDays: number;
  dataDelayDays: number;
};

export type ResolvedGscSyncDateRange = {
  dateFrom: string;
  dateTo: string;
  searchType: GscSupportedSearchType;
  calendarDayCount: number;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseStrictCalendarDate(value: string, field: string): string {
  const trimmed = value.trim();
  if (!DATE_RE.test(trimmed)) {
    throw validationError(`Invalid ${field}; expected YYYY-MM-DD.`, { field, value: trimmed });
  }
  const [y, m, d] = trimmed.split('-').map((part) => Number.parseInt(part, 10));
  const utc = Date.UTC(y, m - 1, d);
  const roundTrip = new Date(utc);
  if (
    roundTrip.getUTCFullYear() !== y ||
    roundTrip.getUTCMonth() !== m - 1 ||
    roundTrip.getUTCDate() !== d
  ) {
    throw validationError(`Invalid ${field}; not a valid calendar date.`, { field, value: trimmed });
  }
  return trimmed;
}

export function countInclusiveCalendarDays(dateFrom: string, dateTo: string): number {
  const fromMs = Date.parse(`${dateFrom}T00:00:00.000Z`);
  const toMs = Date.parse(`${dateTo}T00:00:00.000Z`);
  return Math.floor((toMs - fromMs) / 86400000) + 1;
}

/** Authoritative sync date bounds for API status and client UI. */
export function resolveGscSyncDateBounds(
  env: NodeJS.ProcessEnv = process.env,
  now: Date = new Date(),
): GscSyncDateBounds {
  const publicCfg = getGscPublicConfigStatus(env);
  const window = computeDefaultGscDateWindow(now, {
    lookbackDays: publicCfg.lookbackDays,
    dataDelayDays: publicCfg.dataDelayDays,
  });

  return {
    latestSafeDate: window.dateTo,
    maxRangeDays: GSC_SYNC_MAX_RANGE_DAYS,
    defaultDateFrom: window.dateFrom,
    defaultDateTo: window.dateTo,
    lookbackDays: publicCfg.lookbackDays,
    dataDelayDays: publicCfg.dataDelayDays,
  };
}

export type ValidateGscSyncDateInput = {
  dateFrom?: string | Date | null;
  dateTo?: string | Date | null;
  searchType?: string | null;
  now?: Date;
  bounds?: GscSyncDateBounds;
};

function normaliseOptionalDate(value: string | Date | null | undefined, field: string): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw validationError(`Invalid ${field}.`, { field });
    }
    return parseStrictCalendarDate(value.toISOString().slice(0, 10), field);
  }
  return parseStrictCalendarDate(value, field);
}

export function validateGscSyncDateRange(input: ValidateGscSyncDateInput): ResolvedGscSyncDateRange {
  const bounds = input.bounds ?? resolveGscSyncDateBounds(process.env, input.now);
  const hasFrom = input.dateFrom != null && String(input.dateFrom).trim() !== '';
  const hasTo = input.dateTo != null && String(input.dateTo).trim() !== '';

  if (hasFrom !== hasTo) {
    throw validationError('Both dateFrom and dateTo are required for a custom date range.', {
      dateFrom: hasFrom,
      dateTo: hasTo,
    });
  }

  let dateFrom = bounds.defaultDateFrom;
  let dateTo = bounds.defaultDateTo;

  if (hasFrom && hasTo) {
    dateFrom = normaliseOptionalDate(input.dateFrom, 'dateFrom')!;
    dateTo = normaliseOptionalDate(input.dateTo, 'dateTo')!;
  }

  if (dateFrom > dateTo) {
    throw validationError('dateFrom must be on or before dateTo.', { dateFrom, dateTo });
  }

  if (dateTo > bounds.latestSafeDate) {
    throw validationError('dateTo exceeds the latest safe Google Search Console reporting date.', {
      dateTo,
      latestSafeDate: bounds.latestSafeDate,
    });
  }

  const calendarDayCount = countInclusiveCalendarDays(dateFrom, dateTo);
  if (calendarDayCount > bounds.maxRangeDays) {
    throw validationError(
      `Date range exceeds the maximum of ${bounds.maxRangeDays} inclusive calendar days.`,
      { dateFrom, dateTo, calendarDayCount, maxRangeDays: bounds.maxRangeDays },
    );
  }

  const rawSearchType = (input.searchType ?? 'web').trim() || 'web';
  if (!GSC_SUPPORTED_SEARCH_TYPES.includes(rawSearchType as GscSupportedSearchType)) {
    throw validationError('Unsupported searchType.', {
      searchType: rawSearchType,
      supported: [...GSC_SUPPORTED_SEARCH_TYPES],
    });
  }

  return {
    dateFrom,
    dateTo,
    searchType: rawSearchType as GscSupportedSearchType,
    calendarDayCount,
  };
}

/** First calendar day of a Pacific month as YYYY-MM-DD. */
export function pacificMonthStart(year: number, month1: number): string {
  return `${year}-${String(month1).padStart(2, '0')}-01`;
}

/** Last calendar day of a Pacific month as YYYY-MM-DD. */
export function pacificMonthEnd(year: number, month1: number): string {
  const lastDay = new Date(Date.UTC(year, month1, 0)).getUTCDate();
  return `${year}-${String(month1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function parsePacificYearMonth(now: Date = new Date()): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = Number.parseInt(parts.find((p) => p.type === 'year')?.value ?? '1970', 10);
  const month = Number.parseInt(parts.find((p) => p.type === 'month')?.value ?? '1', 10);
  return { year, month };
}

export type GscDateRangePresetId =
  | 'last_7_days'
  | 'last_28_days'
  | 'last_90_days'
  | 'this_month'
  | 'previous_month'
  | 'custom';

export type GscDateRangePreset = {
  id: GscDateRangePresetId;
  label: string;
  dateFrom: string;
  dateTo: string;
  calendarDayCount: number;
};

export function resolveGscDateRangePreset(
  presetId: GscDateRangePresetId,
  bounds: Pick<GscSyncDateBounds, 'latestSafeDate'>,
  now: Date = new Date(),
): GscDateRangePreset {
  const { latestSafeDate } = bounds;
  const labels: Record<GscDateRangePresetId, string> = {
    last_7_days: 'Last 7 days',
    last_28_days: 'Last 28 days',
    last_90_days: 'Last 90 days',
    this_month: 'This month',
    previous_month: 'Previous month',
    custom: 'Custom',
  };

  if (presetId === 'custom') {
    return {
      id: presetId,
      label: labels.custom,
      dateFrom: latestSafeDate,
      dateTo: latestSafeDate,
      calendarDayCount: 1,
    };
  }

  if (presetId === 'last_7_days') {
    const dateFrom = addDaysToDateString(latestSafeDate, -6);
    return {
      id: presetId,
      label: labels.last_7_days,
      dateFrom,
      dateTo: latestSafeDate,
      calendarDayCount: 7,
    };
  }

  if (presetId === 'last_28_days') {
    const dateFrom = addDaysToDateString(latestSafeDate, -27);
    return {
      id: presetId,
      label: labels.last_28_days,
      dateFrom,
      dateTo: latestSafeDate,
      calendarDayCount: 28,
    };
  }

  if (presetId === 'last_90_days') {
    const dateFrom = addDaysToDateString(latestSafeDate, -89);
    return {
      id: presetId,
      label: labels.last_90_days,
      dateFrom,
      dateTo: latestSafeDate,
      calendarDayCount: 90,
    };
  }

  const { year, month } = parsePacificYearMonth(now);

  if (presetId === 'this_month') {
    const monthStart = pacificMonthStart(year, month);
    const monthEnd = pacificMonthEnd(year, month);
    const dateTo = monthEnd > latestSafeDate ? latestSafeDate : monthEnd;
    const dateFrom = monthStart > dateTo ? dateTo : monthStart;
    return {
      id: presetId,
      label: labels.this_month,
      dateFrom,
      dateTo,
      calendarDayCount: countInclusiveCalendarDays(dateFrom, dateTo),
    };
  }

  // previous_month
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const dateFrom = pacificMonthStart(prevYear, prevMonth);
  const dateTo = pacificMonthEnd(prevYear, prevMonth);
  return {
    id: presetId,
    label: labels.previous_month,
    dateFrom,
    dateTo,
    calendarDayCount: countInclusiveCalendarDays(dateFrom, dateTo),
  };
}

export function buildGscCustomSyncPayload(
  dateFrom: string,
  dateTo: string,
): { dateFrom: string; dateTo: string; searchType: 'web' } {
  return { dateFrom, dateTo, searchType: 'web' };
}

export function isGscSyncControlsDisabled(options: {
  syncing: boolean;
  syncLocked: boolean;
  connectionActive: boolean;
}): boolean {
  return options.syncing || options.syncLocked || !options.connectionActive;
}
