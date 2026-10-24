# PW-CHAT-PRESENCE-WS1 — Central presence policy & operational reporting

**Branch:** `feat/pw-chat-presence-ws1`  
**Status:** Central infrastructure only. Option 1 is **not** activated for any production tenant.  
**Companions:** `Docs/pw-chat-tenant-presence-01.md`, `Docs/pw-chat-tenant-presence-requirement.md`

---

## What shipped

| Capability | Detail |
|---|---|
| `presencePolicy` | Per-tenant; default missing row = `legacy_forced_online` (current behaviour) |
| Option 1 flag | `heartbeat_required_online` — Host/Owner only, reason required, audited |
| Presence events | Significant transitions only (not every heartbeat) |
| Host reporting | Read-only consolidated availability + event history |
| Tenant reporting | Same endpoints, scoped to granted tenants |
| Ingestion contract | Versioned `POST /api/v1/operator-presence/heartbeat` for future adapters |

## Migration

Additive migration: `prisma/migrations/20261024120000_tenant_presence_policy_events`

Creates:

- `TenantPresencePolicy` + `TenantPresencePolicyAudit`
- `TenantPresenceEvent` (deduped, retention-bounded)
- `TenantPresenceIdempotencyKey` (replay protection for v1 ingestion)

Does **not** seed policies, rewrite `ChatPresenceSetting` / `AdminPresence`, or activate Option 1.

Apply on deploy hosts later with `npx prisma migrate deploy`. Do not apply to production from this workstream.

## API contract (v1 ingestion)

```
POST /api/v1/operator-presence/heartbeat
Authorization: Bearer <server-side credential>
Body: {
  clientActionId: string (1..64),   // replay protection
  operatorRef: string (1..64),      // tenant-local operator id
  operatorUserId?: number,          // optional central User mapping
  correlationId?: string (1..64)
}
```

Rules:

- Tenant id comes **only** from the credential binding (integration / installation / Admin grant).
- Body `tenantId` is rejected.
- Integration credentials require scope `chat:presence:write` (declared; **not** granted to WordPress or Silver yet).
- Heartbeat TTL remains `ADMIN_PRESENCE_ACTIVE_WINDOW_MS` (5 minutes).
- Permanent events fire on Online **transition**, not every beat.
- Never embed presence-write credentials in frontend JavaScript.

Existing Admin paths unchanged:

- `POST /api/admin/presence/heartbeat?tenantId=`
- `GET|PATCH /api/admin/chat/availability?tenantId=`
- WordPress / Silver ops APIs unchanged

## Governance & reporting APIs

| Method | Path | Auth |
|---|---|---|
| GET | `/api/admin/presence-policy` | Admin (scoped list) |
| POST | `/api/admin/presence-policy/:tenantId` | Host/Owner + reason |
| GET | `/api/admin/presence-reporting` | Admin (scoped; `reportingOnly: true`) |
| GET | `/api/admin/presence-reporting/:tenantId/events` | Admin (scoped) |

Reporting responses include `canManageAvailability: false`. There is no Host override API to manufacture human Online.

## Security & tenant isolation

- No cross-tenant fallback in resolution or reporting.
- Policy store miss / unavailable → legacy behaviour (never invent Option 1).
- Event details run through Autopilot `redactSensitive` + Chat Connect `sanitizeAuditDetails`.
- Host cannot impersonate operators or force Online via reporting.
- WP/Silver keep read-only presence until WS-3 / WS-4 grant `chat:presence:write`.

## Rollout

1. Deploy schema + app with empty policy tables (all tenants legacy).
2. Validate UK adapter (WS-2), then Host activates UK only.
3. Infotech WP adapter (WS-3) → Silver (WS-4) → global cutover (WS-5).

## Rollback

1. Deploy previous application (stops reading policy tables).
2. Optionally drop the four new tables after the previous app is live.

Reverting a single tenant: Host sets `legacy_forced_online` with an audited reason.
