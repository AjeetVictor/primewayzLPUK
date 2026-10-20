# Chat admin tenant presence — Phase 1 (backend & security)

Local branch: `feat/chat-admin-tenant-presence`. Phase 1 does not push, merge, deploy, or modify production data.

## Root cause — UK versus Infotech availability

Backend presence is already tenant-scoped (`ChatPresenceSetting` / `AdminPresence` keyed by `tenantId`). Admin presence routes require a concrete `?tenantId=` and reject `all`.

When the Admin UI omits `tenantId`, `resolveAuthorizedAdminTenantFilter` defaults a Host/Owner to **`pw-uk`**.

`AdminPanel` still calls:

- `GET/PATCH /api/admin/chat/availability` without the selected entity
- `POST /api/admin/presence/heartbeat` without the selected entity

while other operations use `adminTenantPath` / `adminTenantQuery`. Heartbeats and mode changes therefore land on Primewayz UK even when the operator is viewing Primewayz Infotech. Infotech visitors then resolve `auto` with no recent Infotech heartbeat (`assistant` / `not_online`) while UK can show online.

UI forwarding of the selected `tenantId` is deferred past Phase 1. Backend now also requires per-tenant chat authorization on those routes.

## Authorization and compatibility strategy

| Layer | Decision |
|---|---|
| Tenant Chat Entitlement | Commercial chat on/off for a tenant (unchanged) |
| `UserTenantGrant.chatRole` | Per-operator chat permission for that tenant (`none` \| `agent`) |
| Presence | Per-tenant Available / Away / Offline (+ `auto`) |

### Defaults

- New grant columns: `chatRole = none`, `chatRoleExplicit = false`
- Additive migration does **not** UPDATE existing rows to `agent` and does **not** seed data

### Compatibility (reviewed)

1. **Host/Owner** → effective `agent` on every operational tenant (Silver still gated by activation env).
2. **Explicit** `chatRole` / `chatRoleExplicit = true` → authoritative (`agent` or intentional `none`).
3. **Legacy path:** grant exists, `chatRole` is non-explicit `none`, and the global role is an operations role (`viewer` / `editor` / `admin` / `super_admin`) → effective `agent` (`legacy_operations_compat`). This preserves today's chat access without a production data backfill.
4. Blog-only / non-operations roles with a bare grant → `none`.

To revoke chat while keeping the tenant grant for other modules, Host sets `chatRole: none` with `chatRoleExplicit: true` via `tenantChatGrants` on user create/update.

## Presence and heartbeat

- Admin PATCH accepts `available` \| `away` \| `offline` \| `auto` (legacy `online` persists as `available`).
- Visitor widget status remains `online` \| `assistant` \| `away` \| `offline`.
- Team/WordPress surfaces use `teamStatus`: `available` \| `away` \| `offline` \| `not_online`.
- Heartbeat requires authentication, operations role, concrete tenant, and effective chat `agent`.
- Active window: `ADMIN_PRESENCE_ACTIVE_WINDOW_MS` (5 minutes). Heartbeat response includes `expiresInMs`.

## Isolation and Silver

- Cross-tenant presence and chat session checks remain fail-closed.
- `rrb-silver-campaign` stays inactive unless `RRB_SILVER_CAMPAIGN_ENABLED` is exactly `true` after trim/case normalization; chat role resolution returns `inactive_tenant`.

## Migration

- Folder: `prisma/migrations/20261020180000_tenant_chat_role_presence_authz`
- **Not applied** in Phase 1. Rehearsal: `Docs/tenant-chat-role-migration-rehearsal.md`.

## Validation (local, no database)

| Command | Result |
|---|---|
| `npx prisma generate` | exit 0 (client only; no migrate) |
| `npx prisma validate` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| Focused authz / presence / WordPress / Silver batch | 181 passed, 0 failed |

No `prisma migrate deploy` / `db push` / `migrate dev` / `migrate reset` was run. Production MySQL was not modified. The configured tunnel host (`127.0.0.1:3336`) was unreachable during Phase 1, so live metadata inspection was skipped.
