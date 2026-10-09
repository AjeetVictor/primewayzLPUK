# Tenant access Phase 1 implementation log

## Scope and status

Phase 1A locally hardens and validates the authenticated tenant-grant and distinct Host/Owner model for the shared Primewayz administration platform. It does not register or activate rrb-silver-campaign, change public tenant resolution, apply a database migration, provision a live entitlement, commit, push, or deploy.

Local validation is complete. Production approval remains blocked on the explicitly listed rollout prerequisites and staging database tests.

## Security model retained

- User.isPlatformOwner is an explicit entitlement independent of the legacy role string. Existing users default to false; no role is implicitly promoted.
- UserTenantGrant is the operator-to-tenant allow-list. Only active registered tenant IDs are accepted.
- A single-tenant operator defaults to that tenant. A multi-tenant operator must select an assigned tenant. Unassigned operators fail closed.
- Only an explicit Host/Owner may request tenantId=all, manage users/grants, or read AdminAccessAuditLog.
- Persisted record ownership is checked server-side for chat sessions, messages, reply references, attachments, forms, leads, appointments, alerts, presence, and summaries.
- Host authority and tenant operations remain distinct.

## Phase 1A work completed

### Test-runner reliability

The previous platform timeout was traced to a tenant-operator test accidentally declared inside startAdminApp. Every app startup registered another copy recursively. The test was moved to top level and its stale authorization-helper assertion was updated. A separate stale presence-helper source assertion was also corrected.

### Last-Host concurrency hardening

Host demotion and deletion now run through runSerializableAccessTransaction:

- Prisma transactions use Serializable isolation.
- Prisma P2034 write conflicts are retried up to three times.
- A retried request re-reads the current Host count before mutation.
- The signed-in Host still cannot remove their own Host entitlement or delete their own account.
- User.isPlatformOwner has an index for the count/range check.
- Focused tests verify isolation selection, retry behavior, non-conflict behavior, last-owner re-evaluation, and route wiring.

A real MySQL two-connection race test was deliberately not run against the configured database during local validation. Execute this in staging before production approval.

### Transactional access audit

User creation, access update, and deletion keep the audit insert inside the same Prisma transaction as the user/grant mutation. Access-audit payloads now use an explicit whitelist containing only role, isPlatformOwner, and tenantIds. Passwords and reset-token fields cannot enter these snapshots.

AdminAccessAuditLog intentionally has no User foreign key, so deleting a user does not cascade historical evidence. UserTenantGrant retains its user foreign key with ON DELETE CASCADE.

Focused tests verify Host-only route wiring, transaction placement, audit field whitelisting, deletion ordering, migration retention behavior, and that non-conflict transaction failures are not retried. Database-backed rollback fault injection remains a staging prerequisite.

### Controlled first-Host bootstrap

Added scripts/bootstrap-platform-owner.ts and the access:bootstrap-host package script.

The command:

- is dry-run-only unless --execute is supplied;
- requires the exact approval phrase I_APPROVE_FIRST_HOST_BOOTSTRAP;
- targets one exact existing email;
- never accepts, creates, prints, or changes credentials;
- refuses if any Host already exists;
- refuses an unknown or already-entitled target;
- uses a serializable transaction;
- records first_host_bootstrapped in AdminAccessAuditLog.

No execution against a database occurred. See tenant-access-bootstrap-runbook.md and tenant-access-provisioning-matrix.md.

### Route coverage review

Tenant scope is enforced server-side for:

- chat lists, session history, replies, status changes, message edits/deletes;
- reply references and attachment ownership;
- forms and tool leads;
- audit leads and review leads;
- conversion summaries;
- appointments and alerts;
- tenant availability and heartbeat presence;
- notification summaries.

Unknown/inactive tenants, tenantId=all by non-Hosts, unassigned operators, and cross-tenant persisted records fail closed.

User/grant administration and access-audit reads are Host-only.

### Existing administrator compatibility

Blog posts and blog comments are currently Host-only in the Phase 1 implementation, despite existing blog/editor roles. This can unintentionally block legitimate Primewayz UK publishing workflows. No permission was broadened during Phase 1A. Product/security approval is required to choose between:

1. retain Host-only global publishing; or
2. restore role-authorized global blog publishing; or
3. introduce a later tenant-scoped content permission model.

Pricing backlog and Autopilot content administration remain legacy global operational workflows and were not converted into tenant grants. Their intended authority must be classified before rollout.

## Migration safety assessment

The migration is additive:

- User.isPlatformOwner is non-null with default false.
- User_isPlatformOwner_idx supports Host checks.
- UserTenantGrant uses a composite primary key, tenant lookup index, and cascading user foreign key.
- AdminAccessAuditLog indexes target/time and actor/time and deliberately retains integer actor/target IDs without cascading foreign keys.
- JSON and DATETIME(3) require a compatible MySQL release; verify the deployed server version and settings in staging.
- Existing User rows remain valid, but receive no access automatically.
- Table-name case behavior and migration privileges must be checked on the deployment host.
- Rollback would delete grants and audit tables/evidence. Preserve/export audit evidence and restore from a verified backup; do not use prisma db push in production.

## Validation record

All output is captured under tmp/phase1a-*.log.

| Command | Result | Counts / notes |
|---|---:|---|
| npx prisma validate | exit 0 | schema valid |
| npm run typecheck | exit 0 | TypeScript passed |
| focused tenant/access batch | exit 0 | 37 passed, 0 failed |
| npm run test:platform | exit 0 | 290 passed, 0 failed |
| npm test | exit 0 | 1,370 passed, 0 failed; 20 suites |
| npm run build:client | exit 0 | 2,863 modules; bundle-size warning only |
| npm run build:ssr | exit 0 | 298 modules |
| bootstrap dry run | exit 0 | no database connection or mutation |

## Files added in Phase 1A

- Docs/tenant-access-bootstrap-runbook.md
- Docs/tenant-access-provisioning-matrix.md
- scripts/bootstrap-platform-owner.ts
- src/lib/admin/adminAccessMutation.ts
- src/lib/admin/adminAccessMutation.test.ts

## Files additionally modified in Phase 1A

- package.json
- prisma/schema.prisma
- prisma/migrations/20261009190000_admin_tenant_access/migration.sql
- server.ts
- src/lib/admin/adminChatTenantAccess.test.ts
- src/lib/chat/tenantChatPresence.test.ts
- Docs/tenant-access-phase1-implementation-log.md

The working tree also retains all earlier uncommitted Phase 1 files shown by git status. No unrelated changes were discarded.

## Remaining deployment blockers

1. Approve the exact first Host and every operational-account matrix row.
2. Decide the blog/content administration compatibility policy.
3. Verify the production MySQL version, case behavior, backup/restore, and migration privileges in staging.
4. Run database-backed two-connection concurrent Host demotion/deletion tests in staging.
5. Run database-backed audit rollback fault-injection tests in staging.
6. Rehearse bootstrap, verification, application rollback, and evidence-preserving schema recovery in staging.
7. Obtain final review of the complete uncommitted diff.

## Recommendation

Phase 1A local hardening is complete, but the production decision remains no-go until the blockers above are closed. Do not start Phase 2, apply the production migration, provision live privileges, or deploy.