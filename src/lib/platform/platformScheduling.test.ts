import assert from 'node:assert/strict';
import test from 'node:test';
import { createHmac } from 'node:crypto';
import { buildPublicPlatformCapabilities } from './publicCapabilities.ts';
import { resolveSourceContext, assertChatSessionTenantAccess, SourceResolutionError } from './sourceResolver.ts';
import { getTenantCapabilities, tenantSupportsCapability } from './tenantCapabilities.ts';
import { getTenantNotificationRecipient } from './notificationRouting.ts';
import { getTenantDisplayName } from './tenantRegistry.ts';
import {
  getSchedulingAvailability,
  processCalendlyWebhookEvent,
  resolveSchedulingConversionAttribution,
  verifyCalendlyWebhookSignature,
  verifyCalendlyWebhookSignatureDetailed,
  DEFAULT_CALENDLY_WEBHOOK_TOLERANCE_SECONDS,
  buildCalendlyWebhookIdempotencyKey,
  buildCalendlyAppointmentProviderEventId,
  findEnvConnectionByProviderUri,
  DEFAULT_PW_UK_CALENDLY_BOOKING_URL,
} from '../scheduling/index.ts';
import { SCHEDULING_ENCRYPTED_OAUTH_REQUIREMENT } from '../scheduling/credentials.ts';
import { resolveChatBookingDestination } from '../chat/resolveChatBookingDestination.ts';
import { DISCOVERY_CALL_DESTINATION } from '../../constants/conversionCta.ts';
import {
  resolveTenantCapabilityModuleAvailability,
  isUkModuleAvailable,
  isPlatformModuleAvailable,
  getPlatformUserManagementAvailability,
  PLATFORM_WIDE_BADGE,
  SCHEDULING_CONFIG_INACTIVE_NOTE,
} from '../admin/adminModuleScope.ts';

function signCalendlyBody(rawBody: string, key: string, t: string) {
  const v1 = createHmac('sha256', key).update(`${t}.${rawBody}`, 'utf8').digest('hex');
  return `t=${t},v1=${v1}`;
}

function makePrismaMock() {
  const webhookRows = new Map<string, Record<string, unknown>>();
  const appointments = new Map<string, Record<string, unknown>>();
  let webhookSeq = 0;
  let apptSeq = 0;
  let conversionUpdates = 0;

  return {
    webhookRows,
    appointments,
    get conversionUpdates() {
      return conversionUpdates;
    },
    prisma: {
      schedulingWebhookEvent: {
        findUnique: async ({
          where,
        }: {
          where: { provider_providerEventId: { providerEventId: string } };
        }) => webhookRows.get(where.provider_providerEventId.providerEventId) ?? null,
        create: async ({ data }: { data: Record<string, unknown> }) => {
          webhookSeq += 1;
          const row = { id: `wh-${webhookSeq}`, appointmentId: null, ...data };
          webhookRows.set(String(data.providerEventId), row);
          return row;
        },
        update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          for (const [key, row] of webhookRows) {
            if (row.id === where.id) {
              const next = { ...row, ...data };
              webhookRows.set(key, next);
              return next;
            }
          }
          throw new Error('missing webhook row');
        },
      },
      schedulingAppointment: {
        upsert: async ({
          where,
          create,
          update,
        }: {
          where: { provider_providerEventId: { providerEventId: string } };
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => {
          const key = where.provider_providerEventId.providerEventId;
          const existing = appointments.get(key);
          if (existing) {
            const next = { ...existing, ...update };
            appointments.set(key, next);
            return next;
          }
          apptSeq += 1;
          const created = { id: `appt-${apptSeq}`, conversionEmitted: false, ...create };
          appointments.set(key, created);
          return created;
        },
        update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
          for (const [key, row] of appointments) {
            if (row.id === where.id) {
              conversionUpdates += 1;
              const next = { ...row, ...data };
              appointments.set(key, next);
              return next;
            }
          }
          return null;
        },
      },
    },
  };
}

test('tenant capabilities match intended configuration', () => {
  assert.deepEqual(getTenantCapabilities('pw-uk'), {
    audit: true,
    forms: true,
    chat: true,
    conversion: true,
    scheduling: true,
  });
  assert.deepEqual(getTenantCapabilities('pw-infotech'), {
    audit: true,
    forms: true,
    chat: true,
    conversion: true,
    scheduling: true,
  });
  assert.deepEqual(getTenantCapabilities('rrb'), {
    audit: false,
    forms: false,
    chat: true,
    conversion: false,
    scheduling: false,
  });
  assert.equal(tenantSupportsCapability('rrb', 'chat'), true);
  assert.equal(tenantSupportsCapability('rrb', 'scheduling'), false);
});

