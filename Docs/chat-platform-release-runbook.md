# Chat platform release — SSH deployment runbook

This is the operator procedure for the two pending Prisma migrations and the application that enforces central tenant chat entitlement. Do not run it until the release is approved. Do not use `prisma db push` or `prisma migrate reset`.

The application is the Primewayz UK Node process (`primewayz-uk` in `ecosystem.config.cjs`) on the host that serves `https://uk.primewayz.com`. Primewayz Infotech and other tenants use that same process and the same MySQL database. Confirm the PM2 name with `pm2 list` before restarting anything.

## Migration order

Apply both folders with `npx prisma migrate deploy`. Prisma runs them in folder-name order. There is no foreign key between them, and neither one alters `ChatSession`, `ChatMessage`, or `User`.

| Order | Folder | What it does |
| ----- | ------ | ------------ |
| 1 | `prisma/migrations/20261019120000_chat_connect_installation_registry` | Creates `ChatConnectInstallation`, `ChatConnectAuditLog`, and `ChatConnectIdempotencyKey`. Seeds `cci_pw_infotech_wordpress` and `cci_pw_uk_first_party` only when those ids are absent. Does not copy `WORDPRESS_CHAT_INTEGRATION_TOKEN`. Does not seed RentReadBuy or Silver. |
| 2 | `prisma/migrations/20261019180000_tenant_chat_entitlement` | Creates `TenantChatEntitlement` and `TenantChatEntitlementAudit`. Inserts no rows. |

`20261019180000` does not depend on the installation tables. `20261019120000` does not depend on the entitlement tables. The new application does depend on both being present before it serves traffic.

Deploying the new application before `TenantChatEntitlement` exists makes every entitlement read fail. The platform then refuses new chat messages for every tenant, including Primewayz UK and Primewayz Infotech. That is intentional. A missing store must not look like “no row”.

Applying the tables before the new application is safe. The previous application ignores them.

Leave `TenantChatEntitlement` empty after deployment. No row keeps Primewayz UK and Primewayz Infotech on their existing chat behavior. Silver stays disabled unless `RRB_SILVER_CAMPAIGN_ENABLED` is exactly `true`. Do not insert an `entitled` row to “turn chat on”.

## 1. Pre-deployment database backup

On the database host, or from the app host if that is where `mysqldump` is already used, take a consistent backup of the production schema before `migrate deploy`. Use the existing operator backup path and credentials. Do not print the database URL or password into shell history notes that will be pasted into chat.

```bash
mkdir -p "$HOME/db-backups"
mysqldump \
  --single-transaction \
  --routines \
  --triggers \
  --databases "$MYSQL_DATABASE" \
  > "$HOME/db-backups/pw-uk-before-chat-platform-$(date -u +%Y%m%dT%H%M%SZ).sql"
```

Stop if the dump file is missing or empty:

```bash
test -s "$HOME/db-backups"/pw-uk-before-chat-platform-*.sql
```

Record the newest dump path, the git commit that will be deployed, and `npx prisma migrate status` before any change.

## 2. Migration verification

On the app host, in the release checkout, with `DATABASE_URL` pointing at the production database:

```bash
npx prisma validate
npx prisma migrate status
```

Pending output must list only:

- `20261019120000_chat_connect_installation_registry`
- `20261019180000_tenant_chat_entitlement`

If a different migration is pending, or a previous migration is recorded as failed, stop. Do not deploy.

Apply only after the backup file is confirmed:

```bash
npx prisma migrate deploy
npx prisma migrate status
```

Then, read-only, confirm the schema and the intended seed. `TenantChatEntitlement` must be empty.

```sql
SHOW TABLES LIKE 'ChatConnectInstallation';
SHOW TABLES LIKE 'ChatConnectAuditLog';
SHOW TABLES LIKE 'ChatConnectIdempotencyKey';
SHOW TABLES LIKE 'TenantChatEntitlement';
SHOW TABLES LIKE 'TenantChatEntitlementAudit';

SELECT id, tenantId, integrationTechnology, authorizationStatus, legacyEnvBinding
FROM ChatConnectInstallation
WHERE id IN ('cci_pw_infotech_wordpress', 'cci_pw_uk_first_party');

SELECT COUNT(*) AS entitlement_rows FROM TenantChatEntitlement;
```

Expected:

- Both installation ids exist. Infotech technology is `wordpress` and `legacyEnvBinding` is true. UK technology is `react` and `legacyEnvBinding` is false.
- No installation row for `rrb` or `rrb-silver-campaign`.
- `entitlement_rows` is 0.
- `_prisma_migrations` has both folders with a finished applied time and a null rolled-back time.

`npx prisma generate` is required only if the deploy host runs the TypeScript server from source and the client was not already generated for this schema. The production start path is `scripts/start-server.ts` through PM2.

## 3. Deployment procedure

Build and switch the process only after both migrations are applied.

