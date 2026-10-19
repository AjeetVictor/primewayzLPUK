import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import test, { afterEach } from 'node:test';
import express from 'express';
import type { ToolLead } from '@prisma/client';
import { listAdminAuditLeads } from '../audit/leads/adminAuditLeadsService.ts';
import { assertAdminCanAccessChatSession } from '../admin/adminChatRoutes.ts';
import { listAuthorizedAdminTenantOptions, resolveAuthorizedAdminTenantFilter, validateTenantGrants } from '../admin/adminTenantAccess.ts';
import { conversationRequiresHumanAttention } from '../admin/adminChatAttention.ts';
import { resolveQuickReplyTemplates } from '../chatTypes.ts';
import { publicChatApiCorsMiddleware, isPublicChatOriginAllowed } from '../chat/publicChatApiCors.ts';
import { validateExistingOrNewChatSessionId } from '../chat/publicChatGuards.ts';
import { resolveOfflineAcknowledgement, resolveTenantBotReply, visitorMessageIsAnsweredByTenantBot } from '../chat/tenantBotReply.ts';
import {
  RRB_SILVER_APPROVED_ANSWERS,
  RRB_SILVER_CHAT_WIDGET,
} from '../chat/tenantContent/rrbSilverCampaign.ts';
import { buildOfflineChatBotReply } from '../chat/visitorChatTypes.ts';
import { resolveAdminTenantFilter } from './adminTenantFilter.ts';
import { resolveTenantNotificationRoute } from './notificationRouting.ts';
import { buildPublicPlatformCapabilities } from './publicCapabilities.ts';
import { isPublicPlatformOriginAllowed } from './publicPlatformApiCors.ts';
import {
  assertChatSessionTenantAccess,
  assertTenantCapability,
  resolveSourceContext,
  SourceResolutionError,
} from './sourceResolver.ts';
import {
  getAdminTenantFilterOptions,
  getTenantAllowedOrigins,
  getTenantByHost,
  getTenantById,
  isTenantActive,
  parseTenantOriginList,
  resolveTenantChatPresentation,
  resolveTenantTimeZone,
} from './tenantRegistry.ts';

const TENANT = 'rrb-silver-campaign';
const ORIGIN_ENV = 'RRB_SILVER_CAMPAIGN_ALLOWED_ORIGINS';
const ACTIVATION_ENV = 'RRB_SILVER_CAMPAIGN_ENABLED';
const PREVIEW = 'https://silver-preview.example.test';
const SOFTWARE_SERVICE_WORDING = /primewayz|discovery call|foundation sprint|software|subscription plans start|project timeline/i;

const savedEnv = { activation: process.env[ACTIVATION_ENV], origins: process.env[ORIGIN_ENV], nodeEnv: process.env.NODE_ENV };
afterEach(() => {
  if (savedEnv.activation === undefined) delete process.env[ACTIVATION_ENV];
  else process.env[ACTIVATION_ENV] = savedEnv.activation;
  if (savedEnv.origins === undefined) delete process.env[ORIGIN_ENV];
  else process.env[ORIGIN_ENV] = savedEnv.origins;
  process.env.NODE_ENV = savedEnv.nodeEnv;
});

function registerPreview(value = PREVIEW) {
  process.env[ACTIVATION_ENV] = 'true';
  process.env[ORIGIN_ENV] = value;
}

const chat = (origin: string) => resolveSourceContext({ origin, sourceChannel: 'chat' });

// --- Tenant registration ---

test('tenant: rrb-silver-campaign is a separate IN / Asia/Kolkata RentReadBuy tenant with chat only', () => {
  const tenant = getTenantById(TENANT)!;
  assert.equal(tenant.displayName, 'RentReadBuy Silver Membership');
  assert.equal(tenant.brand, 'RentReadBuy');
  assert.equal(tenant.market, 'IN');
  assert.equal(resolveTenantTimeZone(TENANT), 'Asia/Kolkata');
  assert.equal(tenant.active, true);
  assert.equal(tenant.activationEnv, ACTIVATION_ENV);
  delete process.env[ACTIVATION_ENV];
  assert.equal(isTenantActive(tenant), false, 'disabled by default');
  assert.deepEqual(tenant.capabilities, { audit: false, forms: false, chat: true, conversion: false, scheduling: false });
  assert.equal(tenant.chatWidget?.publicSiteKey, 'rentreadbuy-silver');
  assert.ok(TENANT.length <= 32, 'fits the VARCHAR(32) tenantId columns');
});

