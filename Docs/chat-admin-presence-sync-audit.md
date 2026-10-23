# Admin Presence & Tenant Synchronisation Audit

**Workstream:** PW-CHAT-PRESENCE-01 (extends PW-CHAT-GA4-01 production readiness)  
**Scope:** Validation and targeted repair of administrator presence / tenant availability synchronisation.  
**Not in scope:** Chat platform redesign, WebSocket migration, analytics event semantics (see `Docs/chat-widget-analytics-integration.md`).

---

## 1. Existing presence architecture

Team availability is **tenant-scoped HTTP polling** (no WebSocket / SSE).

| Layer | Mechanism |
|---|---|
| Admin console | `AdminPanel` POSTs `/api/admin/presence/heartbeat` every 60s (+ activity, 30s client throttle) and GET/PATCH `/api/admin/chat/availability` |
| Persistence | `AdminPresence(tenantId, userId, lastSeenAt)` + append-only `ChatPresenceSetting(tenantId, mode, …)` |
| Resolution | `resolveChatPresence(mode, latestAdminSeenAt)` in `src/lib/chat/chatPresence.ts` |
| Public widget | GET `/api/chat/availability` (Origin/Host → tenant), poll ~60s |
| WordPress Chat Connect | Server-to-server dashboard/diagnostics → `getOperationalTeamPresence` → `team.status` |
| Visitor presence (orthogonal) | `visitorLastSeenAt` via `/api/chat/heartbeat` → online/idle/offline windows |

Connector installation heartbeats (`chatConnect`) are **not** team availability.

---

## 2. Source of truth for administrator state

| Concern | Source of truth |
|---|---|
| Authentication | JWT cookie `primewayz_admin_token` (~8h). Login sets cookie; logout clears cookie. |
| Chat operator permission | `resolveEffectiveTenantChatRole` (Host/Owner, explicit `chatRole`, or legacy ops compat) |
| Explicit team mode | Latest `ChatPresenceSetting.mode` for the tenant (`auto` \| `available` \| `away` \| `offline`; legacy `online` → `available`) |
| Live operator activity | Latest `AdminPresence.lastSeenAt` for the tenant (any authorised agent) within `ADMIN_PRESENCE_ACTIVE_WINDOW_MS` (5 minutes) |

**Contract:** Authentication and chat-agent permission are **not** visitor-facing availability. An authenticated Host/Owner does not make the team “online” until a heartbeat lands on that tenant (auto mode) or mode is forced to `available`.

---

## 3. Team availability calculation

```
mode = latest ChatPresenceSetting for tenant (default auto)
hasActiveAdmin = latest AdminPresence.lastSeenAt within 5 minutes
status (visitor) =
  auto     → online if hasActiveAdmin else assistant
  available/online → online (heartbeat not required)
  away     → away
  offline  → offline (canAcceptMessages = false)
teamStatus =
  online → available; assistant → not_online; else same as status
```

Multi-admin: any fresh heartbeat for the tenant keeps the team online in auto mode (latest `lastSeenAt` wins for the clock).

---

## 4. Tenant-specific synchronisation flow

```
AdminPanel (selected adminTenantFilter)
  → ?tenantId= on heartbeat + availability
  → AdminPresence / ChatPresenceSetting rows for that tenant only
  → resolveChatPresence
  → GET /api/chat/availability (public Origin) | WordPress team block
  → visitor widget / Connect UI
```

- Public and WordPress paths reject body/query `tenantId` from clients.
- Admin presence routes reject `tenantId=all`.
- Host omit `?tenantId=` still defaults to `pw-uk` on the server — the UI must always forward the selected entity.

---

## 5. Visitor-facing status mapping

| Backend / team | Visitor widget `status` | Launcher tone | Notes |
|---|---|---|---|
| Active auto / forced available | `online` | `online` | Live-chat workflow |
| Auto, no fresh heartbeat | `assistant` | `automated` | Guidance; messages accepted |
| Forced away | `away` | `away` | Messages accepted; no immediate live promise |
| Forced offline | `offline` | `away` (amber) | Messages rejected (`canAcceptMessages: false`) |

Conversation layers (not presence): `waiting_for_team`, `admin_replied`, `needsAttention`. These must not be treated as team online/offline.

---

## 6. Confirmed defects and fixes

| Classification | Item | Action |
|---|---|---|
| **Confirmed defect → fixed** | `AdminPanel` omitted `tenantId` on availability/heartbeat (Host defaulted to `pw-uk` while viewing Infotech) | Forward `adminTenantPath(...)`; retarget effect on `adminTenantFilter` |
| **Confirmed defect → fixed** | Logout cleared cookie only; auto-mode stayed online up to 5 minutes | `clearAdminPresenceForUser` on logout (all of that user’s heartbeat rows) |
| **Verified working** | Tenant-scoped store; public Origin authority; WP Infotech binding; chat-role gate on presence routes | Covered by existing + new tests |
| **Intentional behaviour (documented)** | Forced `available` stays online without heartbeats | Explicit product mode; logout does **not** clear settings |
| **Intentional behaviour (documented)** | Session expiry / unexpected close without logout still relies on 5-minute TTL | Existing server-side expiry |
| **Intentional behaviour (documented)** | Polling architecture retained | No WebSocket change |
| **Unverified (env)** | Live multi-tab / production WordPress E2E against MySQL | Local unit/wiring tests only; tunnel DB may be unavailable |

---

## 7. Automated test results

Focused presence / authz / lifecycle / analytics regression (run at review time):

| Suite | Expectation |
|---|---|
| `src/lib/chat/adminPresenceLifecycle.test.ts` | Login≠available, mode changes, heartbeat TTL, logout clear, multi-admin, isolation, visitor mapping, negative authz |
| `src/lib/chat/tenantChatPresence.test.ts` | Tenant isolation + logout wiring |
| `src/lib/admin/tenantChatRole.test.ts` | AdminPanel now **requires** `adminTenantPath` for presence |
| `src/embed/chat/pwChatWidget.test.ts` / analytics | GA4 events unchanged by presence fixes |
| `npm run test:platform` / `test:chat-embed` | Regression |

---

## 8. Remaining risks

1. **Forced `available` after all operators leave** — intentional until someone PATCHes mode back to `auto`/`away`/`offline`.
2. **Browser close without logout** — up to 5 minutes stale online in auto mode (by design).
3. **Concurrent mode writers** — append-only settings; last `updatedAt` wins; no conflict UI.
4. **Duplicate tabs** — both heartbeat the same `(tenantId, userId)` upsert; safe but does not multiply “online” count.
5. **Production E2E** — Host switching Infotech ↔ UK in a live admin session should be smoke-tested after deploy.

---

## 9. Deployment and rollback implications

| Change | Deploy note | Rollback |
|---|---|---|
| AdminPanel `tenantId` forwarding | Frontend-only; no migration | Revert commit; Host may again mis-target `pw-uk` |
| Logout heartbeat clear | Server behaviour; uses existing `AdminPresence` delete | Revert commit; TTL-only expiry returns |
| GA4 analytics (separate commit) | Embed **1.3.1** immutable folder + Connect ZIP | Do not rewrite older embed folders; point WP to prior vendored version |

**Do not merge or deploy automatically.** Keep analytics and presence as distinct commits/PRs when releasing.

Presence does **not** depend on GA4. GA4 only snapshots `availability_state` on visitor events and does not drive presence.
