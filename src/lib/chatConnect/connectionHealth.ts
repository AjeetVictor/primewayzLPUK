import {
  CHAT_CONNECT_CONNECTED_MAX_AGE_MS,
  CHAT_CONNECT_STALE_MAX_AGE_MS,
} from './constants.ts';
import type { ChatConnectConnectionHealth } from './types.ts';

export function deriveConnectionHealth(
  installation: { heartbeatProtocolAdopted: boolean; lastVerifiedHeartbeatAt: Date | null },
  now: Date,
): ChatConnectConnectionHealth {
  if (!installation.heartbeatProtocolAdopted || !installation.lastVerifiedHeartbeatAt) return 'unknown';
  const age = now.getTime() - installation.lastVerifiedHeartbeatAt.getTime();
  if (!Number.isFinite(age) || age < 0) return 'unknown';
  if (age <= CHAT_CONNECT_CONNECTED_MAX_AGE_MS) return 'connected';
  if (age <= CHAT_CONNECT_STALE_MAX_AGE_MS) return 'stale';
  return 'disconnected';
}
