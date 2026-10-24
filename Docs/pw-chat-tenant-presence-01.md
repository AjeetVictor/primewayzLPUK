# PW-CHAT-TENANT-PRESENCE-01

**Branch:** `fix/pw-uk-postdeploy-fix-01`  
**Base:** `origin/main` @ `a20f6ef`  
**Production:** `https://uk.primewayz.com`  
**Scope:** Cookie settings UI correction + deployment asset-permission preflight + tenant-owned presence architecture (design only).  
**Out of scope:** Merging, deploying, rewriting `ChatPresenceSetting` rows, changing Infotech/Silver connector packages, or activating the new Online rule globally.

---

## 1. Root-cause findings

### 1.1 Cookie settings UI

`AnalyticsConsentManager` always rendered a large fixed white `<aside>`. After accept/reject it replaced the banner body with a lone “Cookie settings” control, so the floating panel remained on every page.

**Fix in this PR:** hide the aside after a valid consent decision; reopen preferences from a discreet footer **Cookie settings** control via `OPEN_ANALYTICS_SETTINGS_EVENT` / `openAnalyticsSettings()`.

### 1.2 Forced Online presence (production observation)

Public `/api/chat/availability` can report:

| Field | Example |
|---|---|
| `status` | `online` |
| `mode` | `online` |
| `computedStatus` | `assistant` |
| `hasActiveAdmin` | `false` |
| `latestAdminSeenAt` | stale timestamp |

**Root cause:** `resolveChatPresence` treats `mode === 'online' | 'available'` as visitor `online` **without** requiring a fresh `AdminPresence` heartbeat (`ADMIN_PRESENCE_ACTIVE_WINDOW_MS` = 5 minutes). Auto mode correctly falls back to `assistant` when heartbeats expire; forced Online does not.

This PR **does not** change that resolution rule. It documents the final contract, inventories tenants, and adds an Admin UI warning when forced Online is active without `hasActiveAdmin`.

### 1.3 Deployment asset permissions

A prior production build left `dist/client/assets` at mode `700` and JS/CSS at `600`. Apache (different OS user) returned **HTTP 403**.

**Fix in this PR:** `npm run preflight:assets` (`scripts/check-public-asset-permissions.mjs`) validates world-readable public assets and rejects secret-like paths under `dist/client`, intended to run on the Linux deploy host **before** any service restart. Narrow remediation only:

```bash
find dist/client -type d -exec chmod 755 {} +
find dist/client -type f -exec chmod 644 {} +
```

Do **not** `chmod`/`chown` the whole repository or shared server tree.

---

## 2. Current versus proposed availability semantics

### Current (unchanged behaviour)

```
mode = latest ChatPresenceSetting for tenant (default auto)
hasActiveAdmin = latest AdminPresence.lastSeenAt within 5 minutes
status =
  auto              → online if hasActiveAdmin else assistant
  online/available  → online   ← heartbeat NOT required
  away              → away
  offline           → offline (canAcceptMessages = false)
```

### Proposed final contract (Option 1 — staged; not activated globally yet)

| Public meaning | Rule |
|---|---|
| **Online** | ≥1 eligible tenant operator has a valid authenticated session **and** a fresh authorised heartbeat within the bounded TTL (keep 5 minutes unless analysis justifies otherwise). |
| **Away** | Authenticated operator explicitly Away (if supported). Does **not** imply active human responsiveness. |
| **Offline** | No eligible fresh presence signal, or tenant disabled human availability. |
| **Automated assistance** | May acknowledge/route; must **not** make human availability appear Online. |
| **Unknown / unavailable** | Missing or failed integration signals must **not** silently default to human Online. |

**Forced human Online as an independent source of public availability is deprecated.** Under the final rule: forced Online without a current authorised operator heartbeat must never display “Team available”. Tenant-controlled Away/Offline may remain. Central platform validates, stores, expires, aggregates, and reports — it must not impersonate tenant operators or manufacture human availability.

**Multiple operators:** derive effective availability from eligible active operators, not a single global login flag. Logout / disconnect stops contribution. A login cookie without recent chat-console activity must not create perpetual Online.

