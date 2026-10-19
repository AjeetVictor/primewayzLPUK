# Tenant chat entitlement — migration and rollback

Release deployment for this migration and the Chat Connect installation registry is in `Docs/chat-platform-release-runbook.md`. This note is the schema contract for the entitlement tables only.

This migration is additive. It creates `TenantChatEntitlement` and `TenantChatEntitlementAudit`. It does not insert a row, does not create a tenant, and does not change chat sessions, messages, users, or Chat Connect installations.

No row means the tenant keeps its existing chat behavior. Do not seed entitled rows for Primewayz UK or Primewayz Infotech as part of deployment.

## Order

1. Apply `prisma/migrations/20261019180000_tenant_chat_entitlement` to the target database.
2. Deploy the application that reads the entitlement store.
3. Leave the tables empty unless a Host/Owner deliberately records a status.

Deploying the application before the tables exist makes every entitlement read fail. The platform then denies chat, including Primewayz UK and Primewayz Infotech, until the tables are present. That is intentional. A missing store must not look like “no row”.

Applying the tables before the new application is safe. The previous application ignores them.

## Rollback

1. Deploy the previous application first, so chat no longer reads these tables.
2. Drop `TenantChatEntitlementAudit`, then drop `TenantChatEntitlement`.

Dropping the tables while the new application is still running denies chat for every tenant.

## What this does not change

Installation suspension, connector health, widget release files, and session history stay where they are. A Host/Owner suspends tenant chat from Tenant Management. That action does not suspend an installation, and suspending an installation does not suspend tenant chat.
