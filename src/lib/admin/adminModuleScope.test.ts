import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GLOBAL_CHAT_PRESENCE_NOTE,
  PLATFORM_USER_MANAGEMENT_NOTE,
  PLATFORM_USER_MANAGEMENT_TITLE,
  PLATFORM_WIDE_BADGE,
  UK_SCOPED_BADGE,
  doesPlatformModuleUseTenantFilter,
  doesTenantScopedModuleUseTenantFilter,
  getPlatformUserManagementAvailability,
  isPlatformModuleAvailable,
  isTenantScopedModuleAvailable,
  isUkModuleAvailable,
  resolveUkModuleAvailability,
  shouldLeaveUkOnlyAdminTab,
} from './adminModuleScope.ts';
import {
  AUTOPILOT_ALL_ENTITIES_SCOPE_NOTE,
  AUTOPILOT_UK_SCOPE_NOTE,
  getAutopilotTenantScopeNote,
  isAutopilotAvailableForAdminTenant,
} from '../autopilot/adminAutopilotTenantScope.ts';

test('pw-uk can access Autopilot, Blog CMS, and Blog Comments', () => {
  for (const moduleId of ['autopilot', 'blogCms', 'blogComments'] as const) {
    const availability = resolveUkModuleAvailability(moduleId, 'pw-uk');
    assert.equal(availability.available, true);
    assert.equal(availability.scopeBadge, null);
    assert.equal(availability.scopeNote, null);
    assert.equal(availability.unavailableLabel, null);
    assert.equal(isUkModuleAvailable(moduleId, 'pw-uk'), true);
  }
});

test('pw-infotech sees Autopilot, Blog CMS, and Blog Comments unavailable', () => {
  const cases = [
    {
      moduleId: 'autopilot' as const,
      unavailable: 'Autopilot unavailable — configured for Primewayz UK',
      note: AUTOPILOT_UK_SCOPE_NOTE,
    },
    {
      moduleId: 'blogCms' as const,
      unavailable: 'Blog CMS unavailable — configured for Primewayz UK',
      note: 'Blog CMS is currently configured for Primewayz UK.',
    },
    {
      moduleId: 'blogComments' as const,
      unavailable: 'Blog Comments unavailable — configured for Primewayz UK',
      note: 'Blog Comments is currently configured for Primewayz UK.',
    },
  ];

  for (const item of cases) {
    const availability = resolveUkModuleAvailability(item.moduleId, 'pw-infotech');
    assert.equal(availability.available, false);
    assert.equal(availability.unavailableLabel, item.unavailable);
    assert.equal(availability.scopeNote, item.note);
    assert.equal(availability.scopeBadge, null);
    assert.equal(isUkModuleAvailable(item.moduleId, 'pw-infotech'), false);
  }
});

test('all can access UK modules with UK-scoped indication', () => {
  const notes = {
    autopilot: AUTOPILOT_ALL_ENTITIES_SCOPE_NOTE,
    blogCms: 'Blog CMS is Primewayz UK scoped.',
    blogComments: 'Blog Comments is Primewayz UK scoped.',
  } as const;

  for (const moduleId of ['autopilot', 'blogCms', 'blogComments'] as const) {
    const availability = resolveUkModuleAvailability(moduleId, 'all');
    assert.equal(availability.available, true);
    assert.equal(availability.scopeBadge, UK_SCOPED_BADGE);
    assert.equal(availability.scopeNote, notes[moduleId]);
    assert.equal(availability.unavailableLabel, null);
  }
});

test('User Management remains available under every entity selector', () => {
  for (const tenant of ['pw-uk', 'pw-infotech', 'all']) {
    assert.equal(isPlatformModuleAvailable(tenant), true);
    const availability = getPlatformUserManagementAvailability(tenant);
    assert.equal(availability.available, true);
    assert.equal(availability.scopeBadge, PLATFORM_WIDE_BADGE);
    assert.equal(availability.scopeNote, PLATFORM_USER_MANAGEMENT_NOTE);
  }
  assert.equal(PLATFORM_USER_MANAGEMENT_TITLE, 'Platform User Management');
});

test('User Management data is not filtered by tenant', () => {
  assert.equal(doesPlatformModuleUseTenantFilter(), false);
});

test('Conversion remains available and tenant-scoped for pw-infotech', () => {
  assert.equal(isTenantScopedModuleAvailable('pw-infotech'), true);
  assert.equal(isTenantScopedModuleAvailable('pw-uk'), true);
  assert.equal(isTenantScopedModuleAvailable('all'), true);
  assert.equal(doesTenantScopedModuleUseTenantFilter(), true);
});

test('global Chat presence copy remains platform-wide', () => {
  assert.equal(
    GLOBAL_CHAT_PRESENCE_NOTE,
    'Global presence — one team services all Primewayz entities.',
  );
  assert.equal(doesPlatformModuleUseTenantFilter(), false);
});

test('Autopilot compatibility helpers stay aligned with shared scope model', () => {
  assert.equal(isAutopilotAvailableForAdminTenant('pw-uk'), true);
  assert.equal(isAutopilotAvailableForAdminTenant('all'), true);
  assert.equal(isAutopilotAvailableForAdminTenant('pw-infotech'), false);
  assert.equal(getAutopilotTenantScopeNote('pw-infotech'), AUTOPILOT_UK_SCOPE_NOTE);
  assert.equal(getAutopilotTenantScopeNote('all'), AUTOPILOT_ALL_ENTITIES_SCOPE_NOTE);
  assert.equal(getAutopilotTenantScopeNote('pw-uk'), null);
});

test('Infotech selection forces leave from UK-only Admin tabs', () => {
  assert.equal(shouldLeaveUkOnlyAdminTab('autopilot', 'pw-infotech'), true);
  assert.equal(shouldLeaveUkOnlyAdminTab('blog', 'pw-infotech'), true);
  assert.equal(shouldLeaveUkOnlyAdminTab('comments', 'pw-infotech'), true);
  assert.equal(shouldLeaveUkOnlyAdminTab('forms', 'pw-infotech'), false);
  assert.equal(shouldLeaveUkOnlyAdminTab('users', 'pw-infotech'), false);
  assert.equal(shouldLeaveUkOnlyAdminTab('conversion', 'pw-infotech'), false);
  assert.equal(shouldLeaveUkOnlyAdminTab('blog', 'pw-uk'), false);
  assert.equal(shouldLeaveUkOnlyAdminTab('blog', 'all'), false);
});
