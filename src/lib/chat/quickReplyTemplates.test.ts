import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import {
  QUICK_REPLY_TEMPLATE_IDS,
  QUICK_REPLY_TEMPLATES,
  resolveQuickReplyTemplates,
} from '../chatTypes.ts';
import { resolveTenantChatPresentation } from '../platform/tenantRegistry.ts';

const byId = (tenantId: string | null | undefined) => {
  const map = new Map(resolveQuickReplyTemplates(tenantId).map((t) => [t.id, t.text]));
  return map;
};

describe('resolveQuickReplyTemplates — tenant-aware Admin Chat copy', () => {
  test('stable semantic IDs remain identical across tenants', () => {
    for (const tenantId of ['pw-uk', 'pw-infotech', 'rrb', 'future-client', null] as const) {
      assert.deepEqual(
        resolveQuickReplyTemplates(tenantId).map((t) => t.id),
        [...QUICK_REPLY_TEMPLATE_IDS],
      );
    }
  });

  test('pw-uk quick replies use Primewayz UK team + UK business hours where applicable', () => {
    const templates = byId('pw-uk');
    assert.match(templates.get('follow_up')!, /Primewayz UK team/);
    assert.match(templates.get('follow_up')!, /A member of the Primewayz UK team will respond shortly/);
    assert.equal(
      templates.get('business_hours'),
      `We have received your details and will follow up during ${resolveTenantChatPresentation('pw-uk').businessHours}.`,
    );
    assert.match(templates.get('business_hours')!, /UK business hours/);
    assert.doesNotMatch(templates.get('follow_up')!, /our UK team/);
    assert.doesNotMatch(templates.get('business_hours')!, /UK business day/);
  });

  test('pw-infotech quick replies do not mention UK', () => {
    const templates = resolveQuickReplyTemplates('pw-infotech');
    const joined = templates.map((t) => t.text).join('\n');
    assert.doesNotMatch(joined, /\bUK\b/);
    assert.doesNotMatch(joined, /Primewayz UK/);
    assert.match(byId('pw-infotech').get('follow_up')!, /Primewayz Infotech team/);
    assert.match(byId('pw-infotech').get('business_hours')!, /India business hours/);
  });

  test('rrb quick replies do not mention Primewayz UK', () => {
    const templates = resolveQuickReplyTemplates('rrb');
    const joined = templates.map((t) => t.text).join('\n');
    assert.doesNotMatch(joined, /Primewayz UK/);
    assert.doesNotMatch(joined, /\bUK\b/);
    assert.match(byId('rrb').get('follow_up')!, /RentReadBuy team/);
    assert.match(byId('rrb').get('business_hours')!, /India business hours/);
  });

  test('future / unknown tenants get neutral wording (never UK default)', () => {
    for (const tenantId of ['future-client', 'digiblend', 'srh'] as const) {
      const joined = resolveQuickReplyTemplates(tenantId)
        .map((t) => t.text)
        .join('\n');
      assert.doesNotMatch(joined, /Primewayz UK/);
      assert.doesNotMatch(joined, /our UK team/);
      assert.doesNotMatch(joined, /UK business day/);
      assert.match(byId(tenantId).get('follow_up')!, /A member of our team will respond shortly/);
      assert.match(byId(tenantId).get('business_hours')!, /Mon-Fri, business hours/);
    }
  });

  test('registered tenant without chatPresentation derives team label (never UK)', () => {
    const followUp = byId('pw-us').get('follow_up')!;
    const hours = byId('pw-us').get('business_hours')!;
    assert.match(followUp, /Primewayz US team/);
    assert.doesNotMatch(followUp, /Primewayz UK|UK team/);
    assert.match(hours, /Mon-Fri, business hours/);
    assert.doesNotMatch(hours, /UK business/);
  });

  test('legacy / null tenant does not default to UK branding', () => {
    const joined = resolveQuickReplyTemplates(null)
      .map((t) => t.text)
      .join('\n');
    assert.doesNotMatch(joined, /Primewayz UK/);
    assert.doesNotMatch(joined, /our UK team/);
    assert.doesNotMatch(joined, /UK business day/);
    assert.doesNotMatch(joined, /UK business hours/);
    assert.match(byId(null).get('follow_up')!, /A member of our team will respond shortly/);
    assert.deepEqual(QUICK_REPLY_TEMPLATES, resolveQuickReplyTemplates(null).map((t) => t.text));
  });

  test('All entities + RRB conversation resolves RRB copy from session tenantId', () => {
    // Admin filter "all" must not influence wording — only ChatSession.tenantId.
    const adminFilter = 'all';
    void adminFilter;
    const sessionTenantId = 'rrb';
    const followUp = byId(sessionTenantId).get('follow_up')!;
    assert.match(followUp, /RentReadBuy team/);
    assert.doesNotMatch(followUp, /Primewayz UK|UK team/);
  });

  test('All entities + Infotech conversation resolves Infotech copy from session tenantId', () => {
    const adminFilter = 'all';
    void adminFilter;
    const sessionTenantId = 'pw-infotech';
    const followUp = byId(sessionTenantId).get('follow_up')!;
    assert.match(followUp, /Primewayz Infotech team/);
    assert.doesNotMatch(followUp, /Primewayz UK|UK team/);
  });

  test('business-hours quick reply stays tenant-aware via resolveTenantChatPresentation', () => {
    assert.equal(
      byId('pw-uk').get('business_hours'),
      'We have received your details and will follow up during Mon-Fri, UK business hours.',
    );
    assert.equal(
      byId('pw-infotech').get('business_hours'),
      'We have received your details and will follow up during Mon-Fri, India business hours.',
    );
    assert.equal(
      byId('rrb').get('business_hours'),
      'We have received your details and will follow up during Mon-Fri, India business hours.',
    );
    assert.equal(
      byId(null).get('business_hours'),
      'We have received your details and will follow up during Mon-Fri, business hours.',
    );
  });

  test('Admin Chat UI resolves quick replies from conversation/session tenantId', () => {
    const adminPanel = readFileSync(new URL('../../components/AdminPanel.tsx', import.meta.url), 'utf8');
    const mobileChat = readFileSync(
      new URL('../../components/AdminMobileChat.tsx', import.meta.url),
      'utf8',
    );
    const chatTypes = readFileSync(new URL('../chatTypes.ts', import.meta.url), 'utf8');

    assert.match(adminPanel, /resolveQuickReplyTemplates\(selectedConversation\.tenantId\)/);
    assert.doesNotMatch(adminPanel, /QUICK_REPLY_TEMPLATES/);
    assert.doesNotMatch(adminPanel, /resolveQuickReplyTemplates\(adminTenantFilter\)/);

    assert.match(mobileChat, /resolveQuickReplyTemplates\(selectedSession\?\.tenantId\)/);
    assert.doesNotMatch(mobileChat, /QUICK_REPLY_TEMPLATES/);

    assert.doesNotMatch(chatTypes, /our UK team/);
    assert.doesNotMatch(chatTypes, /UK business day/);
    assert.match(chatTypes, /resolveTenantChatPresentation/);
  });
});
