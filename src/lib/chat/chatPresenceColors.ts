/**
 * Unified Primewayz chat presence colours (PW-CHAT-PRESENCE-02).
 *
 * Do not use theme `emerald-*` / `indigo-*` for presence: this project's
 * index.css remaps emerald → brand blue and indigo → pink.
 *
 * Semantic states (not admin login):
 * - Human online / available → green
 * - Away / busy → amber
 * - Offline → grey
 * - Automated assistance only → blue
 * - Service unavailable / error → red
 */

export const CHAT_PRESENCE_COLORS = {
  online: '#16A34A',
  away: '#F59E0B',
  offline: '#94A3B8',
  automated: '#0284C7',
  unavailable: '#DC2626',
} as const;

export type ChatPresenceColorKey = keyof typeof CHAT_PRESENCE_COLORS;

/**
 * Tailwind arbitrary-value classes — immune to theme colour remaps.
 * Literals must appear in source so the Tailwind scanner can detect them.
 */
export const CHAT_PRESENCE_DOT_CLASS: Record<ChatPresenceColorKey, string> = {
  online: 'bg-[#16A34A]',
  away: 'bg-[#F59E0B]',
  offline: 'bg-[#94A3B8]',
  automated: 'bg-[#0284C7]',
  unavailable: 'bg-[#DC2626]',
};

/** Visitor / admin availability payload status → colour key. */
export type ChatAvailabilityPresenceStatus =
  | 'online'
  | 'away'
  | 'offline'
  | 'assistant'
  | 'loading'
  | string;

/**
 * WordPress / operational team.status → colour key.
 *
 * `not_online` is the team-surface alias of visitor `assistant`: auto mode with
 * no recent human heartbeat, while automated guidance remains available
 * (`canAcceptMessages: true`). Blue is reserved for that confirmed state only.
 * Unknown / missing values map to grey offline — never to automated blue.
 */
export type OperationalTeamPresenceStatus =
  | 'available'
  | 'away'
  | 'offline'
  | 'not_online'
  | string;

export const ADMIN_AVAILABILITY_LABELS: Record<
  'online' | 'away' | 'offline' | 'assistant' | 'loading',
  string
> = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
  assistant: 'Automated assistance',
  loading: 'Loading',
};

/** Labels for operational / WordPress team.status (not visitor session presence). */
export const OPERATIONAL_TEAM_PRESENCE_LABELS: Record<
  'available' | 'away' | 'offline' | 'not_online',
  string
> = {
  available: 'Online',
  away: 'Away',
  offline: 'Offline',
  not_online: 'Automated assistance',
};

export function resolveChatAvailabilityPresenceColor(
  status: ChatAvailabilityPresenceStatus | null | undefined,
): ChatPresenceColorKey {
  if (status === 'online') return 'online';
  if (status === 'away') return 'away';
  if (status === 'offline') return 'offline';
  if (status === 'assistant') return 'automated';
  // loading / unknown / unavailable payloads → grey, never automated blue
  return 'offline';
}

export function resolveOperationalTeamPresenceColor(
  teamStatus: OperationalTeamPresenceStatus | null | undefined,
): ChatPresenceColorKey {
  if (teamStatus === 'available') return 'online';
  if (teamStatus === 'away') return 'away';
  if (teamStatus === 'offline') return 'offline';
  // Confirmed auto→assistant mapping from resolveChatPresence; not "unknown".
  if (teamStatus === 'not_online') return 'automated';
  return 'offline';
}

export function formatOperationalTeamPresenceLabel(
  teamStatus: OperationalTeamPresenceStatus | null | undefined,
): string {
  if (
    teamStatus === 'available'
    || teamStatus === 'away'
    || teamStatus === 'offline'
    || teamStatus === 'not_online'
  ) {
    return OPERATIONAL_TEAM_PRESENCE_LABELS[teamStatus];
  }
  if (!teamStatus) return 'Offline';
  return String(teamStatus);
}

export function resolveAdminAvailabilityDotClass(
  status: ChatAvailabilityPresenceStatus | null | undefined,
): string {
  return CHAT_PRESENCE_DOT_CLASS[resolveChatAvailabilityPresenceColor(status)];
}

export function formatAdminAvailabilityLabel(
  status: ChatAvailabilityPresenceStatus | null | undefined,
): string {
  if (status === 'online' || status === 'away' || status === 'offline' || status === 'assistant') {
    return ADMIN_AVAILABILITY_LABELS[status];
  }
  if (!status) return ADMIN_AVAILABILITY_LABELS.loading;
  return String(status);
}

/** Relative luminance (sRGB), WCAG 2.x. */
export function relativeLuminance(hex: string): number {
  const normalized = hex.replace('#', '').trim();
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Invalid hex colour: ${hex}`);
  }
  const channels = [0, 2, 4].map((i) => {
    const value = Number.parseInt(full.slice(i, i + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

/** WCAG contrast ratio between two hex colours (order-independent). */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Presence dots are decorative; accessible meaning comes from adjacent text labels.
 * Non-text UI contrast target is 3:1 against the surface the dot sits on.
 */
export const PRESENCE_DOT_MIN_CONTRAST = 3;

export const PRESENCE_DOT_SURFACES = {
  /** Admin banner / light launcher chrome */
  light: '#FFFFFF',
  /** Hosted / embed chat header navy */
  darkHeader: '#082445',
} as const;

export function presenceDotMeetsContrast(
  colorKey: ChatPresenceColorKey,
  surfaceHex: string,
  minRatio: number = PRESENCE_DOT_MIN_CONTRAST,
): boolean {
  return contrastRatio(CHAT_PRESENCE_COLORS[colorKey], surfaceHex) >= minRatio;
}
