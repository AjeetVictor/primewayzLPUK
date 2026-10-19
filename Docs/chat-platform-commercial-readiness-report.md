# Primewayz Chat Platform — commercial readiness report

Branch: `feat/chat-platform-commercial-readiness`  
Base: `origin/main` at `cb80886`  
This report is for review. It is not a production deployment, and it is not a WCAG conformance claim.

## What landed

- One **Chat Platform** entry replaces the separate Chat Leads, Chat History, Tenant Management, and Chat Connect tabs. Inbox, history, team presence, tenants, sites, integrations, permissions, audit, and settings sit inside that workspace. Other admin modules stay where they were.
- **Primewayz Chat Platform** is the central product. **Primewayz Chat Connect** remains the installed add-on.
- Commercial tenant records, sites, exact-origin challenges, and installation links are database-backed. Existing catalog ids are reused. New tenants do not require a source-code union change.
- Lifecycle actions are activate, suspend, reactivate, archive, and restore to draft. Sensitive actions use the existing confirmation dialog. There is no delete control. Referenced tenants cannot be deleted.
- A suspended or archived commercial record closes chat even when the compile-time catalog is still active. A failed registry read denies chat. A missing table, before this migration, keeps the previous behavior.
- Database-onboarded tenants stay closed until the Host/Owner writes a central entitlement. Entitlement, account status, installation authorization, connector health, and presence stay separate.
- Origins stay pending until DNS TXT or the HTTPS well-known file matches the stored token hash. Cross-tenant and catalog origin collisions are rejected.
- The overview counts tenants, entitlements, authorization, and verified heartbeat health. Unknown health stays unreported. It is not treated as connected.
- Admin controls used by this workspace have hover, pressed, focus-visible, and disabled treatments. Navigation is a button list with a visible current page, keyboard focus, and 44px targets.

## Verification

- `npx tsc --noEmit` passed after the registry types were corrected.
- Platform regression passed: 381 tests, including WordPress integration, chat embed coverage in that set, entitlement, governance UX, and the new tenant and domain tests. `npm run test:wordpress-integration` (77) and `npm run test:chat-embed` (99) also passed. Widget release files 1.1.0 and 1.2.0 were not edited.
- `scripts/check-tenant-registry-migration.mjs` refuses any host other than localhost. On this machine `DATABASE_URL` points at `127.0.0.1:3336`, and that port refused the connection, so the SQL was not applied to a live server. The migration file and rollback order are covered by `src/lib/platform/tenantAccount.test.ts`. Re-run the script when the local MySQL on that port is up, still against the disposable database name in the script.

## Not claimed

- A screen-reader pass at 320, 375, 768, 1024, and 1440px was not completed in a browser session for this report. The layout uses the existing dashboard column, stacking cards under `xl`, and tables from `xl` up. That is an implementation target, not conformance.
- Voice, multimodal chat, AI agents, workflow automation, and marketplace billing are documented extension points only.

## Release gate

Do not run `prisma db push` or `prisma migrate reset` on production. Apply `20261019200000_platform_tenant_account` with `prisma migrate deploy` only after the disposable check succeeds and this branch is approved. Rolling the tables back re-opens catalog tenants that were suspended only by a commercial record.
