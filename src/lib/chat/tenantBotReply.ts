/**
 * The only source of automated visitor-facing bot text. Every reply is resolved from the
 * session's own tenant: an approved answer for a configured intent, otherwise that tenant's
 * offline acknowledgement. No cross-tenant or generic service answer is ever chosen.
 */

import {
  resolveTenantApprovedAnswer,
  resolveTenantChatPresentation,
} from '../platform/tenantRegistry.ts';
import { buildOfflineChatBotReply } from './visitorChatTypes.ts';

export type TenantBotReply = {
  kind: 'approved_answer' | 'offline_acknowledgement';
  text: string;
};

export function resolveOfflineAcknowledgement(tenantId: string | null | undefined): string {
  const presentation = resolveTenantChatPresentation(tenantId);
  if (presentation.offlineAcknowledgement) {
    return presentation.offlineAcknowledgement.replaceAll('{businessHours}', presentation.businessHours);
  }
  return buildOfflineChatBotReply(presentation);
}

export function resolveTenantBotReply(
  tenantId: string | null | undefined,
  intentKey: string | null | undefined,
): TenantBotReply {
  const approved = resolveTenantApprovedAnswer(tenantId, intentKey);
  if (approved) return { kind: 'approved_answer', text: approved };
  return { kind: 'offline_acknowledgement', text: resolveOfflineAcknowledgement(tenantId) };
}
