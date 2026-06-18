# Primewayz UK Landing + Admin

React + Vite frontend and Node (Express-style) API server in one project, using Prisma with MySQL.

## Tech stack

- Frontend: React 19, TypeScript, Vite, React Router, Tailwind CSS
- Backend: Node + Express-style routes in `server.ts`
- ORM/DB: Prisma + MySQL
- Auth: JWT cookie auth for admin panel

## 1) Local setup

1. Install dependencies:
   `npm install`
2. Create env file:
   `copy .env.example .env`
3. Update `.env` with your DB credentials and JWT secrets.
4. Generate Prisma client:
   `npm run prisma:generate`
5. Push schema to DB:
   `npm run prisma:push`
6. Start app:
   `npm run dev`

App URL: `http://localhost:3000/`

## 2) Build and production run

1. Build client + SSR bundles:
   `npm run build`
2. Start API + SSR/static server:
   `npm run start`

Build output:
- `dist/client`: browser assets from `vite build --outDir dist/client`
- `dist/server`: SSR renderer bundle from `vite build --ssr src/entry-server.tsx --outDir dist/server`

## 3) Important environment variables

- `DATABASE_URL`: MySQL connection URL (DB: `primewayz-lpageuk`)
- `APP_BASE_PATH`: router/static base path (default `/`)
- `VITE_APP_BASE_PATH`: Vite router base path (default `/`)
- `COOKIE_SECURE`: `true` in HTTPS production, `false` locally
- `ADMIN_EMAIL` + `ADMIN_PASSWORD`: auto-seeded admin on first run
- `CHAT_API_KEY`: API key for server-side chat provider
- `CHAT_API_BASE`: OpenAI-compatible API base URL (default `https://api.openai.com/v1`)
- `CHAT_MODEL`: chat model id (default `gpt-4o-mini`)

### Build lock (root hosting)

This project is intentionally locked to root-hosted subdomain deployment.

- Required values: `APP_BASE_PATH=/` and `VITE_APP_BASE_PATH=/`
- `vite.config.ts` must keep `base: '/'`
- `npm run build` runs a prebuild guard (`scripts/validate-base-path.mjs`) and fails if these drift

Additional SEO variables used by SSR:
- `SITE_URL`: canonical origin used by SSR metadata, schema, and production links

## 4) Apache deployment

See `Docs/apache-config.md` for SPA rewrite + reverse proxy configuration.

Production URLs:
- Landing page: `https://uk.primewayz.com/`
- Admin panel: `https://uk.primewayz.com/admin`

## 4.1) SSR and SEO architecture (handover guide)

This project now runs on a **Vite SSR foundation** with server-rendered HTML for public pages, then hydrates on the client. It is SEO-friendly because bots receive meaningful HTML + metadata directly from the server response.

### Core SSR files

- `server.ts`
  - Runs Express API + SSR HTML handling in one process.
  - In development: starts Vite middleware server and transforms `index.html` on each request.
  - In production: serves `dist/client` static assets and imports `dist/server/entry-server.js` for rendering.
- `src/entry-server.tsx`
  - Exposes `render(url, basePath)` for server-side `renderToString(...)` with `MemoryRouter`.
- `src/entry-client.tsx`
  - Uses `hydrateRoot(...)` with `BrowserRouter` to attach React to pre-rendered HTML.
- `index.html`
  - SSR injection point is `<!--app-html-->` inside `<div id="root">...</div>`.
  - Client boot script is `/src/entry-client.tsx` (rewritten to built client asset in production).

### End-to-end request lifecycle (public pages)

1. Browser/crawler hits a non-API route (for example `/`, `/blog/...`).
2. `server.ts` catch-all route builds per-request SEO payload:
   - title/description/canonical
   - Open Graph + Twitter tags
   - JSON-LD structured data
3. HTML template is loaded:
   - Dev: Vite `transformIndexHtml(...)`
   - Prod: prebuilt `dist/client/index.html`
4. SSR render step:
   - For non-admin pages, server calls `ssrRender(appPathname, APP_BASE_PATH)` from `entry-server`.
   - `entry-server` renders `<App />` to string with `MemoryRouter`.
5. Server injects rendered markup into `<!--app-html-->`.
6. Server injects SEO tags into `<head>` (replacing old dynamic tags safely).
7. Final HTML is returned to client/bot with complete metadata and meaningful content.
8. On browser load, `entry-client.tsx` hydrates existing HTML (`hydrateRoot`) so app becomes fully interactive.

### Route behavior and SEO rules

