# Mandatory requirement — Tenant-specific admin presence & status synchronisation

**Status:** Requirements binding + gap inventory (no production activation).  
**Companion design:** `Docs/pw-chat-tenant-presence-01.md`  
**Prior repairs:** `Docs/chat-admin-presence-sync-audit.md`, `Docs/chat-admin-tenant-presence-phase1.md`  
**Constraint:** Do not merge, deploy, alter production databases, or update WordPress plugins from this workstream. Implement central changes and tenant adapters on **separate branches/PRs**. Do not enable a cross-tenant breaking change until the applicable adapter is validated.

---

## Binding contract (summary)

| Rule | Meaning |
|---|---|
| Tenant isolation | Each tenant owns its authenticated admin environment, sessions, and operator availability. Tenant A never moves Tenant B Online/Offline. |
| Auth ≠ availability | JWT/login cookie proves authentication only. Human chat availability requires a **fresh authorised heartbeat** within TTL (currently 5 minutes). |
| Multi-operator | Tenant is human-available while **≥1** authorised operator has a valid heartbeat. Logout / disconnect / expiry removes that operator’s contribution. |
| Visitor truth | “Team available” only from verified active tenant operators — never from static forced Online, assistant automation, stale cookies, or another tenant. |
| Shared source | Tenant admin dashboard and visitor widget must resolve from the same validated presence store. |
| Central role | Authenticate, validate, route, expire, report, audit, isolate. **Never** manually override or manufacture tenant human availability. |

**Final public Online rule (Option 1 — not globally activated yet):**  
`online` ⇔ ≥1 eligible tenant operator has a valid authenticated session **and** a fresh authorised heartbeat. Forced `available`/`online` without heartbeat must not display “Team available”.

---

## Current capability inventory

### Shared central store (already present)

| Capability | State |
|---|---|
| Tenant-scoped `ChatPresenceSetting` + `AdminPresence` | Yes (`tenantId` + `userId` unique) |
| `resolveChatPresence` | Yes — **but** forced `online`/`available` skips heartbeat (legacy) |
| Admin heartbeat `POST /api/admin/presence/heartbeat?tenantId=` | Yes; chat-agent authz; `expiresInMs` |
| Logout clears operator heartbeats | Yes (`clearAdminPresenceForUser`) |
| Public `GET /api/chat/availability` (Origin → tenant) | Yes; poll ~60s |
| Cross-tenant fallback forbidden | Yes (unit-covered) |
| Presence transition / login–logout audit events | **Missing** as first-class central reporting |
| Active operator **count** + per-operator roster on dashboard | **Missing** (only latest `lastSeenAt` / `hasActiveAdmin`) |
| Per-tenant `presencePolicy` flag | **Missing** (needed for staged Option 1) |

### 1. Primewayz UK (`pw-uk`) administration

| Interface | State |
|---|---|
| Heartbeat adapter | **Working** — `AdminPanel` → `/api/admin/presence/heartbeat` (~60s) with `adminTenantPath` |
| Availability GET/PATCH | **Working** — tenant-forwarded |
| Auth vs availability distinction in UI | Partial — mode, computed status, last heartbeat, forced-Online **warning** only |
| Session expiry → presence stop | TTL-based (5 min); explicit logout clears immediately |
| Adapter ready for Option 1? | **Partially** — harden session↔heartbeat coupling + dashboard fields; UK can be first migrate |

### 2. Primewayz Infotech WordPress Chat Connect (`pw-infotech`)

| Interface | State |
|---|---|
| Presence **read** on dashboard/diagnostics | Yes — credential-bound `pw-infotech` only; `team.status` |
| Presence **write** / heartbeat from WP console | **No** — scopes are read/ops (`chat:dashboard`, `chat:read`, …); no `presence` write scope |
| Heartbeat adapter | **Missing** — WP Chat Connect operator-presence adapter required |
| Forced Online risk | Yes if central mode left `available`/`online` without Infotech heartbeat |
| Safe until adapter exists | Prefer `auto` / Away / Offline; never invent Online for Infotech |

### 3. RentReadBuy Silver (`rrb-silver-campaign`)

| Interface | State |
|---|---|
| Central Admin API heartbeat when Silver selected | Possible via platform Admin (same as UK path) |
| Dedicated Silver campaign-admin console heartbeat | **Missing** |
| Activation gate | `RRB_SILVER_CAMPAIGN_ENABLED` / inactive tenant handling |
| Adapter ready for Option 1? | **No** |

### Visitor widget

