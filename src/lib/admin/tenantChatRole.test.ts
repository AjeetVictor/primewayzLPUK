import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
  isAdminPresenceExpired,
  persistChatPresenceMode,
  resolveChatPresence,
} from '../chat/chatPresence.ts';
import {
  assertAdminTenantChatAccess,
  buildTenantGrantCreates,
  mergeTenantChatGrantsForUpdate,
  resolveEffectiveTenantChatRole,
  validateTenantChatGrants,
} from './tenantChatRole.ts';
import { AdminTenantAccessError } from './adminTenantAccess.ts';

const host = {
  id: 1,
  role: 'admin',
  isPlatformOwner: true,
  tenantIds: [] as string[],
};

const ukAgent = {
  id: 2,
  role: 'viewer',
  isPlatformOwner: false,
  tenantIds: ['pw-uk'],
  tenantChatGrants: [{ tenantId: 'pw-uk', chatRole: 'agent' as const, chatRoleExplicit: true }],
};

const ukLegacyOps = {
  id: 3,
  role: 'editor',
  isPlatformOwner: false,
  tenantIds: ['pw-uk', 'pw-infotech'],
  tenantChatGrants: [
    { tenantId: 'pw-uk', chatRole: 'none' as const, chatRoleExplicit: false },
    { tenantId: 'pw-infotech', chatRole: 'none' as const, chatRoleExplicit: false },
  ],
};

const ukExplicitNone = {
  id: 4,
  role: 'editor',
  isPlatformOwner: false,
  tenantIds: ['pw-uk'],
  tenantChatGrants: [{ tenantId: 'pw-uk', chatRole: 'none' as const, chatRoleExplicit: true }],
};

const blogOnly = {
  id: 5,
  role: 'blog_author',
  isPlatformOwner: false,
  tenantIds: ['pw-uk'],
  tenantChatGrants: [{ tenantId: 'pw-uk', chatRole: 'none' as const, chatRoleExplicit: false }],
};

test('Host/Owner always receives agent chat role on operational tenants', () => {
  assert.deepEqual(resolveEffectiveTenantChatRole(host, 'pw-uk'), { role: 'agent', basis: 'platform_owner' });
  assert.deepEqual(resolveEffectiveTenantChatRole(host, 'pw-infotech'), { role: 'agent', basis: 'platform_owner' });
});

test('explicit agent and explicit none are authoritative', () => {
  assert.equal(resolveEffectiveTenantChatRole(ukAgent, 'pw-uk').basis, 'explicit_agent');
  assert.equal(resolveEffectiveTenantChatRole(ukExplicitNone, 'pw-uk').basis, 'explicit_none');
  assert.equal(resolveEffectiveTenantChatRole(ukExplicitNone, 'pw-uk').role, 'none');
});

test('compatibility preserves operations-role grants that still default to non-explicit none', () => {
  assert.deepEqual(resolveEffectiveTenantChatRole(ukLegacyOps, 'pw-uk'), {
    role: 'agent',
    basis: 'legacy_operations_compat',
  });
  assert.deepEqual(resolveEffectiveTenantChatRole(ukLegacyOps, 'pw-infotech'), {
    role: 'agent',
    basis: 'legacy_operations_compat',
  });
});

test('non-operations roles do not inherit chat from a bare tenant grant', () => {
  assert.deepEqual(resolveEffectiveTenantChatRole(blogOnly, 'pw-uk'), {
    role: 'none',
    basis: 'default_none',
  });
});

test('Silver stays denied while its activation gate is closed', () => {
  const env = { ...process.env };
  delete env.RRB_SILVER_CAMPAIGN_ENABLED;
  const decision = resolveEffectiveTenantChatRole(host, 'rrb-silver-campaign', env);
  assert.equal(decision.role, 'none');
  assert.equal(decision.basis, 'inactive_tenant');
});

test('assertAdminTenantChatAccess fails closed for denied operators', () => {
  assert.throws(
    () => assertAdminTenantChatAccess('pw-uk', ukExplicitNone),
    (error: unknown) => error instanceof AdminTenantAccessError && error.code === 'chat_role_denied',
  );
  assert.doesNotThrow(() => assertAdminTenantChatAccess('pw-infotech', ukLegacyOps));
});

test('grant builders default to none and mark Host-supplied roles explicit', () => {
  assert.deepEqual(buildTenantGrantCreates(['pw-uk', 'pw-infotech']), [
    { tenantId: 'pw-uk', chatRole: 'none', chatRoleExplicit: false },
    { tenantId: 'pw-infotech', chatRole: 'none', chatRoleExplicit: false },
  ]);
  const validated = validateTenantChatGrants([{ tenantId: 'pw-uk', chatRole: 'agent' }]);
  assert.deepEqual(buildTenantGrantCreates(['pw-uk'], validated), [
    { tenantId: 'pw-uk', chatRole: 'agent', chatRoleExplicit: true },
  ]);
});

