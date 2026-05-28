# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server on port 1998
npm run build        # Production build
npm run start        # Production server on port 1998
npm run lint         # ESLint check
npm run typecheck    # tsc --noEmit (strict TypeScript)

# Testing
npm test                        # Vitest unit tests (tests/unit/**/*.test.ts)
npx vitest run tests/unit/streak.test.ts   # Run a single unit test file

npm run e2e                     # Playwright E2E (requires `npm run start` first)
npx playwright test tests/e2e/auth.spec.ts # Run a single E2E spec

# Database
npm run db:up        # Start MariaDB via docker compose (port 3307)
npm run db:down      # Stop MariaDB
npm run db:migrate   # Apply Prisma migrations (production)
npm run db:migrate:dev  # Dev migration (interactive)
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:seed      # Seed admin user + demo lessons
npm run content:import  # Import full lesson/exercise content
```

### Required environment variables
Copy `.env.example` → `.env.local` and set:
- `DATABASE_URL` — MariaDB connection string (port 3307 via docker-compose)
- `AUTH_SECRET` — random secret for Auth.js JWT
- `NEXTAUTH_URL` / `AUTH_TRUST_HOST` — base URL of the app
- `RATE_LIMIT_DISABLED=1` — bypass rate limiting (test/CI only)

Node version is pinned in `.nvmrc` (Node 24). Use `nvm use` before running anything.

## Architecture

### Routing
All user-facing pages live under `src/app/[locale]/`, making every route locale-aware. The default locale (`en`) omits the prefix; others (`es`, `fr`, `vi`) include it. Locale detection and routing is handled by `src/middleware.ts` (next-intl). Route groups: `auth/`, `admin/`, `lessons/`, `practice/`, `vocab/`, `profile/`, `dashboard/`, `history/`, `search/`, `test-prep/`.

### API routes
`src/app/api/` mirrors domain areas. Every write endpoint follows the same four-step pattern:
1. **Auth gate** — call `requireLearner()` or `requireAdmin()` from `src/lib/api-auth.ts`; early-return on `"error"` key
2. **Rate limit** — call `rateLimit(clientKey(req, …))` before touching the DB
3. **Validate input** — Zod schema `.safeParse()`; return 400 on failure
4. **DB operation** — Prisma upsert/create/findFirst with existence check before recording analytics (SEC-03)

### Authentication
`src/auth.ts` configures Auth.js v5 with a Credentials provider (email + bcryptjs password). Sessions are JWT-only — no database sessions. The `isAdmin` flag is embedded in the JWT and refreshed on each session update. Use `requireAdmin()` / `requireLearner()` / `currentUser()` from `src/lib/api-auth.ts` in API routes; never read session directly in routes.

### Database
Prisma 6 with MariaDB 11. Schema lives in `prisma/schema.prisma`. Key models: `User`, `Lesson`, `LessonProgress`, `LessonRating`, `Exercise`, `ExerciseAttempt`, `VocabItem`, `UserActivity`. `UserActivity` stores minute-level timestamps used by `computeStreakDays()` for streak logic. After schema changes always run `npm run db:generate`.

### Internationalization
`messages/{en,es,fr,vi}.json` hold all UI strings. All four files must have identical keys — `tests/unit/i18n-parity.test.ts` enforces this and will fail the test suite if they diverge. Use `useTranslations()` / `getTranslations()` from next-intl; never hardcode user-facing strings.

### Key utilities in `src/lib/`
| Module | Purpose |
|---|---|
| `db.ts` | Prisma singleton — import `prisma` from here |
| `api-auth.ts` | `requireAdmin()`, `requireLearner()`, `currentUser()` |
| `rate-limit.ts` | In-memory sliding-window rate limiter; `clientKey()` helper |
| `streak.ts` | Pure `computeStreakDays(timestamps[])` |
| `avatar-crop.ts` | Pure canvas geometry for avatar cropping (unit tested) |
| `avatar.ts` | Client-safe helpers: `initialsOf()`, `avatarColor()` (hash-stable) |
| `avatar-server.ts` | Server-only: `AVATAR_DIR`, `avatarPath()`, `isSafeUserId()` |
| `password-policy.ts` | `isStrongPassword()` (8+ chars, letter + digit) |
| `content.ts` | DB loaders + TS types for `Lesson`, `Exercise`, `CefrLevel`; `isCategory()`, `isSkill()` |
| `segments.ts` | `splitSegments()` — sentence-level split on `.`, `!`, `?` |
| `dictation.ts` | `scoreDictation()` — LCS-based word-level accuracy scoring |
| `analytics.ts` | DB-backed analytics: `totalsOverview()`, `dauWauMau()`, `lessonsPerformance()`, etc. |
| `analytics-helpers.ts` | Pure: `ageBracketOf()`, `lessonHealth()` composite score |
| `user-analytics.ts` | `userStats()`, `userRecentActivity()` (uses streak.ts) |
| `learning-goals.ts` | `GOAL_OPTIONS` (16 goal types), `parseGoals()` |
| `languages.ts` | 73 ISO 639-1 codes with autonyms; `languageByCode()`, `parseLanguages()` |
| `countries.ts` | ISO 3166-1 alpha-2 countries with flag emoji; `countryByCode()`, `flagOf()` |
| `cn.ts` | classnames shorthand |

### Content storage
Lessons and exercises live in the **database**, not in flat JSON files. `npm run db:seed` loads the admin user; `npm run content:import` loads the full catalog from `tests/import/seed-content/` (generated by `scripts/seed-content.mjs`) via `scripts/import-content.mjs`. `content.ts` exposes DB loaders alongside the TypeScript types. Admins can also bulk-upload JSON/YAML at `/admin/import` (no filesystem involved — writes straight to Prisma).

### Dictation / TTS
Dictation exercises use the **browser Web Speech API** (`SpeechSynthesis`) — no audio files and no external TTS service. `scoreDictation()` in `src/lib/dictation.ts` normalizes and diff-scores the learner's transcript via LCS.

### Avatar storage
Avatars are stored on local disk at `public/avatars/<userId>.jpg` and served via the `/api/avatars/[userId]` streaming route (not the `public/` static folder, which isn't reliable after `next build`). They are **not** stored in the database. This is an intentional single-instance design (tracked as INFRA-01).

### Testing strategy
- **Unit tests** (Vitest, `tests/unit/`): pure-function coverage only — no Prisma, no HTTP. Fast, no external dependencies.
- **E2E tests** (Playwright, `tests/e2e/`): full user flows against a running production server. Single worker, 90 s timeout. Rate limiting is disabled in the test environment (`RATE_LIMIT_DISABLED=1`). Run `npm run start` in one terminal before running `npm run e2e`.
