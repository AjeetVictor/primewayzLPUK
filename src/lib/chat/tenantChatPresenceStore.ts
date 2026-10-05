/**
 * Tenant-scoped team presence persistence.
 *
 * Every read and write is keyed by a concrete tenantId supplied by an already-authorised caller
 * (server-derived public source, Admin tenant selector, or a credential-bound integration).
 * There is no global or cross-tenant fallback: a tenant with no rows reads as null/null.
 */

export type TenantChatPresencePrisma = {
  chatPresenceSetting: {
    findFirst: (args: {
      where: { tenantId: string };
      orderBy: { updatedAt: 'desc' };
      select: { mode: true; message: true };
    }) => Promise<{ mode: string; message: string | null } | null>;
    create: (args: {
      data: { tenantId: string; mode: string; message: string | null; updatedById: number | null };
    }) => Promise<unknown>;
  };
  adminPresence: {
    findFirst: (args: {
      where: { tenantId: string };
      orderBy: { lastSeenAt: 'desc' };
      select: { lastSeenAt: true };
    }) => Promise<{ lastSeenAt: Date } | null>;
    upsert: (args: {
      where: { tenantId_userId: { tenantId: string; userId: number } };
      update: { lastSeenAt: Date };
      create: { tenantId: string; userId: number; lastSeenAt: Date };
    }) => Promise<unknown>;
  };
};

export type TenantChatPresenceReadPrisma = {
  chatPresenceSetting: Pick<TenantChatPresencePrisma['chatPresenceSetting'], 'findFirst'>;
  adminPresence: Pick<TenantChatPresencePrisma['adminPresence'], 'findFirst'>;
};

export type TenantChatPresenceState = {
  setting: { mode: string; message: string | null } | null;
  latestAdminSeenAt: Date | null;
};

export async function readTenantChatPresence(
  prisma: TenantChatPresenceReadPrisma,
  tenantId: string,
): Promise<TenantChatPresenceState> {
  const [setting, latestPresence] = await Promise.all([
    prisma.chatPresenceSetting.findFirst({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      select: { mode: true, message: true },
    }),
    prisma.adminPresence.findFirst({
      where: { tenantId },
      orderBy: { lastSeenAt: 'desc' },
      select: { lastSeenAt: true },
    }),
  ]);
  return { setting: setting ?? null, latestAdminSeenAt: latestPresence?.lastSeenAt ?? null };
}

const EMPTY_PRESENCE_STATE: TenantChatPresenceState = { setting: null, latestAdminSeenAt: null };

/** Without a concrete tenant there is no presence lookup at all (never a global read). */
export async function readOptionalTenantChatPresence(
  prisma: TenantChatPresenceReadPrisma,
  tenantId: string | null | undefined,
): Promise<TenantChatPresenceState> {
  if (!tenantId) return { ...EMPTY_PRESENCE_STATE };
  return readTenantChatPresence(prisma, tenantId);
}

export async function recordTenantChatPresenceSetting(
  prisma: Pick<TenantChatPresencePrisma, 'chatPresenceSetting'>,
  input: { tenantId: string; mode: string; message: string | null; updatedById: number | null },
): Promise<void> {
  await prisma.chatPresenceSetting.create({
    data: {
      tenantId: input.tenantId,
      mode: input.mode,
      message: input.message,
      updatedById: input.updatedById,
    },
  });
}

export async function recordTenantAdminHeartbeat(
  prisma: Pick<TenantChatPresencePrisma, 'adminPresence'>,
  input: { tenantId: string; userId: number; now?: Date },
): Promise<void> {
  const lastSeenAt = input.now ?? new Date();
  await prisma.adminPresence.upsert({
    where: { tenantId_userId: { tenantId: input.tenantId, userId: input.userId } },
    update: { lastSeenAt },
    create: { tenantId: input.tenantId, userId: input.userId, lastSeenAt },
  });
}
