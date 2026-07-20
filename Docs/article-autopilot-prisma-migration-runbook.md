# Article Autopilot — Prisma Migration Runbook

This document explains how to deploy the Article Autopilot Prisma migrations safely.

It covers the migrations introduced through:

* Phase 1B.2 — Autopilot foundation
* Phase 2A — Keyword import and candidate pipeline
* Phase 2B — Research snapshots and evidence history

These are production and operations instructions for a controlled deployment. Do not execute migration commands casually against a populated database.

---

## 1. Migrations in this repository

The project already has a committed MySQL migration history under:

```text
prisma/migrations/
```

The existing June 2026 migrations represent the application schema before Article Autopilot.

Article Autopilot currently adds three incremental migrations:

| Order       | Migration folder                                      | Purpose                                                                                      |
| ----------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Existing    | `20260601…` through `20260618120000_chat_lead_phase1` | Pre-Autopilot application schema history                                                     |
| Autopilot 1 | `20260717150100_autopilot_foundation`                 | Core topics, activity logs, workflow runs, settings, and locked `autoPublishEnabled = false` |
| Autopilot 2 | `20260717180000_autopilot_keyword_imports`            | Keyword import batches, candidate records, provenance, review, and topic-conversion links    |
| Autopilot 3 | `20260720120000_autopilot_research_snapshots`         | Versioned research snapshots, evidence history, completeness, and confirmation records       |

Database provider:

```text
MySQL
```

Migration lock file:

```text
prisma/migrations/migration_lock.toml
```

---

## 2. Why there is no separate baseline migration

An early architecture review assumed that no committed SQL migration history existed because the repository contained a global SQL ignore rule:

```gitignore
*.sql
```

A later check using:

```bash
git ls-files prisma/migrations
```

confirmed that the June 2026 migrations were already tracked.

Creating another empty-to-full-schema baseline after those migrations would be unsafe because it could:

* attempt to recreate tables that earlier migrations already created
* break `prisma migrate deploy` on a new empty database
* conflict with production `_prisma_migrations` history
* make deployment order ambiguous
* create duplicate tables, indexes, or foreign keys

Therefore, Article Autopilot is delivered only through additive migrations placed after the existing migration history.

The repository now includes this `.gitignore` exception:

```gitignore
!prisma/migrations/**/*.sql
```

This keeps Prisma migration SQL trackable while continuing to ignore unrelated database backups and SQL dumps.

---

## 3. Objects created by the Autopilot migrations

The three Autopilot migrations create these tables:

```text
AutopilotTopic
AutopilotActivityLog
AutopilotWorkflowRun
AutopilotSetting
AutopilotKeywordImportBatch
AutopilotKeywordCandidate
AutopilotResearchSnapshot
```

The migrations are additive.

They must not:

* alter `CmsBlogPost`
* alter public blog content
* alter static article data
* alter SDaaS `/insights` content
* delete application data
* drop existing tables
* truncate existing tables
* enable automatic publishing

The foundation migration inserts one setting:

```text
autoPublishEnabled = false
```

The setting is locked during the foundation and research phases.

---

## 4. Safety rules

Before deployment:

1. Take a verified database backup.
2. Confirm the target environment and database name.
3. Confirm the currently deployed Git revision.
4. Review `npx prisma migrate status`.
5. Confirm whether `_prisma_migrations` contains the existing June migrations.
6. Confirm whether any `Autopilot%` tables already exist.
7. Do not proceed when database history and physical schema disagree.

Never run this against production:

```bash
npx prisma migrate reset
```

Do not use this as a substitute for reviewed migrations:

```bash
npx prisma db push
```

Do not manually execute migration SQL files unless a specific recovery plan has been reviewed.

Do not use `AutopilotSetting` as a secrets store. API keys, tokens, credentials, and provider secrets must remain in environment variables.

---

## 5. Pre-deployment checks

From the deployed project directory, check the Prisma migration status:

```bash
npx prisma migrate status
```

Also inspect the migration folders:

```bash
ls -la prisma/migrations
```

Confirm that these folders are present:

```text
20260717150100_autopilot_foundation
20260717180000_autopilot_keyword_imports
20260720120000_autopilot_research_snapshots
```

Check whether any Autopilot tables already exist:

```sql
SHOW TABLES LIKE 'Autopilot%';
```

For a normal first Autopilot deployment, this query should return no Autopilot tables before migration deployment.

If some Autopilot tables already exist, stop and investigate before running `prisma migrate deploy`.

---

## 6. Existing populated database deployment

Use this procedure when the production database already contains the existing application schema and the historical June 2026 migrations are correctly recorded in `_prisma_migrations`.

### Step 1 — Take and verify a backup

Create a full database backup.

Verify that:

* the backup file exists
* its size is plausible
* it can be read
* the backup destination has sufficient storage
* the backup includes `_prisma_migrations`

Do not proceed without a verified backup.

### Step 2 — Confirm current migration history

Run:

```bash
npx prisma migrate status
```

Expected normal result:

