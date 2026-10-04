/**
 * Site-neutral visitor chat analytics guards shared by the UK widget and the
 * embeddable widget. No analytics transport lives here: callers inject a sink.
 */

export type VisitorChatAnalyticsSink = (
  eventName: string,
  params: Record<string, unknown>,
) => void;

export type VisitorChatAvailabilityState =
  | 'online'
  | 'away'
  | 'offline'
  | 'assistant'
  | 'unknown';

export const VISITOR_CHAT_PROHIBITED_ANALYTICS_KEYS = [
  'name',
  'email',
  'workEmail',
  'work_email',
  'company',
  'phone',
  'message',
  'text',
  'transcript',
  'filename',
  'originalName',
  'fileName',
  'attachment_url',
  'attachmentUrl',
  'sessionId',
  'session_id',
  'chatSessionId',
  'chat_session_id',
  'id',
  'ip',
  'referrer',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'tenantId',
  'tenant_id',
  'market',
  'sourceSite',
  'source_site',
  'sourceOrigin',
  'source_origin',
  'sourceChannel',
  'source_channel',
] as const;

export function assertNoProhibitedVisitorChatAnalyticsProps(
  payload: object,
): void {
  const record = payload as Record<string, unknown>;
  for (const key of VISITOR_CHAT_PROHIBITED_ANALYTICS_KEYS) {
    if (key in record) {
      throw new Error(`${key} must not appear in visitor chat analytics payloads`);
    }
  }
}

/** Analytics routes are path-only: query strings and fragments can carry private values. */
export function toVisitorChatAnalyticsRoute(route: string): string {
  return route.split('?')[0]?.split('#')[0] || '/';
}

export function normalizeVisitorChatAvailabilityState(
  status?: string,
): VisitorChatAvailabilityState | undefined {
  if (status === 'online') return 'online';
  if (status === 'away') return 'away';
  if (status === 'offline') return 'offline';
  if (status === 'assistant') return 'assistant';
  if (status == null || status === '') return undefined;
  return 'unknown';
}
