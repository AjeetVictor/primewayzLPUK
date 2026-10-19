# Chat Connect installation registry — migration and rollback

Release deployment for this migration and tenant chat entitlement is in `Docs/chat-platform-release-runbook.md`. This note is the schema contract for the installation tables only.

This migration is additive. It creates the installation registry and seeds two existing chat surfaces: the Primewayz Infotech WordPress binding, and the Primewayz UK first-party LiveChat installation. It does not copy the environment credential, does not insert a tenant, and does not change chat sessions or messages. RentReadBuy and Silver are not seeded. Silver stays disabled unless `RRB_SILVER_CAMPAIGN_ENABLED` is exactly `true`.

Apply it with Prisma's migration deploy path. Do not use `prisma db push`.

```bash
npx prisma migrate deploy
```

The migration directory is `prisma/migrations/20261019120000_chat_connect_installation_registry`.

MySQL identifier names in this migration are 64 characters or shorter. The legacy-binding index is `ChatConnectInstallation_legacyBinding_idx`. The idempotency unique key is `ChatConnectIdempotency_install_action_key`.

## What the seed records

`cci_pw_infotech_wordpress` points at tenant key `pw-infotech` and integration id `primewayz-wordpress`.

- `provisionedAt`, `createdAt`, and `updatedAt` are the time the migration runs.
- `registeredAt`, `authorizedAt`, `activatedAt`, heartbeat, and authenticated-activity timestamps are left null. Those historical moments are not known and are not invented.
- `frontendVisibility` is `unset`.
- `heartbeatProtocolAdopted` is false, so connection health stays Unknown until a connector sends a verified heartbeat.
- No credential hash is stored. `WORDPRESS_CHAT_INTEGRATION_TOKEN` remains the operational WordPress credential.

`cci_pw_uk_first_party` points at tenant key `pw-uk`. Its technology is `react`, matching the in-app `LiveChat` component. It is not an `INTEGRATION_REGISTRY` credential and `integrationId` is null.

- The same timestamp rule applies: only `provisionedAt`, `createdAt`, and `updatedAt` use the migration time.
- `registeredAt`, `authorizedAt`, `activatedAt`, heartbeat, and authenticated-activity timestamps are null.
- `frontendVisibility` is `unset`. The row is not marked Visible because the site is deployed.
- `heartbeatProtocolAdopted` is false, so connection health stays Unknown. A running central API is not a verified heartbeat.
- `legacyEnvBinding` is false. No connector secret is stored.
- The audit detail records `classification: first-party` and `source: live_chat_component`.

Both seed inserts are guarded by `WHERE NOT EXISTS`, so applying the migration once cannot duplicate either installation.

RentReadBuy remains a tenant in the compile-time registry only. No installation row is created for `rrb` or `rrb-silver-campaign`. A RentReadBuy connector installation still requires a Host/Owner to register it after the connector source is verified.

## Existing WordPress behaviour before and after

The operational route `POST /api/integrations/wordpress/chat` keeps its current authentication, tenant binding, and response body. A failure while stamping last-authenticated activity is logged and does not change that response. If this migration has not been applied, that stamp fails and the operational call still succeeds.

## Rollback

Roll back only the new tables, in this order. Do not delete chat or user rows; this migration did not write them.

```sql
DROP TABLE `ChatConnectIdempotencyKey`;
DROP TABLE `ChatConnectAuditLog`;
DROP TABLE `ChatConnectInstallation`;
```

After the tables are dropped, remove the migration record for `20261019120000_chat_connect_installation_registry` from `_prisma_migrations` if this database should be returned to the previous migration history. Redeploy the previous application build so the new admin and connector routes are not called.

Heartbeat idempotency keys are retained for 24 hours. A later heartbeat, at most once every 10 minutes per process, deletes up to 5000 heartbeat keys older than that window. Activation keys are not deleted, so a delayed activation retry still replays. Cleanup failure does not fail the heartbeat. Dropping the idempotency table is safe for rollback because those keys are not chat transcripts.
