# PW-CHAT-PRESENCE-WS3 — Infotech WordPress Operator Presence

**Branch:** `feat/pw-chat-presence-ws3-central`  
**Depends on:** WS-1 / WS-2 on `main`  
**Plugin:** Primewayz Chat Connect **v1.3.5** (separate source tree)  
**Status:** Central + WP adapter implemented. Option 1 is **not** activated for Infotech. Silver untouched.

---

## What shipped

| Capability | Detail |
|---|---|
| Scope grant | `chat:presence:write` on `primewayz-wordpress` → `pw-infotech` only |
| Silver | Still **without** presence write |
| Integration Offline | `POST /api/v1/operator-presence/offline` for principals with write scope + optional `notAfterMs` (far-future stamps rejected; 2‑minute skew) |
| Installation Offline | Still `501 reserved` (connection health ≠ human Online) |
| WP adapter | Console AJAX → PHP → central heartbeat/offline; Bearer stays server-side |
| Multi-tab | Distinct opaque `operatorRef` per console instance; Offline clears only that session |
| TTL | 5-minute heartbeat window unchanged |

## Non-goals

- Do **not** activate `heartbeat_required_online` for Infotech.
- Do **not** change UK or Silver presence policy.
- Do **not** grant presence write to installation credentials or Silver.
- Do **not** mark Online from ordinary WordPress login or Chat Connect cron.

## Central API

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/operator-presence/heartbeat` | Integration Bearer + `chat:presence:write`; body `{ clientActionId, operatorRef, correlationId? }` |
| POST | `/api/v1/operator-presence/offline` | Same auth; body adds optional `notAfterMs` |

Tenant id comes only from the credential. Client `tenantId` / `operatorUserId` are rejected.

## WordPress adapter

Working tree: `G:\backup-project\primewayz\2026\primewayz-chat-connect\primewayz-integration`  
Baseline: verified v1.3.4 copy. Version: **1.3.5**.

Gate for every presence AJAX call:

1. Authenticated WP session  
2. `current_user_can('manage_options')`  
3. Valid `pwi_chat_admin` nonce  
4. Active Chat Connect admin console (JS only enqueued on plugin page)  
5. Server-derived `operatorRef` from WP user + session token + console instance id  

## Rollout (manual — not performed by this workstream)

1. Merge/deploy central PR (schema already from WS-1).  
2. Install Chat Connect **v1.3.5** ZIP on Infotech WordPress (replace plugin; keep credentials).  
3. Verify console heartbeats appear in Host presence reporting for `pw-infotech`.  
4. Host activates Option 1 for Infotech **later**, only after verification.

## Rollback

1. Redeploy previous central app build (presence write scope ignored if WP still posts — or revoke by redeploying registry without the scope).  
2. Reinstall Chat Connect **v1.3.4** ZIP.  
3. Heartbeat TTL clears residual Online within five minutes.

## Remaining concerns

- Under legacy forced Online (Option 1 off), visitors may still see Online without a verified operator — intentional until Host activates Option 1.  
- `pagehide` Offline is best-effort; TTL is the safety net.  
- `manage_options` remains the chat-operator gate (no finer capability yet).  
- Logout Offline clears tracked refs best-effort; revoked sessions rely on TTL if logout hooks miss.
