# PW-CHAT-PRODUCTION-BASELINE-01

Canonical Primewayz UK production-ready **source** baseline. Integration only — no merge to `main`, no deploy, no production DB changes, no PM2 restart, no closing of legacy PRs from this document.

## Integration commit

| Item | Value |
| --- | --- |
| Branch | `integrate/pw-chat-production-baseline-01` |
| Base | `origin/main` @ `5e5d926` (includes Silver central PR **#13**) |
| Integrated tip | `origin/fix/pw-chat-presence-03-expanded-header-status` (PR **#11**, inherits **#8** / **#10** / merged **#12**) |
| Merge commit | `d179540` — ort auto-merge; `server.ts` + WordPress integration tests combined without discarding Silver |

## What this baseline contains

| Area | Status on baseline |
| --- | --- |
| Silver ops registry (`rrb-silver-campaign-next`), `RRB_SILVER_CHAT_INTEGRATION_TOKEN`, provider-neutral `/api/integrations/chat-ops` alias | Preserved from main / PR #13 (integration source files byte-identical to main) |
| Tenant authorization / Host–Owner / activation gate | Preserved; Silver remains fail-closed unless `RRB_SILVER_CAMPAIGN_ENABLED=true` |
| GA4 / GTM embed analytics (1.3.1+) | Included from PR #8 / #6 lineage |
| `chatRole` + `chatRoleExplicit` migration + presence authz | Included (`20261020180000_tenant_chat_role_presence_authz`) |
| Tenant-scoped admin presence + logout sync | Included |
| Immutable widgets **1.3.1**, **1.3.2**, **1.3.3** | Included; SHA-256 for 1.3.3 = `88b15f117c3f9896e1c72ffe090bdaf46c7d9dc5883f38cf6232540910540f92` |
| Recovered WordPress Chat Connect **v1.3.3** ZIP + packaging / verify scripts | Included (forward-slash paths, canonical `primewayz-integration/` identity) |

## Three-way differences

### A. Current production (ops reality)

- **UK Node app (`uk.primewayz.com`)** tracks the mainline commercial chat platform (through PR **#5** / widget **1.3.0** era on git `main` before this PR). Exact live deploy SHA is an ops check (`pm2` / release checkout) and was **not** modified here.
- **Silver central ops binding (PR #13)** is on `main` but only live after an approved deploy of that commit (or later).
- **Infotech WordPress** Chat Connect may already use a recovered **1.3.3** package from ops; folder identity must remain `primewayz-integration/`. This baseline makes that package and its verifier first-class in git.
- **Not yet on production git main:** per-tenant `chatRole`, widgets 1.3.1–1.3.3 on the UK host, GA4 embed path from this stack, presence colour unification, recovered ZIP scripts.

### B. Current `main` (`5e5d926`)

- Has Silver campaign Chat Connect ops registry + provider-neutral alias (PR **#13**).
- Embed version stays **1.3.0**; no `embed-releases/chat/1.3.1|1.3.2|1.3.3`.
- No `UserTenantGrant.chatRole` columns / migration.
- No recovered `releases/primewayz-chat-connect-v1.3.3.zip` packaging pipeline from PR **#12**.
- Open legacy stack PRs **#8**, **#10**, **#11** (and closed **#12** into #11) remain unmerged into main.

### C. Proposed integrated baseline (this branch)

- **Union** of B + full PR **#11** lineage (**#8** admin presence/GA4, **#10** widget 1.3.2, **#11** widget 1.3.3, **#12** Linux ZIP recovery).
- Silver files from main were **not** overwritten; only additive presence/`teamStatus` assertion adjustment in WordPress integration tests.
- Ready for review as the single source tip before any production migrate/deploy.

## Widget byte-identity (required)

| Version | SHA-256 | Matches PR #11 tip blob |
| --- | --- | --- |
| 1.3.1 | `e6388bc2478f7f2e36800957f00bece185a4a9a0d33ff667c94bbd85f7184f7f` | yes |
| 1.3.2 | `b5adf088eb82f7190d0b0e765279c487bcb8f5a2136f03f651893b6a2579e242` | yes |
| 1.3.3 | `88b15f117c3f9896e1c72ffe090bdaf46c7d9dc5883f38cf6232540910540f92` | yes |

Canonical WP package: `releases/primewayz-chat-connect-v1.3.3.zip` (sha256 `0e951e60a58be987bc3eb8a18427603536c1a4a097a88f77f03c3eb4a5d13c35`), identical to `releases/primewayz-chat-connect-1.3.3.zip`. Verifier: `node scripts/verify-chat-connect-zip.mjs releases/primewayz-chat-connect-v1.3.3.zip`.

## Compatibility with subsequent Chat Connect **1.3.4** (Live-preservation)

1.3.4 (branch work `fix/pw-chat-connect-default-01`, not merged into this baseline) changes **plugin activation / `chat_mode` defaults only**.

| Check | Result |
| --- | --- |
| 1.3.4 bundled `assets/chat/pw-chat.js` vs baseline hosted 1.3.3 | **Byte-identical** (`88b15f11…`) |
| Plugin identity | Still `primewayz-integration` / `pwi_settings` |
| Heartbeat | `addonVersion=1.3.4`, `widgetVersion=1.3.3` |
| Visitor-mode regression suite | 11/11 pass against the 1.3.4 sibling artifacts |

**Ship order:** deploy this UK baseline (embed 1.3.3 + optional WP 1.3.3) first; apply WP **1.3.4** afterward as an in-place upgrade that must not demote Live tenants. Do not rewrite immutable 1.3.1–1.3.3 embed artifacts.

## Database migration review

| Migration | Risk |
| --- | --- |
| `20261020180000_tenant_chat_role_presence_authz` | **Additive only**: two columns on `UserTenantGrant` (`chatRole` default `none`, `chatRoleExplicit` default `false`) + index. No chat session/message/presence writes. No seed of `agent`. |
| App compatibility | Legacy operations roles keep effective agent until Host sets `chatRoleExplicit` (see `Docs/chat-admin-tenant-presence-phase1.md`, `Docs/tenant-chat-role-migration-rehearsal.md`). |
| Production | **Do not** `migrate deploy` from this PR without operator approval and backup. Rehearse on disposable schema first. |

Rollback sketch (only after approved reverse deploy of app code that no longer reads the columns):

1. `ALTER TABLE UserTenantGrant DROP INDEX UserTenantGrant_tenantId_chatRole_idx;`
2. `ALTER TABLE UserTenantGrant DROP COLUMN chatRoleExplicit, DROP COLUMN chatRole;`

## Verification evidence (this worktree)

| Check | Result |
| --- | --- |
| Prisma schema validate (dummy `DATABASE_URL`) | pass |
| `prisma generate` | pass |
| `npm run typecheck` / `lint` | pass (requires `dist/server/entry-server.js` present; satisfied after `npm run build`) |
| `npm run test:platform` | **425** pass / 0 fail |
| `npm run test:chat-embed` | **117** pass / 0 fail |
| `node --test scripts/verify-chat-connect-zip.test.mjs` | pass |
| `npm run build` (client + SSR) | pass |
| `npm audit --omit=dev` | **17** advisories (4 moderate, 12 high, 1 critical) — **same lockfile as main**; not introduced by this integration. Nodemailer / proxy-addr / qs / react-router / vite / source-map-js. Track separately; do not `audit fix --force` in this PR. |
| Sibling 1.3.4 visitor-mode tests | **11** pass / 0 fail |

Full `npm test` run may be attached in the PR checks; platform + embed cover the chat/Silver/WordPress surface for this baseline.

## Deployment / rollback (operator — not executed here)

### Deploy (after PR merge approval)

1. Backup production MySQL; record `prisma migrate status` and current git SHA / PM2 process.
2. Deploy this commit to the UK app host; `npx prisma migrate deploy` **only** for `20261020180000_tenant_chat_role_presence_authz` after rehearsal.
3. Publish hosted embed **1.3.3** (immutable file under `embed-releases/chat/1.3.3/`); leave 1.3.0–1.3.2 artifacts in place.
4. Optional: upload `releases/primewayz-chat-connect-v1.3.3.zip` to Infotech WordPress as in-place upgrade of `primewayz-integration` (see `Docs/pw-chat-recovery-01.md`).
5. Smoke: UK visitor chat, Infotech launcher, admin presence colours, Silver still disabled unless explicitly gated on.
6. Later: WP **1.3.4** Live-preservation upgrade without touching widget bytes.

### Rollback

1. Revert app process to previous git SHA / PM2 dump; do **not** leave new app code talking to a partially migrated schema without a plan.
2. Column drop only if the rolled-back code no longer depends on `chatRole*` and ops approve DDL.
3. WordPress: restore previous `primewayz-integration` folder backup; do not install a second plugin slug.
4. Embed: keep serving prior immutable version path if CDN/app pin requires it; never rewrite historical `embed-releases/chat/1.3.x` blobs.

## Explicit non-actions

- No merge of this PR without separate operator approval.
- No production database migrate/deploy from this session.
- No PM2 restart / Apache / WordPress live install from this session.
- Legacy open PRs **#8**, **#10**, **#11** left open for history; this PR supersedes them as the integration vehicle.
