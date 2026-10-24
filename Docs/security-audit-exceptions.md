# Security Audit Exceptions

Last reviewed: 24 October 2026 (PW-CHAT-CENTRAL-SECURITY-01)

## Scope

Compatible dependency remediation only. Do not run `npm audit fix --force`.
Preserve Prisma 6.x / database compatibility, Nodemailer transport and
`disableFileAccess` / `disableUrlAccess` behaviour, and chat widget artifacts
1.3.1–1.3.3 byte-for-byte.

## Applied compatible fixes (this release)

- Critical `proxy-addr` 2.0.7 → 2.0.8 (via Express transitive update).
- Express / `body-parser` / `qs` / related runtime parser chain.
- `mysql2` within `^3.20.0` (3.20.0 → 3.24.6).
- `vite` within `^6.2.0` (6.4.3 → 6.4.5).
- `react-router` / `react-router-dom` 7.18.1 → 7.18.4 (RSC advisory patch;
  no downgrade; app does not use React Router RSC mode).
- Build/tooling transitive: `browserslist`, `baseline-browser-mapping`,
  `js-yaml`, `nanoid`, `source-map-js`, `ip-address`.
- Exact pin `nodemailer` 9.0.3 → 9.1.1 (same major; email security flags kept).
- Exact pin `sharp` 0.35.1 → 0.35.5 (same minor line; image pipeline only).

## Remaining: Prisma `deepmerge-ts` chain (high)

Advisory: GHSA-ggr8-5vv4-36mx (`deepmerge-ts` < 8.0.0)

Installed:

- `prisma` / `@prisma/client` 6.19.3
- nested `@prisma/config` → vulnerable `deepmerge-ts`

npm proposes Prisma **7.10.1** (semver major). That would change Prisma config,
client generation, and risk database/migration compatibility.

Decision:

- Do not upgrade Prisma to 7.x in this PR.
- Do not override `deepmerge-ts` to 8.x without a dedicated Prisma compatibility
  review (config merge API may differ).
- Mitigation: Prisma CLI/config is a trusted local/admin toolchain path, not a
  public request parser. Revisit when an official Prisma 6.x patch lands or when
  a planned Prisma 7 migration is reviewed.

## Remaining: Nodemailer 9.x residual advisories (high)

Installed: `nodemailer` 9.1.1 (latest 9.x).

Several addressparser / DNS-cache / DKIM advisories remain. npm proposes
`nodemailer@10.2.1` (semver major).

Decision:

- Do not jump to Nodemailer 10.x without a dedicated email regression review.
- Keep `disableFileAccess: true` and `disableUrlAccess: true` on `sendMail`.
- Application sends generated text/HTML only to configured SMTP recipients;
  untrusted free-form address lists are not accepted from public chat clients.
- Track Nodemailer 10.x as a follow-up breaking upgrade.

## Remaining: happy-dom major (high)

Advisory: GHSA-834v-8h66-3h79

Installed: `happy-dom` 20.14.5 (devDependency). Vulnerable range includes
through 21.0.3; fix is `happy-dom@21.0.4` (semver major).

Decision:

- Do not apply unreviewed happy-dom 21.x in this PR.
- Mitigation: test-only dependency; not shipped in production runtime.
- Follow-up: upgrade happy-dom to ≥ 21.0.4 and re-run the full test suite.

## Google APIs nested dependency override

googleapis-common previously resolved a vulnerable gaxios chain. Root
`package.json` retains:

googleapis-common → gaxios 7.3.0

## Explicit non-actions

- Do not run `npm audit fix --force`.
- Do not modify production, PM2, shared-server services, or run Prisma migrations.
- Do not alter chat Connect / embed release ZIPs for 1.3.1–1.3.3.
