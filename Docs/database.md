# Database Guide (`primewayz_lpage_uk`)

This project uses Prisma with MySQL. The database name on remote host is:

- `primewayz_lpage_uk`

## Prisma source of truth

- Prisma schema: `prisma/schema.prisma`
- Apply schema to DB: `npm run prisma:push`
- Regenerate Prisma client: `npm run prisma:generate`

## Core tables from current schema

- `User`: admin/editor/viewer credentials and role
- `FormResponse`: contact submissions
- `ChatSession`: visitor chat sessions
- `ChatMessage`: chat message stream (supports reply chains)
- `BlogPostComment`: public comments on blog posts

## Recommended DATABASE_URL format

```env
DATABASE_URL="mysql://DB_USER:DB_PASSWORD@DB_HOST:3306/primewayz_lpage_uk"
```

## First-time setup flow

1. Create DB on remote host (`primewayz_lpage_uk`)
2. Update `.env` with remote DB credentials
3. Run:
   - `npm run prisma:generate`
   - `npm run prisma:push`
4. Start app (`npm run dev` or `npm run start`)

## Migration workflow (recommended)

Use this when you want proper Prisma migration history for MySQL:

1. Set `DATABASE_URL` to MySQL in `.env`
2. Generate migration files:
   - `npm run prisma:migrate:dev -- --name init_mysql`
3. Deploy migrations on server:
   - `npm run prisma:migrate:deploy`
4. Check migration status:
   - `npm run prisma:status`

If the remote DB is new/empty, `prisma db push` is also acceptable for quick setup.

## Inputs required before executing commands

- `DB_HOST` (remote MySQL hostname)
- `DB_PORT` (usually `3306`)
- `DB_USER`
- `DB_PASSWORD`
- DB name (`primewayz_lpage_uk`)

### Where to get these values

- From MySQL Workbench connection profile:
  - Open saved connection -> read host, port, username
- From hosting panel / VPS env / DBA:
  - Database password and database name
- From direct SQL check after connecting:
  - `SELECT DATABASE();` should return `primewayz_lpage_uk`
