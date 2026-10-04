/**
 * Service-provider-owned visitor intelligence for operational chat consumers.
 *
 * Presence is derived at read time from ChatSession.visitorLastSeenAt and never stored.
 * Device / browser / OS values are reduced to fixed labels on write and again on read,
 * so a raw User-Agent (or any other client-supplied string) is never returned.
 * Unknown values are null: nothing is inferred from unrelated records.
 */

import { toOriginatingPagePath } from './chatOperationalSemantics.ts';
import { isStrongChatSessionId } from './chatSessionId.ts';

export const VISITOR_ONLINE_WINDOW_MS = 75 * 1000;
export const VISITOR_IDLE_WINDOW_MS = 5 * 60 * 1000;

export type VisitorPresence = 'online' | 'idle' | 'offline' | 'unknown';

function toValidDate(value: Date | string | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Timestamps slightly in the future (clock skew) count as online. */
export function resolveVisitorPresence(
  lastSeenAt: Date | string | null | undefined,
  now: number = Date.now(),
): VisitorPresence {
  const seen = toValidDate(lastSeenAt);
  if (!seen) return 'unknown';
  const age = now - seen.getTime();
  if (age <= VISITOR_ONLINE_WINDOW_MS) return 'online';
  if (age <= VISITOR_IDLE_WINDOW_MS) return 'idle';
  return 'offline';
}

// --- Normalised client context ---

const DEVICE_TYPES = ['desktop', 'mobile', 'tablet'] as const;
const BROWSERS = ['Chrome', 'Edge', 'Safari', 'Firefox', 'Opera', 'Samsung Internet', 'Other'] as const;
const OPERATING_SYSTEMS = ['Windows', 'macOS', 'iOS', 'Android', 'Linux', 'ChromeOS'] as const;

export type VisitorDeviceType = (typeof DEVICE_TYPES)[number];
export type VisitorBrowser = (typeof BROWSERS)[number];
export type VisitorOperatingSystem = (typeof OPERATING_SYSTEMS)[number];

function fromAllowList<T extends string>(allowed: readonly T[], value: string | null | undefined): T | null {
  const needle = (value ?? '').trim().toLowerCase();
  if (!needle) return null;
  return allowed.find((label) => label.toLowerCase() === needle) ?? null;
}

export function normalizeVisitorDeviceType(value: string | null | undefined): VisitorDeviceType | null {
  return fromAllowList(DEVICE_TYPES, value);
}

export function normalizeVisitorBrowser(value: string | null | undefined): VisitorBrowser | null {
  return fromAllowList(BROWSERS, value);
}

export function normalizeVisitorOperatingSystem(value: string | null | undefined): VisitorOperatingSystem | null {
  return fromAllowList(OPERATING_SYSTEMS, value);
}

const USER_AGENT_MAX_LENGTH = 1024;

export function deriveOperatingSystem(userAgent: string | null | undefined): VisitorOperatingSystem | null {
  const ua = (userAgent ?? '').slice(0, USER_AGENT_MAX_LENGTH);
  if (!ua) return null;
  if (/Windows NT|Windows Phone|Win64|Win32/i.test(ua)) return 'Windows';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh|Mac OS X/.test(ua)) return 'macOS';
  if (/Linux|X11/.test(ua)) return 'Linux';
  return null;
}

export function deriveDeviceType(userAgent: string | null | undefined): VisitorDeviceType | null {
  const ua = (userAgent ?? '').slice(0, USER_AGENT_MAX_LENGTH);
  if (!ua) return null;
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
  if (/Mobile|iPhone|iPod/i.test(ua)) return 'mobile';
  if (/Windows NT|Macintosh|X11|CrOS|Linux/i.test(ua)) return 'desktop';
  return null;
}

