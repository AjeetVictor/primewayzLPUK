# Phase 1B controlled multi-tenant integration

## Git preservation evidence

- Verified production baseline and original main HEAD: 190f7d28bf3ea5362ac47c76581e06cd7e78bca4.
- Admin-access branch: codex/phase1a-admin-access.
- Admin-access checkpoint: bf228fc1faafe514daee7277f1c35e7f4ebdaea7.
- Silver feature branch: feat/rrb-silver-campaign-tenant.
- Silver feature commit: c00b1d4c992f0ba5862be92aadb75b27a5b79fa5.
- Silver branch tip/release commit: 5e5b18351d4cdbecb34aa31470468e5c7ad80aeb.
- Integration branch: codex/phase1b-multitenant-integration.
- The integration is a non-fast-forward merge preserving both feature histories.
- The original uncommitted Phase 1/1A tree was inventoried, verified, committed without environment/generated files, and carried intact. No destructive cleanup or forced checkout was used.

## Integrated scope

The integration combines explicit Host/Owner access, per-user tenant grants, transactional access audit, serializable last-Host protection, first-Host bootstrap, and the separate RentReadBuy Silver chat/widget implementation.

Silver identity remains:

- Tenant ID: rrb-silver-campaign
- Public widget site key: rentreadbuy-silver
- Brand: RentReadBuy
- Market: India
- Timezone: Asia/Kolkata

Silver is never aliased to rrb, pw-infotech, or any Primewayz tenant.

## Silver activation control

The registry supports a reusable optional activationEnv field. isTenantActive is the single fail-closed evaluator used by public source resolution, public CORS, capability-origin enumeration, admin grant validation, tenant filters, and WordPress tenant availability.

Silver uses RRB_SILVER_CAMPAIGN_ENABLED:

- Missing, empty, false, 1, yes, enabled, and invalid values are disabled.
- Only case-insensitive, whitespace-trimmed true enables the tenant.
- RRB_SILVER_CAMPAIGN_ALLOWED_ORIGINS remains empty by default.
- Enabling without an approved exact origin still exposes no public route.
- Configuring an origin while disabled does not enable CORS, public identity resolution, session creation, or grants.
- Disabled Silver is absent from active operational selectors.
- There are no automatic operator grants.
- RRB_SILVER_CAMPAIGN_NOTIFICATION_EMAIL is optional and never falls back to rrb or Primewayz recipients.
- No campaign production domain has been invented or activated.

Browser-bundled static selector data deliberately excludes activation-controlled tenants. A future server-supplied active-tenant list is recommended before live Silver operator onboarding.

## Backward compatibility

Automated regression coverage confirms pw-uk, pw-infotech, and rrb retain their registered origins and identities, public chat isolation, existing offline acknowledgements, session ownership, notification routing, presence behavior, and WordPress integration. Legacy null-tenant records are unchanged and remain UK-conservative.

## Merge conflict resolution

One textual conflict occurred in package.json. It was resolved by retaining both sets of platform tests:

- Host/Owner and tenant-grant security tests.
- Silver tenant and immutable chat-embed release tests.

server.ts merged automatically. It retains the Host/Owner authorization paths and adds tenant-specific bot replies, approved Silver intent responses, and the immutable embed release endpoint. Security checks were not weakened.

## Database and migration readiness

Silver requires no new schema migration; its tenant ID fits existing VARCHAR(32) tenant ownership columns. The integration depends on additive migration 20261009190000_admin_tenant_access from the admin branch.

Do not use prisma db push in production. Rehearse the migration, bootstrap, grants, backups, rollback, and audit retention against an isolated MySQL instance first.

## Local validation

Outputs are captured under tmp/phase1b-*.log.

| Check | Exit | Result |
|---|---:|---|
| Prisma validate | 0 | schema valid |
| Prisma generate | 0 | client 6.19.3 generated |
| TypeScript | 0 | passed |
| Focused Host/Silver/isolation batch | 0 | 58 passed, 0 failed |
| WordPress integration | 0 | 75 passed, 0 failed |
| Platform suite | 0 | 318 passed, 0 failed |
| Complete suite | 0 | 1,398 passed, 0 failed; 20 suites |
| Client production build | 0 | 2,864 modules; existing large-chunk warning |
| SSR production build | 0 | 299 modules |

## Unresolved administration policy

No policy was silently expanded or restricted. Approval is still required for:

1. Blog post and comment administration, currently Host-only.
2. Pricing-backlog administration.
3. Autopilot administration.
4. Tenant-specific content publishing and management.
5. Host delegation of tenant capabilities and permissions.

Recommended future model: explicit capability grants scoped by tenant, with Host-only assignment, expiry/revocation support, and transactional audit. This is not implemented in Phase 1B.

## Staging-equivalent environment requirements

Create an isolated environment with:

- a production-compatible MySQL version and case/settings profile;
- no production credentials, domains, users, or notification recipients;
- a restorable pre-migration backup;
- migration deployment and rollback rehearsal;
- first-Host dry-run and approved execution rehearsal;
- explicit reviewed existing-user grant provisioning;
- real two-connection Host demotion/deletion concurrency tests;
- database-backed audit rollback fault injection;
- backup restore and audit-evidence retention verification;
- WordPress read/write integration regression using staging credentials;
- Silver activation tests for disabled, enabled-without-origin, and enabled-with-approved-preview-origin states;
- application rollback before any evidence-preserving schema recovery.

## Rollout blockers

- No staging-equivalent environment currently exists.
- Existing operational account grants and first Host are not approved.
- Database-backed concurrency and rollback tests have not run.
- Blog/content administration policy remains unresolved.
- No Silver production origin or notification recipient is approved.
- Silver must remain disabled until all activation prerequisites are reviewed.

Production migration, Host provisioning, Silver activation, push, main merge, and deployment are not authorised.