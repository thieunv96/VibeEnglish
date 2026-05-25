# Directory Structure

**Analysis Date:** 2026-05-25

## Top-Level Layout

```
vibeenglish_lexinglo/
├── src/                  Application source (only this is compiled by tsconfig)
│   ├── app/              Next.js App Router (pages + API)
│   ├── components/       Shared React components
│   ├── lib/              Domain logic & utilities
│   ├── i18n/             next-intl routing/request config
│   ├── generated/        (reserved; Prisma client output is in node_modules)
│   ├── auth.ts           Auth.js v5 configuration
│   └── middleware.ts     next-intl locale middleware
├── prisma/               schema.prisma, migrations/, seed.mjs
├── messages/             next-intl message catalogs (en/es/fr/vi .json)
├── tests/                e2e/ (Playwright) + unit/ (Vitest)
├── scripts/              import-content.mjs, capture-screenshots.mjs, capture-admin-screenshots.mjs
├── public/               Static assets + brand/ + avatars/ (runtime uploads)
├── docs/.dev/            Vibe planning + codebase map (this folder)
├── docker-compose.yml    MariaDB 11 service (host port 3307)
├── next.config.ts, tsconfig.json, eslint.config.mjs,
├── postcss.config.mjs, vitest.config.ts, playwright.config.ts
└── package.json
```

## `src/app/` — App Router

**Localized pages** live under `src/app/[locale]/`:

| Route folder | Purpose |
|---|---|
| `page.tsx` | Home / landing |
| `lessons/` | Lesson categories + lesson dictation player |
| `practice/` | Exercise skill areas + exercise runner |
| `learn-from-youtube/` | YouTube-sourced lessons |
| `test-prep/` | TOEIC/TOEFL/IELTS/OET tracks |
| `profile/` | Learner home: hero + stats + `ProfileForm` + `HeroAvatarMenu` |
| `vocab/` | Saved vocabulary list |
| `history/` | Learning history |
| `dashboard/` | Redirects to `/profile` |
| `search/` | `/search?q=` results |
| `admin/` | Admin dashboard, content CRUD, analytics |
| `auth/` | Login / register |
| `about/`, `faq/`, `privacy/`, `terms/` | Static content |
| `layout.tsx` | Locale layout: providers, Header, Footer, Toaster, HeartbeatPing |

**API route handlers** under `src/app/api/`:

```
api/
├── auth/[...nextauth]/route.ts   Auth.js handlers
├── register/route.ts             Sign-up (bcrypt)
├── profile/route.ts              PATCH profile (zod-validated)
├── profile/avatar/route.ts       POST/DELETE avatar bytes
├── avatars/[userId]/route.ts     GET avatar bytes from disk
├── vocab/route.ts                Save/delete vocab
├── attempts/route.ts             Exercise attempts
├── progress/route.ts             Lesson dictation progress
├── ratings/route.ts              Lesson star ratings
├── heartbeat/route.ts            Activity heartbeat → streak
└── admin/lessons|exercises/...   Admin content CRUD (+ [id] routes)
```

## `src/components/`

Shared UI. Notable members:
- `Header.tsx`, `Footer.tsx`, `Logo.tsx`, `Container.tsx`, `Section.tsx` — layout/chrome.
- `AvatarMenu.tsx`, `Avatar.tsx` — navbar avatar dropdown + avatar primitive.
- `LanguageSwitcher.tsx`, `MobileNav.tsx`, `SearchBar.tsx` — nav.
- `DictationPlayer.tsx`, `SaveWordButton.tsx`, `VocabList.tsx` — lesson interactivity.
- `ExerciseRunner.tsx` — practice exercises.
- `LessonRatingWidget.tsx`, `Stars.tsx` — ratings.
- `LanguageMultiPicker.tsx` — multi-select language popover (profile).
- `CefrBadge.tsx`, `FaqAccordion.tsx`, `HeartbeatPing.tsx`.
- `components/admin/` — `LessonForm.tsx`, `ExerciseForm.tsx`, `ConfirmDeleteButton.tsx`, `Sparkline.tsx`.

Profile-specific client pieces live next to the page in `src/app/[locale]/profile/` (`ProfileForm.tsx`, `HeroAvatarMenu.tsx`, `Stats.tsx`).

## `src/lib/`

| File | Responsibility |
|---|---|
| `db.ts` | Prisma client singleton |
| `api-auth.ts` | `requireLearner` / `requireAdmin` gates |
| `avatar.ts` / `avatar-server.ts` | Client-safe avatar helpers / Node path + URL helpers |
| `content.ts` | Lesson/exercise content access |
| `segments.ts` | Dictation text segmentation |
| `dictation.ts` | Dictation scoring/diff |
| `streak.ts` | `computeStreakDays` |
| `analytics.ts` / `analytics-helpers.ts` / `user-analytics.ts` | Stats aggregation |
| `learning-goals.ts` | `GOAL_OPTIONS`, `TEST_PREP_GOALS`, `parseGoals` |
| `languages.ts` | ISO-639-1 list, `parseLanguages` |
| `countries.ts` | ISO-3166-1 list with flag emojis |
| `cn.ts` | className join helper |

## Naming Conventions

- **Components:** PascalCase files, one component per file (`DictationPlayer.tsx`).
- **Utilities:** kebab/lowercase `.ts` in `src/lib/` (`api-auth.ts`, `user-analytics.ts`).
- **Route handlers:** always `route.ts`; dynamic segments use bracket folders (`[userId]`, `[id]`, `[...nextauth]`).
- **Locale pages:** under `src/app/[locale]/`.
- **Tests:** `tests/unit/*.test.ts` (Vitest), `tests/e2e/*.spec.ts` (Playwright); shared fixtures in `tests/e2e/_fixtures.ts`.
- **Migrations:** `prisma/migrations/<timestamp>_<snake_case_name>/migration.sql`.
- **Path alias:** `@/*` → `src/*` (used in app/components/lib; tests use relative `../../src/...`).

## Where to Add Things

- **New page:** `src/app/[locale]/<route>/page.tsx` (+ co-located client components).
- **New API endpoint:** `src/app/api/<name>/route.ts`, gate with `requireLearner`/`requireAdmin`, validate with zod.
- **New shared util:** `src/lib/<name>.ts` (keep Prisma-free if it needs unit tests).
- **New model/field:** edit `prisma/schema.prisma`, then `npm run db:migrate:dev` (needs Node 24 — see CONCERNS.md).
- **New translatable string:** add the key to all four `messages/*.json` files.

---

*Structure analysis: 2026-05-25*
