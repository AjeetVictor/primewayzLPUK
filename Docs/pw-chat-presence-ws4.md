# PW-CHAT-PRESENCE-WS4 — RentReadBuy Silver Operator Presence

**Branch:** `feat/pw-chat-presence-ws4-central`  
**Depends on:** WS-1 / WS-2 / WS-3 on `main`  
**Companion:** Silver campaign `feat/silver-chat-operator-presence-ws4`  
**Status:** Central scope grant + Silver console adapter implemented. Option 1 is **not** activated for Silver. UK and Infotech policies unchanged.

---

## What shipped

| Capability | Detail |
|---|---|
| Scope grant | `chat:presence:write` on `rrb-silver-campaign-next` → `rrb-silver-campaign` |
| Existing Silver ops | dashboard / read / diagnostics / reply / resolve / reopen **preserved** |
| Archive / delete | Still **excluded** for Silver |
| WordPress | WS-3 presence write **unchanged** |
| Integration Offline | Same v1 path; Silver principals with write scope may clear their `operatorRef` |
| Installation Offline | Still `501 reserved` |
| TTL | 5-minute heartbeat window unchanged |
| Visitor resolver | Shared `resolveChatPresence` — no Silver-specific fork |

## Non-goals

- Do **not** activate `heartbeat_required_online` for Silver (or UK / Infotech).
- Do **not** change UK Admin or Infotech WordPress presence policies.
- Do **not** grant presence write to Chat Connect installation credentials.
- Do **not** mark Online from ordinary campaign visitors, membership customers, or Host/Owner sessions.
- Do **not** deploy or merge automatically from this workstream.

## Central API (unchanged contract)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/operator-presence/heartbeat` | Integration Bearer + `chat:presence:write`; body `{ clientActionId, operatorRef, correlationId? }` |
| POST | `/api/v1/operator-presence/offline` | Same auth; body adds optional `notAfterMs` |

Tenant id comes only from the credential (`RRB_SILVER_CHAT_INTEGRATION_TOKEN` → `rrb-silver-campaign`). Client `tenantId` / `operatorUserId` are rejected.

## Silver adapter (companion repo)

Gate for every presence call:

1. Authenticated Silver campaign operator session (`rrb_silver_campaign_operator`)
2. Valid CSRF + same-origin checks
3. Active `/admin` operator console
4. Server-derived `operatorRef` from username hash + session id + console instance id
5. Server-side Bearer to central v1 paths (never in the browser)

## Production configuration (names only)

| Variable | Role |
|---|---|
| `RRB_SILVER_CHAT_INTEGRATION_TOKEN` | Ops + presence write Bearer (already required for conversation ops) |
| `RRB_SILVER_CHAT_INTEGRATION_TOKEN_PREVIOUS` | Optional rotation |
| `RRB_SILVER_CAMPAIGN_ENABLED` | Tenant activation gate (unchanged) |
| `RRB_SILVER_CAMPAIGN_ALLOWED_ORIGINS` | Origin allowlist (unchanged) |

No new central secrets are introduced for WS-4. Deploying this registry change enables presence write for the existing Silver credential.

## Deployment sequence (manual — not performed here)

1. Review / merge central PR → deploy central.  
2. Review / merge Silver PR → deploy campaign app.  
3. Verify console heartbeats for `rrb-silver-campaign` in Host presence reporting.  
4. Host activates Option 1 for Silver **later**, only after Online/Offline soak.

## Rollback

1. Redeploy previous central build (registry without Silver `chat:presence:write`), **or** rotate/revoke `RRB_SILVER_CHAT_INTEGRATION_TOKEN`.  
2. Redeploy previous Silver campaign build (no presence routes).  
3. Heartbeat TTL clears residual Online within five minutes.

## Remaining concerns

- Under legacy forced Online (Option 1 off), visitors may still see Online without a verified operator — intentional until Host activates Option 1.  
- `pagehide` Offline is best-effort; TTL is the safety net.  
- Multi-instance Silver admin auth still requires `CHAT_ADMIN_SHARED_STORE_*` when more than one Node process is used.
