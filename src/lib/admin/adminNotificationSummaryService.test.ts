import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAdminNotificationSummary,
  type AdminNotificationSummaryPrisma,
} from './adminNotificationSummaryService.ts';
import { SourceResolutionError } from '../platform/sourceResolver.ts';
import {
  adminSessionTenantWhere,
  adminTenantWhere,
  resolveAdminTenantFilter,
} from '../platform/adminTenantFilter.ts';
import {
  AUTOPILOT_ALL_ENTITIES_SCOPE_NOTE,
  AUTOPILOT_UK_SCOPE_NOTE,
  getAutopilotTenantScopeNote,
  isAutopilotAvailableForAdminTenant,
} from '../autopilot/adminAutopilotTenantScope.ts';

type SessionRow = {
  id: string;
  tenantId: string | null;
  market: string | null;
  sourceSite: string | null;
  createdAt: Date;
};

type FormRow = { id: number; tenantId: string | null; createdAt: Date };
type MessageRow = { id: number; sender: string; sessionId: string; timestamp: Date };
type AppointmentRow = { id: number; sessionId: string; status: string; createdAt: Date };
type AlertRow = {
  id: number;
  sessionId: string;
  messageId: number;
  alertType: string;
  status: string;
  sentAt: Date;
  createdAt: Date;
};

function matchesTenant(where: Record<string, unknown>, tenantId: string | null): boolean {
  if (!('tenantId' in where)) return true;
  return where.tenantId === tenantId;
}

function matchesSessionTenant(
  where: Record<string, unknown>,
  sessions: SessionRow[],
  sessionId: string,
): boolean {
  const nested = where.session as { tenantId?: string } | undefined;
  if (!nested?.tenantId) return true;
  const session = sessions.find((row) => row.id === sessionId);
  return session?.tenantId === nested.tenantId;
}

function matchesSessionIdIn(where: Record<string, unknown>, sessionId: string): boolean {
  const scope = where.sessionId as { in?: string[] } | undefined;
  if (!scope?.in) return true;
  return scope.in.includes(sessionId);
}

function inToday(createdAt: Date, start: Date, end: Date): boolean {
  return createdAt >= start && createdAt < end;
}

function createPrismaFixture(seed: {
  sessions: SessionRow[];
  forms: FormRow[];
  messages: MessageRow[];
  appointments: AppointmentRow[];
  alerts: AlertRow[];
}): AdminNotificationSummaryPrisma & {
  lastFormWhere?: Record<string, unknown>;
  lastSessionWhere?: Record<string, unknown>;
  lastAlertWheres: Record<string, unknown>[];
} {
  const state = {
    lastFormWhere: undefined as Record<string, unknown> | undefined,
    lastSessionWhere: undefined as Record<string, unknown> | undefined,
    lastAlertWheres: [] as Record<string, unknown>[],
  };

  const prisma: AdminNotificationSummaryPrisma & typeof state = {
    ...state,
    formResponse: {
      count: async ({ where }) => {
        state.lastFormWhere = where;
        prisma.lastFormWhere = where;
        const start = (where.createdAt as { gte: Date; lt: Date }).gte;
        const end = (where.createdAt as { gte: Date; lt: Date }).lt;
        return seed.forms.filter(
          (row) => inToday(row.createdAt, start, end) && matchesTenant(where, row.tenantId),
        ).length;
      },
    },
    chatSession: {
      count: async ({ where }) => {
        state.lastSessionWhere = where;
        prisma.lastSessionWhere = where;
        const start = (where.createdAt as { gte: Date; lt: Date }).gte;
        const end = (where.createdAt as { gte: Date; lt: Date }).lt;
        return seed.sessions.filter(
          (row) => inToday(row.createdAt, start, end) && matchesTenant(where, row.tenantId),
        ).length;
      },
      findMany: async ({ where, select }) => {
        if (select.id && !select.tenantId) {
          return seed.sessions
            .filter((row) => matchesTenant(where || {}, row.tenantId))
            .map((row) => ({ id: row.id }));
        }
        const ids = (where?.id as { in?: string[] } | undefined)?.in;
        return seed.sessions
          .filter((row) => !ids || ids.includes(row.id))
          .map((row) => ({
            id: row.id,
            tenantId: row.tenantId,
            market: row.market,
            sourceSite: row.sourceSite,
          }));
      },
    },
    chatMessage: {
      count: async ({ where }) => {
        const start = (where.timestamp as { gte: Date; lt: Date }).gte;
        const end = (where.timestamp as { gte: Date; lt: Date }).lt;
        return seed.messages.filter(
          (row) =>
            row.sender === where.sender &&
            inToday(row.timestamp, start, end) &&
            matchesSessionTenant(where, seed.sessions, row.sessionId),
        ).length;
      },
    },
    chatAppointmentRequest: {
      count: async ({ where }) => {
        return seed.appointments.filter((row) => {
          if (where.status && row.status !== where.status) return false;
          if (where.createdAt) {
            const start = (where.createdAt as { gte: Date; lt: Date }).gte;
            const end = (where.createdAt as { gte: Date; lt: Date }).lt;
            if (!inToday(row.createdAt, start, end)) return false;
          }
          return matchesSessionTenant(where, seed.sessions, row.sessionId);
        }).length;
      },
    },
    chatAlert: {
      count: async ({ where }) => {
        state.lastAlertWheres.push(where);
        prisma.lastAlertWheres = state.lastAlertWheres;
        const start = (where.createdAt as { gte: Date; lt: Date } | undefined)?.gte;
        const end = (where.createdAt as { gte: Date; lt: Date } | undefined)?.lt;
        return seed.alerts.filter((row) => {
          if (where.alertType && row.alertType !== where.alertType) return false;
          if (where.status && row.status !== where.status) return false;
          if (start && end && !inToday(row.createdAt, start, end)) return false;
          return matchesSessionIdIn(where, row.sessionId);
        }).length;
      },
      findMany: async ({ where, take }) => {
        state.lastAlertWheres.push(where || {});
        prisma.lastAlertWheres = state.lastAlertWheres;
        return seed.alerts
          .filter((row) => matchesSessionIdIn(where || {}, row.sessionId))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, take);
      },
    },
    leadSummaryEmail: {
      findFirst: async () => ({
        id: 1,
        dateKey: '2026-09-16',
        summaryType: 'daily_lead_summary',
        status: 'sent',
        sentAt: new Date('2026-09-16T08:00:00.000Z'),
        createdAt: new Date('2026-09-16T08:00:00.000Z'),
      }),
    },
  };

  return prisma;
}

