import {
  TENANT_PRESENCE_EVENT_MAX_PER_TENANT,
  TENANT_PRESENCE_EVENT_RETENTION_MS,
  buildPresenceEventDedupeKey,
  isTenantPresenceEventType,
  normalizeActorRef,
  normalizeCorrelationId,
  sanitizePresenceEventDetails,
  type AppendTenantPresenceEventInput,
  type TenantPresenceEventRecord,
  type TenantPresenceEventStore,
  type TenantPresenceEventType,
} from './tenantPresenceEvents.ts';

export function createMemoryTenantPresenceEventStore(): TenantPresenceEventStore {
  const events: TenantPresenceEventRecord[] = [];
  let nextId = 1;

  function toPublic(row: TenantPresenceEventRecord, duplicated = false): TenantPresenceEventRecord {
    return { ...row, duplicated };
  }

  return {
    async append(input: AppendTenantPresenceEventInput) {
      if (!isTenantPresenceEventType(input.eventType)) {
        throw new Error('invalid_presence_event_type');
      }
      const at = input.at ?? new Date();
      const dedupeKey = buildPresenceEventDedupeKey({
        eventType: input.eventType,
        actorRef: input.actorRef,
        actorUserId: input.actorUserId,
        correlationId: input.correlationId,
        dedupeKey: input.dedupeKey,
        at,
      });
      const existing = events.find(
        (row) =>
          row.tenantId === input.tenantId
          && row.eventType === input.eventType
          && row.dedupeKey === dedupeKey,
      );
      if (existing) return toPublic(existing, true);

      const row: TenantPresenceEventRecord = {
        id: nextId,
        tenantId: input.tenantId,
        eventType: input.eventType as TenantPresenceEventType,
        actorRef: normalizeActorRef(input.actorRef),
        actorUserId: input.actorUserId ?? null,
        correlationId: normalizeCorrelationId(input.correlationId),
        dedupeKey,
        details: sanitizePresenceEventDetails(input.details),
        createdAt: at,
        duplicated: false,
      };
      nextId += 1;
      events.push(row);
      return toPublic(row, false);
    },

    async list(filter) {
      let rows = [...events];
      if (filter.tenantId) rows = rows.filter((row) => row.tenantId === filter.tenantId);
      if (filter.tenantIds) {
        const allowed = new Set(filter.tenantIds);
        rows = rows.filter((row) => allowed.has(row.tenantId));
      }
      if (filter.beforeId != null) rows = rows.filter((row) => row.id < filter.beforeId!);
      return rows
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime() || right.id - left.id)
        .slice(0, filter.limit)
        .map((row) => toPublic(row));
    },

    async prune(now = new Date()) {
      const cutoff = now.getTime() - TENANT_PRESENCE_EVENT_RETENTION_MS;
      const beforeAge = events.length;
      for (let i = events.length - 1; i >= 0; i -= 1) {
        if (events[i].createdAt.getTime() < cutoff) events.splice(i, 1);
      }
      const deletedByAge = beforeAge - events.length;

      let deletedByCap = 0;
      const byTenant = new Map<string, TenantPresenceEventRecord[]>();
      for (const row of events) {
        const list = byTenant.get(row.tenantId) ?? [];
        list.push(row);
        byTenant.set(row.tenantId, list);
      }
      const keep = new Set<number>();
      for (const list of byTenant.values()) {
        list
          .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime() || right.id - left.id)
          .slice(0, TENANT_PRESENCE_EVENT_MAX_PER_TENANT)
          .forEach((row) => keep.add(row.id));
      }
      for (let i = events.length - 1; i >= 0; i -= 1) {
        if (!keep.has(events[i].id)) {
          events.splice(i, 1);
          deletedByCap += 1;
        }
      }
      return { deletedByAge, deletedByCap };
    },
  };
}