test('public capabilities DTO never exposes secrets', () => {
  const uk = resolveSourceContext({ origin: 'https://uk.primewayz.com', sourceChannel: 'other' });
  const rrb = resolveSourceContext({ origin: 'https://rentreadbuy.com', sourceChannel: 'other' });
  const ukDto = buildPublicPlatformCapabilities(uk, {});
  const rrbDto = buildPublicPlatformCapabilities(rrb, {});
  assert.equal(ukDto.tenant.key, 'pw-uk');
  assert.equal(ukDto.capabilities.scheduling, true);
  assert.equal(ukDto.scheduling.enabled, true);
  assert.equal(ukDto.scheduling.provider, 'calendly');
  assert.equal(ukDto.scheduling.publicBookingUrl, DEFAULT_PW_UK_CALENDLY_BOOKING_URL);
  assert.equal(rrbDto.tenant.key, 'rrb');
  assert.equal(rrbDto.capabilities.chat, true);
  assert.equal(rrbDto.capabilities.scheduling, false);
  assert.equal(rrbDto.scheduling.enabled, false);
  const serialized = JSON.stringify(ukDto);
  assert.equal(serialized.includes('CALENDLY_WEBHOOK'), false);
  assert.equal(serialized.includes('secret'), false);
  assert.equal(serialized.includes('token'), false);
});

test('scheduling availability is tenant-owned and provider-neutral', () => {
  const uk = getSchedulingAvailability({ tenantId: 'pw-uk' }, {});
  const infotech = getSchedulingAvailability({ tenantId: 'pw-infotech' }, {});
  const infotechConfigured = getSchedulingAvailability(
    { tenantId: 'pw-infotech' },
    {
      SCHEDULING_PW_INFOTECH_ENABLED: 'true',
      SCHEDULING_PW_INFOTECH_PUBLIC_BOOKING_URL: 'https://calendly.com/primewayz-infotech/consult',
    },
  );
  const rrb = getSchedulingAvailability({ tenantId: 'rrb' }, {});
  assert.equal(uk.enabled, true);
  assert.equal(uk.provider, 'calendly');
  assert.equal(infotech.enabled, false);
  assert.equal(infotechConfigured.enabled, true);
  assert.equal(infotechConfigured.publicBookingUrl, 'https://calendly.com/primewayz-infotech/consult');
  assert.equal(rrb.enabled, false);
  assert.equal(rrb.canBookFromChat, false);
  assert.ok(SCHEDULING_ENCRYPTED_OAUTH_REQUIREMENT.includes('AES-256-GCM'));
});

test('cross-tenant chat session access is rejected', () => {
  const uk = resolveSourceContext({ origin: 'https://uk.primewayz.com', sourceChannel: 'chat' });
  const infotech = resolveSourceContext({ origin: 'https://primewayz.com', sourceChannel: 'chat' });
  const rrb = resolveSourceContext({ origin: 'https://rentreadbuy.com', sourceChannel: 'chat' });
  assert.throws(() => assertChatSessionTenantAccess('rrb', infotech), SourceResolutionError);
  assert.throws(() => assertChatSessionTenantAccess('pw-uk', rrb), SourceResolutionError);
  assert.throws(() => assertChatSessionTenantAccess('pw-infotech', uk), SourceResolutionError);
  assert.doesNotThrow(() => assertChatSessionTenantAccess('rrb', rrb));
});

test('calendly signature: valid t/v1 passes; invalid and malformed rejected', () => {
  const rawBody = '{"event":"invitee.created"}';
  const nowSeconds = Math.floor(Date.now() / 1000);
  const t = String(nowSeconds);
  const key = 'test-signing-key';
  const header = signCalendlyBody(rawBody, key, t);

  assert.equal(
    verifyCalendlyWebhookSignature({ rawBody, signatureHeader: header, signingKey: key }),
    true,
  );
  assert.equal(
    verifyCalendlyWebhookSignature({
      rawBody,
      signatureHeader: `t=${t},v1=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef`,
      signingKey: key,
    }),
    false,
  );
  assert.equal(
    verifyCalendlyWebhookSignatureDetailed({
      rawBody,
      signatureHeader: 'not-a-signature',
      signingKey: key,
    }).ok,
    false,
  );
  const malformedTs = verifyCalendlyWebhookSignatureDetailed({
    rawBody,
    signatureHeader: `t=abc,v1=deadbeef`,
    signingKey: key,
  });
  assert.equal(malformedTs.ok, false);
  if (!malformedTs.ok) assert.equal(malformedTs.reason, 'invalid_timestamp');
});

