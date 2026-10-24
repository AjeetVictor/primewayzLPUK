/**
 * Tenant-scoped chat presence policy (WS-1).
 *
 * No row ⇒ legacy_forced_online (forced Available/Online may display without a fresh heartbeat).
 * heartbeat_required_online ⇒ Option 1: human Online requires an authorised fresh heartbeat.
 * Policy changes are Host/Owner-only, audited, and never auto-applied to production tenants.
 *
 * Availability integrity on store failure:
 * - A missing row (store answers null) preserves legacy behaviour during migration.
 * - A store throw/outage cannot be distinguished from an activated row, so resolution
 *   fail-closes: never manufacture human Online from forced Available alone.
 * - Activation remains durable in TenantPresencePolicy (+ audit); no unbounded in-memory policy cache.
 */

export const TENANT_PRESENCE_POLICIES = ['legacy_forced_online', 'heartbeat_required_online'] as const;

export type TenantPresencePolicyMode = (typeof TENANT_PRESENCE_POLICIES)[number];

/** Default when no policy row exists — preserves current production behaviour. */
export const DEFAULT_TENANT_PRESENCE_POLICY: TenantPresencePolicyMode = 'legacy_forced_online';

/**
 * Resolution policy used when the durable store cannot be read.
 * Fail-closed: Option-1 semantics so forced Available cannot invent Online.
 */
export const FAIL_CLOSED_PRESENCE_POLICY: TenantPresencePolicyMode = 'heartbeat_required_online';

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

/** How the effective resolution policy was obtained. */
export type PresencePolicyLookupSource =
  | 'row'
  | 'default_missing'
  | 'fail_closed_unavailable';

export type PresencePolicyLookupResult = {
  /** Policy used by resolveChatPresence (may be fail-closed on outage). */
  policy: TenantPresencePolicyMode;
  source: PresencePolicyLookupSource;
  /**
   * True when the durable store answered. False on throw/outage — activated vs missing
   * cannot be distinguished until the store recovers.
   */
  storeReadable: boolean;
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

/**
 * Look up the durable policy with an explicit source.
 *
 * Distinguishing activated vs missing:
 * - storeReadable + source `row` ⇒ activated (or explicitly set legacy) policy from DB.
 * - storeReadable + source `default_missing` ⇒ no row; legacy during migration.
 * - !storeReadable + source `fail_closed_unavailable` ⇒ outage; do not invent Online.
 */
export async function lookupPresencePolicy(
  store: Pick<TenantPresencePolicyStore, 'find'>,
  tenantId: string | null | undefined,
): Promise<PresencePolicyLookupResult> {
  if (!tenantId) {
    return { policy: DEFAULT_TENANT_PRESENCE_POLICY, source: 'default_missing', storeReadable: true };
  }
  try {
    const record = await store.find(tenantId);
    if (!record) {
      return { policy: DEFAULT_TENANT_PRESENCE_POLICY, source: 'default_missing', storeReadable: true };
    }
    return { policy: effectivePresencePolicy(record), source: 'row', storeReadable: true };
  } catch {
    return {
      policy: FAIL_CLOSED_PRESENCE_POLICY,
      source: 'fail_closed_unavailable',
      storeReadable: false,
    };
  }
}

/**
 * Resolution policy for visitor/team surfaces.
 * On store outage returns fail-closed Option-1 semantics (never manufactures Online).
 */
export async function lookupEffectivePresencePolicy(
  store: Pick<TenantPresencePolicyStore, 'find'>,
  tenantId: string | null | undefined,
): Promise<TenantPresencePolicyMode> {
  const result = await lookupPresencePolicy(store, tenantId);
  return result.policy;
}
