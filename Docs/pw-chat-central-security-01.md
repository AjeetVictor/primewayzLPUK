# PW-CHAT-CENTRAL-SECURITY-01

## Baseline

- Branch base: `origin/main` @ `f8c8a09` (includes merged PRs #13 and #14).
- Worktree: clean; no production or shared-server changes.
- Policy: no `npm audit fix --force`; no unreviewed major upgrades.

## Before (`npm audit` on clean main install)

| Severity | Count |
| --- | ---: |
| critical | 1 |
| high | 15 |
| moderate | 4 |
| **total** | **20** |

Notable: critical `proxy-addr` (IP spoofing via IPv4-mapped IPv6 trust subnet);
high runtime items included Express parser chain, `mysql2`, `vite`,
`react-router`, and pinned `nodemailer` / `sharp`.

(Note: advisory inventory at remediation time reported 20 packages, not the
earlier “17” figure — counts move with the npm advisory database.)

## After (compatible fixes only)

| Severity | Count |
| --- | ---: |
| critical | 0 |
| high | 5 |
| moderate | 0 |
| **total** | **5** |

Critical `proxy-addr` and all non-breaking audit-fixable issues cleared.
Remaining five highs all require semver-major upgrades (documented in
`Docs/security-audit-exceptions.md`):

1. `deepmerge-ts` / `@prisma/config` / `prisma` → Prisma 7.x
2. `happy-dom` → 21.0.4+
3. `nodemailer` residual advisories → Nodemailer 10.x

## Compatible changes applied

- `npm audit fix` (no `--force`) for Express/`proxy-addr`/`qs`/`body-parser`,
  `mysql2`, `vite`, `react-router(-dom)`, browserslist chain, etc.
- Pin bumps: `nodemailer` 9.0.3 → 9.1.1; `sharp` 0.35.1 → 0.35.5.

## Preservation checks

- Prisma remains **6.19.3** (client + CLI); no migrations executed.
- Nodemailer `sendMail` keeps `disableFileAccess` / `disableUrlAccess`.
- Chat Connect release ZIPs 1.3.1 / 1.3.2 / 1.3.3 unchanged (`git status`
  clean under `releases/`; SHA-256):
  - `primewayz-chat-connect-1.3.1.zip` `0DDF6231AE977B023FC373A3FE2883F864225CE61EF8D5A83004AE95697E3974`
  - `primewayz-chat-connect-1.3.2.zip` `DEF6797E679A2F1F7075307F1A1C154D79C774D2CDA92D055CE77C2E74AD6BBC`
  - `primewayz-chat-connect-v1.3.3.zip` / `primewayz-chat-connect-1.3.3.zip` `0E951E60A58BE987BC3EB8A18427603536C1A4A097A88F77F03C3EB4A5D13C35`
- Primewayz Infotech and Silver tenant integration code paths not modified.

## Verification (this worktree)

| Gate | Result |
| --- | --- |
| `npx prisma generate` (6.19.3) | pass |
| `npm run typecheck` / `lint` | pass (after production build artifacts present) |
| `npm run test:audit` | 6/6 pass |
| `npm run test:platform` | 425/425 pass |
| `npm test` | 1519/1519 pass |
| `npm run test:chat-embed` | pass |
| `npm run build` | pass (Vite 6.4.5 client + SSR) |
| `npm audit` | 5 high remaining (documented exceptions) |

## Release risks

- Remaining Nodemailer 9.x advisories: addressparser DoS / edge parsing —
  mitigated by controlled recipients and file/URL access disabled; full clear
  needs Nodemailer 10 review.
- Prisma CLI nested `deepmerge-ts`: trusted toolchain only until Prisma 7 plan.
- `happy-dom` 20.x: test-only; not in production bundles.
- `mysql2` / Express / Vite patch bumps: low behaviour risk; covered by full
  test + production build gate before merge.
- Do not merge/deploy automatically; human review required. No production changes
  in this ticket.