---

## 3. Cookie UI implementation (this PR)

| Change | Detail |
|---|---|
| Hide post-consent aside | `AnalyticsConsentManager` returns `null` when consent is set and manage UI is closed |
| Footer link | Discreet **Cookie settings** button next to legal links; calls `openAnalyticsSettings()` |
| Event reuse | `OPEN_ANALYTICS_SETTINGS_EVENT` still opens the preference panel |
| Persistence | `localStorage` + in-memory consent unchanged; withdrawal still calls `setAnalyticsConsent('rejected')` |
| Analytics gate | GA4 still requires `hasAnalyticsConsent()` |
| A11y | Dialog role when managing; Escape closes; focus moves into panel and restores to the opener |
| Copy | Cookie Policy §7 references the footer link (not a “persistent floating control”) |

---

## 4. Tenant-owned presence — architecture contract

Presence must originate from each tenant’s own authorised administration environment.

| Tenant | Presence source |
|---|---|
| **Primewayz UK (`pw-uk`)** | Authenticated UK Admin chat operator session + heartbeat on `/api/admin/presence/heartbeat?tenantId=pw-uk` |
| **Primewayz Infotech (`pw-infotech`)** | Authorised WordPress administrator operating Chat Connect console → future **operator-presence adapter** into central heartbeat ingestion (today: read-only team block from central store; mode/heartbeat via Admin API / UK Admin selecting Infotech) |
| **RentReadBuy Silver (`rrb-silver-campaign`)** | Authorised Next.js Silver Campaign chat administrator → future adapter; today same central `AdminPresence` / `ChatPresenceSetting` when operated from platform Admin |

Central Host/Owner retains governance (tenancy, entitlement, security, integrations) but must not manually manufacture human Online for a tenant.

### Operational reporting (design)

Reuse existing stores where possible:

- `ChatConnectAuditLog` / `appendAudit` — installation lifecycle
- `TenantAudit` / tenant account audit — entitlement & access
- Autopilot `ActivityLog` pattern — redaction helpers (do not duplicate stores)

Record **significant** events (authenticated tenant id, authorised operator reference, timestamp, event type, correlation id):

- Operator authenticated / session ended  
- Presence transitioned Online / Away / Offline  
- Presence expired  
- Conversation replied / resolved  
- Tenant integration authentication failed  
- Installation suspended / reactivated / revoked  

Heartbeats: bounded, lower-volume telemetry (not one audit row per beat). Never store passwords, session tokens, or private message contents.

---

## 5. Compatibility matrix

| Concern | UK (`pw-uk`) | Infotech (`pw-infotech`) | Silver (`rrb-silver-campaign`) |
|---|---|---|---|
| **Public availability** | Origin/Host → tenant; `resolveChatPresence` | Same; WP credential bound to Infotech | Origin allowlist + activation env |
| **Heartbeat write today** | AdminPanel → `/api/admin/presence/heartbeat` | Admin API with `tenantId=pw-infotech` (or Admin UI when Infotech selected). WP scopes are **read-only** for presence | Admin API / Admin UI when Silver selected; no separate Silver presence API yet |
| **Mode write today** | Admin PATCH availability | Same (tenant-scoped). WP cannot PATCH presence | Same |
| **Forced Online risk** | Yes if mode left `online`/`available` | Yes; WP dashboard shows `team.status=available` from forced Online | Yes when activated |
| **Adapter ready for Option 1?** | Partially (UK Admin heartbeats exist) | **No** — needs WP console heartbeat → central ingestion | **No** — needs Silver admin console heartbeat scope |
| **Safe fallback if adapter missing** | Prefer `auto` / Away / Offline; never invent Online | Expose `not_online` / assistant accurately; do not advertise human Online | Same |
| **DB rewrite this PR** | None | None | None |
| **Contract change this PR** | None to WP/Silver APIs | None | None |

### Discovery checklist (completed for design)

