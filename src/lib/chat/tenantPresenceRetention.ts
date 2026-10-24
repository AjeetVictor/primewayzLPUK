/**
 * Bounded retention for tenant presence events and ingestion idempotency keys (WS-1).
 *
 * Ownership: opportunistic prune on successful presence writes (ingestion + Admin heartbeat).
 * No dedicated background worker — mirrors Chat Connect heartbeat idempotency retention.
 * Failures are swallowed so retention never blocks presence writes.
 */

import type { PresenceIdempotencyStore } from './operatorPresenceIngestion.ts';
import {
  TENANT_PRESENCE_EVENT_MAX_PER_TENANT,
  TENANT_PRESENCE_EVENT_RETENTION_MS,
  type TenantPresenceEventStore,
} from './tenantPresenceEvents.ts';

/** Keep aligned with OPERATOR_PRESENCE_IDEMPOTENCY_TTL_MS (value import avoided to prevent cycles). */
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/** Minimum gap between prune attempts (process-local throttle). */
export const TENANT_PRESENCE_PRUNE_INTERVAL_MS = 15 * 60 * 1000;

export const TENANT_PRESENCE_RETENTION = {
  eventsRetentionMs: TENANT_PRESENCE_EVENT_RETENTION_MS,
  eventsMaxPerTenant: TENANT_PRESENCE_EVENT_MAX_PER_TENANT,
  idempotencyTtlMs: IDEMPOTENCY_TTL_MS,
  pruneIntervalMs: TENANT_PRESENCE_PRUNE_INTERVAL_MS,
  ownership: 'opportunistic_on_presence_write',
} as const;

let lastPruneAttemptAt = 0;

export function resetTenantPresencePruneForTests(): void {
  lastPruneAttemptAt = 0;
}

export async function pruneTenantPresenceArtifacts(
  deps: {
    events: Pick<TenantPresenceEventStore, 'prune'>;
    idempotency: Pick<PresenceIdempotencyStore, 'prune'>;
  },
  now: Date = new Date(),
): Promise<void> {
  if (now.getTime() - lastPruneAttemptAt < TENANT_PRESENCE_PRUNE_INTERVAL_MS) return;
  lastPruneAttemptAt = now.getTime();
  try {
    await deps.events.prune(now);
  } catch {
    // Best-effort; throttle already advanced so a failing DB is not hit on every write.
  }
  try {
    await deps.idempotency.prune(now);
  } catch {
    // Same: retention must not fail the heartbeat.
  }
}
