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

1. Build frontend:
   `npm run build`
2. Start API + static server:
   `npm run start`

## 3) Important environment variables

- `DATABASE_URL`: MySQL connection URL (DB: `primewayz_lpage_uk`)
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

## 4) Apache deployment

See `Docs/apache-config.md` for SPA rewrite + reverse proxy configuration.

Production URLs:
- Landing page: `https://primewayz-uk.primewayz.com/`
- Admin panel: `https://primewayz-uk.primewayz.com/admin`

## 4.1) Chat architecture and logs

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
