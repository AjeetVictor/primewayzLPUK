import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AdminTenantAccessError,
  assertAdminTenantAccess,
  resolveAuthorizedAdminTenantFilter,
  validateTenantGrants,
} from './adminTenantAccess.ts';

const platformAdmin = {
  id: 1,
  role: 'admin',
  isPlatformOwner: true,
  tenantIds: [],
};

test('Host/Owners retain the UK default, assigned tenant access, and all-tenant access', () => {
  assert.equal(resolveAuthorizedAdminTenantFilter(undefined, platformAdmin), 'pw-uk');
  assert.equal(resolveAuthorizedAdminTenantFilter('pw-infotech', platformAdmin), 'pw-infotech');
  assert.equal(resolveAuthorizedAdminTenantFilter('all', platformAdmin), undefined);
});

test('single-tenant operators default only to their grant and cannot widen with filters', () => {
  const operator = {
    id: 2,
    role: 'viewer',
    isPlatformOwner: false,
    tenantIds: ['pw-infotech'],
  };
  assert.equal(resolveAuthorizedAdminTenantFilter(undefined, operator), 'pw-infotech');
  assert.equal(resolveAuthorizedAdminTenantFilter('pw-infotech', operator), 'pw-infotech');
  assert.throws(
    () => resolveAuthorizedAdminTenantFilter('pw-uk', operator),
    { status: 403, code: 'tenant_access_denied' },
  );
  assert.throws(
    () => resolveAuthorizedAdminTenantFilter('all', operator),
    { status: 403, code: 'platform_owner_required' },
  );
});

test('multi-tenant operators must select one assigned tenant; unassigned users fail closed', () => {
  const multi = {
    id: 3,
    role: 'editor',
    isPlatformOwner: false,
    tenantIds: ['pw-uk', 'rrb'],
  };
  assert.equal(resolveAuthorizedAdminTenantFilter('rrb', multi), 'rrb');
  assert.throws(
    () => resolveAuthorizedAdminTenantFilter(undefined, multi),
    { status: 400, code: 'tenant_selection_required' },
  );
  assert.throws(
    () => resolveAuthorizedAdminTenantFilter(undefined, {
      id: 4,
      role: 'viewer',
      isPlatformOwner: false,
      tenantIds: [],
    }),
    { status: 403, code: 'tenant_access_required' },
  );
  assert.throws(() => resolveAuthorizedAdminTenantFilter('pw-uk', undefined), {
    status: 401,
    code: 'admin_access_required',
  });
});

test('record ownership checks reject legacy, inactive, and unassigned tenants for operators', () => {
  const operator = { id: 5, role: 'editor', isPlatformOwner: false, tenantIds: ['pw-infotech'] };
  assert.doesNotThrow(() => assertAdminTenantAccess('pw-infotech', operator));
  for (const tenantId of [null, 'pw-uk', 'pw-us']) {
    assert.throws(
      () => assertAdminTenantAccess(tenantId, operator),
      AdminTenantAccessError,
    );
  }
  assert.doesNotThrow(() => assertAdminTenantAccess(null, platformAdmin));
});

test('grant validation accepts unique active tenants and rejects unknown or inactive IDs', () => {
  assert.deepEqual(validateTenantGrants(['rrb', 'pw-uk', 'rrb']), ['rrb', 'pw-uk']);
  assert.throws(() => validateTenantGrants(['pw-us']), {
    status: 400,
    code: 'invalid_tenant_grants',
  });
  assert.throws(() => validateTenantGrants('pw-uk'), {
    status: 400,
    code: 'invalid_tenant_grants',
  });
});
