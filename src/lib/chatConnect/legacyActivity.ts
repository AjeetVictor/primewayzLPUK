import type { ChatConnectStore } from './types.ts';

/**
 * Records that an already-authorized operational API call authenticated.
 * This is not a connector heartbeat and must not change connection health or authorization.
 * Callers have to catch failures so a missing registry cannot fail the operational call.
 */
export async function recordLegacyChatConnectActivity(
  store: ChatConnectStore,
  input: { integrationId: string; tenantId: string; at: Date },
): Promise<void> {
  const installation = await store.findLegacyBinding(input.integrationId, input.tenantId);
  if (!installation) return;
  await store.update(installation.id, {
    lastAuthenticatedActivityAt: input.at,
    updatedAt: input.at,
  });
}