* all historical June 2026 migrations are applied
* the three Article Autopilot migrations are pending

Depending on whether any earlier Autopilot migration has already been deployed in the target environment, only the remaining migrations may appear pending.

### Step 3 — Deploy the application code

Deploy the code containing:

```text
prisma/schema.prisma
prisma/migrations/20260717150100_autopilot_foundation
prisma/migrations/20260717180000_autopilot_keyword_imports
prisma/migrations/20260720120000_autopilot_research_snapshots
```

Do not restart the application with the new Autopilot code before the required tables are available.

The existing public website should continue functioning because the migrations are additive and no public route depends on Autopilot data.

### Step 4 — Check pending migrations again

Run:

```bash
npx prisma migrate status
```

Confirm that Prisma recognises the expected pending Autopilot migrations in timestamp order.

### Step 5 — Apply pending migrations

Run:

```bash
npx prisma migrate deploy
```

Prisma should apply migrations in this order:

```text
20260717150100_autopilot_foundation
20260717180000_autopilot_keyword_imports
20260720120000_autopilot_research_snapshots
```

Do not interrupt the command while it is applying migrations.

### Step 6 — Generate Prisma Client

Run:

```bash
npx prisma generate
```

Confirm that Prisma Client generation succeeds.

### Step 7 — Build the application

Run:

```bash
npm run build
```

Confirm:

* image optimisation completes
* base-path validation passes
* client build succeeds
* SSR build succeeds

A Vite chunk-size warning does not by itself mean the build failed.

### Step 8 — Restart the application

Restart the correct PM2 process:

```bash
pm2 restart primewayz-uk
```

If the environment uses a different PM2 process name, confirm it first:

```bash
pm2 list
```

The process definition should also be checked in:

```text
ecosystem.config.cjs
```

### Step 9 — Verify process health

Run:

```bash
pm2 status
pm2 logs primewayz-uk --lines 100
```

Check for:

* Prisma connection errors
* missing-table errors
* migration errors
* TypeScript runtime errors
* route-registration failures
* repeated process restarts

### Step 10 — Verify migration status

Run:

```bash
npx prisma migrate status
```

Expected result:

```text
Database schema is up to date
```

---

## 7. Database verification after deployment

### Verify all Autopilot tables

Run:

```sql
SHOW TABLES LIKE 'Autopilot%';
```

Expected tables:

```text
AutopilotActivityLog
AutopilotKeywordCandidate
AutopilotKeywordImportBatch
AutopilotResearchSnapshot
AutopilotSetting
AutopilotTopic
AutopilotWorkflowRun
```

### Verify the locked publishing setting

Run:

```sql
SELECT
  `key`,
  `value`,
  `isLocked`,
  `description`
FROM `AutopilotSetting`
WHERE `key` = 'autoPublishEnabled';
```

Expected values:

```text
key      = autoPublishEnabled
value    = false
isLocked = 1
```

The value must remain a JSON boolean false.

It must not be:

```text
"false"
```

as a JSON string.

It must never be:

```text
true
```

during these phases.

### Verify research-snapshot version uniqueness

Run:

```sql
SHOW INDEX
FROM `AutopilotResearchSnapshot`
WHERE `Key_name` = 'AutopilotResearchSnapshot_topicId_version_key';
```

Expected:

* the unique index exists
* it covers `topicId`
* it covers `version`
* there is no redundant non-unique `(topicId, version)` index

### Verify existing tables remain intact

Spot-check important existing application tables:

```sql
SHOW TABLES LIKE 'User';
SHOW TABLES LIKE 'CmsBlogPost';
SHOW TABLES LIKE 'ChatSession';
SHOW TABLES LIKE 'FormResponse';
```

The Autopilot migrations must not recreate or modify these tables.

---

## 8. Functional verification

After the application restarts, sign in to the admin panel using an authorised account.

Verify:

1. The Autopilot tab is visible to an authorised role.
2. The dashboard loads.
3. Topic Pipeline loads.
4. Keyword Imports loads.
5. Research Queue loads.
6. Activity Log loads.
7. Creating a test topic does not publish anything.
8. Keyword import preview does not persist data.
9. Committing a small test import creates an import batch and candidates.
10. Converting a candidate creates only an Autopilot topic.
11. Starting manual research creates a research snapshot.
12. Research confirmation does not:

    * score the topic
    * approve the topic
    * assign a final category automatically
    * create a CMS article
    * publish content
13. `autoPublishEnabled` cannot be enabled through the admin APIs.

Use test records that can safely remain archived or be clearly identified as deployment verification data.

Do not hard-delete audit history.

---

## 9. When `_prisma_migrations` is empty or incomplete

A populated database may have been maintained previously with:

```bash
npx prisma db push
```

instead of Prisma migrations.

In that case, the physical tables may exist even though `_prisma_migrations` does not contain all historical migrations.

Do not run all historical migrations against that populated database.

Do not create a new baseline migration.

Do not mark migrations as applied without verifying that every migration’s expected schema changes are already physically present.

### Required process

