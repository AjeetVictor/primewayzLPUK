import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AdminTenantAccessError,
  assertAdminTenantAccess,
  listAuthorizedAdminTenantOptions,
  resolveAuthorizedAdminTenantFilter,
  validateTenantGrants,
} from './adminTenantAccess.ts';
import { createAdminTenantOptionsHandler } from './adminTenantOptionsRoute.ts';
import express, { type NextFunction, type Request, type Response } from 'express';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

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

test('operational filtering keeps pw-uk, pw-infotech and rrb in filters and grants while Silver is disabled', () => {
  const liveTenants = ['pw-uk', 'pw-infotech', 'rrb'] as const;
  const disabledSilverEnvs: NodeJS.ProcessEnv[] = [
    {},
    {
      RRB_SILVER_CAMPAIGN_ENABLED: 'false',
      RRB_SILVER_CAMPAIGN_ALLOWED_ORIGINS: 'https://silver-preview.example.test',
    },
  ];
  const operator = {
    id: 9,
    role: 'editor',
    isPlatformOwner: false,
    tenantIds: [...liveTenants, 'pw-us', 'rrb-silver-campaign'],
  };

  for (const env of disabledSilverEnvs) {
    assert.deepEqual(
      listAuthorizedAdminTenantOptions(platformAdmin, env).map((option) => option.value),
      [...liveTenants, 'all'],
    );
    assert.deepEqual(
      listAuthorizedAdminTenantOptions(operator, env).map((option) => option.value),
      [...liveTenants],
    );
    assert.deepEqual(validateTenantGrants([...liveTenants], env), [...liveTenants]);
    for (const tenantId of liveTenants) {
      assert.equal(resolveAuthorizedAdminTenantFilter(tenantId, platformAdmin, env), tenantId);
      assert.equal(resolveAuthorizedAdminTenantFilter(tenantId, operator, env), tenantId);
      assert.doesNotThrow(() => assertAdminTenantAccess(tenantId, operator, env));
    }
    assert.throws(() => validateTenantGrants(['rrb-silver-campaign'], env), { code: 'invalid_tenant_grants' });
    assert.throws(
      () => resolveAuthorizedAdminTenantFilter('rrb-silver-campaign', platformAdmin, env),
      { code: 'invalid_tenant_filter' },
    );
  }
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
  assert.throws(() => validateTenantGrants(['rrb-silver-campaign'], {}), {
    status: 400,
    code: 'invalid_tenant_grants',
  });
});

test('Host/Owners see every operational tenant and operators see only granted tenants', () => {
  const emptyEnv = {};
  assert.deepEqual(
    listAuthorizedAdminTenantOptions(platformAdmin, emptyEnv).map((option) => option.value),
    ['pw-uk', 'pw-infotech', 'rrb', 'all'],
  );
  assert.deepEqual(
    listAuthorizedAdminTenantOptions({
      id: 6,
      role: 'editor',
      isPlatformOwner: false,
      tenantIds: ['rrb', 'pw-us'],
    }, emptyEnv).map((option) => option.value),
    ['rrb'],
  );
  assert.throws(
    () => resolveAuthorizedAdminTenantFilter('pw-uk', {
      id: 6,
      role: 'editor',
      isPlatformOwner: false,
      tenantIds: ['rrb'],
    }, emptyEnv),
    { status: 403, code: 'tenant_access_denied' },
  );
});

test('tenant options are refused without an authenticated administrator', async () => {
  const app = express();
  app.use((req: Request & { adminUser?: unknown }, res: Response, next: NextFunction) => {
    const cookie = req.get('cookie') ?? '';
    if (cookie.includes('primewayz_admin_token=host')) {
      req.adminUser = platformAdmin;
    } else if (cookie) {
      return res.status(401).json({ code: 'admin_access_required' });
    }
    return next();
  });
  app.get('/api/admin/tenant-options', createAdminTenantOptionsHandler());
  const server = await new Promise<http.Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const port = (server.address() as AddressInfo).port;
  const get = (cookie?: string) => new Promise<{ status: number; json: { options?: Array<{ value: string }>; code?: string } }>((resolve, reject) => {
    const headers: Record<string, string> = {};
    if (cookie) headers.Cookie = cookie;
    http.get({ host: '127.0.0.1', port, path: '/api/admin/tenant-options', headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, json: data ? JSON.parse(data) : {} }));
    }).on('error', reject);
  });
  try {
    const anonymous = await get();
    assert.equal(anonymous.status, 401);
    assert.equal(anonymous.json.code, 'admin_access_required');
    const host = await get('primewayz_admin_token=host');
    assert.equal(host.status, 200);
    assert.deepEqual(
      host.json.options?.map((option) => option.value),
      listAuthorizedAdminTenantOptions(platformAdmin).map((option) => option.value),
    );
    assert.equal(host.json.options?.some((option) => option.value === 'pw-us'), false);
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
  }
});