test('grant updates preserve prior roles for tenants that remain assigned', () => {
  const merged = mergeTenantChatGrantsForUpdate({
    tenantIds: ['pw-uk', 'pw-infotech'],
    nextExplicit: [{ tenantId: 'pw-infotech', chatRole: 'agent', chatRoleExplicit: true }],
    previous: [
      { tenantId: 'pw-uk', chatRole: 'agent', chatRoleExplicit: true },
      { tenantId: 'rrb', chatRole: 'none', chatRoleExplicit: false },
    ],
  });
  assert.deepEqual(merged, [
    { tenantId: 'pw-uk', chatRole: 'agent', chatRoleExplicit: true },
    { tenantId: 'pw-infotech', chatRole: 'agent', chatRoleExplicit: true },
  ]);
});

test('explicit Available/Away/Offline persistence and heartbeat expiry', () => {
  assert.equal(persistChatPresenceMode('available'), 'available');
  assert.equal(persistChatPresenceMode('online'), 'available');
  assert.equal(persistChatPresenceMode('away'), 'away');

  const now = Date.parse('2026-10-20T12:00:00.000Z');
  const fresh = resolveChatPresence({
    mode: 'available',
    latestAdminSeenAt: new Date(now - 60_000),
    now,
  });
  assert.equal(fresh.status, 'online');
  assert.equal(fresh.teamStatus, 'available');
  assert.equal(fresh.hasActiveAdmin, true);

  const expiredAt = new Date(now - ADMIN_PRESENCE_ACTIVE_WINDOW_MS);
  assert.equal(isAdminPresenceExpired(expiredAt, now), true);
  const stale = resolveChatPresence({ mode: 'auto', latestAdminSeenAt: expiredAt, now });
  assert.equal(stale.teamStatus, 'not_online');
  assert.equal(stale.hasActiveAdmin, false);
});

test('Admin presence calls forward the selected tenantId (UK versus Infotech fix)', () => {
  const adminPanel = fs.readFileSync(path.join(process.cwd(), 'src/components/AdminPanel.tsx'), 'utf8');
  assert.match(adminPanel, /adminTenantPath\('\/api\/admin\/chat\/availability'\)/);
  assert.match(adminPanel, /adminTenantPath\('\/api\/admin\/presence\/heartbeat'\)/);
  assert.match(adminPanel, /\[isAuthenticated, user, adminTenantFilter\]/);
  assert.doesNotMatch(adminPanel, /adminRequest\('\/api\/admin\/chat\/availability'\)/);
  assert.doesNotMatch(adminPanel, /adminRequest\('\/api\/admin\/presence\/heartbeat'/);

  const server = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
  assert.match(server, /function resolveAdminPresenceTenantId/);
  assert.match(server, /requireAdminTenantChatAccess\(req, res, tenantId\)/);
  assert.match(server, /persistChatPresenceMode/);
  assert.match(server, /expiresInMs: ADMIN_PRESENCE_ACTIVE_WINDOW_MS/);
  assert.match(server, /clearAdminPresenceForUser\(prisma, \{ userId: decoded\.id \}\)/);
});

test('Admin warns when forced Online has no active operator heartbeat (availability logic unchanged)', () => {
  const adminPanel = fs.readFileSync(path.join(process.cwd(), 'src/components/AdminPanel.tsx'), 'utf8');
  assert.match(adminPanel, /data-testid="forced-online-heartbeat-warning"/);
  assert.match(adminPanel, /!chatAvailability\.hasActiveAdmin/);
  assert.match(adminPanel, /Forced Online still advertises human availability/);
  assert.match(adminPanel, /Public\s+behaviour is unchanged in this release/);
  // Must not alter resolveChatPresence forced-online semantics in this PR.
  const presence = fs.readFileSync(path.join(process.cwd(), 'src/lib/chat/chatPresence.ts'), 'utf8');
  assert.match(presence, /forcedOnline = mode === 'online' \|\| mode === 'available'/);
  assert.match(presence, /forcedOnline\s*\?\s*'online'/);
});

test('additive migration introduces chatRole default none without seeding agent access', () => {
  const migration = fs.readFileSync(
    path.join(process.cwd(), 'prisma/migrations/20261020180000_tenant_chat_role_presence_authz/migration.sql'),
    'utf8',
  );
  assert.match(migration, /ADD COLUMN `chatRole` VARCHAR\(16\) NOT NULL DEFAULT 'none'/);
  assert.match(migration, /ADD COLUMN `chatRoleExplicit` BOOLEAN NOT NULL DEFAULT false/);
  assert.doesNotMatch(migration, /UPDATE\s+`?UserTenantGrant`?/i);
  assert.doesNotMatch(migration, /INSERT\s+INTO/i);
});
