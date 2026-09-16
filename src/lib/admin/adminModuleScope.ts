/**
 * Admin module scope model for the shared multi-tenant platform.
 *
 * - tenant: filtered by Admin entity selector (forms, audit leads, conversion, chat)
 * - platform: always available; never filtered by entity (user management, chat presence)
 * - pw-uk: Primewayz UK application/content modules (Autopilot, Blog CMS, Blog Comments)
 */

export type AdminModuleScope = 'tenant' | 'platform' | 'pw-uk';

export type AdminUkModuleId = 'autopilot' | 'blogCms' | 'blogComments';

export type AdminModuleAvailability = {
  available: boolean;
  /** Short tab badge when available under All entities (or platform modules). */
  scopeBadge: string | null;
  /** Banner / title note when scope needs an explicit explanation. */
  scopeNote: string | null;
  /** Disabled nav label when unavailable for the selected entity. */
  unavailableLabel: string | null;
};

const UK_MODULE_LABELS: Record<AdminUkModuleId, string> = {
  autopilot: 'Autopilot',
  blogCms: 'Blog CMS',
  blogComments: 'Blog Comments',
};

export const UK_SCOPED_BADGE = 'UK scoped';
export const PLATFORM_WIDE_BADGE = 'Platform-wide';

export const PLATFORM_USER_MANAGEMENT_TITLE = 'Platform User Management';
export const PLATFORM_USER_MANAGEMENT_NOTE =
  'These users administer the shared Primewayz platform and are not associated with the selected business entity.';

export const GLOBAL_CHAT_PRESENCE_NOTE =
  'Global presence — one team services all Primewayz entities.';

/** Resolve availability + copy for UK-specific Admin modules. */
export function resolveUkModuleAvailability(
  moduleId: AdminUkModuleId,
  tenantFilter: string,
): AdminModuleAvailability {
  const label = UK_MODULE_LABELS[moduleId];

  if (tenantFilter === 'pw-infotech') {
    return {
      available: false,
      scopeBadge: null,
      scopeNote: `${label} is currently configured for Primewayz UK.`,
      unavailableLabel: `${label} unavailable — configured for Primewayz UK`,
    };
  }

  if (tenantFilter === 'all') {
    return {
      available: true,
      scopeBadge: UK_SCOPED_BADGE,
      scopeNote: `${label} is Primewayz UK scoped.`,
      unavailableLabel: null,
    };
  }

  // Default / pw-uk — available without extra labeling.
  return {
    available: true,
    scopeBadge: null,
    scopeNote: null,
    unavailableLabel: null,
  };
}

export function isUkModuleAvailable(moduleId: AdminUkModuleId, tenantFilter: string): boolean {
  return resolveUkModuleAvailability(moduleId, tenantFilter).available;
}

/** Platform modules remain available under every entity selector value. */
export function isPlatformModuleAvailable(_tenantFilter: string): boolean {
  return true;
}

/** Platform modules must not apply the Admin entity selector to their data. */
export function doesPlatformModuleUseTenantFilter(): boolean {
  return false;
}

/** Tenant-scoped operational modules stay available for every entity (including Infotech zeros). */
export function isTenantScopedModuleAvailable(_tenantFilter: string): boolean {
  return true;
}

export function doesTenantScopedModuleUseTenantFilter(): boolean {
  return true;
}

export function getPlatformUserManagementAvailability(
  tenantFilter: string,
): AdminModuleAvailability {
  return {
    available: isPlatformModuleAvailable(tenantFilter),
    scopeBadge: PLATFORM_WIDE_BADGE,
    scopeNote: PLATFORM_USER_MANAGEMENT_NOTE,
    unavailableLabel: null,
  };
}

/** Tabs that must leave Infotech when a UK-only module is selected. */
export const UK_ONLY_ADMIN_TABS = ['autopilot', 'blog', 'comments'] as const;

export function shouldLeaveUkOnlyAdminTab(activeTab: string, tenantFilter: string): boolean {
  if (tenantFilter !== 'pw-infotech') return false;
  return (UK_ONLY_ADMIN_TABS as readonly string[]).includes(activeTab);
}