export function deriveBrowser(userAgent: string | null | undefined): VisitorBrowser | null {
  const ua = (userAgent ?? '').slice(0, USER_AGENT_MAX_LENGTH);
  if (!ua) return null;
  if (/Edg(e|A|iOS)?\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/SamsungBrowser\//.test(ua)) return 'Samsung Internet';
  if (/Firefox\/|FxiOS\//.test(ua)) return 'Firefox';
  if (/Chrome\/|CriOS\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return null;
}

/**
 * Normalised labels derived from the request User-Agent header. Only the labels are
 * persisted; the header itself is never stored or returned.
 */
export function deriveVisitorClientContext(userAgent: string | null | undefined): {
  deviceType: VisitorDeviceType | null;
  browser: VisitorBrowser | null;
  operatingSystem: VisitorOperatingSystem | null;
} {
  return {
    deviceType: deriveDeviceType(userAgent),
    browser: deriveBrowser(userAgent),
    operatingSystem: deriveOperatingSystem(userAgent),
  };
}

// --- Visitor-supplied identity / contact ---

export const VISITOR_PHONE_MAX_LENGTH = 32;
const VISITOR_PHONE_PATTERN = /^\+?[0-9(][0-9 ()\-.]*$/;
const VISITOR_PHONE_MIN_DIGITS = 6;
const VISITOR_PHONE_MAX_DIGITS = 15;

/** Visitor-typed phone number in a plausible shape, otherwise null. */
export function normalizeVisitorPhone(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const phone = value.replace(/\s+/g, ' ').trim();
  if (!phone || phone.length > VISITOR_PHONE_MAX_LENGTH || !VISITOR_PHONE_PATTERN.test(phone)) return null;
  const digits = phone.replace(/\D/g, '').length;
  if (digits < VISITOR_PHONE_MIN_DIGITS || digits > VISITOR_PHONE_MAX_DIGITS) return null;
  return phone;
}

/** Stable browser-generated visitor identity: UUID v4 only, stored lower-case. */
export function normalizeVisitorId(value: unknown): string | null {
  return isStrongChatSessionId(value) ? value.toLowerCase() : null;
}

const VISITOR_NAME_MAX_LENGTH = 80;
const VISITOR_EMAIL_MAX_LENGTH = 320;
const VISITOR_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

/** Visitor-supplied name; email-shaped values are not presented as names. */
export function toVisitorName(value: string | null | undefined): string | null {
  const name = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!name || name.includes('@')) return null;
  return name.slice(0, VISITOR_NAME_MAX_LENGTH);
}

export function toVisitorEmail(value: string | null | undefined): string | null {
  const email = (value ?? '').trim();
  if (!email || email.length > VISITOR_EMAIL_MAX_LENGTH || !VISITOR_EMAIL_PATTERN.test(email)) return null;
  return email;
}

const LOCATION_PART_MAX_LENGTH = 120;

function toLocationPart(value: string | null | undefined): string | null {
  const part = (value ?? '').replace(/\s+/g, ' ').trim();
  return part ? part.slice(0, LOCATION_PART_MAX_LENGTH) : null;
}

// --- Operational response shape ---

export type VisitorProfileRow = {
  id: string;
  tenantId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  visitorId: string | null;
  visitorLastSeenAt: Date | null;
  visitStartedAt: Date | null;
  firstLandingPage: string | null;
  currentPageUrl: string | null;
  deviceType: string | null;
  browser: string | null;
  operatingSystem: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  createdAt: Date;
};

export type OperationalVisitor = {
  presence: VisitorPresence;
  lastSeenAt: string | null;
  firstSeenAt: string | null;
  returning: boolean | null;
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type OperationalVisitorSession = {
  startedAt: string | null;
  currentPage: string | null;
  originatingPage: string | null;
  lastActivityAt: string | null;
  device: VisitorDeviceType | null;
  browser: VisitorBrowser | null;
  operatingSystem: VisitorOperatingSystem | null;
  location: {
    city: string | null;
    region: string | null;
    country: string | null;
    approximate: true;
  };
};

const toIso = (value: Date | string | null | undefined): string | null => toValidDate(value)?.toISOString() ?? null;

/**
 * Builds the delegated visitor / session objects from an allow-listed profile row.
 * `returning` is null unless a stable visitorId exists and the earlier-session lookup ran.
 */
export function buildOperationalVisitorIntelligence(input: {
  profile: VisitorProfileRow;
  lastActivityAt: Date | string | null;
  returning: boolean | null;
  now: number;
}): { visitor: OperationalVisitor; session: OperationalVisitorSession } {
  const { profile } = input;
  return {
    visitor: {
      presence: resolveVisitorPresence(profile.visitorLastSeenAt, input.now),
      lastSeenAt: toIso(profile.visitorLastSeenAt),
      firstSeenAt: toIso(profile.createdAt),
      returning: profile.visitorId ? input.returning : null,
      name: toVisitorName(profile.name),
      email: toVisitorEmail(profile.email),
      phone: normalizeVisitorPhone(profile.phone),
    },
    session: {
      startedAt: toIso(profile.visitStartedAt ?? profile.createdAt),
      currentPage: toOriginatingPagePath(profile.currentPageUrl),
      originatingPage: toOriginatingPagePath(profile.firstLandingPage),
      lastActivityAt: toIso(input.lastActivityAt),
      device: normalizeVisitorDeviceType(profile.deviceType),
      browser: normalizeVisitorBrowser(profile.browser),
      operatingSystem: normalizeVisitorOperatingSystem(profile.operatingSystem),
      location: {
        city: toLocationPart(profile.city),
        region: toLocationPart(profile.region),
        country: toLocationPart(profile.country),
        approximate: true,
      },
    },
  };
}