const now = new Date('2026-09-16T12:00:00.000Z');
const today = new Date('2026-09-16T10:00:00.000Z');
const yesterday = new Date('2026-09-15T10:00:00.000Z');

const fixtureSeed = {
  sessions: [
    {
      id: 'sess-uk',
      tenantId: 'pw-uk',
      market: 'UK',
      sourceSite: 'uk.primewayz.com',
      createdAt: today,
    },
    {
      id: 'sess-in',
      tenantId: 'pw-infotech',
      market: 'IN',
      sourceSite: 'primewayz.com',
      createdAt: today,
    },
    {
      id: 'sess-legacy',
      tenantId: null,
      market: null,
      sourceSite: null,
      createdAt: today,
    },
  ] satisfies SessionRow[],
  forms: [
    { id: 1, tenantId: 'pw-uk', createdAt: today },
    { id: 2, tenantId: 'pw-infotech', createdAt: today },
    { id: 3, tenantId: null, createdAt: today },
  ] satisfies FormRow[],
  messages: [
    { id: 1, sender: 'user', sessionId: 'sess-uk', timestamp: today },
    { id: 2, sender: 'user', sessionId: 'sess-in', timestamp: today },
    { id: 3, sender: 'admin', sessionId: 'sess-uk', timestamp: today },
  ] satisfies MessageRow[],
  appointments: [
    { id: 1, sessionId: 'sess-uk', status: 'pending', createdAt: today },
    { id: 2, sessionId: 'sess-in', status: 'pending', createdAt: today },
    { id: 3, sessionId: 'sess-legacy', status: 'pending', createdAt: yesterday },
  ] satisfies AppointmentRow[],
  alerts: [
    {
      id: 10,
      sessionId: 'sess-uk',
      messageId: 100,
      alertType: 'unanswered_chat',
      status: 'logged',
      sentAt: today,
      createdAt: today,
    },
    {
      id: 11,
      sessionId: 'sess-in',
      messageId: 101,
      alertType: 'unanswered_chat',
      status: 'logged',
      sentAt: today,
      createdAt: today,
    },
    {
      id: 12,
      sessionId: 'sess-legacy',
      messageId: 102,
      alertType: 'unanswered_chat',
      status: 'failed',
      sentAt: today,
      createdAt: today,
    },
  ] satisfies AlertRow[],
};

test('resolveAdminTenantFilter accepts active tenants and all, rejects invalid', () => {
  assert.equal(resolveAdminTenantFilter('pw-uk'), 'pw-uk');
  assert.equal(resolveAdminTenantFilter('pw-infotech'), 'pw-infotech');
  assert.equal(resolveAdminTenantFilter('all'), undefined);
  assert.equal(resolveAdminTenantFilter(undefined), 'pw-uk');
  assert.throws(() => resolveAdminTenantFilter('pw-us'), SourceResolutionError);
  assert.throws(() => resolveAdminTenantFilter('not-a-tenant'), SourceResolutionError);
});

test('admin tenant where helpers never coerce legacy NULL into pw-uk', () => {
  assert.deepEqual(adminTenantWhere('pw-uk'), { tenantId: 'pw-uk' });
  assert.deepEqual(adminTenantWhere('pw-infotech'), { tenantId: 'pw-infotech' });
  assert.deepEqual(adminTenantWhere(undefined), {});
  assert.deepEqual(adminSessionTenantWhere('pw-infotech'), { session: { tenantId: 'pw-infotech' } });
  assert.deepEqual(adminSessionTenantWhere(undefined), {});
});