```bash
git status
npm ci
npm run build
pm2 restart primewayz-uk --update-env
pm2 status primewayz-uk
```

Confirm `git status` is the approved release commit before `npm ci`. Do not restart PM2 while `migrate deploy` is still running.

The new process reads entitlement on:

- public visitor chat, including `POST /api/chat/respond`
- `GET /api/platform/capabilities` and public chat CORS
- authenticated admin replies and admin chat mutations, including a pre-tenant session whose stored tenant id is null, which is checked as Primewayz UK
- WordPress delegated reply, resolve, and reopen

It does not read entitlement for admin conversation history. Host/Owner changes to `/api/admin/tenant-chat-entitlements` stay available to the platform owner.

## 4. Post-deployment smoke tests

Run these against `https://uk.primewayz.com` after the process is up. They are reads plus one real visitor message on the existing UK chat, which has no entitlement row.

1. `npx prisma migrate status` shows both migrations applied and no pending folders.
2. `SELECT COUNT(*) FROM TenantChatEntitlement` is still 0.
3. From a browser on `https://uk.primewayz.com`, open the site chat, send a short message, and confirm it appears in the UK admin inbox. Reply from the inbox and confirm the reply is stored.
4. `GET /api/platform/capabilities` with `Origin: https://uk.primewayz.com` returns `capabilities.chat: true`. The same call with `Origin: https://primewayz.com` returns `capabilities.chat: true`.
5. WordPress `POST /api/integrations/wordpress/chat` with the existing integration credential and `{ "action": "diagnostics" }` returns `ok: true`, `chat.enabled: true`, and the existing diagnostics keys.
6. WordPress `{ "action": "dashboard" }` still returns `attention`, `recentConversations`, `service`, and `team`.
7. Admin chat history for an existing Infotech conversation still loads. Do not create a suspended row during smoke testing.
8. `GET /embed/chat/1.1.0/pw-chat.js` and `GET /embed/chat/1.2.0/pw-chat.js` return `200` with `cache-control: public, max-age=31536000, immutable`. Compare the body hash with the release files committed in `embed-releases/chat/`. This release does not rebuild those files.
9. PM2 logs show no Prisma error for `TenantChatEntitlement` or `ChatConnectInstallation`.

Silver is not part of the smoke test. It stays off while `RRB_SILVER_CAMPAIGN_ENABLED` is unset or any value other than `true`.

## 5. Safe application rollback

Roll the application back before dropping tables.

1. On the app host, check out the previous release commit and run `npm ci` and `npm run build`.
2. `pm2 restart primewayz-uk --update-env`.
3. Confirm UK visitor chat and the admin inbox reply work again.
4. Leave the new tables in place. The previous application does not read them. Chat suspension from this release is inactive once the old process is serving.

Drop tables only when this release is being removed from the database, and only after the previous application is the process that is serving.

Entitlement first, because nothing else references it:

```sql
DROP TABLE `TenantChatEntitlementAudit`;
DROP TABLE `TenantChatEntitlement`;
```

Installation registry second:

```sql
DROP TABLE `ChatConnectIdempotencyKey`;
DROP TABLE `ChatConnectAuditLog`;
DROP TABLE `ChatConnectInstallation`;
```

If the database should forget the migration history as well, delete only these rows from `_prisma_migrations`:

- `20261019180000_tenant_chat_entitlement`
- `20261019120000_chat_connect_installation_registry`

Do not delete chat sessions, messages, users, or any other migration row. Restore the pre-deployment dump if a migration failed halfway or a seed row is wrong. Do not drop the tables while the new application is still running: every entitlement read will fail and new chat messages will be refused.

## 6. Entitlement database outage

If MySQL cannot read `TenantChatEntitlement` while the rest of the database is up, the new application refuses new chat messages. It does not treat the failure as “no entitlement row”.

| Path | Result |
| ---- | ------ |
| Visitor chat, including `POST /api/chat/respond` | `503` `Chat is temporarily unavailable.` |
| Public capabilities | `200` with `capabilities.chat` false |
| Public chat CORS when Origin is present | `503` |
| Admin reply and admin chat mutations | `503` `chat_service_unavailable` |
| Admin conversation history | Still served from the chat tables |
| WordPress diagnostics | `200`, `status: unavailable`, `chat.enabled: false` |
| WordPress dashboard, conversation, reply, resolve, reopen | `503` `chat_service_unavailable` |
| Host/Owner entitlement save | `503` `entitlement_store_unavailable` |

Do not drop the entitlement tables to clear the outage. A missing table is the same deny. Do not insert an `entitled` row as a bypass unless the Host/Owner has decided that status. Restore database connectivity, then re-check `SELECT COUNT(*) FROM TenantChatEntitlement` and the UK visitor message path.

A stored `suspended` or `revoked` row is different from an outage. Historical admin reads and WordPress dashboard and conversation reads stay available. New messages stay refused with `403`.