test('tenant: activation accepts only explicit true and disabled Silver stays out of operational selectors', () => {
  const tenant = getTenantById(TENANT)!;
  for (const value of [undefined, '', 'false', '1', 'yes', 'enabled', 'invalid']) {
    if (value === undefined) delete process.env[ACTIVATION_ENV];
    else process.env[ACTIVATION_ENV] = value;
    assert.equal(isTenantActive(tenant), false, String(value));
    assert.equal(getAdminTenantFilterOptions(process.env).some((option) => option.value === TENANT), false);
  }
  process.env[ACTIVATION_ENV] = ' TrUe ';
  delete process.env[ORIGIN_ENV];
  assert.equal(isTenantActive(tenant), true);
  assert.equal(getAdminTenantFilterOptions(process.env).some((option) => option.value === TENANT), false, 'activation without an origin is not selectable');
  process.env[ORIGIN_ENV] = PREVIEW;
  assert.equal(getAdminTenantFilterOptions(process.env).some((option) => option.value === TENANT), true);
});

test('tenant: invalid or missing Silver origins stay out of active selections and grants', () => {
  const host = { id: 1, role: 'admin', isPlatformOwner: true, tenantIds: [] as string[] };
  process.env[ACTIVATION_ENV] = 'true';
  for (const origins of [undefined, '', 'https://*.rentreadbuy.com', 'https://rentreadbuy.com', 'not a url']) {
    if (origins === undefined) delete process.env[ORIGIN_ENV];
    else process.env[ORIGIN_ENV] = origins;
    assert.equal(getAdminTenantFilterOptions(process.env).some((option) => option.value === TENANT), false, String(origins));
    assert.throws(() => validateTenantGrants([TENANT]), { code: 'invalid_tenant_grants' });
    assert.throws(() => resolveAuthorizedAdminTenantFilter(TENANT, host), { code: 'invalid_tenant_filter' });
  }
  process.env[ORIGIN_ENV] = PREVIEW;
  assert.equal(getAdminTenantFilterOptions(process.env).some((option) => option.value === TENANT), true);
  assert.deepEqual(validateTenantGrants([TENANT]), [TENANT]);
  const options = listAuthorizedAdminTenantOptions(host);
  assert.ok(options.some((option) => option.value === TENANT));
  assert.ok(options.some((option) => option.value === 'all'));
  assert.deepEqual(
    listAuthorizedAdminTenantOptions({ id: 2, role: 'editor', isPlatformOwner: false, tenantIds: [TENANT] }).map((option) => option.value),
    [TENANT],
  );
  assert.deepEqual(
    listAuthorizedAdminTenantOptions({ id: 3, role: 'editor', isPlatformOwner: false, tenantIds: ['rrb'] }).map((option) => option.value),
    ['rrb'],
  );
  assert.throws(
    () => resolveAuthorizedAdminTenantFilter(TENANT, { id: 3, role: 'editor', isPlatformOwner: false, tenantIds: ['rrb'] }),
    { status: 403, code: 'tenant_access_denied' },
  );
});
test('tenant: no production origin is hardcoded; with no env configured the tenant accepts no traffic', () => {
  delete process.env[ORIGIN_ENV];
  const tenant = getTenantById(TENANT)!;
  assert.deepEqual(tenant.allowedOrigins, []);
  assert.deepEqual(getTenantAllowedOrigins(tenant), []);
  assert.throws(() => chat(PREVIEW), SourceResolutionError);
  assert.equal(isPublicChatOriginAllowed(PREVIEW), false);
  assert.equal(isPublicPlatformOriginAllowed(PREVIEW), false);
});

