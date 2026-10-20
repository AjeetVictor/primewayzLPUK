# Tenant chat role — disposable-database migration rehearsal

Phase 1 prepares this procedure only. **Do not** create the disposable database, apply the migration, or change production during Phase 1.

## Goal

Rehearse `20261020180000_tenant_chat_role_presence_authz` on a disposable MySQL schema on the **existing** remote Primewayz UK MySQL host, using the already-approved secure connection path (for example the configured SSH tunnel to the remote server). Do not install a local MySQL server and do not create external cloud databases.

## Preconditions

1. Production schema remains untouched.
2. Operators have approval to create one disposable schema on the existing remote host (name example: `primewayz_chat_role_rehearsal` — exact name is an ops choice).
3. Credentials stay in the existing secure env files; never print `DATABASE_URL` or passwords into logs, tickets, or generated docs.
4. Application code for Phase 1 is already on branch `feat/chat-admin-tenant-presence`.

## Rehearsal steps (when approved — not Phase 1)

1. Through the approved tunnel/session, create an empty disposable schema on the existing remote server only.
2. Point a **throwaway shell env** (not production `.env`) at that schema. Prefer a one-shot env var in the shell over editing committed files.
3. Copy production migration history into the disposable schema only as far as required for Prisma to recognise prior migrations (ops-standard clone or migrate-from-empty through prior folders). Prefer a schema-only copy with no production row data.
4. Run **only** against the disposable URL:
   - `npx prisma migrate deploy`
   - Confirm `UserTenantGrant.chatRole` defaults to `none` and `chatRoleExplicit` defaults to `false`.
   - Confirm no unexpected UPDATE/INSERT against chat session tables.
5. Smoke the application decision module with mocks (already covered by `tenantChatRole.test.ts`); optional disposable DB smoke is Host-only.
6. Drop the disposable schema when finished. Do not leave rehearsal credentials in shared docs.

## Explicitly forbidden during Phase 1 and against production

- `prisma db push`
- `prisma migrate dev`
- `prisma migrate reset`
- `prisma migrate deploy` aimed at production
- Seeding `agent` roles without a reviewed provisioning matrix

## Rollback sketch (disposable only)

1. Stop any rehearsal app process using the disposable URL.
2. `ALTER TABLE UserTenantGrant DROP INDEX UserTenantGrant_tenantId_chatRole_idx;`
3. `ALTER TABLE UserTenantGrant DROP COLUMN chatRoleExplicit, DROP COLUMN chatRole;`
4. Or drop the disposable schema entirely.

Production rollback planning belongs in a later release runbook after staging sign-off.