1. Take a verified backup.
2. Compare the live database schema with the migration history.
3. Identify which historical migrations are already reflected in the live database.
4. Mark only those verified historical migrations as applied:

```bash
npx prisma migrate resolve --applied <migration_folder_name>
```

5. Leave migrations pending when their tables or changes do not yet exist.
6. Run:

```bash
npx prisma migrate status
```

7. Apply only genuinely pending migrations:

```bash
npx prisma migrate deploy
```

For a database that has no Autopilot tables, the following should remain pending until `migrate deploy` applies them:

```text
20260717150100_autopilot_foundation
20260717180000_autopilot_keyword_imports
20260720120000_autopilot_research_snapshots
```

`prisma migrate resolve --applied` is a controlled deployment operation.

It must not be run merely to suppress an error.

---

## 10. When Autopilot tables already exist but migrations are not recorded

This may happen if someone used `prisma db push` with the Autopilot schema.

Do not immediately run:

```bash
npx prisma migrate deploy
```

The create-table migrations could fail because the tables already exist.

Required response:

1. Stop deployment.
2. Take a fresh backup.
3. Inspect every existing Autopilot table.
4. Compare columns, indexes, foreign keys, defaults, and constraints with the migration SQL.
5. Confirm the locked `autoPublishEnabled = false` setting.
6. Resolve each migration as applied only after exact schema equivalence has been established.
7. Document the reconciliation.

Do not assume that similarly named tables are structurally correct.

---

## 11. New empty database deployment

For a new empty database, run:

```bash
npx prisma migrate deploy
npx prisma generate
npm run build
```

Prisma should apply all migrations in timestamp order:

1. Existing June 2026 application migrations
2. `20260717150100_autopilot_foundation`
3. `20260717180000_autopilot_keyword_imports`
4. `20260720120000_autopilot_research_snapshots`

Then start the application:

```bash
npm run start
```

or restart it through PM2:

```bash
pm2 restart primewayz-uk
```

Verify the application and database using the checks in this runbook.

---

## 12. Rolling-deployment considerations

The Autopilot admin APIs require the corresponding database tables.

During a rolling deployment:

* old application code can continue operating after the additive migrations
* new application code may fail in Autopilot admin screens if started before the tables exist
* public blog and SDaaS routes should remain unaffected
* the Autopilot dashboard contains some graceful-degradation handling, but migration order must still be respected

Preferred deployment order:

```text
1. Backup
2. Deploy code and migration files
3. Check migration status
4. Run prisma migrate deploy
5. Run prisma generate
6. Run npm run build
7. Restart PM2
8. Verify logs and functionality
```

---

## 13. Rollback approach

### Application rollback

The application can be rolled back to an earlier code revision without dropping the Autopilot tables.

The new tables are additive and do not need to be removed merely because the application code is rolled back.

### Database rollback

Do not automatically drop Autopilot tables.

Database rollback requires:

* an explicit written plan
* a current verified backup
* confirmation of whether any Autopilot data must be preserved
* confirmation of whether activity logs or research evidence have been created
* review of foreign-key dependencies
* review of `_prisma_migrations`

Do not delete Autopilot activity history simply to reverse an application deployment.

Do not remove migration rows from `_prisma_migrations` without a reviewed recovery plan.

### Preferred rollback strategy

When the issue is limited to application behaviour:

1. Roll back the application code.
2. Leave Autopilot tables in place.
3. Disable access to the Autopilot admin feature if required.
4. Investigate and fix the application.
5. Redeploy through normal migration-aware procedures.

---

## 14. Commands that must not be used casually in production

Do not casually run:

```bash
npx prisma migrate reset
```

```bash
npx prisma db push
```

```bash
npx prisma db pull
```

Do not manually run:

```text
prisma/migrations/*/migration.sql
```

Do not execute destructive SQL such as:

```sql
DROP TABLE ...
TRUNCATE TABLE ...
DELETE FROM ...
```

without a reviewed plan and verified backup.

---

## 15. Final deployment checklist

Before deployment:

* [ ] Correct server and database confirmed
* [ ] Verified database backup completed
* [ ] Git revision recorded
* [ ] Existing migration history reviewed
* [ ] Autopilot tables checked
* [ ] Migration SQL reviewed
* [ ] No previous migration file modified after application
* [ ] `autoPublishEnabled` confirmed as false in code and migration

During deployment:

* [ ] Code and migration folders deployed
* [ ] `npx prisma migrate status` reviewed
* [ ] `npx prisma migrate deploy` completed
* [ ] `npx prisma generate` completed
* [ ] `npm run build` passed
* [ ] Correct PM2 process restarted

After deployment:

* [ ] `npx prisma migrate status` reports schema up to date
* [ ] Seven Autopilot tables verified
* [ ] Locked setting verified as JSON false
* [ ] PM2 logs checked
* [ ] Autopilot dashboard tested
* [ ] Keyword import preview tested
* [ ] Research snapshot workflow tested
* [ ] No CMS post created unintentionally
* [ ] No public content or route regression found
* [ ] Deployment outcome documented
