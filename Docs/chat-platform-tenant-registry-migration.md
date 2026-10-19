# Chat Platform tenant registry — migration and rollback

This migration adds the commercial tenant registry used by Primewayz Chat Platform. It does not insert tenants, does not change chat sessions, and does not change TenantChatEntitlement or ChatConnectInstallation rows.

Apply it with `npx prisma migrate deploy` on a database that already has the earlier Chat Connect and entitlement migrations. Do not run `prisma db push` or `prisma migrate reset` against production.

## What it creates

- `PlatformTenantAccount` — one row per commercial tenant, keyed by the existing tenant id when the tenant is already in the compile-time catalog
- `PlatformTenantSite` — sites or applications under that tenant
- `PlatformTenantOrigin` — exact origins, unique across the platform, unverified until a probe succeeds
- `PlatformTenantAudit` — lifecycle and domain events
- `PlatformTenantSiteInstallation` — links a Chat Connect installation id to a site without changing the installation row

No row means the compile-time tenant keeps its current access. A suspended or archived row closes that access even if the source catalog still says active. If the registry cannot be read, chat authorization fails closed. The only legacy path is a missing table before this migration is applied.

## Rollback

Stop the application version that writes these tables before dropping them. Drop in this order:

```sql
DROP TABLE `PlatformTenantSiteInstallation`;
DROP TABLE `PlatformTenantAudit`;
DROP TABLE `PlatformTenantOrigin`;
DROP TABLE `PlatformTenantSite`;
DROP TABLE `PlatformTenantAccount`;
```

Rollback removes commercial records, site links, and domain challenges. It does not delete conversations, grants, entitlements, or installations. Compile-time tenants become reachable again through the pre-migration fallback, including any tenant that was suspended only by a commercial record. Take a backup before rolling back if those suspensions must be kept.

## Disposable check

The SQL is asserted by `src/lib/platform/tenantAccount.test.ts`. `node scripts/check-tenant-registry-migration.mjs` creates `pw_chat_platform_migration_check` on the local `DATABASE_URL` host, applies the migration, drops the tables, and drops that database. It refuses any host other than localhost or `127.0.0.1`. Do not point that check at production.