test('calendly signature: stale and excessive future timestamps rejected', () => {
  const rawBody = '{"event":"invitee.created"}';
  const key = 'test-signing-key';
  const nowMs = 1_700_000_000_000;
  const nowSeconds = Math.floor(nowMs / 1000);
  const tolerance = DEFAULT_CALENDLY_WEBHOOK_TOLERANCE_SECONDS;

  const staleT = String(nowSeconds - tolerance - 1);
  const stale = verifyCalendlyWebhookSignatureDetailed({
    rawBody,
    signatureHeader: signCalendlyBody(rawBody, key, staleT),
    signingKey: key,
    nowMs,
    toleranceSeconds: tolerance,
  });
  assert.equal(stale.ok, false);
  if (!stale.ok) assert.equal(stale.reason, 'stale_timestamp');

  const futureT = String(nowSeconds + tolerance + 1);
  const future = verifyCalendlyWebhookSignatureDetailed({
    rawBody,
    signatureHeader: signCalendlyBody(rawBody, key, futureT),
    signingKey: key,
    nowMs,
    toleranceSeconds: tolerance,
  });
  assert.equal(future.ok, false);
  if (!future.ok) assert.equal(future.reason, 'future_timestamp');
});

test('calendly signature: exact raw-body verification; modified body fails', () => {
  const rawBody = '{"event":"invitee.created","payload":{"uri":"https://api.calendly.com/invitees/a"}}';
  const key = 'raw-body-key';
  const t = String(Math.floor(Date.now() / 1000));
  const header = signCalendlyBody(rawBody, key, t);
  assert.equal(
    verifyCalendlyWebhookSignature({ rawBody, signatureHeader: header, signingKey: key }),
    true,
  );
  // Re-serialized / modified body must fail — proves we require exact raw bytes.
  const modified = '{"payload":{"uri":"https://api.calendly.com/invitees/a"},"event":"invitee.created"}';
  assert.equal(
    verifyCalendlyWebhookSignature({ rawBody: modified, signatureHeader: header, signingKey: key }),
    false,
  );
});

test('idempotency: duplicate invitee.created processed once', async () => {
  const mock = makePrismaMock();
  const inviteeUri = 'https://api.calendly.com/invitees/inv-1';
  const body = {
    event: 'invitee.created',
    created_by: 'https://api.calendly.com/users/uk-user',
    payload: {
      email: 'guest@example.com',
      name: 'Guest',
      uri: inviteeUri,
      scheduled_event: {
        uri: 'https://api.calendly.com/scheduled_events/evt-1',
        start_time: '2026-09-20T10:00:00.000Z',
        end_time: '2026-09-20T10:30:00.000Z',
        event_memberships: [{ user: 'https://api.calendly.com/users/uk-user' }],
      },
    },
  };
  const env = {
    SCHEDULING_PW_UK_CALENDLY_USER_URI: 'https://api.calendly.com/users/uk-user',
  } as NodeJS.ProcessEnv;

  const first = await processCalendlyWebhookEvent({
    prisma: mock.prisma as never,
    rawBody: JSON.stringify(body),
    body,
    env,
  });
  assert.equal(first.status, 'processed');
  if (first.status === 'processed') {
    assert.equal(first.tenantId, 'pw-uk');
    assert.equal(first.duplicate, false);
  }

  const webhookKey = buildCalendlyWebhookIdempotencyKey(body);
  assert.equal(webhookKey, `invitee.created:${inviteeUri}`);
  const stored = mock.webhookRows.get(webhookKey!);
  assert.ok(stored);
  stored!.status = 'processed';
  stored!.tenantId = 'pw-uk';
  stored!.appointmentId = 'appt-1';

  const second = await processCalendlyWebhookEvent({
    prisma: mock.prisma as never,
    rawBody: JSON.stringify(body),
    body,
    env,
  });
  assert.equal(second.status, 'duplicate');
  assert.equal(mock.appointments.size, 1);
});