| Concern | State |
|---|---|
| Labels (“Team available” / automated) | Present (`visitorChatUi`) |
| Polling (~60s) | Present — acceptable; no WebSocket required for this phase |
| Misleading Online from forced mode | **Open defect under final contract** — Option 1 not activated |

### Central Host/Owner reporting

| Concern | State |
|---|---|
| Observe tenant presence via Admin selector | Yes (read/write through Admin APIs) |
| Consolidated historical presence events | **Missing** |
| Manual override of tenant availability | Must remain forbidden — Host mode PATCH is tenant-scoped operator action when Host acts *as* that tenant’s authorised agent, not a separate “force Online” control |

---

## Acceptance tests → current readiness

| # | Scenario | Auto mode today | Forced Online today | Gap to close |
|---|---|---|---|---|
| 1 | No admin logged in → not Team available | Pass (`assistant`) | **Fail** (still Online) | Option 1 + policy flag |
| 2 | Auth admin + active heartbeat → available | Pass | Pass | — |
| 3 | Logout → offline/assistant | Pass (auto) | **Fail** if mode stays available | Option 1; logout already clears heartbeats |
| 4 | Browser close → expire within TTL | Pass (≤5 min) | **Fail** under forced Online | Option 1 |
| 5 | Logged in, no heartbeats → not perpetual Online | Pass (auto) | **Fail** | Option 1 |
| 6 | Two admins; one logs out → stays Online | Pass (auto) | Pass | Need operator count for dashboard clarity |
| 7 | Last admin logs out → Offline/assistant | Pass (auto) | **Fail** | Option 1 |
| 8 | Tenant A login ≠ Tenant B | Pass (store isolation) | Pass | Keep; WP/Silver adapters must not break |
| 9 | Dashboard ≡ visitor human availability | Pass when same store | Can disagree with warning only | Shared Option 1 resolver + richer dashboard |
| 10 | Central reporting without changing status | **Partial** (no presence event log) | — | Future 1 reporting |

---

## Separate implementation workstreams

Do **not** combine these into one PR. Validate each adapter before enabling Option 1 for that tenant.

| ID | Branch / PR focus | Activate Option 1? | Depends on |
|---|---|---|---|
| **WS-0** (done / in flight) | Cookie UI, asset preflight, design docs, Admin forced-Online **warning** only | No | — |
| **WS-1** Central presence policy + reporting | Feature-flagged `presencePolicy: legacy_forced_online \| heartbeat_required_online`; authenticated tenant-scoped presence **events** (login/logout, available/unavailable, heartbeat expiry) with tenant id, operator id, timestamp, correlation id; Host consolidated read-only history. **No** Host override API. | Dark / flagged off by default | — |
| **WS-2** Primewayz UK adapter harden | Session↔heartbeat coupling; dashboard: session status, own presence, effective tenant availability, active operator count (authz), last update / expiry; same resolver as visitor | UK tenant flag only after soak | WS-1 |
| **WS-3** Infotech WP Chat Connect adapter | New presence write scope + WP console heartbeat → central ingestion; read path unchanged; no UK/Silver contract break | Infotech flag only | WS-1 |
| **WS-4** Silver campaign admin adapter | Authenticated Silver console heartbeat scope + entitlement; preserve inactive gate | Silver flag only | WS-1 |
| **WS-5** Global Option 1 cutover | Remove legacy forced-Online public behaviour (or default all tenants to `heartbeat_required_online`) | Global after WS-2–4 green | WS-2, WS-3, WS-4 |

### Suggested flags

1. Per-tenant `presencePolicy` (default existing tenants `legacy_forced_online`; new tenants `heartbeat_required_online`).
2. Migrate UK → Infotech → Silver after each adapter soak.
3. Never auto-rewrite `ChatPresenceSetting` rows; operators choose Away / Offline / Auto.

### Release restrictions (repeat)

- Preserve working integrations while introducing functionality.
- Separate branches/PRs for central vs each tenant adapter.
- No automatic merge, deploy, production DB change, or WordPress plugin publish.
- Missing adapter ⇒ expose `not_online` / assistant accurately; never advertise human Online from silence.

---

## Expected result

Every tenant controls its own administrator sessions and human presence; the tenant admin dashboard and visitor chat reflect those states from one validated source; Primewayz Central Platform maintains consolidated visibility and audit without taking operational control of tenant availability.

---

## Next action

Open **WS-1** on a dedicated branch (`feat/pw-chat-presence-central-01` or equivalent) when implementation is authorised. Do not activate Option 1 or change Infotech/Silver packages in that PR.
