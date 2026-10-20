/**
 * Per-tenant chat operator roles (UserTenantGrant.chatRole).
 *
 * Default is `none` (fail closed for new grants). Host/Owner always retains chat on
 * operational tenants. A reviewed compatibility path preserves today's access for
 * operations-role accounts that already hold a tenant grant until a Host sets an
 * explicit chatRole (chatRoleExplicit = true).
 *
 * Tenant Chat Entitlement (commercial on/off) and operator availability (presence)
 * remain separate decisions.
 */

import { resolveStoredChatSessionTenantId } from '../platform/sourceResolver.ts';
import { getTenantById, isTenantOperational } from '../platform/tenantRegistry.ts';
import { AdminTenantAccessError, type AdminTenantPrincipal } from './adminTenantAccess.ts';

export const TENANT_CHAT_ROLES = ['none', 'agent'] as const;
export type TenantChatRole = (typeof TENANT_CHAT_ROLES)[number];

export type TenantChatGrantRecord = {
  tenantId: string;
  chatRole: TenantChatRole;
  chatRoleExplicit: boolean;
};

export type TenantChatRolePrincipal = AdminTenantPrincipal & {
  /** When omitted, grants are inferred as non-explicit `none` from tenantIds (compat). */
  tenantChatGrants?: ReadonlyArray<TenantChatGrantRecord>;
};

export type EffectiveTenantChatRoleBasis =
  | 'platform_owner'
  | 'explicit_agent'
  | 'explicit_none'
  | 'legacy_operations_compat'
  | 'no_grant'
  | 'inactive_tenant'
  | 'default_none';

export type EffectiveTenantChatRoleDecision = {
  role: TenantChatRole;
  basis: EffectiveTenantChatRoleBasis;
};

export function isTenantChatRole(value: unknown): value is TenantChatRole {
  return typeof value === 'string' && (TENANT_CHAT_ROLES as readonly string[]).includes(value);
}

export function isOperationsChatRole(role?: string | null): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'editor' || role === 'viewer';
}

function grantForTenant(
  principal: TenantChatRolePrincipal,
  tenantId: string,
): TenantChatGrantRecord | null {
  const listed = principal.tenantChatGrants?.find((grant) => grant.tenantId === tenantId);
  if (listed) return listed;
  if (principal.tenantIds.includes(tenantId)) {
    return { tenantId, chatRole: 'none', chatRoleExplicit: false };
  }
  return null;
}

/**
 * Pure decision for one concrete tenant. Silver and other inactive tenants deny here
 * through isTenantOperational — the activation env gate stays authoritative.
 */
export function resolveEffectiveTenantChatRole(
  principal: TenantChatRolePrincipal,
  tenantId: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): EffectiveTenantChatRoleDecision {
  const resolvedTenantId = resolveStoredChatSessionTenantId(tenantId);
  const tenant = getTenantById(resolvedTenantId);
  if (!tenant || !isTenantOperational(tenant, env)) {
    return { role: 'none', basis: 'inactive_tenant' };
  }
  if (principal.isPlatformOwner) {
    return { role: 'agent', basis: 'platform_owner' };
  }

  const grant = grantForTenant(principal, resolvedTenantId);
  if (!grant) {
    return { role: 'none', basis: 'no_grant' };
  }
  if (grant.chatRoleExplicit) {
    if (grant.chatRole === 'agent') return { role: 'agent', basis: 'explicit_agent' };
    return { role: 'none', basis: 'explicit_none' };
  }
  if (grant.chatRole === 'agent') {
    return { role: 'agent', basis: 'explicit_agent' };
  }
  // Compatibility: non-explicit none + operations role + grant → keep today's chat access.
  if (isOperationsChatRole(principal.role)) {
    return { role: 'agent', basis: 'legacy_operations_compat' };
  }
  return { role: 'none', basis: 'default_none' };
}

