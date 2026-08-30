# SEO Intelligence — Prisma Migration Runbook

This document explains how to deploy the SEO Intelligence foundation migrations safely on Primewayz UK production.

It covers:

- Canonical page identity (`SeoPage`, `SeoPageAlias`)
- GA4 aggregate reporting foundation and enhancements
- Conversion evidence aggregation (`SeoPageConversionDaily`)

These are production and operations instructions. Do not execute migration commands casually against a populated database.

---

## 1. Migrations in this phase

| Order | Migration folder | Purpose |
| ----- | ---------------- | ------- |
| SEO 1 | `20260830120000_seo_page_identity` | Canonical page identity tables |
| SEO 2 | `20260830133000_ga4_reporting_foundation` | GA4 sync + page metrics (initial) |
| SEO 3 | `20260830150000_seo_conversion_daily` | Daily conversion evidence aggregates |
| SEO 4 | `20260830210000_ga4_aggregate_reporting` | GA4 dimension key hash, normalised URLs, partial sync status |

Database provider: **MySQL**

Migration lock file: `prisma/migrations/migration_lock.toml`

---

## 2. Safety characteristics

All SEO Intelligence migrations in this phase are **additive only**:

- Creates new tables and indexes
- Does **not** drop existing tables or columns (GA4 enhancement migration alters GA4 tables only)
- Does **not** alter existing operational URL fields (GSC, chat, lead, CMS)
- Does **not** add foreign keys from existing operational tables to `SeoPage`
- Uses cascade delete only from `SeoPageAlias` → `SeoPage`

Tables created by `20260830120000_seo_page_identity`:

- `SeoPage` — one row per canonical Primewayz UK page URL
- `SeoPageAlias` — observed URL variants mapped to a canonical page

Tables created by GA4 migrations:

- `Ga4ConfigurationState` — sync lock and last-success metadata
- `Ga4SyncRun` — sync run history
- `Ga4PageMetric` — daily aggregate landing-page metrics

Enhancement migration `20260830210000_ga4_aggregate_reporting` adds:

- `Ga4PageMetric.normalisedLandingPage`, `normalisedLandingPageHash`, `dimensionKeyHash`
- `Ga4PageMetric.unclassifiedLeadEvents`, `qaLeadEvents` (nullable)
- `Ga4SyncRun.unmatchedPages`
- `Ga4SyncStatus.PARTIAL`
- Unique key on `(metricDate, dimensionKeyHash)`

---

## 3. Environment variables (GA4)

Configure on the server (never in Prisma, never in the browser):

```env
GA4_PROPERTY_ID=
GA4_SERVICE_ACCOUNT_CLIENT_EMAIL=
GA4_SERVICE_ACCOUNT_PRIVATE_KEY=
GA4_DEFAULT_LOOKBACK_DAYS=28
GA4_DATA_DELAY_DAYS=1
```

Requirements:

- GA4 service account with **Viewer** access to the Primewayz UK GA4 property
- Separate from GSC OAuth — do not reuse the GSC refresh token
- Private key newlines may use `\n` in `.env`; the server normalises them safely
- Missing variables are reported by name only in `/api/admin/autopilot/ga4/status`

Validate configuration after deploy:

```bash
curl -s -H "Cookie: <admin-session>" -X POST \
  "https://uk.primewayz.com/api/admin/autopilot/ga4/test-connection"
```

---

## 4. Pre-deployment checks

On the deployment host:

```bash
git pull
npm ci
npm run typecheck
npm run test
npm run build
npx prisma validate
npx prisma generate
npx prisma migrate status
```

Confirm:

- Working tree matches the intended release commit
- `DATABASE_URL` points at the correct production database
- A recent MySQL backup exists
- No pending failed migration is recorded in `_prisma_migrations`

**Do not use:**

- `npx prisma db push`
- `npx prisma migrate reset`

---

## 5. Production migration commands (do not run casually)

```bash
# 1. Backup first (operator responsibility)

# 2. Check migration status
npx prisma migrate status

# 3. Apply pending migrations
npx prisma migrate deploy

# 4. Regenerate client (if not already done in build pipeline)
npx prisma generate

# 5. Rebuild and restart application
npm run build
pm2 restart <app-process-name>
```

---

## 6. Post-deployment verification

```bash
npx prisma migrate status
curl -s -H "Cookie: <admin-session>" \
  "https://uk.primewayz.com/api/admin/autopilot/ga4/status"
curl -s -H "Cookie: <admin-session>" \
  "https://uk.primewayz.com/api/admin/autopilot/seo-pages/diagnostics?limit=5"
```

Expected:

- Migration status shows all SEO migrations applied
- GA4 status returns `configured: true` when env vars are set
- Test connection succeeds for a correctly permissioned service account
- Diagnostics endpoint returns aggregate counts
- Application health checks pass
- No new Prisma errors in PM2 logs

---

## 7. First GA4 sync checklist (production)

1. Confirm GA4 env vars and service account Viewer access
2. `POST /api/admin/autopilot/ga4/test-connection` — expect `{ ok: true }`
3. Dry review: check `latestSafeDate` in status response
4. First sync: `POST /api/admin/autopilot/ga4/sync` with default range (or small custom range, e.g. last 7 days)
5. Review sync history: status, rows stored, unmatched pages
6. `GET /api/admin/autopilot/ga4/performance?dateFrom=...&dateTo=...` — confirm summary and data quality
7. Compare unmatched landing pages with `/api/admin/autopilot/seo-pages/diagnostics?unmatchedOnly=true`

Do **not** run a production SEO-page backfill as part of GA4 sync — GA4 sync creates aliases opportunistically only.

---

## 8. Backfill commands (SeoPage identity — post-migration, dry-run first)

Dry-run is the default and writes nothing:

```bash
npm run seo:pages:backfill:dry
```

Write mode requires explicit flag:

```bash
npm run seo:pages:backfill
```

The backfill is idempotent, resumable, and does not read chat message text or print PII.

---

## 9. Rollback considerations

There is no automated down migration.

If a migration must be rolled back:

1. Stop the application
2. Restore the pre-deployment MySQL backup, **or**
3. Manually drop only the new SEO Intelligence tables if no production data must be preserved

4. Remove corresponding rows from `_prisma_migrations`
5. Redeploy the previous application commit

Because later phases may depend on these tables, coordinate rollback with the engineering owner before dropping data.

---

## 10. Operator checklist

- [ ] Backup completed
- [ ] `prisma migrate status` reviewed
- [ ] `prisma migrate deploy` succeeded
- [ ] GA4 env vars configured (Viewer service account)
- [ ] `npm run build` succeeded
- [ ] PM2 restart succeeded
- [ ] GA4 test connection verified
- [ ] First GA4 sync reviewed (rows, unmatched pages)
- [ ] GA4 performance endpoint verified
- [ ] Diagnostics endpoint verified
- [ ] SeoPage backfill scheduled separately if needed
