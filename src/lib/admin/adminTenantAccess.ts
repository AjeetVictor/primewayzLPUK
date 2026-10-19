import { getTenantById, isTenantActive } from '../platform/tenantRegistry.ts';

export type AdminTenantPrincipal = {
  id: number;
  role: string;
  isPlatformOwner: boolean;
  tenantIds: readonly string[];
};

export class AdminTenantAccessError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AdminTenantAccessError';
    this.status = status;
    this.code = code;
  }
}

function activeGrantedTenantIds(principal: AdminTenantPrincipal): string[] {
  return [...new Set(principal.tenantIds)].filter((tenantId) => Boolean(getTenantById(tenantId) && isTenantActive(getTenantById(tenantId)!)));
}

/**
 * Resolve the requested admin filter and enforce the authenticated user's grants.
 * An omitted filter preserves the platform-owner UK default; a single-tenant operator
 * defaults to that grant, while multi-tenant operators must choose a tenant explicitly.
 */
export function resolveAuthorizedAdminTenantFilter(
  requested: string | undefined | null,
  principal: AdminTenantPrincipal | null | undefined,
): string | undefined {
  if (!principal) {
    throw new AdminTenantAccessError(401, 'admin_access_required', 'Authenticated admin access is required.');
  }

  const requestedValue = typeof requested === 'string' && requested.length > 0 ? requested : undefined;
  if (requestedValue === 'all') {
    if (!principal.isPlatformOwner) {
      throw new AdminTenantAccessError(403, 'platform_owner_required', 'All-tenant access is restricted to the platform Host/Owner.');
    }
    return undefined;
  }

  if (!requestedValue) {
    if (principal.isPlatformOwner) return 'pw-uk';
    const tenantIds = activeGrantedTenantIds(principal);
    if (tenantIds.length === 1) return tenantIds[0];
    if (tenantIds.length > 1) {
      throw new AdminTenantAccessError(400, 'tenant_selection_required', 'Select one of your assigned tenants.');
    }
    throw new AdminTenantAccessError(403, 'tenant_access_required', 'No active tenant access is assigned to this account.');
  }

  const tenant = getTenantById(requestedValue);
  if (!tenant || !isTenantActive(tenant)) {
    throw new AdminTenantAccessError(400, 'invalid_tenant_filter', 'Unknown or inactive tenant filter.');
  }
  const tenantId = tenant.tenantId;
  if (!principal.isPlatformOwner && !activeGrantedTenantIds(principal).includes(tenantId)) {
    throw new AdminTenantAccessError(403, 'tenant_access_denied', 'This account is not assigned to the selected tenant.');
  }
  return tenantId;
}

/** Verify a persisted tenant owner against the user's grants, independently of UI/query filters. */
export function assertAdminTenantAccess(
  tenantId: string | null | undefined,
  principal: AdminTenantPrincipal | null | undefined,
): void {
  if (!principal) {
    throw new AdminTenantAccessError(401, 'admin_access_required', 'Authenticated admin access is required.');
  }
  if (principal.isPlatformOwner) return;
  if (!tenantId || !activeGrantedTenantIds(principal).includes(tenantId)) {
    throw new AdminTenantAccessError(403, 'tenant_access_denied', "This record is outside the account's assigned tenants.");
  }
}

export function validateTenantGrants(tenantIds: unknown): string[] {
  if (!Array.isArray(tenantIds) || !tenantIds.every((tenantId) => typeof tenantId === 'string')) {
    throw new AdminTenantAccessError(400, 'invalid_tenant_grants', 'tenantIds must be an array of active tenant IDs.');
  }
  const unique = [...new Set(tenantIds)];
  if (unique.some((tenantId) => !Boolean(getTenantById(tenantId) && isTenantActive(getTenantById(tenantId)!)))) {
    throw new AdminTenantAccessError(400, 'invalid_tenant_grants', 'Tenant grants must reference active tenants.');
  }
  return unique;
}
