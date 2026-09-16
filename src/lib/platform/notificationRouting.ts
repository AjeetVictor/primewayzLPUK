import type { SourceContext } from './sourceContext.ts';
import { getTenantById } from './tenantRegistry.ts';

export function getTenantNotificationRecipient(source: SourceContext, env: NodeJS.ProcessEnv = process.env): string | null {
  const key = getTenantById(source.tenantId)?.notificationRecipientEnv;
  return key ? env[key]?.trim() || null : null;
}
