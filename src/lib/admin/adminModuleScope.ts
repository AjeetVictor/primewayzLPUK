/**
 * Admin module scope model for the shared multi-tenant platform.
 *
 * - tenant: filtered by Admin entity selector (forms, audit leads, conversion, chat)
 * - platform: always available; never filtered by entity (user management, chat presence)
 * - pw-uk: Primewayz UK application/content modules (Autopilot, Blog CMS, Blog Comments)
 *
 * Tenant operational modules combine MODULE SCOPE + TENANT CAPABILITY.
 * Do not scatter `if (tenant === 'rrb')` checks in AdminPanel — use resolvers here.
 */

import { getSchedulingAvailability } from '../scheduling/availability.ts';
import {
  tenantSupportsCapability,
  type TenantCapability,
} from '../platform/tenantCapabilities.ts';
import { getTenantById } from '../platform/tenantRegistry.ts';

export type AdminModuleScope = 'tenant' | 'platform' | 'pw-uk';

export type AdminUkModuleId = 'autopilot' | 'blogCms' | 'blogComments';

/** Tenant-scoped operational modules gated by capability when a single entity is selected. */
export type AdminTenantCapabilityModuleId =
  | 'forms'
  | 'auditLeads'
  | 'conversion'
  | 'chatLeads'
  | 'chatHistory'
  | 'scheduling';

export type AdminModuleAvailability = {
  available: boolean;
  /** Short tab badge when available under All entities (or platform modules). */
  scopeBadge: string | null;
  /** Banner / title note when scope needs an explicit explanation. */
  scopeNote: string | null;
  /** Disabled nav label when unavailable for the selected entity. */
  unavailableLabel: string | null;
  /**
   * When scheduling capability is on but provider config is inactive.
   * CAPABILITY != ACTIVE PROVIDER CONFIGURATION.
   */
  configurationActive?: boolean;
};

const UK_MODULE_LABELS: Record<AdminUkModuleId, string> = {
  autopilot: 'Autopilot',
  blogCms: 'Blog CMS',
  blogComments: 'Blog Comments',
};

const TENANT_MODULE_LABELS: Record<AdminTenantCapabilityModuleId, string> = {
  forms: 'Form Responses',
  auditLeads: 'Audit Leads',
  conversion: 'Conversion',
  chatLeads: 'Chat Leads',
  chatHistory: 'Chat History',
  scheduling: 'Scheduling',
};

const TENANT_MODULE_CAPABILITY: Record<AdminTenantCapabilityModuleId, TenantCapability> = {
  forms: 'forms',
  auditLeads: 'audit',
  conversion: 'conversion',
  chatLeads: 'chat',
  chatHistory: 'chat',
  scheduling: 'scheduling',
};

export const UK_SCOPED_BADGE = 'UK scoped';
export const PLATFORM_WIDE_BADGE = 'Platform-wide';

export const PLATFORM_USER_MANAGEMENT_TITLE = 'Platform User Management';
export const PLATFORM_USER_MANAGEMENT_NOTE =
  'These users administer the shared Primewayz platform and are not associated with the selected business entity.';

export const GLOBAL_CHAT_PRESENCE_NOTE =
  'Global presence — one team services all Primewayz entities.';

export const SCHEDULING_CONFIG_INACTIVE_NOTE =
  'Scheduling capability is enabled; provider configuration is not active yet.';

