# SEO Intelligence — Prisma Migration Runbook

This document explains how to deploy the SEO Intelligence foundation migrations safely on Primewayz UK production.

It covers:

- Canonical page identity (`SeoPage`, `SeoPageAlias`)
- GA4 aggregate reporting foundation
- Conversion evidence aggregation (`SeoPageConversionDaily`)

These are production and operations instructions. Do not execute migration commands casually against a populated database.

---

## 1. Migrations in this phase

| Order | Migration folder | Purpose |
| ----- | ---------------- | ------- |
| SEO 1 | `20260830120000_seo_page_identity` | Canonical page identity tables |
| SEO 2 | `20260830133000_ga4_reporting_foundation` | GA4 sync + page metrics |
| SEO 3 | `20260830150000_seo_conversion_daily` | Daily conversion evidence aggregates |

Database provider: **MySQL**

Migration lock file: `prisma/migrations/migration_lock.toml`

---

## 2. Safety characteristics

All SEO Intelligence migrations in this phase are **additive only**:

- Creates new tables and indexes
- Does **not** drop existing tables or columns
- Does **not** alter existing operational URL fields (GSC, chat, lead, CMS)
- Does **not** add foreign keys from existing operational tables to `SeoPage`
- Uses cascade delete only from `SeoPageAlias` → `SeoPage`

Tables created by `20260830120000_seo_page_identity`:

- `SeoPage` — one row per canonical Primewayz UK page URL
- `SeoPageAlias` — observed URL variants mapped to a canonical page

---

## 3. Pre-deployment checks

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

## 4. Production migration commands (do not run casually)

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

## 5. Post-deployment verification

```bash
npx prisma migrate status
curl -s -H "Cookie: <admin-session>" \
  "https://uk.primewayz.com/api/admin/autopilot/seo-pages/diagnostics?limit=5"
```

Expected:

- Migration status shows all three SEO migrations applied
- Diagnostics endpoint returns aggregate counts (may be zero before backfill)
- Application health checks pass
- No new Prisma errors in PM2 logs

---

## 6. Backfill commands (post-migration, dry-run first)

Dry-run is the default and writes nothing:

```bash
npm run seo:pages:backfill:dry
```

Optional filters:

```bash
npx tsx scripts/backfill-seo-pages.ts --source=GSC --limit=500 --verbose
npx tsx scripts/backfill-seo-pages.ts --date-from=2026-01-01 --date-to=2026-03-01
```

Write mode requires explicit flag:

```bash
npm run seo:pages:backfill
# equivalent to:
npx tsx scripts/backfill-seo-pages.ts --write
```

The backfill is:

- Idempotent
- Resumable (`--offset`, `--limit`)
- Safe to stop and rerun
- Does not read chat message text or print PII

---

## 7. Rollback considerations

There is no automated down migration.

If a migration must be rolled back:

1. Stop the application
2. Restore the pre-deployment MySQL backup, **or**
3. Manually drop only the new SEO Intelligence tables if no production data must be preserved:

   - `SeoPageAlias`
   - `SeoPage`
   - GA4 / conversion tables from later migrations

4. Remove corresponding rows from `_prisma_migrations`
5. Redeploy the previous application commit

Because later phases may depend on these tables, coordinate rollback with the engineering owner before dropping data.

---

## 8. Operator checklist

- [ ] Backup completed
- [ ] `prisma migrate status` reviewed
- [ ] `prisma migrate deploy` succeeded
- [ ] `npm run build` succeeded
- [ ] PM2 restart succeeded
- [ ] Diagnostics endpoint verified
- [ ] Dry-run backfill reviewed
- [ ] Write-mode backfill scheduled separately if needed
