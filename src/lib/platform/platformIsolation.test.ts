import assert from 'node:assert/strict';
import test from 'node:test';
import type { ToolLead } from '@prisma/client';
import { listAdminAuditLeads } from '../audit/leads/adminAuditLeadsService.ts';
import { computeConversionBucketKeyHash } from '../seo/conversionBucketKey.ts';
import { getTenantNotificationRecipient } from './notificationRouting.ts';
import { defaultUkSourceContext, toPersistedSourceContext } from './sourceContext.ts';
import { assertChatSessionTenantAccess, resolveSourceContext } from './sourceResolver.ts';
import { ADMIN_TENANT_FILTER_OPTIONS } from './tenantRegistry.ts';

function toolLead(partial: Partial<ToolLead> & Pick<ToolLead, 'id'>): ToolLead {
  return {
    id: partial.id,
    source: partial.source ?? 'Web Presence Audit',
    websiteUrl: partial.websiteUrl ?? 'https://example.com',
    score: partial.score ?? 50,
    businessType: partial.businessType ?? null,
    businessName: partial.businessName ?? null,
    location: partial.location ?? null,
    name: partial.name ?? 'Test',
    email: partial.email ?? 'test@example.com',
    phone: partial.phone ?? null,
    message: partial.message ?? null,
    details: partial.details ?? {},
    tenantId: partial.tenantId ?? null,
    market: partial.market ?? null,
    sourceSite: partial.sourceSite ?? null,
    sourceOrigin: partial.sourceOrigin ?? null,
    sourceChannel: partial.sourceChannel ?? null,
    campaignId: partial.campaignId ?? null,
    createdAt: partial.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
  };
}

test('trusted origin persists UK and Infotech audit source context', () => {
  const uk = resolveSourceContext({ origin: 'https://uk.primewayz.com', sourceChannel: 'website-audit' });
  const infotech = resolveSourceContext({ origin: 'https://primewayz.com', sourceChannel: 'website-audit' });
  assert.deepEqual(toPersistedSourceContext(uk), {
    tenantId: 'pw-uk',
    market: 'UK',
    sourceSite: 'uk.primewayz.com',
    sourceOrigin: 'https://uk.primewayz.com',
    sourceChannel: 'website-audit',
    campaignId: null,
  });
  assert.equal(toPersistedSourceContext(infotech).tenantId, 'pw-infotech');
  assert.equal(toPersistedSourceContext(infotech).market, 'IN');
});

test('admin audit lead list respects tenant filter and exposes source markers', async () => {
  const leads = [
    toolLead({ id: 1, tenantId: 'pw-uk', market: 'UK', sourceSite: 'uk.primewayz.com' }),
    toolLead({ id: 2, tenantId: 'pw-infotech', market: 'IN', sourceSite: 'primewayz.com' }),
  ];
  const prisma = {
    toolLead: {
      findMany: async ({ where }: { where: { source: string; tenantId?: string } }) =>
        leads.filter((lead) => (!where.tenantId || lead.tenantId === where.tenantId)),
    },
  };

  const ukOnly = await listAdminAuditLeads(prisma as never, { tenantId: 'pw-uk' });
  assert.equal(ukOnly.total, 1);
  assert.equal(ukOnly.items[0]?.sourceContext.entity, 'Primewayz UK');

  const infotechOnly = await listAdminAuditLeads(prisma as never, { tenantId: 'pw-infotech' });
  assert.equal(infotechOnly.total, 1);
  assert.equal(infotechOnly.items[0]?.sourceContext.entity, 'Primewayz Infotech');

  const all = await listAdminAuditLeads(prisma as never, { tenantId: 'all' });
  assert.equal(all.total, 2);
});

test('conversion bucket keys stay independent of campaign attribution dimensions', () => {
  const tenantA = computeConversionBucketKeyHash({
    tenantId: 'pw-infotech',
    seoPageId: 1,
    attributionModel: 'first_touch',
    channelGroup: 'organic',
  });
  const tenantB = computeConversionBucketKeyHash({
    tenantId: 'pw-uk',
    seoPageId: 1,
    attributionModel: 'first_touch',
    channelGroup: 'organic',
  });
  assert.notEqual(tenantA, tenantB);
  const sameTenantDifferentChannel = computeConversionBucketKeyHash({
    tenantId: 'pw-uk',
    seoPageId: 1,
    attributionModel: 'first_touch',
    channelGroup: 'linkedin',
  });
  assert.notEqual(tenantB, sameTenantDifferentChannel);
});

test('Infotech notification never falls back to UK recipient when env is missing', () => {
  const infotech = resolveSourceContext({ origin: 'https://primewayz.com', sourceChannel: 'website-audit' });
  const uk = defaultUkSourceContext('website-audit');
  const env = {
    INTERNAL_NOTIFICATION_EMAIL: 'uk-ops@example.com',
  };
  assert.equal(getTenantNotificationRecipient(infotech, env), null);
  assert.equal(getTenantNotificationRecipient(uk, env), 'uk-ops@example.com');
  assert.notEqual(getTenantNotificationRecipient(infotech, env), env.INTERNAL_NOTIFICATION_EMAIL);
});

test('admin filter options expose only active tenants plus all', () => {
  assert.deepEqual(
    ADMIN_TENANT_FILTER_OPTIONS.map((option) => option.value),
    ['pw-uk', 'pw-infotech', 'all'],
  );
});

test('legacy chat ownership cannot be claimed by Infotech', () => {
  const infotech = resolveSourceContext({ origin: 'https://www.primewayz.com', sourceChannel: 'chat' });
  const uk = resolveSourceContext({ origin: 'https://uk.primewayz.com', sourceChannel: 'chat' });
  assert.throws(() => assertChatSessionTenantAccess(null, infotech), /Legacy chat ownership/);
  assert.doesNotThrow(() => assertChatSessionTenantAccess(null, uk));
  assert.throws(() => assertChatSessionTenantAccess('pw-uk', infotech), /different Primewayz entity/);
  assert.doesNotThrow(() => assertChatSessionTenantAccess('pw-infotech', infotech));
});

test('NULL audit lead entity marker stays Legacy / unknown', async () => {
  const leads = [toolLead({ id: 9, tenantId: null, market: null, sourceSite: null })];
  const prisma = {
    toolLead: {
      findMany: async () => leads,
    },
  };
  const all = await listAdminAuditLeads(prisma as never, { tenantId: 'all' });
  assert.equal(all.items[0]?.sourceContext.entity, 'Legacy / unknown');
  assert.equal(all.items[0]?.sourceContext.tenantId, null);
});
