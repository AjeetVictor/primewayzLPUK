import { SourceResolutionError } from './sourceResolver.ts';
import { getTenantById } from './tenantRegistry.ts';

/**
 * Resolve the Admin tenant selector for operational queries.
 * Returns a concrete tenant id, or `undefined` for All entities (no tenant predicate).
 * Rejects inactive / unknown ids — never accepts arbitrary tenant strings.
 */
export function resolveAdminTenantFilter(requested: string | undefined | null): string | undefined {
  const value = typeof requested === 'string' && requested.length > 0 ? requested : 'pw-uk';
  if (value === 'all') return undefined;
  const tenant = getTenantById(value);
  if (!tenant?.active) {
    throw new SourceResolutionError('Unknown or inactive tenant filter.');
  }
  return tenant.tenantId;
}

/** Direct tenant column filter. Legacy NULL rows appear only under All entities. */
export function adminTenantWhere(tenantId: string | undefined): { tenantId: string } | Record<string, never> {
  return tenantId ? { tenantId } : {};
}

/** Nested session.tenantId filter for appointment / message relations. */
export function adminSessionTenantWhere(
  tenantId: string | undefined,
): { session: { tenantId: string } } | Record<string, never> {
  return tenantId ? { session: { tenantId } } : {};
}