test('tenant: a configured origin cannot activate Silver while the activation flag is disabled', () => {
  process.env[ORIGIN_ENV] = PREVIEW;
  process.env[ACTIVATION_ENV] = 'false';
  assert.throws(() => chat(PREVIEW), SourceResolutionError);
  assert.equal(isPublicChatOriginAllowed(PREVIEW), false);
  assert.equal(isPublicPlatformOriginAllowed(PREVIEW), false);
  assert.throws(() => validateTenantGrants([TENANT]), { code: 'invalid_tenant_grants' });
});
test('tenant: a configured preview origin resolves to rrb-silver-campaign and nothing else', () => {
  registerPreview(`${PREVIEW}/`);
  const source = chat(PREVIEW);
  assert.equal(source.tenantId, TENANT);
  assert.equal(source.market, 'IN');
  assert.equal(source.sourceSite, 'rentreadbuy-silver');
  assert.doesNotThrow(() => assertTenantCapability(source, 'chat'));
  assert.throws(() => assertTenantCapability(source, 'forms'), SourceResolutionError);
  assert.throws(() => assertTenantCapability(source, 'scheduling'), SourceResolutionError);
  assert.equal(chat('https://rentreadbuy.com').tenantId, 'rrb');
  assert.equal(chat('https://uk.primewayz.com').tenantId, 'pw-uk');
});

// --- Invalid origins ---

test('origins: wildcards, paths, credentials, plain http and malformed values are never registered', () => {
  const parse = (raw: string, allowLocalHttp = false) => parseTenantOriginList(raw, { allowLocalHttp });
  assert.deepEqual(parse('https://*.rentreadbuy.com'), []);
  assert.deepEqual(parse('*'), []);
  assert.deepEqual(parse('https://silver.example.test/landing'), []);
  assert.deepEqual(parse('https://user:pass@silver.example.test'), []);
  assert.deepEqual(parse('http://silver.example.test'), []);
  assert.deepEqual(parse('silver.example.test'), []);
  assert.deepEqual(parse('https://silver.example.test?x=1'), []);
  assert.deepEqual(parse('http://localhost:3000'), [], 'local http only outside production');
  assert.deepEqual(parse('http://localhost:3000', true), ['http://localhost:3000']);
  assert.deepEqual(parse(' https://a.example.test , https://a.example.test/ ,https://b.example.test'), [
    'https://a.example.test',
    'https://b.example.test',
  ]);
});

test('origins: production ignores a localhost entry even if it is configured', () => {
  process.env.NODE_ENV = 'production';
  registerPreview(`http://localhost:3000,${PREVIEW}`);
  assert.deepEqual(getTenantAllowedOrigins(getTenantById(TENANT)!), [PREVIEW]);
});

test('origins: env configuration cannot claim an origin already owned by another tenant', () => {
  registerPreview('https://rentreadbuy.com,https://uk.primewayz.com');
  assert.deepEqual(getTenantAllowedOrigins(getTenantById(TENANT)!), []);
  assert.equal(chat('https://rentreadbuy.com').tenantId, 'rrb');
  assert.equal(chat('https://uk.primewayz.com').tenantId, 'pw-uk');
});

test('origins: the tenant never resolves from a no-Origin Host header', () => {
  registerPreview();
  assert.equal(getTenantByHost('rentreadbuy-silver'), undefined);
  assert.equal(getTenantByHost('silver-preview.example.test'), undefined);
  assert.throws(() => resolveSourceContext({ host: 'rentreadbuy-silver', sourceChannel: 'chat' }), SourceResolutionError);
  assert.equal(getTenantByHost('rentreadbuy.com')?.tenantId, 'rrb', 'existing tenants keep Host fallback');
});

test('origins: browser body fields can never select the tenant', () => {
  registerPreview();
  assert.throws(
    () => resolveSourceContext({ origin: 'https://rentreadbuy.com', sourceChannel: 'chat', body: { tenantId: TENANT } }),
    /controlled by the server/,
  );
});

