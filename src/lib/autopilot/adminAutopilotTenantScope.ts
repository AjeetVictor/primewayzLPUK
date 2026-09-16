/**
 * Autopilot / GSC is currently wired to Primewayz UK only.
 * Until tenant-specific Search Console connections exist, gate the module by Admin tenant context.
 */

export const AUTOPILOT_UK_SCOPE_NOTE = 'Autopilot is currently configured for Primewayz UK.';
export const AUTOPILOT_ALL_ENTITIES_SCOPE_NOTE = 'Autopilot is Primewayz UK scoped.';

/** True when Autopilot may appear for the current Admin tenant selector value. */
export function isAutopilotAvailableForAdminTenant(tenantFilter: string): boolean {
  return tenantFilter === 'pw-uk' || tenantFilter === 'all';
}

/** Explicit UK-only notice for Autopilot UI, or null when plain UK context. */
export function getAutopilotTenantScopeNote(tenantFilter: string): string | null {
  if (tenantFilter === 'pw-infotech') return AUTOPILOT_UK_SCOPE_NOTE;
  if (tenantFilter === 'all') return AUTOPILOT_ALL_ENTITIES_SCOPE_NOTE;
  return null;
}
