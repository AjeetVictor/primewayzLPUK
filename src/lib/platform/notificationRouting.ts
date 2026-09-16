import type { SourceContext } from './sourceContext.ts';
import { getTenantById } from './tenantRegistry.ts';

export type NotificationRouteResult = {
  recipient: string | null;
  envKey: string | null;
  skipped: boolean;
  reason: string | null;
};

/**
 * Resolve the tenant-owned notification destination.
 * Never falls back to another tenant's recipient.
 */
export function getTenantNotificationRecipient(
  source: SourceContext,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  return resolveTenantNotificationRoute(source, env).recipient;
}

export function resolveTenantNotificationRoute(
  source: SourceContext,
  env: NodeJS.ProcessEnv = process.env,
): NotificationRouteResult {
  const envKey = getTenantById(source.tenantId)?.notificationRecipientEnv ?? null;
  if (!envKey) {
    return {
      recipient: null,
      envKey: null,
      skipped: true,
      reason: `No notification env key configured for tenant ${source.tenantId}.`,
    };
  }
  const recipient = env[envKey]?.trim() || null;
  if (!recipient) {
    return {
      recipient: null,
      envKey,
      skipped: true,
      reason: `${envKey} is not configured; notification skipped for tenant ${source.tenantId}.`,
    };
  }
  return { recipient, envKey, skipped: false, reason: null };
}
