# PW-CHAT-PRESENCE-WS2 — Primewayz UK Admin Presence Hardening

**Branch:** `feat/pw-chat-presence-ws2`  
**Depends on:** WS-1 (`feat/pw-chat-presence-ws1` / PR #17)  
**Status:** UK Admin adapter hardened. Option 1 is **not** activated. WordPress / Silver untouched.

---

## What shipped

| Capability | Detail |
|---|---|
| Session ↔ heartbeat | Heartbeats require authenticated chat-agent access for the selected tenant; body rejects client `tenantId` / `operatorUserId` |
| Disconnect / offline | `POST /api/admin/presence/offline?tenantId=` clears this operator’s heartbeat; AdminPanel `pagehide` + effect cleanup use keepalive |
| v1 offline (Admin only) | `POST /api/v1/operator-presence/offline` works for Admin cookie sessions; integration/installation stay `501 reserved` (WS-3/WS-4) |
| Dashboard enrichment | Active operator count, presence expiry, own session contributing flag, `verifiedHumanOnline`, `visitorStatus` |
| Shared resolver | Admin availability uses the same `resolveChatPresence` + tenant store as public `GET /api/chat/availability` |
| Automated replies | Bot `/api/chat/respond` path does not write `AdminPresence` or `ChatPresenceSetting` |

## Non-goals (this PR)

- Do **not** insert / activate `TenantPresencePolicy` rows (Option 1 stays Host-disabled / legacy default).
- Do **not** grant `chat:presence:write` to WordPress or Silver.
- Do **not** merge, deploy, or run production migrations from this workstream.

## API additions

| Method | Path | Notes |
|---|---|---|
| GET/PATCH | `/api/admin/chat/availability?tenantId=` | Adds `activeOperatorCount`, `presenceExpiresAt`, `operatorSession`, `verifiedHumanOnline`, `visitorStatus`, `option1Activated: false` |
| POST | `/api/admin/presence/heartbeat?tenantId=` | Rejects identity override fields; returns count / expiry / session snapshot |
| POST | `/api/admin/presence/offline?tenantId=` | Clears authenticated operator for that tenant only |

## Verified human Online

`verifiedHumanOnline` ⇔ fresh authorised operator heartbeat **and** resolved visitor `status === 'online'`.

Under legacy forced Online without a heartbeat, visitor status may still be `online` while `verifiedHumanOnline` is `false` (dashboard warning). Host must activate Option 1 later to align public Online with verified operators.

## Rollback

Redeploy previous app build. No WS-2 schema. Heartbeat TTL remains the offline safety net if disconnect beacons fail.
