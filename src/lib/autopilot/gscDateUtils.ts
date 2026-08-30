/**
 * Shared Pacific-calendar date helpers for GSC sync.
 */

import { validationError } from './apiErrors.ts';
import { getGscPublicConfigStatus } from './gscConfig.ts';

export const GSC_PACIFIC_TZ = 'America/Los_Angeles';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Calendar date in America/Los_Angeles as YYYY-MM-DD. */
export function getPacificDateString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: GSC_PACIFIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  if (!y || !m || !d) {
    throw new Error('Unable to resolve Pacific calendar date.');
  }
  return `${y}-${m}-${d}`;
}

export function addDaysToDateString(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map((v) => Number.parseInt(v, 10));
  const utc = Date.UTC(y, m - 1, d) + deltaDays * 24 * 60 * 60 * 1000;
  const dt = new Date(utc);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

export type GscDateWindow = {
  dateFrom: string;
  dateTo: string;
};

export function computeDefaultGscDateWindow(
  now: Date = new Date(),
  options?: { lookbackDays?: number; dataDelayDays?: number },
): GscDateWindow {
  const publicCfg = getGscPublicConfigStatus();
  const lookbackDays = options?.lookbackDays ?? publicCfg.lookbackDays;
  const dataDelayDays = options?.dataDelayDays ?? publicCfg.dataDelayDays;
  const todayPacific = getPacificDateString(now);
  const dateTo = addDaysToDateString(todayPacific, -dataDelayDays);
  const dateFrom = addDaysToDateString(dateTo, -(lookbackDays - 1));
  return { dateFrom, dateTo };
}

export function enumerateDateStringsInclusive(
  dateFrom: string,
  dateTo: string,
  maxRangeDays: number,
): string[] {
  if (dateFrom > dateTo) {
    throw validationError('dateFrom must be on or before dateTo.', { dateFrom, dateTo });
  }
  const days: string[] = [];
  let cursor = dateFrom;
  let guard = 0;
  while (cursor <= dateTo) {
    days.push(cursor);
    cursor = addDaysToDateString(cursor, 1);
    guard += 1;
    if (guard > maxRangeDays) {
      throw validationError('Date range is too large.', { dateFrom, dateTo });
    }
  }
  return days;
}
