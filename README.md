# VibeEnglish

A self-hosted, full-stack English-learning web app: localized lessons with
browser TTS dictation, practice exercises, saved vocabulary, lesson ratings, and
streak/progress tracking, plus an admin dashboard for content and analytics.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript 5 · Prisma 6 ·
MariaDB 11 · Auth.js v5 (Credentials/JWT) · next-intl v4 (en/es/fr/vi) ·
Tailwind CSS v4.

## Prerequisites

- **Node.js 24** — managed via [nvm](https://github.com/nvm-sh/nvm). The repo
  pins the version in `.nvmrc`, so from the project root just run:

  ```bash
  nvm use        # reads .nvmrc → installs/activates Node 24
  ```

  The toolchain (`next`, `prisma`, `vitest`, `playwright`, and the helper
  scripts) uses modern JavaScript that crashes on older Node, so make sure
  `node --version` reports `v24.x` before running anything else.
- **npm 10+** (ships with Node 24).
- **Docker + Docker Compose** — for the MariaDB database.

## Database (MariaDB via Docker)

MariaDB 11 runs in Docker and is published on **host port 3307** (matching
`docker-compose.yml` and `DATABASE_URL`):

```bash
npm run db:up          # docker compose up -d mariadb (host port 3307)
npm run db:migrate:dev # apply Prisma migrations to the dev database
npm run db:seed        # seed lessons, exercises, and the admin user
npm run db:down        # stop and remove the container when you're done
```

## Environment variables

Copy the example file and fill in real values — never commit `.env`:

```bash
cp .env.example .env
```

The required variables (see `.env.example` for the exact format and a command to
generate `AUTH_SECRET`):

| Variable          | Purpose                                                            |
| ----------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`    | MariaDB connection string (`mysql://…@localhost:3307/vibeenglish`) |
| `AUTH_SECRET`     | Auth.js session/JWT signing secret                                 |
| `AUTH_TRUST_HOST` | `true` — trust the local host header in dev                        |
| `NEXTAUTH_URL`    | Base URL of the app (`http://localhost:1998`)                      |

Do not paste secret values into docs or commits — only `.env.example` is
tracked.

## Commands

```bash
npm run dev        # development server on http://localhost:1998
npm run typecheck  # tsc --noEmit (strict)
npm test           # Vitest unit tests (pure domain logic; relative imports)
npm run build      # production build
npm run start      # production server on http://localhost:1998
npm run e2e        # Playwright E2E suite (Chromium) against the production server
npm run lint       # ESLint
```

The Playwright suite targets a **production** server on port `1998`. Build and
start the app (`npm run build` then `npm run start`) before running `npm run
e2e`. A stale `next-server` left running on `:1998` is the most common cause of
false E2E failures — stop it before re-running.

## Avatars and persistence

Runtime-uploaded avatars are written to **local disk** at
`public/avatars/<userId>.jpg` and served at request time through the
`/api/avatars/<userId>` route — not as static `public/` assets. This is
deliberate: `next start` does not reliably serve files written to `public/`
after the build, so a dedicated streaming route reads the file from disk on each
request (see `src/lib/avatar-server.ts`).

**Known limitation:** avatars live on local disk only. They are not stored in
the database or object storage, so they will not survive container/host
replacement and are not shared across multiple instances. Migrating avatar
storage to object storage is deferred (INFRA-01).

Runtime avatar serving is verified by `tests/e2e/avatar-api.spec.ts` (404/400
behavior on `/api/avatars/<id>`) and `tests/e2e/profile-avatar.spec.ts` (a real
uploaded avatar streams `200 image/jpeg` under `next start`).

## Internationalization

UI strings live in four catalogs: `messages/{en,es,fr,vi}.json`. Any new
translatable string must be added to **all four**. `tests/unit/i18n-parity.test.ts`
fails if the locale key sets diverge from `en`, so run `npm test` after editing
translations.
