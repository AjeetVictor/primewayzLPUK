/** UK business calendar for SLA calculations. Update holidays annually. */
export const UK_BUSINESS_TIMEZONE = 'Europe/London';

/** Configurable UK public holidays — extend for future years. */
export const UK_BUSINESS_HOLIDAYS: readonly string[] = [
  '2026-01-01',
  '2026-04-03',
  '2026-04-06',
  '2026-05-04',
  '2026-05-25',
  '2026-08-31',
  '2026-12-25',
  '2026-12-28',
];

const HOLIDAY_SET = new Set(UK_BUSINESS_HOLIDAYS);

export function isWeekend(date: Date, timeZone = UK_BUSINESS_TIMEZONE): boolean {
  const weekday = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'short' }).format(date);
  return weekday === 'Sat' || weekday === 'Sun';
}

export function toDateKey(date: Date, timeZone = UK_BUSINESS_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
}

export function isUkBusinessHoliday(date: Date, timeZone = UK_BUSINESS_TIMEZONE): boolean {
  return HOLIDAY_SET.has(toDateKey(date, timeZone));
}

export function isUkBusinessDay(date: Date, timeZone = UK_BUSINESS_TIMEZONE): boolean {
  return !isWeekend(date, timeZone) && !isUkBusinessHoliday(date, timeZone);
}

export function addUkBusinessDays(
  start: Date,
  businessDays: number,
  timeZone = UK_BUSINESS_TIMEZONE,
): Date {
  if (businessDays <= 0) return new Date(start);

  const cursor = new Date(start);
  let remaining = businessDays;

  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (isUkBusinessDay(cursor, timeZone)) {
      remaining -= 1;
    }
  }

  return cursor;
}

export function calculateOneBusinessDaySlaDueAt(
  startAt: Date,
  timeZone = UK_BUSINESS_TIMEZONE,
): Date {
  let cursor = new Date(startAt);

  if (!isUkBusinessDay(cursor, timeZone)) {
    while (!isUkBusinessDay(cursor, timeZone)) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    cursor.setUTCHours(9, 0, 0, 0);
  }

  return addUkBusinessDays(cursor, 1, timeZone);
}

export function isSlaBreached(slaDueAt: Date | null | undefined, firstContactedAt: Date | null | undefined, now = new Date()): boolean {
  if (!slaDueAt) return false;
  if (firstContactedAt && firstContactedAt <= slaDueAt) return false;
  return now > slaDueAt;
}

export function computeSlaBreachedAt(
  slaDueAt: Date | null | undefined,
  firstContactedAt: Date | null | undefined,
  now = new Date(),
): Date | null {
  if (!isSlaBreached(slaDueAt, firstContactedAt, now)) return null;
  if (firstContactedAt && slaDueAt && firstContactedAt > slaDueAt) return firstContactedAt;
  return slaDueAt ?? null;
}
