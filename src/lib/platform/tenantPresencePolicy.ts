/**
 * Tenant-scoped chat presence policy (WS-1).
 *
 * No row ⇒ legacy_forced_online (forced Available/Online may display without a fresh heartbeat).
 * heartbeat_required_online ⇒ Option 1: human Online requires an authorised fresh heartbeat.
 * Policy changes are Host/Owner-only, audited, and never auto-applied to production tenants.
 */

export const TENANT_PRESENCE_POLICIES = ['legacy_forced_online', 'heartbeat_required_online'] as const;

export type TenantPresencePolicyMode = (typeof TENANT_PRESENCE_POLICIES)[number];

/** Default when no policy row exists — preserves current production behaviour. */
export const DEFAULT_TENANT_PRESENCE_POLICY: TenantPresencePolicyMode = 'legacy_forced_online';

export const TENANT_PRESENCE_POLICY_REASON_MAX = 512;

export type TenantPresencePolicyRecord = {
  tenantId: string;
  policy: TenantPresencePolicyMode;
  reason: string;
  updatedByUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TenantPresencePolicyAuditRecord = {
  id: number;
  tenantId: string;
  actorUserId: number | null;
  policy: TenantPresencePolicyMode;
  reason: string;
  createdAt: Date;
};

export type TenantPresencePolicyStore = {
  find(tenantId: string): Promise<TenantPresencePolicyRecord | null>;
  list(tenantIds?: readonly string[]): Promise<TenantPresencePolicyRecord[]>;
  recentAudits(tenantId: string, limit: number): Promise<TenantPresencePolicyAuditRecord[]>;
  set(input: {
    tenantId: string;
    policy: TenantPresencePolicyMode;
    reason: string;
    actorUserId: number;
    at: Date;
  }): Promise<TenantPresencePolicyRecord>;
};

export function isTenantPresencePolicyMode(value: unknown): value is TenantPresencePolicyMode {
  return typeof value === 'string' && (TENANT_PRESENCE_POLICIES as readonly string[]).includes(value);
}

/** Effective policy for resolution — missing row keeps legacy forced-online behaviour. */
export function effectivePresencePolicy(
  record: { policy: string } | null | undefined,
): TenantPresencePolicyMode {
  if (record && isTenantPresencePolicyMode(record.policy)) return record.policy;
  return DEFAULT_TENANT_PRESENCE_POLICY;
}

export async function lookupEffectivePresencePolicy(
  store: Pick<TenantPresencePolicyStore, 'find'>,
  tenantId: string | null | undefined,
): Promise<TenantPresencePolicyMode> {
  if (!tenantId) return DEFAULT_TENANT_PRESENCE_POLICY;
  try {
    const record = await store.find(tenantId);
    return effectivePresencePolicy(record);
  } catch {
    // Store unavailable must not invent Option 1; keep legacy visitor behaviour.
    return DEFAULT_TENANT_PRESENCE_POLICY;
  }
}
