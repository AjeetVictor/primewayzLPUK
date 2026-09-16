import { adminSessionTenantWhere, adminTenantWhere } from '../platform/adminTenantFilter.ts';

export type AdminNotificationSummaryPrisma = {
  formResponse: {
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
  };
  chatSession: {
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
    findMany: (args: {
      where?: Record<string, unknown>;
      select: { id: true; tenantId?: true; market?: true; sourceSite?: true };
    }) => Promise<
      Array<{
        id: string;
        tenantId?: string | null;
        market?: string | null;
        sourceSite?: string | null;
      }>
    >;
  };
  chatMessage: {
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
  };
  chatAppointmentRequest: {
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
  };
  chatAlert: {
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
    findMany: (args: {
      where?: Record<string, unknown>;
      orderBy: { createdAt: 'desc' };
      take: number;
    }) => Promise<
      Array<{
        id: number;
        sessionId: string;
        messageId: number;
        alertType: string;
        status: string;
        sentAt: Date;
        createdAt: Date;
      }>
    >;
  };
  leadSummaryEmail: {
    findFirst: (args: { orderBy: { createdAt: 'desc' } }) => Promise<{
      id: number;
      dateKey: string;
      summaryType: string;
      status: string;
      sentAt: Date | null;
      createdAt: Date;
    } | null>;
  };
};

export type AdminNotificationAlert = {
  id: number;
  sessionId: string;
  messageId: number;
  alertType: string;
  status: string;
  sentAt: Date;
  createdAt: Date;
  tenantId: string | null;
  market: string | null;
  sourceSite: string | null;
};

export type AdminNotificationSummary = {
  dateKey: string;
  generatedAt: string;
  tenantId: string;
  priority: 'normal' | 'medium' | 'high';
  counts: {
    todayContactForms: number;
    todayChatSessions: number;
    todayVisitorMessages: number;
    todayAdminReplies: number;
    todayAppointments: number;
    pendingAppointments: number;
    todayUnansweredAlerts: number;
    todayEmailSentAlerts: number;
    todayEmailFailedAlerts: number;
    todayEmailSkippedAlerts: number;
    recentAlertCount: number;
  };
  latestAlerts: AdminNotificationAlert[];
  latestDailySummary: {
    id: number;
    dateKey: string;
    summaryType: string;
    status: string;
    sentAt: Date | null;
    createdAt: Date;
  } | null;
  dailySummaryScope: 'pw-uk' | 'none';
};

export function todayRange(now = new Date()): { start: Date; end: Date } {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function dateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * ChatAlert has no Prisma relation to ChatSession yet, so tenant scope is applied
 * via sessionId ∈ tenant-owned sessions. Empty set → no alerts for that tenant.
 */
async function tenantSessionIdScope(
  prisma: AdminNotificationSummaryPrisma,
  tenantId: string | undefined,
): Promise<{ sessionId: { in: string[] } } | Record<string, never>> {
  if (!tenantId) return {};
  const sessions = await prisma.chatSession.findMany({
    where: { tenantId },
    select: { id: true },
  });
  return { sessionId: { in: sessions.map((session) => session.id) } };
}

export async function getAdminNotificationSummary(
  prisma: AdminNotificationSummaryPrisma,
  options: {
    /** Concrete tenant id, or undefined for All entities. */
    tenantId: string | undefined;
    now?: Date;
  },
): Promise<AdminNotificationSummary> {
  const now = options.now ?? new Date();
  const { start, end } = todayRange(now);
  const tenantId = options.tenantId;
  const tenantWhere = adminTenantWhere(tenantId);
  const sessionTenantWhere = adminSessionTenantWhere(tenantId);
  const alertSessionScope = await tenantSessionIdScope(prisma, tenantId);
  const todayCreated = { createdAt: { gte: start, lt: end } };
  const todayMessage = { timestamp: { gte: start, lt: end } };

  const [
    todayContactForms,
    todayChatSessions,
    todayVisitorMessages,
    todayAdminReplies,
    todayAppointments,
    pendingAppointments,
    todayUnansweredAlerts,
    todayEmailSentAlerts,
    todayEmailFailedAlerts,
    todayEmailSkippedAlerts,
    recentAlertCount,
    latestAlertsRaw,
    latestDailySummaryRaw,
  ] = await Promise.all([
    prisma.formResponse.count({ where: { ...todayCreated, ...tenantWhere } }),
    prisma.chatSession.count({ where: { ...todayCreated, ...tenantWhere } }),
    prisma.chatMessage.count({
      where: { sender: 'user', ...todayMessage, ...sessionTenantWhere },
    }),
    prisma.chatMessage.count({
      where: { sender: 'admin', ...todayMessage, ...sessionTenantWhere },
    }),
    prisma.chatAppointmentRequest.count({
      where: { ...todayCreated, ...sessionTenantWhere },
    }),
    prisma.chatAppointmentRequest.count({
      where: { status: 'pending', ...sessionTenantWhere },
    }),
    prisma.chatAlert.count({
      where: {
        alertType: 'unanswered_chat',
        ...todayCreated,
        ...alertSessionScope,
      },
    }),
    prisma.chatAlert.count({
      where: { status: 'sent', ...todayCreated, ...alertSessionScope },
    }),
    prisma.chatAlert.count({
      where: { status: 'failed', ...todayCreated, ...alertSessionScope },
    }),
    prisma.chatAlert.count({
      where: { status: 'skipped', ...todayCreated, ...alertSessionScope },
    }),
    prisma.chatAlert.count({
      where: { ...todayCreated, ...alertSessionScope },
    }),
    prisma.chatAlert.findMany({
      where: { ...alertSessionScope },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Daily summary email is UK operational only (no tenant column).
    tenantId === undefined || tenantId === 'pw-uk'
      ? prisma.leadSummaryEmail.findFirst({ orderBy: { createdAt: 'desc' } })
      : Promise.resolve(null),
  ]);

  const sessionIds = [...new Set(latestAlertsRaw.map((alert) => alert.sessionId))];
  const sessions =
    sessionIds.length > 0
      ? await prisma.chatSession.findMany({
          where: { id: { in: sessionIds } },
          select: { id: true, tenantId: true, market: true, sourceSite: true },
        })
      : [];
  const sessionById = new Map(sessions.map((session) => [session.id, session]));

  const latestAlerts: AdminNotificationAlert[] = latestAlertsRaw.map((alert) => {
    const session = sessionById.get(alert.sessionId);
    return {
      ...alert,
      tenantId: session?.tenantId ?? null,
      market: session?.market ?? null,
      sourceSite: session?.sourceSite ?? null,
    };
  });

  const priority: AdminNotificationSummary['priority'] =
    pendingAppointments || todayUnansweredAlerts || todayEmailFailedAlerts
      ? todayEmailFailedAlerts > 0
        ? 'high'
        : 'medium'
      : 'normal';

  return {
    dateKey: dateKey(now),
    generatedAt: now.toISOString(),
    tenantId: tenantId ?? 'all',
    priority,
    counts: {
      todayContactForms,
      todayChatSessions,
      todayVisitorMessages,
      todayAdminReplies,
      todayAppointments,
      pendingAppointments,
      todayUnansweredAlerts,
      todayEmailSentAlerts,
      todayEmailFailedAlerts,
      todayEmailSkippedAlerts,
      recentAlertCount,
    },
    latestAlerts,
    latestDailySummary: latestDailySummaryRaw,
    dailySummaryScope: tenantId === undefined || tenantId === 'pw-uk' ? 'pw-uk' : 'none',
  };
}
