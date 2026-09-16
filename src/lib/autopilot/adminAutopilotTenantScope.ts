/**
 * Autopilot / GSC is currently wired to Primewayz UK only.
 * Thin compatibility layer over the shared Admin module-scope helper.
 */

import {
  resolveUkModuleAvailability,
  isUkModuleAvailable,
} from '../admin/adminModuleScope.ts';

export const AUTOPILOT_UK_SCOPE_NOTE = 'Autopilot is currently configured for Primewayz UK.';
export const AUTOPILOT_ALL_ENTITIES_SCOPE_NOTE = 'Autopilot is Primewayz UK scoped.';

/** True when Autopilot may appear for the current Admin tenant selector value. */
export function isAutopilotAvailableForAdminTenant(tenantFilter: string): boolean {
  return isUkModuleAvailable('autopilot', tenantFilter);
}

/** Explicit UK-only notice for Autopilot UI, or null when plain UK context. */
export function getAutopilotTenantScopeNote(tenantFilter: string): string | null {
  const availability = resolveUkModuleAvailability('autopilot', tenantFilter);
  if (!availability.available) return availability.scopeNote;
  return availability.scopeNote;
}
