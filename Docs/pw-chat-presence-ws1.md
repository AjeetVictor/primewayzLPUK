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
| Offline path | **Reserved** for WS-2/3/4 (`501`); WS-1 offline = heartbeat TTL expiry |

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
  operatorRef: string (1..64),      // tenant-local operator id (adapter-asserted)
  correlationId?: string (1..64)
}
```

Rules:

- Tenant id comes **only** from the credential binding (integration / installation / Admin grant).
- Body `tenantId` and `operatorUserId` are **rejected**.
- Operator identity is bound to the authorised credential + `operatorRef` (admin session user id, or deterministic negative synthetic id scoped by tenant + integration/installation + operatorRef).
- Integration credentials require scope `chat:presence:write` (declared; **not** granted to WordPress or Silver yet).
- Heartbeat TTL remains `ADMIN_PRESENCE_ACTIVE_WINDOW_MS` (5 minutes).
- Permanent events fire on Online **transition**, not every beat.
- Idempotency: claim → write; on write failure the claim is **released** so retries remain safe.
- Never embed presence-write credentials in frontend JavaScript.

### Offline (reserved)

```
POST /api/v1/operator-presence/offline  → 501 code=reserved
```

Explicit authenticated session invalidation is deferred to WS-2/3/4. Until then, operators go Offline/assistant when heartbeats stop (TTL expiry).

Existing Admin paths unchanged:

- `POST /api/admin/presence/heartbeat?tenantId=` (session-bound user id only)
- `GET|PATCH /api/admin/chat/availability?tenantId=`
- WordPress / Silver ops APIs unchanged

## Governance & reporting APIs

| Method | Path | Auth |
|---|---|---|
| GET | `/api/admin/presence-policy` | Admin (scoped list) |
| POST | `/api/admin/presence-policy/:tenantId` | Host/Owner + reason |
| GET | `/api/admin/presence-reporting` | Admin (scoped; `reportingOnly: true`) |
| GET | `/api/admin/presence-reporting/:tenantId/events` | Admin (scoped) |

Reporting responses include `canManageAvailability: false`. There is no Host override API to manufacture human Online, impersonate operators, or change tenant operator sessions through reporting.

Policy configuration, operational presence writes, and read-only reporting remain separate concepts.

## Security & tenant isolation

### Policy-store failure (availability integrity)

| Store outcome | Resolution policy | Notes |
|---|---|---|
| Readable, no row | `legacy_forced_online` | Migration-safe default |
| Readable, row present | Stored policy | Activation is durable in `TenantPresencePolicy` (+ audit) |
| Throw / outage | **Fail-closed** `heartbeat_required_online` | Never manufacture Online from forced Available |

**Distinguishing activated vs missing during an outage:** while the store is unreadable they cannot be distinguished. WS-1 deliberately does **not** keep an unbounded in-memory policy cache. Fail-closed resolution applies to both cases so an activated tenant cannot silently revert to forced Online. When the store recovers: missing row → legacy; activated row → Option 1.

### Operator identity

- Never trust a client-supplied central User id (`operatorUserId` rejected).
- Admin path: session `adminUserId` only.
- Adapter path: synthetic negative `AdminPresence.userId` from `sha256(presence-v1‖tenant‖credential‖operatorRef)` (no User FK on `AdminPresence`; positive ids reserved for real users).
- Credential scoping prevents cross-installation / cross-tenant identity sharing.
- Adapters must authenticate their own operators before asserting `operatorRef` (WS-2/3/4 session binding).

### Idempotency

Claim-then-write with **release on write failure**. Successful heartbeats keep the claim (duplicates replay without re-write). Transition event append failures after a recorded heartbeat do not release the claim (heartbeat already durable; events are best-effort / deduped).

## Event retention & operational reporting

| Artifact | Retention | Cap | Cleanup ownership |
|---|---|---|---|
| `TenantPresenceEvent` | 90 days | 5,000 / tenant | Opportunistic prune on successful presence writes |
| `TenantPresenceIdempotencyKey` | 24 hours | n/a (TTL delete) | Same opportunistic path |

- **No new background worker** in WS-1 — prune is throttled (`TENANT_PRESENCE_PRUNE_INTERVAL_MS`, 15 minutes) and invoked from ingestion + Admin heartbeat paths (`pruneTenantPresenceArtifacts`).
- Prune failures are swallowed so retention never blocks presence writes; throttle still advances to avoid hammering a failing DB.
- Event details go through Autopilot `redactSensitive` + Chat Connect `sanitizeAuditDetails`.
- Tenant audit: policy changes write `TenantPresencePolicyAudit` + `policy_changed` events; Host/tenant reporting is read-only and scoped.

## Rollout

1. Deploy schema + app with empty policy tables (all tenants legacy).
2. Validate UK adapter (WS-2), then Host activates UK only.
3. Infotech WP adapter (WS-3) → Silver (WS-4) → global cutover (WS-5).

## Rollback

1. Deploy previous application (stops reading policy tables).
2. Optionally drop the four new tables after the previous app is live.

Reverting a single tenant: Host sets `legacy_forced_online` with an audited reason.

**Note:** After this security revision, a policy-store outage fail-closes visitor Online (assistant/not_online without a fresh heartbeat) even for legacy tenants. That is intentional availability integrity, not Option 1 activation.

## Deferred to WS-2 / WS-3 / WS-4

- Explicit `offline` ingestion with authenticated tenant-bound session invalidation + replay protection. **(WS-2: Admin/UK offline shipped; WP/Silver still reserved — see `Docs/pw-chat-presence-ws2.md`.)**
- UK / WordPress / Silver operator-presence adapters (grant `chat:presence:write`, map verified operator sessions). **(WS-2: UK Admin path hardened without granting WP/Silver write scope.)**
- Stronger operator session↔heartbeat coupling beyond adapter-asserted `operatorRef`. **(WS-2: UK Admin session↔heartbeat + disconnect.)**
- Optional transactional claim+heartbeat in a single DB transaction where adapters require it (WS-1 uses claim/release semantics compatible with Prisma unique constraints).