1. `resolveChatPresence` / `ChatPresenceSetting` — traced (`src/lib/chat/chatPresence.ts`, `tenantChatPresenceStore.ts`)  
2. `AdminPresence`, heartbeat, logout clear — traced (`server.ts`, `clearAdminPresenceForUser`)  
3. Availability mutation endpoints — Admin GET/PATCH `/api/admin/chat/availability`; public GET `/api/chat/availability` (read-only)  
4. Host vs tenant — Host selects entity; presence rows remain per-tenant; Host must not manufacture Online without operator signal (final contract)  
5. WordPress auth — installation credential; presence **read** via operational dashboard; scopes exclude presence write  
6. Silver permissions — need authenticated campaign-admin heartbeat + tenant entitlement; not in WP scopes  
7. UK operator presence — tied to Admin session + 60s heartbeat / 5‑min TTL; logout clears rows  
8. Audit/retention — Chat Connect + tenant audits exist; presence transitions not yet first-class events  
9. Migrations for final design — likely additive audit/event table or reuse; **no** forced rewrite of `ChatPresenceSetting`  
10. Staged plan — see §6  

---

## 6. Separate implementation PR plan

| PR | Purpose | Activate Option 1? |
|---|---|---|
| **This PR** | Cookie UI, consent tests, asset preflight, docs, Admin forced-Online **warning** only | No |
| **Future 1** | Central authenticated tenant-presence ingestion + consolidated reporting contract | Feature-flagged / dark |
| **Future 2** | Primewayz UK operator-presence adapter (harden session↔heartbeat coupling) | UK only after validation |
| **Future 3** | WordPress Chat Connect operator-presence adapter | Infotech only after validation |
| **Future 4** | RentReadBuy Silver operator-presence adapter | Silver only after validation |
| **Future 5** | Final removal of forced-Online public behaviour | Global after all adapters green |

Do **not** combine Future 1–5 into the Cookie UI PR.

### Suggested rollout flags (future)

1. Per-tenant `presencePolicy: legacy_forced_online | heartbeat_required_online`  
2. Default new tenants to `heartbeat_required_online`  
3. Migrate UK → Infotech → Silver after each adapter’s soak  
4. Never auto-rewrite existing `ChatPresenceSetting` rows; operators choose Away/Offline/Auto  

### Rollback risks

| Change | Risk | Rollback |
|---|---|---|
| Cookie UI | Visitors temporarily cannot find settings if footer missed | Revert commit; restore floating control |
| Asset preflight | Deploy blocked on true 600/700 modes | Fix perms with narrow chmod; do not skip on Linux prod |
| Admin warning | Copy only | Revert UI snippet |
| Future Option 1 | Tenants relying on forced Online go `assistant`/`not_online` | Per-tenant policy flag back to legacy |

---

## 7. Production rollout / rollback (this PR only)

1. Merge via review (manual).  
2. Build on deploy host: `npm run build`.  
3. **Before restart:** `npm run preflight:assets` (must pass on Linux).  
4. Restart Node/PM2 only after assets are world-readable.  
5. Smoke: accept/reject cookies → aside gone; footer Cookie settings reopens panel; GA off until accept.  
6. Confirm Infotech/Silver API contracts unchanged (no presence resolution change).  

**Do not merge or deploy automatically from this workstream.**

---

## 8. Files changed (implementation)

- `src/components/AnalyticsConsentManager.tsx`  
- `src/components/Footer.tsx`  
- `src/lib/analyticsConsent.ts`  
- `src/components/LegalPage.tsx`  
- `src/components/AdminPanel.tsx` (warning only)  
- `scripts/check-public-asset-permissions.mjs`  
- `scripts/check-public-asset-permissions.test.mjs`  
- `src/lib/uk11Consent.test.tsx`  
- `src/lib/digitalSystemsReview/globalCtaPhase2d.test.ts`  
- `src/lib/admin/tenantChatRole.test.ts`  
- `package.json` (`preflight:assets`, validate hook)  
- `Docs/pw-chat-tenant-presence-01.md` (this document)  
- `Docs/apache-config.md` (asset permission note)  