test('operational metrics pw-uk exclude pw-infotech and legacy', async () => {
  const prisma = createPrismaFixture(fixtureSeed);
  const summary = await getAdminNotificationSummary(prisma, { tenantId: 'pw-uk', now });
  assert.equal(summary.tenantId, 'pw-uk');
  assert.equal(summary.counts.todayContactForms, 1);
  assert.equal(summary.counts.todayChatSessions, 1);
  assert.equal(summary.counts.todayVisitorMessages, 1);
  assert.equal(summary.counts.pendingAppointments, 1);
  assert.equal(summary.counts.todayUnansweredAlerts, 1);
  assert.equal(prisma.lastFormWhere?.tenantId, 'pw-uk');
  assert.equal(prisma.lastSessionWhere?.tenantId, 'pw-uk');
});

test('operational metrics pw-infotech exclude pw-uk and legacy', async () => {
  const prisma = createPrismaFixture(fixtureSeed);
  const summary = await getAdminNotificationSummary(prisma, { tenantId: 'pw-infotech', now });
  assert.equal(summary.tenantId, 'pw-infotech');
  assert.equal(summary.counts.todayContactForms, 1);
  assert.equal(summary.counts.todayChatSessions, 1);
  assert.equal(summary.counts.todayVisitorMessages, 1);
  assert.equal(summary.counts.pendingAppointments, 1);
  assert.equal(summary.counts.todayUnansweredAlerts, 1);
  assert.equal(summary.latestDailySummary, null);
  assert.equal(summary.dailySummaryScope, 'none');
});

test('active alert queue pw-infotech excludes UK and legacy', async () => {
  const prisma = createPrismaFixture(fixtureSeed);
  const summary = await getAdminNotificationSummary(prisma, { tenantId: 'pw-infotech', now });
  assert.equal(summary.latestAlerts.length, 1);
  assert.equal(summary.latestAlerts[0]?.sessionId, 'sess-in');
  assert.equal(summary.latestAlerts[0]?.tenantId, 'pw-infotech');
  assert.ok(summary.latestAlerts.every((alert) => alert.tenantId === 'pw-infotech'));
});

test('active alert queue pw-uk excludes Infotech and legacy', async () => {
  const prisma = createPrismaFixture(fixtureSeed);
  const summary = await getAdminNotificationSummary(prisma, { tenantId: 'pw-uk', now });
  assert.equal(summary.latestAlerts.length, 1);
  assert.equal(summary.latestAlerts[0]?.sessionId, 'sess-uk');
  assert.equal(summary.latestAlerts[0]?.tenantId, 'pw-uk');
});

test('all entities includes both tenants plus legacy in KPIs and alert queue', async () => {
  const prisma = createPrismaFixture(fixtureSeed);
  const summary = await getAdminNotificationSummary(prisma, { tenantId: undefined, now });
  assert.equal(summary.tenantId, 'all');
  assert.equal(summary.counts.todayContactForms, 3);
  assert.equal(summary.counts.todayChatSessions, 3);
  assert.equal(summary.counts.pendingAppointments, 3);
  assert.equal(summary.counts.todayUnansweredAlerts, 3);
  assert.equal(summary.latestAlerts.length, 3);
  const tenantIds = new Set(summary.latestAlerts.map((alert) => alert.tenantId));
  assert.ok(tenantIds.has('pw-uk'));
  assert.ok(tenantIds.has('pw-infotech'));
  assert.ok(tenantIds.has(null));
  assert.equal(summary.dailySummaryScope, 'pw-uk');
  assert.ok(summary.latestDailySummary);
});

test('top KPI tenant filtering matches backend definitions for Infotech QA case', async () => {
  const prisma = createPrismaFixture({
    ...fixtureSeed,
    sessions: [
      {
        id: 'qa-in',
        tenantId: 'pw-infotech',
        market: 'IN',
        sourceSite: 'primewayz.com',
        createdAt: today,
      },
      {
        id: 'other-uk',
        tenantId: 'pw-uk',
        market: 'UK',
        sourceSite: 'uk.primewayz.com',
        createdAt: today,
      },
    ],
    forms: [],
    messages: [],
    appointments: [],
    alerts: [],
  });
  const summary = await getAdminNotificationSummary(prisma, { tenantId: 'pw-infotech', now });
  assert.equal(summary.counts.todayChatSessions, 1);
});

test('Autopilot is UK-scoped outside pw-uk tenant context', () => {
  assert.equal(isAutopilotAvailableForAdminTenant('pw-uk'), true);
  assert.equal(isAutopilotAvailableForAdminTenant('all'), true);
  assert.equal(isAutopilotAvailableForAdminTenant('pw-infotech'), false);
  assert.equal(getAutopilotTenantScopeNote('pw-infotech'), AUTOPILOT_UK_SCOPE_NOTE);
  assert.equal(getAutopilotTenantScopeNote('all'), AUTOPILOT_ALL_ENTITIES_SCOPE_NOTE);
  assert.equal(getAutopilotTenantScopeNote('pw-uk'), null);
});