test('idempotency: duplicate invitee.canceled processed once; created+canceled remain distinct', async () => {
  const mock = makePrismaMock();
  const inviteeUri = 'https://api.calendly.com/invitees/inv-2';
  const env = {
    SCHEDULING_PW_UK_CALENDLY_USER_URI: 'https://api.calendly.com/users/uk-user',
  } as NodeJS.ProcessEnv;

  const createdBody = {
    event: 'invitee.created',
    created_by: 'https://api.calendly.com/users/uk-user',
    payload: {
      uri: inviteeUri,
      email: 'a@example.com',
      scheduled_event: {
        uri: 'https://api.calendly.com/scheduled_events/evt-group',
        event_memberships: [{ user: 'https://api.calendly.com/users/uk-user' }],
      },
    },
  };
  const canceledBody = {
    ...createdBody,
    event: 'invitee.canceled',
  };

  const created = await processCalendlyWebhookEvent({
    prisma: mock.prisma as never,
    rawBody: JSON.stringify(createdBody),
    body: createdBody,
    env,
  });
  assert.equal(created.status, 'processed');

  const createdKey = buildCalendlyWebhookIdempotencyKey(createdBody)!;
  const canceledKey = buildCalendlyWebhookIdempotencyKey(canceledBody)!;
  assert.notEqual(createdKey, canceledKey);
  assert.equal(buildCalendlyAppointmentProviderEventId(createdBody), inviteeUri);
  assert.equal(buildCalendlyAppointmentProviderEventId(canceledBody), inviteeUri);

  mock.webhookRows.get(createdKey)!.status = 'processed';

  const canceled = await processCalendlyWebhookEvent({
    prisma: mock.prisma as never,
    rawBody: JSON.stringify(canceledBody),
    body: canceledBody,
    env,
  });
  assert.equal(canceled.status, 'processed');
  assert.equal(mock.webhookRows.size, 2);
  assert.equal(mock.appointments.size, 1);
  assert.equal(mock.appointments.get(inviteeUri)?.status, 'cancelled');

  mock.webhookRows.get(canceledKey)!.status = 'processed';
  const canceledDup = await processCalendlyWebhookEvent({
    prisma: mock.prisma as never,
    rawBody: JSON.stringify(canceledBody),
    body: canceledBody,
    env,
  });
  assert.equal(canceledDup.status, 'duplicate');
});

test('idempotency: different invitees in same scheduled event remain distinct', async () => {
  const mock = makePrismaMock();
  const env = {
    SCHEDULING_PW_UK_CALENDLY_USER_URI: 'https://api.calendly.com/users/uk-user',
  } as NodeJS.ProcessEnv;
  const scheduledEventUri = 'https://api.calendly.com/scheduled_events/evt-group-2';

  const inviteeA = {
    event: 'invitee.created',
    created_by: 'https://api.calendly.com/users/uk-user',
    payload: {
      uri: 'https://api.calendly.com/invitees/a',
      scheduled_event: {
        uri: scheduledEventUri,
        event_memberships: [{ user: 'https://api.calendly.com/users/uk-user' }],
      },
    },
  };
  const inviteeB = {
    event: 'invitee.created',
    created_by: 'https://api.calendly.com/users/uk-user',
    payload: {
      uri: 'https://api.calendly.com/invitees/b',
      scheduled_event: {
        uri: scheduledEventUri,
        event_memberships: [{ user: 'https://api.calendly.com/users/uk-user' }],
      },
    },
  };

  const a = await processCalendlyWebhookEvent({
    prisma: mock.prisma as never,
    rawBody: JSON.stringify(inviteeA),
    body: inviteeA,
    env,
  });
  const b = await processCalendlyWebhookEvent({
    prisma: mock.prisma as never,
    rawBody: JSON.stringify(inviteeB),
    body: inviteeB,
    env,
  });
  assert.equal(a.status, 'processed');
  assert.equal(b.status, 'processed');
  assert.equal(mock.webhookRows.size, 2);
  assert.equal(mock.appointments.size, 2);
});