export function assertAdminTenantChatAccess(
  tenantId: string | null | undefined,
  principal: TenantChatRolePrincipal | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): EffectiveTenantChatRoleDecision {
  if (!principal) {
    throw new AdminTenantAccessError(401, 'admin_access_required', 'Authenticated admin access is required.');
  }
  const decision = resolveEffectiveTenantChatRole(principal, tenantId, env);
  if (decision.role === 'agent') return decision;
  throw new AdminTenantAccessError(
    403,
    'chat_role_denied',
    'This account is not authorized for chat on the selected tenant.',
  );
}

/** Validate Host-supplied per-tenant chat roles. Unknown roles and inactive tenants fail closed. */
export function validateTenantChatGrants(
  input: unknown,
  env: NodeJS.ProcessEnv = process.env,
): TenantChatGrantRecord[] {
  if (!Array.isArray(input)) {
    throw new AdminTenantAccessError(400, 'invalid_tenant_chat_grants', 'tenantChatGrants must be an array.');
  }
  const byTenant = new Map<string, TenantChatGrantRecord>();
  for (const row of input) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      throw new AdminTenantAccessError(400, 'invalid_tenant_chat_grants', 'Each tenant chat grant must be an object.');
    }
    const tenantId = (row as { tenantId?: unknown }).tenantId;
    const chatRole = (row as { chatRole?: unknown }).chatRole;
    if (typeof tenantId !== 'string' || !tenantId) {
      throw new AdminTenantAccessError(400, 'invalid_tenant_chat_grants', 'tenantId is required on each chat grant.');
    }
    if (!isTenantChatRole(chatRole)) {
      throw new AdminTenantAccessError(400, 'invalid_tenant_chat_grants', 'chatRole must be none or agent.');
    }
    const tenant = getTenantById(tenantId);
    if (!tenant || !isTenantOperational(tenant, env)) {
      throw new AdminTenantAccessError(400, 'invalid_tenant_chat_grants', 'Chat grants must reference active tenants.');
    }
    byTenant.set(tenantId, {
      tenantId,
      chatRole,
      chatRoleExplicit: true,
    });
  }
  return [...byTenant.values()];
}

/**
 * Merge Host tenantIds with optional explicit chat roles.
 * Unspecified tenants keep default none / non-explicit (compatibility window).
 * Specifying a chatRole always marks the grant explicit.
 */
export function buildTenantGrantCreates(
  tenantIds: readonly string[],
  tenantChatGrants?: ReadonlyArray<TenantChatGrantRecord>,
): Array<{ tenantId: string; chatRole: TenantChatRole; chatRoleExplicit: boolean }> {
  const roleByTenant = new Map(
    (tenantChatGrants ?? []).map((grant) => [grant.tenantId, grant] as const),
  );
  return tenantIds.map((tenantId) => {
    const grant = roleByTenant.get(tenantId);
    if (grant) {
      return {
        tenantId,
        chatRole: grant.chatRole,
        chatRoleExplicit: grant.chatRoleExplicit === true,
      };
    }
    return { tenantId, chatRole: 'none' as const, chatRoleExplicit: false };
  });
}

/** Preserve prior roles for tenants that remain assigned when Host edits grants. */
export function mergeTenantChatGrantsForUpdate(input: {
  tenantIds: readonly string[];
  nextExplicit?: ReadonlyArray<TenantChatGrantRecord>;
  previous: ReadonlyArray<TenantChatGrantRecord>;
}): TenantChatGrantRecord[] {
  const previousByTenant = new Map(input.previous.map((grant) => [grant.tenantId, grant] as const));
  const explicitByTenant = new Map((input.nextExplicit ?? []).map((grant) => [grant.tenantId, grant] as const));
  return input.tenantIds.map((tenantId) => {
    const next = explicitByTenant.get(tenantId);
    if (next) return next;
    const previous = previousByTenant.get(tenantId);
    if (previous) return previous;
    return { tenantId, chatRole: 'none', chatRoleExplicit: false };
  });
}
