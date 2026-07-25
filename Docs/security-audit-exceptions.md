# Security Audit Exceptions

Last reviewed: 25 July 2026

## React Router RSC advisory

Advisory: GHSA-qwww-vcr4-c8h2

Installed versions:

- react-router: 7.18.1
- react-router-dom: 7.18.1

npm currently reports this advisory against the installed React Router
version and proposes a forced downgrade to react-router-dom 7.11.0.

The application was searched for the following React Server Component APIs:

- unstable_RSC
- react-server-dom
- RSCRouterConfig
- routeRSCServerRequest
- createCallServer
- createFromFetch

No usage was found. Primewayz UK currently uses conventional React Router
routing and custom Express SSR, not React Router RSC mode.

Decision:

- Do not run npm audit fix --force.
- Do not apply the proposed React Router downgrade.
- Retain React Router 7.18.1.
- Review again when an appropriate upstream release or advisory update becomes available.

## Google APIs nested dependency override

googleapis-common 8.0.3 previously resolved gaxios 7.1.3, which introduced
the vulnerable rimraf, glob, minimatch and brace-expansion chain.

The root package.json now overrides:

googleapis-common -> gaxios 7.3.0

The application test suite, Google integration behaviour and production
build must pass before this override is released.