test('tenant mapping: UK and Infotech provider identities; unknown fails closed', async () => {
  assert.equal(
    findEnvConnectionByProviderUri('https://api.calendly.com/users/uk-user', {
      SCHEDULING_PW_UK_CALENDLY_USER_URI: 'https://api.calendly.com/users/uk-user',
    } as NodeJS.ProcessEnv)?.connection.tenantId,
    'pw-uk',
  );
  assert.equal(
    findEnvConnectionByProviderUri('https://api.calendly.com/users/infotech', {
      SCHEDULING_PW_INFOTECH_ENABLED: 'true',
      SCHEDULING_PW_INFOTECH_PUBLIC_BOOKING_URL: 'https://calendly.com/x/y',
      SCHEDULING_PW_INFOTECH_CALENDLY_USER_URI: 'https://api.calendly.com/users/infotech',
    } as NodeJS.ProcessEnv)?.connection.tenantId,
    'pw-infotech',
  );
  assert.equal(
    findEnvConnectionByProviderUri('https://api.calendly.com/users/unknown', {
      SCHEDULING_PW_UK_CALENDLY_USER_URI: 'https://api.calendly.com/users/uk-user',
    } as NodeJS.ProcessEnv),
    null,
  );

  const mock = makePrismaMock();
  const unknown = await processCalendlyWebhookEvent({
    prisma: mock.prisma as never,
    rawBody: '{}',
    body: {
      event: 'invitee.created',
      created_by: 'https://api.calendly.com/users/unknown',
      payload: {
        uri: 'https://api.calendly.com/invitees/x',
        scheduled_event: { uri: 'https://api.calendly.com/scheduled_events/other' },
      },
    },
    env: {
      SCHEDULING_PW_UK_CALENDLY_USER_URI: 'https://api.calendly.com/users/uk-user',
      SCHEDULING_PW_INFOTECH_ENABLED: 'true',
      SCHEDULING_PW_INFOTECH_PUBLIC_BOOKING_URL: 'https://calendly.com/x/y',
      SCHEDULING_PW_INFOTECH_CALENDLY_USER_URI: 'https://api.calendly.com/users/infotech',
    } as NodeJS.ProcessEnv,
  });
  assert.equal(unknown.status, 'rejected');
  // Payload tenantId must have no authority
  const spoofed = await processCalendlyWebhookEvent({
    prisma: mock.prisma as never,
    rawBody: '{}',
    body: {
      event: 'invitee.created',
      created_by: 'https://api.calendly.com/users/unknown',
      payload: {
        uri: 'https://api.calendly.com/invitees/y',
        tenantId: 'pw-uk',
        scheduled_event: { uri: 'https://api.calendly.com/scheduled_events/spoof' },
      } as never,
    },
    env: {
      SCHEDULING_PW_UK_CALENDLY_USER_URI: 'https://api.calendly.com/users/uk-user',
    } as NodeJS.ProcessEnv,
  });
  assert.equal(spoofed.status, 'rejected');
});

test('Admin capabilities: RRB chat only; UK modules unavailable; users platform-wide', () => {
  assert.equal(resolveTenantCapabilityModuleAvailability('chatLeads', 'rrb').available, true);
  assert.equal(resolveTenantCapabilityModuleAvailability('chatHistory', 'rrb').available, true);
  assert.equal(resolveTenantCapabilityModuleAvailability('auditLeads', 'rrb').available, false);
  assert.equal(resolveTenantCapabilityModuleAvailability('forms', 'rrb').available, false);
  assert.equal(resolveTenantCapabilityModuleAvailability('conversion', 'rrb').available, false);
  assert.equal(resolveTenantCapabilityModuleAvailability('scheduling', 'rrb').available, false);
  assert.equal(isUkModuleAvailable('autopilot', 'rrb'), false);
  assert.equal(isUkModuleAvailable('blogCms', 'rrb'), false);
  assert.equal(isUkModuleAvailable('blogComments', 'rrb'), false);
  assert.equal(isPlatformModuleAvailable('rrb'), true);
  assert.equal(getPlatformUserManagementAvailability('rrb').scopeBadge, PLATFORM_WIDE_BADGE);
});

