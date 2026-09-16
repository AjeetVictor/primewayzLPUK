/**
 * Scheduling conversion attribution helpers.
 * Avoid double-counting UK widget analytics (calendly_event_scheduled + generate_lead).
 */

import type { SourceContext } from '../platform/sourceContext.ts';

export type SchedulingConversionAttribution = {
  tenantId: string;
  market: string | null;
  sourceSite: string | null;
  conversionType: 'booking_completed';
  /** False when client-side Calendly analytics already counted the booking. */
  shouldEmit: boolean;
  reason: string;
};

export function resolveSchedulingConversionAttribution(input: {
  tenantId: string;
  clientSideAnalyticsOwned: boolean;
  alreadyEmitted: boolean;
  source?: Pick<SourceContext, 'market' | 'sourceSite'> | null;
}): SchedulingConversionAttribution {
  if (input.alreadyEmitted) {
    return {
      tenantId: input.tenantId,
      market: input.source?.market ?? null,
      sourceSite: input.source?.sourceSite ?? null,
      conversionType: 'booking_completed',
      shouldEmit: false,
      reason: 'Conversion already attributed for this provider event.',
    };
  }
  if (input.clientSideAnalyticsOwned) {
    return {
      tenantId: input.tenantId,
      market: input.source?.market ?? null,
      sourceSite: input.source?.sourceSite ?? null,
      conversionType: 'booking_completed',
      shouldEmit: false,
      reason:
        'Client-side calendly_event_scheduled / generate_lead already owns UK widget attribution.',
    };
  }
  return {
    tenantId: input.tenantId,
    market: input.source?.market ?? null,
    sourceSite: input.source?.sourceSite ?? null,
    conversionType: 'booking_completed',
    shouldEmit: true,
    reason: 'Server webhook owns booking_completed attribution for this tenant connection.',
  };
}