- API endpoints stay under `/api/*` and bypass SSR.
- `/admin` routes are intentionally **not SSR-rendered** and use `robots: noindex,nofollow`.
- Public routes use `robots: index,follow`.
- Blog detail routes (`/blog/:id`) produce article-specific SEO metadata and Article JSON-LD.
- If SSR render fails for a page, server logs the issue and falls back to SEO-safe HTML response.
- The server blocks file-like unknown URLs (for example `/server.ts`, `/.env`) with `404` + `X-Robots-Tag: noindex, nofollow`.

### Development flow (SSR mode)

Run:
- `npm run dev`

What happens:
- `tsx server.ts` starts Express.
- Express starts Vite in middleware mode.
- Every page request is SSR-aware and rendered via dynamic template transform.
- APIs, auth, Prisma, and SSR all run in the same node process.

### Production flow (SSR mode)

Build:
- `npm run build`

Start:
- `npm run start`

What happens:
- Node runs `server.ts` with `NODE_ENV=production`.
- Server loads `dist/client/index.html` once.
- Server imports `dist/server/entry-server.js` once.
- Static assets are served from `dist/client`.
- HTML responses are rendered server-side per request (for supported routes), then hydrated in browser.

### Root base-path constraint (important)

Production is locked to root hosting:
- `APP_BASE_PATH=/`
- `VITE_APP_BASE_PATH=/`
- `vite.config.ts` `base: '/'`

Do not change this unless explicitly requested. If changed incorrectly, SSR paths/canonical URLs/hydration can break.

### Quick verification checklist for handover

After any SSR/SEO change, verify:
- `npm run build` passes.
- `npm run start` serves SSR HTML for `/` and `/blog/:id`.
- View page source contains populated `<title>`, `<meta name="description">`, canonical, OG/Twitter tags, and JSON-LD.
- Browser console has no hydration mismatch warnings on key pages.
- `/admin` returns noindex metadata.
- API routes still return JSON as expected.
- Bing Webmaster Tools verification:
  - `curl -i http://localhost:3000/BingSiteAuth.xml` returns `200` with `Content-Type: application/xml` and XML body only (no React HTML).
  - `curl -s http://localhost:3000/ | grep msvalidate.01` shows `<meta name="msvalidate.01" content="503A5E857E52D99A468198CE6BD47F45" />`.
  - `npm run validate:bing` (server must be running).

### IndexNow URL Submission

- Key URL: `https://uk.primewayz.com/b477408d1a358457fb3b6d0b8e032ee3.txt`
- Local validation (server must be running): `npm run validate:indexnow-key`
- Production validation: `curl -s https://uk.primewayz.com/b477408d1a358457fb3b6d0b8e032ee3.txt`
- Submit after deploy (only when key file is publicly reachable): `npm run submit:indexnow`
- Note: only submit URLs when pages are added, updated, or removed. Do not spam unchanged URLs repeatedly.
- Bing verification remains separate: `npm run validate:bing`

## 4.2) Chat architecture and logs

- Live chat calls backend endpoint `POST /api/chat/respond` (no client-side AI key).
- Backend stores both user and bot messages in MySQL via Prisma.
- Runtime log prefixes:
  - `[backend]` for API/server events
  - `[db]` for database target and Prisma warnings/errors

## 5) Generate DATABASE_URL helper

Use `scripts/make-db-url.sh` to safely build a MySQL `DATABASE_URL` with password URL-encoding.
The script uses Node.js for encoding, so no Python dependency is required.

1. Make it executable:
   `chmod +x scripts/make-db-url.sh`
2. Run with your connection values:
   `DB_USER=... DB_HOST=... DB_PORT=... DB_NAME=... DB_PASS=... ./scripts/make-db-url.sh`

### Direct remote MySQL example

```bash
DB_USER=app_user \
DB_HOST=db.example.com \
DB_PORT=3306 \
DB_NAME=primewayz-lpageuk \
PROMPT_PASSWORD=true \
./scripts/make-db-url.sh
```

### SSH tunnel/local-forward example

```bash
DB_USER=app_user \
DB_HOST=127.0.0.1 \
DB_PORT=3307 \
DB_NAME=primewayz-lpageuk \
PROMPT_PASSWORD=true \
./scripts/make-db-url.sh
```

### Write/update `.env` entries

- Only update `DATABASE_URL`:
  ```bash
  WRITE_ENV=true PROMPT_PASSWORD=true ./scripts/make-db-url.sh
  ```
- Update `DATABASE_URL` plus `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`:
  ```bash
  WRITE_FULL_ENV=true PROMPT_PASSWORD=true ./scripts/make-db-url.sh
  ```