test('Admin capabilities: Infotech services available; scheduling config may be inactive', () => {
  assert.equal(resolveTenantCapabilityModuleAvailability('forms', 'pw-infotech').available, true);
  assert.equal(resolveTenantCapabilityModuleAvailability('auditLeads', 'pw-infotech').available, true);
  assert.equal(resolveTenantCapabilityModuleAvailability('conversion', 'pw-infotech').available, true);
  assert.equal(resolveTenantCapabilityModuleAvailability('chatLeads', 'pw-infotech').available, true);
  const scheduling = resolveTenantCapabilityModuleAvailability('scheduling', 'pw-infotech', {});
  assert.equal(scheduling.available, true);
  assert.equal(scheduling.configurationActive, false);
  assert.equal(scheduling.scopeNote, SCHEDULING_CONFIG_INACTIVE_NOTE);

  const schedulingConfigured = resolveTenantCapabilityModuleAvailability('scheduling', 'pw-infotech', {
    SCHEDULING_PW_INFOTECH_ENABLED: 'true',
    SCHEDULING_PW_INFOTECH_PUBLIC_BOOKING_URL: 'https://calendly.com/infotech/consult',
  } as NodeJS.ProcessEnv);
  assert.equal(schedulingConfigured.available, true);
  assert.equal(schedulingConfigured.configurationActive, true);
});

test('discovery destination: RRB and Infotech cannot inherit UK destination; UK intact', () => {
  assert.equal(
    resolveChatBookingDestination({
      tenantId: 'rrb',
      canBookCall: false,
      publicBookingUrl: DEFAULT_PW_UK_CALENDLY_BOOKING_URL,
    }),
    null,
  );
  assert.equal(
    resolveChatBookingDestination({
      tenantId: 'pw-infotech',
      canBookCall: false,
      publicBookingUrl: null,
    }),
    null,
  );
  assert.equal(
    resolveChatBookingDestination({
      tenantId: 'pw-infotech',
      canBookCall: true,
      publicBookingUrl: 'https://calendly.com/primewayz-infotech/consult',
    }),
    'https://calendly.com/primewayz-infotech/consult',
  );
  assert.notEqual(
    resolveChatBookingDestination({
      tenantId: 'pw-infotech',
      canBookCall: true,
      publicBookingUrl: 'https://calendly.com/primewayz-infotech/consult',
    }),
    DISCOVERY_CALL_DESTINATION,
  );
  assert.equal(
    resolveChatBookingDestination({
      tenantId: 'pw-uk',
      canBookCall: true,
      publicBookingUrl: DEFAULT_PW_UK_CALENDLY_BOOKING_URL,
    }),
    DISCOVERY_CALL_DESTINATION,
  );
  assert.equal(getSchedulingAvailability({ tenantId: 'rrb' }, {}).publicBookingUrl, null);
  assert.equal(getSchedulingAvailability({ tenantId: 'pw-infotech' }, {}).publicBookingUrl, null);
  assert.equal(
    getSchedulingAvailability({ tenantId: 'pw-uk' }, {}).publicBookingUrl,
    DEFAULT_PW_UK_CALENDLY_BOOKING_URL,
  );
});

test('audit/source label derives registry display name for RRB and future tenants', () => {
  assert.equal(getTenantDisplayName('rrb'), 'RentReadBuy');
  assert.equal(getTenantDisplayName('pw-uk'), 'Primewayz UK');
  assert.equal(getTenantDisplayName('pw-infotech'), 'Primewayz Infotech');
  // Future registry tenants resolve without audit-code changes
  assert.equal(getTenantDisplayName('pw-us'), 'Primewayz US');
});

test('scheduling conversion attribution preserves tenant and avoids UK double count', () => {
  const uk = resolveSchedulingConversionAttribution({
    tenantId: 'pw-uk',
    clientSideAnalyticsOwned: true,
    alreadyEmitted: false,
  });
  assert.equal(uk.shouldEmit, false);
  assert.equal(uk.tenantId, 'pw-uk');

  const infotech = resolveSchedulingConversionAttribution({
    tenantId: 'pw-infotech',
    clientSideAnalyticsOwned: false,
    alreadyEmitted: false,
  });
  assert.equal(infotech.shouldEmit, true);
  assert.equal(infotech.tenantId, 'pw-infotech');
  assert.equal(infotech.conversionType, 'booking_completed');
});

test('notification routing never falls across tenants', () => {
  const rrb = resolveSourceContext({ origin: 'https://www.rentreadbuy.com', sourceChannel: 'chat' });
  const env = {
    INTERNAL_NOTIFICATION_EMAIL: 'uk@example.com',
    PW_INFOTECH_NOTIFICATION_EMAIL: 'in@example.com',
  };
  assert.equal(getTenantNotificationRecipient(rrb, env), null);
});
