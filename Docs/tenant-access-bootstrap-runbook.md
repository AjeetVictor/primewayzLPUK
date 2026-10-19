# Host/Owner bootstrap and recovery runbook

## Purpose

This procedure provisions exactly one reviewed existing account as the first platform Host/Owner after the additive tenant-access migration. It never creates an account, changes a password, infers entitlement from a legacy role, or promotes multiple administrators.

Do not run this procedure before the migration is applied. Do not run it from an unreviewed workstation or against production as part of Phase 1A validation.

## Prerequisites

1. Take and verify a restorable database backup.
2. Apply the reviewed migration through the normal deployment pipeline.
3. Confirm the User.isPlatformOwner, UserTenantGrant, and AdminAccessAuditLog objects exist.
4. Have two operators review the exact existing account email and its entry in tenant-access-provisioning-matrix.md.
5. Confirm there are currently zero Host/Owner rows.
6. Ensure the operator has a short-lived, audited database connection through the deployment environment. Do not place credentials on the command line or in source control.

## Dry run

npm run access:bootstrap-host -- --email reviewed.account@example.com

The dry run does not connect to or mutate the database. It prints the required approval phrase and target identifier.

## Approved execution

After peer approval, run through the controlled deployment environment:

npm run access:bootstrap-host -- --email reviewed.account@example.com --execute --approval I_APPROVE_FIRST_HOST_BOOTSTRAP

The command uses a serializable transaction, refuses to run if any Host already exists, refuses unknown accounts, updates only the exact account, and writes first_host_bootstrapped to AdminAccessAuditLog. It does not accept or log a password.

## Verification

- Sign in as the reviewed Host and confirm the users and access-audit views work.
- Confirm a tenant operator cannot open those views or request tenantId=all.
- Confirm the bootstrap audit row names the target user ID and contains no credentials.
- Provision tenant grants only from the audited Host UI using the approved matrix.

## Recovery

If the first Host cannot sign in, repair the account through the existing password-reset process; do not create a second implicit owner. If the database contains zero Hosts because of an interrupted rollout, restore the pre-migration backup or rerun the same reviewed bootstrap for an explicitly approved existing account. If a Host exists, the bootstrap command intentionally refuses recovery; another signed-in Host must use the audited UI. Database break-glass changes require incident approval, a before/after backup, an equivalent manual audit record, and post-incident review.

## Rollback

Application rollback must precede schema rollback. Preserve/export AdminAccessAuditLog before dropping any Phase 1 tables. Because schema rollback deletes grants and audit evidence, it is a recovery operation, not a routine down migration.