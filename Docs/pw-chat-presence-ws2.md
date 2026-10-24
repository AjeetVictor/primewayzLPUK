# PW-CHAT-PRESENCE-WS2 — Primewayz UK Admin Presence Hardening

**Branch:** `feat/pw-chat-presence-ws2`  
**Depends on:** WS-1 (`feat/pw-chat-presence-ws1` / PR #17)  
**Status:** UK Admin adapter hardened. Option 1 is **not** activated by this PR. WordPress / Silver untouched.

---

## What shipped

| Capability | Detail |
|---|---|
| Session ↔ heartbeat | Heartbeats require authenticated chat-agent access for the selected tenant; body rejects client `tenantId` / `operatorUserId` |
| Disconnect / offline | `POST /api/admin/presence/offline?tenantId=` clears this operator’s heartbeat; accepts optional `notAfterMs` so stale Offline cannot wipe a newer beat |
| AdminPanel lifecycle | `pagehide` + tenant-switch Offline are best-effort; same-tenant remount skips Offline via generation + `queueMicrotask`; explicit logout + heartbeat TTL remain authoritative |
| v1 offline (Admin only) | `POST /api/v1/operator-presence/offline` works for Admin cookie sessions; integration/installation stay `501 reserved` (WS-3/WS-4) |
| Dashboard enrichment | Active operator count, presence expiry, own session contributing flag, `verifiedHumanOnline`, `visitorStatus`, `option1Activated` from effective policy |
| Shared resolver | Admin availability uses the same `resolveChatPresence` + tenant store as public `GET /api/chat/availability` |
| Automated replies | Bot `/api/chat/respond` path does not write `AdminPresence` or `ChatPresenceSetting` |

## Non-goals (this PR)

- Do **not** insert / activate `TenantPresencePolicy` rows (Option 1 stays Host-disabled / legacy default unless Host already set it).
- Do **not** grant `chat:presence:write` to WordPress or Silver.
- Do **not** merge, deploy, or run production migrations from this workstream.

## API additions

| Method | Path | Notes |
|---|---|---|
| GET/PATCH | `/api/admin/chat/availability?tenantId=` | Adds `activeOperatorCount`, `presenceExpiresAt`, `operatorSession`, `verifiedHumanOnline`, `visitorStatus`, `option1Activated` (true only when policy is `heartbeat_required_online`) |
| POST | `/api/admin/presence/heartbeat?tenantId=` | Rejects identity override fields; returns count / expiry / session snapshot |
| POST | `/api/admin/presence/offline?tenantId=` | Clears authenticated operator for that tenant; optional body `{ notAfterMs }` refuses clears when `lastSeenAt` is newer |

## Presence end consistency

| Signal | Behaviour |
|---|---|
| `pagehide` | Best-effort keepalive Offline with `notAfterMs` — browsers may drop it |
| Explicit logout | Server clears all of this operator’s heartbeats before cookie drop (authoritative) |
| Heartbeat TTL | `ADMIN_PRESENCE_ACTIVE_WINDOW_MS` — safety net when unload Offline is lost |
| Tenant switch | Offline for the previous tenant immediately; new tenant heartbeats |
| Remount / Strict Mode | Skips Offline when a newer presence generation already owns the same tenant |

## Verified human Online

`verifiedHumanOnline` ⇔ fresh authorised operator heartbeat **and** resolved visitor `status === 'online'`.

Under legacy forced Online without a heartbeat, visitor status may still be `online` while `verifiedHumanOnline` is `false` (dashboard warning). Host must activate Option 1 later to align public Online with verified operators.

`option1Activated` reflects the tenant’s effective `presencePolicy` (`heartbeat_required_online`); this workstream does not flip that policy.

## Rollback

Redeploy previous app build. No WS-2 schema. Heartbeat TTL remains the offline safety net if disconnect beacons fail.