test('origins: public chat CORS rejects unregistered origins and allows the registered preview origin', async () => {
  registerPreview();
  const app = express();
  app.use(publicChatApiCorsMiddleware);
  app.get('/api/chat/availability', (_req, res) => { res.json({ ok: true }); });
  const server = await new Promise<http.Server>((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const port = (server.address() as AddressInfo).port;
  const get = (origin: string) => new Promise<{ status: number; acao: string | undefined }>((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: '/api/chat/availability', headers: { Origin: origin } }, (res) => {
      res.resume();
      resolve({ status: res.statusCode ?? 0, acao: res.headers['access-control-allow-origin'] as string | undefined });
    }).on('error', reject);
  });
  try {
    assert.deepEqual(await get(PREVIEW), { status: 200, acao: PREVIEW });
    assert.equal((await get('https://evil.example.test')).status, 403);
    assert.equal((await get('https://silver-preview.example.test.evil.test')).status, 403);
    assert.equal((await get('http://silver-preview.example.test')).status, 403);
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
  }
});

// --- Session ownership and transcripts ---

test('sessions: rrb, rrb-silver-campaign and Primewayz sessions cannot be read or written across tenants', () => {
  registerPreview();
  const silver = chat(PREVIEW);
  const rrb = chat('https://rentreadbuy.com');
  const uk = chat('https://uk.primewayz.com');
  assert.doesNotThrow(() => assertChatSessionTenantAccess(TENANT, silver));
  assert.throws(() => assertChatSessionTenantAccess('rrb', silver), /different platform entity/);
  assert.throws(() => assertChatSessionTenantAccess('pw-uk', silver), /different platform entity/);
  assert.throws(() => assertChatSessionTenantAccess(TENANT, rrb), /different platform entity/);
  assert.throws(() => assertChatSessionTenantAccess(TENANT, uk), /different platform entity/);
  assert.throws(() => assertChatSessionTenantAccess(null, silver), /Legacy chat ownership/);
});

test('sessions: an existing session id from another tenant is rejected before any write', () => {
  registerPreview();
  const silver = chat(PREVIEW);
  assert.throws(
    () => validateExistingOrNewChatSessionId({ sessionId: 'rrb-session', existingSession: { tenantId: 'rrb' }, source: silver }),
    SourceResolutionError,
  );
  assert.equal(
    validateExistingOrNewChatSessionId({ sessionId: 'silver-session', existingSession: { tenantId: TENANT }, source: silver }).isExisting,
    true,
  );
});

test('transcripts: admin access to a campaign conversation follows its stored tenant, not the rrb filter', () => {
  registerPreview();
  const session = { id: 'silver-1', tenantId: TENANT };
  const host = { id: 1, role: 'admin', isPlatformOwner: true, tenantIds: [] };
  const operator = { id: 2, role: 'editor', isPlatformOwner: false, tenantIds: [TENANT] };
  assert.equal(assertAdminCanAccessChatSession(session, TENANT, operator), session);
  assert.equal(assertAdminCanAccessChatSession(session, undefined, host), session, 'Host All entities');
  assert.throws(() => assertAdminCanAccessChatSession(session, 'rrb', operator), { status: 403, code: 'tenant_scope_mismatch' });
  assert.throws(() => assertAdminCanAccessChatSession({ id: 'rrb-1', tenantId: 'rrb' }, TENANT, operator), { status: 403 });
});

test('operators: Silver grants and filters require deliberate tenant activation', () => {
  delete process.env[ACTIVATION_ENV];
  assert.throws(() => resolveAdminTenantFilter(TENANT));
  assert.throws(() => validateTenantGrants([TENANT]), { code: 'invalid_tenant_grants' });
  registerPreview();
  const operator = { id: 2, role: 'editor', isPlatformOwner: false, tenantIds: [TENANT] };
  assert.equal(resolveAdminTenantFilter(TENANT), TENANT);
  assert.equal(resolveAuthorizedAdminTenantFilter(TENANT, operator), TENANT);
  assert.deepEqual(validateTenantGrants([TENANT]), [TENANT]);
  assert.equal(resolveAdminTenantFilter('rrb'), 'rrb');
});

// --- Leads ---