/** Resolve availability + copy for UK-specific Admin modules. */
export function resolveUkModuleAvailability(
  moduleId: AdminUkModuleId,
  tenantFilter: string,
): AdminModuleAvailability {
  const label = UK_MODULE_LABELS[moduleId];

  // UK application modules are only native under pw-uk; All entities shows UK-scoped badge.
  if (tenantFilter !== 'pw-uk' && tenantFilter !== 'all') {
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

  // pw-uk — available without extra labeling.
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

/**
 * Resolve tenant operational module availability from MODULE SCOPE + TENANT CAPABILITY.
 * Under "All entities", modules stay selectable (cross-tenant ops); zeros are expected
 * only for tenants that actually have the capability.
 */
export function resolveTenantCapabilityModuleAvailability(
  moduleId: AdminTenantCapabilityModuleId,
  tenantFilter: string,
  env: NodeJS.ProcessEnv = process.env,
): AdminModuleAvailability {
  const label = TENANT_MODULE_LABELS[moduleId];
  const capability = TENANT_MODULE_CAPABILITY[moduleId];

  if (tenantFilter === 'all') {
    return {
      available: true,
      scopeBadge: null,
      scopeNote: null,
      unavailableLabel: null,
      configurationActive: moduleId === 'scheduling' ? undefined : undefined,
    };
  }

  const tenant = getTenantById(tenantFilter);
  if (!tenant) {
    return {
      available: false,
      scopeBadge: null,
      scopeNote: `${label} is unavailable for an unknown entity.`,
      unavailableLabel: `${label} unavailable`,
    };
  }

  if (!tenantSupportsCapability(tenantFilter, capability)) {
    return {
      available: false,
      scopeBadge: null,
      scopeNote: `${label} is not enabled for ${tenant.displayName}.`,
      unavailableLabel: `${label} unavailable — capability disabled`,
      configurationActive: false,
    };
  }

  if (moduleId === 'scheduling') {
    const scheduling = getSchedulingAvailability(
      { tenantId: tenant.tenantId },
      env,
    );
    if (!scheduling.enabled) {
      return {
        available: true,
        scopeBadge: null,
        scopeNote: SCHEDULING_CONFIG_INACTIVE_NOTE,
        unavailableLabel: null,
        configurationActive: false,
      };
    }
    return {
      available: true,
      scopeBadge: null,
      scopeNote: null,
      unavailableLabel: null,
      configurationActive: true,
    };
  }

  return {
    available: true,
    scopeBadge: null,
    scopeNote: null,
    unavailableLabel: null,
  };
}

export function isTenantCapabilityModuleAvailable(
  moduleId: AdminTenantCapabilityModuleId,
  tenantFilter: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return resolveTenantCapabilityModuleAvailability(moduleId, tenantFilter, env).available;
}

/**
 * @deprecated Prefer resolveTenantCapabilityModuleAvailability — kept for compatibility.
 * Previously always true; now capability-aware for single-entity selection.
 */
export function isTenantScopedModuleAvailable(tenantFilter: string): boolean {
  // Compatibility: "tenant-scoped modules exist as a class" — use per-module resolver for UX.
  if (tenantFilter === 'all') return true;
  return (
    isTenantCapabilityModuleAvailable('forms', tenantFilter) ||
    isTenantCapabilityModuleAvailable('auditLeads', tenantFilter) ||
    isTenantCapabilityModuleAvailable('conversion', tenantFilter) ||
    isTenantCapabilityModuleAvailable('chatLeads', tenantFilter)
  );
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

/** Tabs that must leave non-UK entity selection when a UK-only module is selected. */
export const UK_ONLY_ADMIN_TABS = ['autopilot', 'blog', 'comments'] as const;

const CAPABILITY_TAB_TO_MODULE: Record<string, AdminTenantCapabilityModuleId> = {
  forms: 'forms',
  'audit-leads': 'auditLeads',
  conversion: 'conversion',
  leads: 'chatLeads',
  chats: 'chatHistory',
};

export function shouldLeaveUkOnlyAdminTab(activeTab: string, tenantFilter: string): boolean {
  if (tenantFilter === 'pw-uk' || tenantFilter === 'all') return false;
  return (UK_ONLY_ADMIN_TABS as readonly string[]).includes(activeTab);
}

/** Leave capability-disabled operational tabs when switching to a restricted entity (e.g. RRB). */
export function shouldLeaveCapabilityDisabledAdminTab(
  activeTab: string,
  tenantFilter: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const moduleId = CAPABILITY_TAB_TO_MODULE[activeTab];
  if (!moduleId) return false;
  return !isTenantCapabilityModuleAvailable(moduleId, tenantFilter, env);
}

/** Preferred fallback tab when leaving a disabled module for a given entity. */
export function getPreferredAdminOperationsTab(tenantFilter: string): string {
  if (isTenantCapabilityModuleAvailable('chatLeads', tenantFilter)) return 'leads';
  if (isTenantCapabilityModuleAvailable('forms', tenantFilter)) return 'forms';
  if (isTenantCapabilityModuleAvailable('conversion', tenantFilter)) return 'conversion';
  return 'leads';
}
