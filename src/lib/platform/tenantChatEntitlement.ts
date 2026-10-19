/**
 * Central tenant chat entitlement.
 * Installation authorization and connector health are separate records.
 * No entitlement row preserves the tenant's existing chat behavior.
 * A failed entitlement read denies chat so a stored suspension cannot reopen.
 */

import { foldTenantAccountGate, type TenantAccountChatGate } from './tenantAccountModel.ts';
import { SourceResolutionError } from './sourceResolver.ts';

export const TENANT_CHAT_ENTITLEMENT_STATUSES = ['entitled', 'suspended', 'revoked'] as const;

export type TenantChatEntitlementStatus = (typeof TENANT_CHAT_ENTITLEMENT_STATUSES)[number];

export const TENANT_CHAT_ENTITLEMENT_REASON_MAX = 512;

export type TenantChatEntitlementRecord = {
  tenantId: string;
  status: TenantChatEntitlementStatus;
  reason: string;
  updatedByUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TenantChatEntitlementAuditRecord = {
  id: number;
  tenantId: string;
  actorUserId: number | null;
  status: TenantChatEntitlementStatus;
  reason: string;
  createdAt: Date;
};

export type TenantChatEntitlementStore = {
  find(tenantId: string): Promise<TenantChatEntitlementRecord | null>;
  list(tenantIds?: readonly string[]): Promise<TenantChatEntitlementRecord[]>;
  recentAudits(tenantId: string, limit: number): Promise<TenantChatEntitlementAuditRecord[]>;
  set(input: {
    tenantId: string;
    status: TenantChatEntitlementStatus;
    reason: string;
    actorUserId: number;
    at: Date;
  }): Promise<TenantChatEntitlementRecord>;
};

export type EffectiveTenantChatBasis =
  | 'allowed_existing'
  | 'allowed_entitled'
  | 'unknown_tenant'
  | 'inactive_tenant'
  | 'capability_disabled'
  | 'suspended'
  | 'revoked'
  | 'entitlement_required'
  | 'store_unavailable';

export type EffectiveTenantChatDecision = {
  allowed: boolean;
  basis: EffectiveTenantChatBasis;
};

export type EntitlementLookupResult =
  | { availability: 'ready'; record: { status: string } | null }
  | { availability: 'unavailable' };

export class TenantChatEntitlementUnavailableError extends Error {
  readonly status = 503;

  constructor() {
    super('Chat is temporarily unavailable.');
    this.name = 'TenantChatEntitlementUnavailableError';
  }
}

/**
 * Pure decision. Activation and the compile-time capability map are applied
 * before any entitlement row. Entitled cannot turn chat on when those gates are closed.
 * An unavailable store is a deny, never the no-row compatibility path.
 */
export function decideEffectiveTenantChat(input: {
  known: boolean;
  active: boolean;
  compileTimeChat: boolean;
  entitlement: EntitlementLookupResult;
  requiresExplicitEntitlement?: boolean;
}): EffectiveTenantChatDecision {
  if (!input.known) return { allowed: false, basis: 'unknown_tenant' };
  if (!input.active) return { allowed: false, basis: 'inactive_tenant' };
  if (!input.compileTimeChat) return { allowed: false, basis: 'capability_disabled' };
  if (input.entitlement.availability === 'unavailable') {
    return { allowed: false, basis: 'store_unavailable' };
  }
  const status = input.entitlement.record?.status;
  if (!status && input.requiresExplicitEntitlement) return { allowed: false, basis: 'entitlement_required' };
  if (!status) return { allowed: true, basis: 'allowed_existing' };
  if (status === 'entitled') return { allowed: true, basis: 'allowed_entitled' };
  if (status === 'suspended') return { allowed: false, basis: 'suspended' };
  if (status === 'revoked') return { allowed: false, basis: 'revoked' };
  return { allowed: false, basis: 'store_unavailable' };
}

export async function resolveEffectiveTenantChat(input: {
  tenantId: string;
  env?: NodeJS.ProcessEnv;
  lookup: () => Promise<{ status: TenantChatEntitlementStatus } | null>;
  account?: () => Promise<TenantAccountChatGate>;
}): Promise<EffectiveTenantChatDecision> {
  const env = input.env ?? process.env;
  let gate: TenantAccountChatGate = { availability: 'legacy' };
  if (input.account) {
    try {
      gate = await input.account();
    } catch {
      gate = { availability: 'unavailable' };
    }
  }
  const folded = foldTenantAccountGate({ tenantId: input.tenantId, env, gate });
  if (folded.shortCircuit === 'store_unavailable') {
    return { allowed: false, basis: 'store_unavailable' };
  }
  if (!folded.known || !folded.active || !folded.compileTimeChat) {
    return decideEffectiveTenantChat({
      known: folded.known,
      active: folded.active,
      compileTimeChat: folded.compileTimeChat,
      requiresExplicitEntitlement: folded.requiresExplicitEntitlement,
      entitlement: { availability: 'ready', record: null },
    });
  }
  try {
    const record = await input.lookup();
    return decideEffectiveTenantChat({
      known: true,
      active: true,
      compileTimeChat: true,
      requiresExplicitEntitlement: folded.requiresExplicitEntitlement,
      entitlement: { availability: 'ready', record },
    });
  } catch {
    return decideEffectiveTenantChat({
      known: true,
      active: true,
      compileTimeChat: true,
      entitlement: { availability: 'unavailable' },
    });
  }
}

/** Public visitor-chat gate. Store failure is 503. Policy denial reuses the capability 403. */
export async function assertVisitorChatEntitlement(
  tenantId: string,
  lookup: () => Promise<{ status: TenantChatEntitlementStatus } | null>,
  env?: NodeJS.ProcessEnv,
): Promise<void> {
  const decision = await resolveEffectiveTenantChat({ tenantId, lookup, env });
  if (decision.basis === 'store_unavailable') throw new TenantChatEntitlementUnavailableError();
  if (!decision.allowed) {
    throw new SourceResolutionError('Capability "chat" is not enabled for this tenant.');
  }
}

export function isTenantChatEntitlementStatus(value: unknown): value is TenantChatEntitlementStatus {
  return typeof value === 'string'
    && (TENANT_CHAT_ENTITLEMENT_STATUSES as readonly string[]).includes(value);
}
