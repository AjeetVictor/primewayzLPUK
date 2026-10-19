import {
  CHAT_CONNECT_HEARTBEAT_IDEMPOTENCY_PRUNE_BATCH,
  CHAT_CONNECT_HEARTBEAT_IDEMPOTENCY_PRUNE_INTERVAL_MS,
  CHAT_CONNECT_HEARTBEAT_IDEMPOTENCY_RETENTION_MS,
} from './constants.ts';
import type { ChatConnectStore } from './types.ts';

let lastPruneAttemptAt = 0;

export function resetHeartbeatIdempotencyPruneForTests(): void {
  lastPruneAttemptAt = 0;
}

/**
 * Deletes heartbeat idempotency keys older than the retention window.
 * Activation keys are left in place. A prune failure must not fail the heartbeat,
 * and a failing database is not retried on every subsequent heartbeat.
 */
export async function pruneExpiredHeartbeatIdempotency(store: ChatConnectStore, now: Date): Promise<void> {
  if (now.getTime() - lastPruneAttemptAt < CHAT_CONNECT_HEARTBEAT_IDEMPOTENCY_PRUNE_INTERVAL_MS) return;
  lastPruneAttemptAt = now.getTime();
  try {
    await store.pruneIdempotency({
      action: 'heartbeat',
      olderThan: new Date(now.getTime() - CHAT_CONNECT_HEARTBEAT_IDEMPOTENCY_RETENTION_MS),
      limit: CHAT_CONNECT_HEARTBEAT_IDEMPOTENCY_PRUNE_BATCH,
    });
  } catch {
    // Retention is best-effort. lastPruneAttemptAt stays set so the next heartbeats proceed.
  }
}