function toolLead(id: number, tenantId: string | null): ToolLead {
  return {
    id, source: 'Web Presence Audit', websiteUrl: 'https://example.com', score: 50, businessType: null,
    businessName: null, location: null, name: 'Test', email: 'test@example.com', phone: null, message: null,
    details: {}, tenantId, market: 'IN', sourceSite: null, sourceOrigin: null, sourceChannel: null,
    campaignId: null, createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

test('leads: campaign records stay out of the rrb filter and are labelled with the campaign entity', async () => {
  const leads = [toolLead(1, 'rrb'), toolLead(2, TENANT), toolLead(3, 'pw-uk')];
  const prisma = {
    toolLead: {
      findMany: async ({ where }: { where: { tenantId?: string } }) =>
        leads.filter((lead) => !where.tenantId || lead.tenantId === where.tenantId),
    },
  };
  const silver = await listAdminAuditLeads(prisma as never, { tenantId: TENANT });
  assert.deepEqual(silver.items.map((item) => item.id), [2]);
  assert.equal(silver.items[0]?.sourceContext.entity, 'RentReadBuy Silver Membership');
  const rrb = await listAdminAuditLeads(prisma as never, { tenantId: 'rrb' });
  assert.deepEqual(rrb.items.map((item) => item.id), [1]);
});

// --- Notifications ---

test('notifications: campaign routes only to its own recipient and never falls back to rrb or Primewayz', () => {
  registerPreview();
  const silver = chat(PREVIEW);
  const others = {
    INTERNAL_NOTIFICATION_EMAIL: 'uk@example.com',
    PW_INFOTECH_NOTIFICATION_EMAIL: 'in@example.com',
    RRB_NOTIFICATION_EMAIL: 'rrb@example.com',
  };
  const missing = resolveTenantNotificationRoute(silver, others);
  assert.equal(missing.recipient, null);
  assert.equal(missing.skipped, true);
  assert.equal(missing.envKey, 'RRB_SILVER_CAMPAIGN_NOTIFICATION_EMAIL');
  const configured = resolveTenantNotificationRoute(silver, { ...others, RRB_SILVER_CAMPAIGN_NOTIFICATION_EMAIL: 'silver@example.com' });
  assert.equal(configured.recipient, 'silver@example.com');
  assert.equal(
    resolveTenantNotificationRoute(chat('https://rentreadbuy.com'), { RRB_SILVER_CAMPAIGN_NOTIFICATION_EMAIL: 'silver@example.com' }).recipient,
    null,
    'rrb never receives the campaign recipient either',
  );
});

// --- Capabilities and branding ---

test('capabilities: campaign tenant publishes chatWidget branding with no Primewayz wording', () => {
  registerPreview();
  const caps = buildPublicPlatformCapabilities(chat(PREVIEW), {});
  assert.deepEqual(caps.tenant, { key: TENANT, displayName: 'RentReadBuy Silver Membership', market: 'IN', brand: 'RentReadBuy' });
  assert.equal(caps.capabilities.chat, true);
  assert.equal(caps.chatWidget?.panelTitle, 'RentReadBuy Reading Assistant');
  assert.equal(caps.chatWidget?.greeting, 'Questions about Silver Membership?');
  assert.doesNotMatch(JSON.stringify(caps), /primewayz/i);
  for (const colour of Object.values(caps.chatWidget!.theme)) assert.match(colour!, /^#[0-9a-f]{6}([0-9a-f]{2})?$/i);
  assert.equal(caps.chatWidget?.theme.launcherBackground, '#037b80', 'RentReadBuy teal');
  assert.equal(caps.chatWidget?.theme.accent, '#f08a6c', 'RentReadBuy coral');
});

test('capabilities: existing tenants keep the exact response shape (no chatWidget key)', () => {
  for (const origin of ['https://uk.primewayz.com', 'https://primewayz.com', 'https://rentreadbuy.com']) {
    const caps = buildPublicPlatformCapabilities(chat(origin), {});
    assert.deepEqual(Object.keys(caps).sort(), ['capabilities', 'scheduling', 'tenant']);
  }
});

// --- Intents, approved answers and offline acknowledgement ---

test('intents: the six Silver intents each have exactly one approved answer', () => {
  const keys = RRB_SILVER_CHAT_WIDGET.intents.map((intent) => intent.key);
  assert.deepEqual(keys, [
    'silver_how_it_works',
    'silver_price_inclusions',
    'silver_book_limits',
    'silver_returns',
    'silver_gifting',
    'silver_joining',
  ]);
  assert.deepEqual(Object.keys(RRB_SILVER_APPROVED_ANSWERS).sort(), [...keys].sort());
});

test('answers: each intent returns its approved answer, restating only approved Silver facts', () => {
  for (const key of Object.keys(RRB_SILVER_APPROVED_ANSWERS)) {
    const reply = resolveTenantBotReply(TENANT, key);
    assert.equal(reply.kind, 'approved_answer');
    assert.equal(reply.text, RRB_SILVER_APPROVED_ANSWERS[key]);
    assert.doesNotMatch(reply.text, SOFTWARE_SERVICE_WORDING);
  }
  assert.match(resolveTenantBotReply(TENANT, 'silver_price_inclusions').text, /₹899 for 3 months/);
  assert.match(resolveTenantBotReply(TENANT, 'silver_book_limits').text, /up to 2 books at a time/);
  assert.match(resolveTenantBotReply(TENANT, 'silver_book_limits').text, /up to 60 days/);
});

test('escalation: approved Silver questions do not need a person, unsupported messages do', () => {
  for (const key of Object.keys(RRB_SILVER_APPROVED_ANSWERS)) {
    const reply = resolveTenantBotReply(TENANT, key);
    assert.equal(visitorMessageIsAnsweredByTenantBot(reply), true);
    assert.equal(conversationRequiresHumanAttention({
      status: 'bot_replied',
      messages: [{ sender: 'user', answered: true }],
    }), false, key);
  }
  const unsupported = resolveTenantBotReply(TENANT, 'can you deliver to another planet');
  assert.equal(unsupported.kind, 'offline_acknowledgement');
  assert.equal(visitorMessageIsAnsweredByTenantBot(unsupported), false);
  assert.equal(conversationRequiresHumanAttention({
    status: 'bot_replied',
    messages: [{ sender: 'user', answered: false }],
  }), true);
  assert.equal(conversationRequiresHumanAttention({
    status: 'closed',
    unansweredVisitorMessageCount: 2,
  }), false, 'closed conversations stay out of the queue');
  assert.equal(resolveTenantBotReply('pw-uk', 'silver_price_inclusions').kind, 'offline_acknowledgement');
});

test('answers: free text and unknown intents get the RentReadBuy offline acknowledgement', () => {
  const expected = 'Thanks for your question. It has been passed to the RentReadBuy team, who will reply here during Mon-Fri, India business hours.';
  for (const intentKey of [null, undefined, 'unknown_intent', 'plans_overview', '__proto__', 'constructor']) {
    const reply = resolveTenantBotReply(TENANT, intentKey);
    assert.equal(reply.kind, 'offline_acknowledgement');
    assert.equal(reply.text, expected);
  }
  assert.doesNotMatch(resolveOfflineAcknowledgement(TENANT), SOFTWARE_SERVICE_WORDING);
});

test('answers: Silver intent keys never produce Silver answers for other tenants', () => {
  for (const tenantId of ['rrb', 'pw-uk', 'pw-infotech', null]) {
    const reply = resolveTenantBotReply(tenantId, 'silver_price_inclusions');
    assert.equal(reply.kind, 'offline_acknowledgement');
    assert.doesNotMatch(reply.text, /₹899/);
  }
});

test('answers: existing tenants keep their exact offline reply', () => {
  for (const tenantId of ['pw-uk', 'pw-infotech', 'rrb', null]) {
    const presentation = resolveTenantChatPresentation(tenantId);
    assert.equal(resolveOfflineAcknowledgement(tenantId), buildOfflineChatBotReply(presentation));
  }
});

test('quick replies: operators get no Primewayz software-service templates for campaign conversations', () => {
  const silver = resolveQuickReplyTemplates(TENANT);
  assert.deepEqual(silver.map((template) => template.id), ['follow_up', 'business_hours']);
  for (const template of silver) assert.doesNotMatch(template.text, SOFTWARE_SERVICE_WORDING);
  assert.match(silver[0]!.text, /the RentReadBuy team/);
  assert.equal(resolveQuickReplyTemplates('pw-uk').length, 5, 'Primewayz tenants unchanged');
  assert.equal(resolveQuickReplyTemplates('rrb').length, 5, 'existing rrb tenant unchanged');
});
