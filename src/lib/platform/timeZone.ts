import { resolveTenantTimeZone } from './tenantRegistry.ts';

/**
 * Validate a candidate as a plausible IANA timezone using the runtime Intl API.
 * Never trust arbitrary timezone text for persistence/rendering without this check.
 */
export function isValidIanaTimeZone(timeZone: string): boolean {
  const trimmed = timeZone.trim();
  if (!trimmed) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

/** Browser IANA timezone when available and valid; otherwise null. */
export function resolveBrowserTimeZone(): string | null {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof timeZone !== 'string') return null;
    return isValidIanaTimeZone(timeZone) ? timeZone.trim() : null;
  } catch {
    return null;
  }
}

/**
 * Appointment `timezone` is the visitor/request timezone (preferred date/time context).
 * Prefer a valid candidate (typically browser IANA); otherwise tenant business fallback.
 */
export function resolveAppointmentRequestTimezone(
  candidate: unknown,
  tenantId: string | null | undefined,
): string {
  if (typeof candidate === 'string' && isValidIanaTimeZone(candidate)) {
    return candidate.trim();
  }
  return resolveTenantTimeZone(tenantId);
}
