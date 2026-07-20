/**
 * Activity log display helpers — safe summaries, redaction, entity linking.
 */

import { getEntityTypeLabel, getEventTypeLabel } from './adminAutopilotLabels.ts';

const REDACTED_KEYS = new Set([
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'providerMetadata',
  'rawPrompt',
  'systemPrompt',
]);

export type AutopilotActivityRowLike = {
  id?: number;
  eventType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actorDisplayName?: string | null;
  actorType?: string | null;
  actorId?: number | null;
  source?: string | null;
  reason?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
  correlationId?: string | null;
  createdAt?: string | Date | null;
};

export function formatAutopilotDate(
  value: string | Date | null | undefined,
  fallback = '—',
): string {
  if (value == null || value === '') return fallback;
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fallback;
  }
}

export function getActivityActorLabel(row: AutopilotActivityRowLike): string {
  if (row.actorDisplayName && row.actorDisplayName.trim()) {
    return row.actorDisplayName.trim();
  }
  if (row.actorType === 'system') return 'System';
  if (row.actorType === 'ai') return 'AI';
  if (row.actorId != null) return `User #${row.actorId}`;
  return 'Unknown actor';
}

export function buildSafeEventSummary(row: AutopilotActivityRowLike): string {
  const event = getEventTypeLabel(row.eventType);
  const entity = getEntityTypeLabel(row.entityType);
  const id = row.entityId ? ` ${row.entityId}` : '';
  return `${event} · ${entity}${id}`;
}

export function canOpenTopicFromActivity(row: AutopilotActivityRowLike): boolean {
  if (row.entityType !== 'topic') return false;
  const id = Number.parseInt(String(row.entityId || ''), 10);
  return Number.isInteger(id) && id > 0;
}

export function getTopicIdFromActivity(row: AutopilotActivityRowLike): number | null {
  if (!canOpenTopicFromActivity(row)) return null;
  return Number.parseInt(String(row.entityId), 10);
}

function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[truncated]';
  if (value == null) return value;
  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(input)) {
    if (REDACTED_KEYS.has(key) || /password|secret|token|apikey/i.test(key)) {
      output[key] = '[redacted]';
    } else {
      output[key] = redactValue(nested, depth + 1);
    }
  }
  return output;
}

/** Ensure sensitive metadata stays redacted even if the server already redacted it. */
export function ensureRedactedMetadata(metadata: unknown): unknown {
  return redactValue(metadata);
}

export function compactValuePreview(value: unknown, maxLength = 120): string {
  if (value == null) return '—';
  const safe = ensureRedactedMetadata(value);
  let text: string;
  try {
    text = typeof safe === 'string' ? safe : JSON.stringify(safe);
  } catch {
    text = String(safe);
  }
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}
