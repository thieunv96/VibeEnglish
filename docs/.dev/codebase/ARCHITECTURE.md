# Architecture

**Analysis Date:** 2026-05-25

## Pattern

**Full-stack Next.js 15 App Router monolith.** A single Next.js app serves both the localized UI (React Server Components + Client Components) and the backend (Route Handlers under `src/app/api/`). Data persists in MariaDB via Prisma. There is no separate API service — server components and route handlers both talk to Prisma directly.

**Rendering model:** Server Components are the default. Components opt into the client with `"use client"` only when they need interactivity (forms, menus, audio, session state). Server components fetch data (Prisma) and pass plain serializable props — including pre-translated `labels` — down to client components.

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Routing / i18n middleware  (src/middleware.ts)                │
│   next-intl locale negotiation, localePrefix "as-needed"      │
├─────────────────────────────────────────────────────────────┤
│ Presentation                                                  │
│   src/app/[locale]/**         localized pages & layouts (RSC) │
│   src/components/**           shared UI (client + server)     │
├─────────────────────────────────────────────────────────────┤
│ API / Server actions                                          │
│   src/app/api/**/route.ts     Route Handlers (POST/PATCH/...) │
│   src/lib/api-auth.ts         requireLearner / requireAdmin   │
├─────────────────────────────────────────────────────────────┤
│ Domain / utilities                                            │
│   src/lib/**                  pure logic (segments, streak,   │
│                               analytics, learning-goals,      │
│                               countries, languages, content)  │
├─────────────────────────────────────────────────────────────┤
│ Data access                                                   │
│   src/lib/db.ts               Prisma client singleton         │
│   prisma/schema.prisma        models + migrations             │
├─────────────────────────────────────────────────────────────┤
│ Persistence:  MariaDB 11 (Docker, host port 3307)             │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

**Read path (page render):**
1. Request hits `src/middleware.ts` → next-intl resolves locale.
2. `src/app/[locale]/layout.tsx` sets the request locale, wraps children in `NextIntlClientProvider`, `SessionProvider`, `Toaster`, `Header`, `Footer`, `HeartbeatPing`.
3. The page (Server Component) calls `auth()` for the session and `prisma` for data (often via helpers in `src/lib/user-analytics.ts`, `src/lib/content.ts`).
4. Page resolves translations with `getTranslations()` and passes plain props + `labels` objects into client components.

**Write path (mutation):**
1. A client component (`ProfileForm`, `SaveWordButton`, `DictationPlayer`, `LessonRatingWidget`, admin forms) issues `fetch()` to a Route Handler.
2. The handler calls `requireLearner()` / `requireAdmin()` (`src/lib/api-auth.ts`) to gate access, then validates the body with a **zod** schema.
3. The handler writes via `prisma` and returns JSON. The client shows a **sonner** toast and usually calls `router.refresh()`.

**Auth flow:**
- `src/auth.ts` configures Auth.js v5 with the Credentials provider (bcrypt verify) and **JWT** session strategy.
- The JWT/`session` callbacks copy `id` and `isAdmin` onto the token/session; `isAdmin` is refreshed from the DB on session-update events.
- `src/app/api/auth/[...nextauth]/route.ts` exposes the handlers.

## Key Abstractions

- **API auth gates** — `requireLearner()` and `requireAdmin()` in `src/lib/api-auth.ts` return either `{ userId, user }` or `{ error: NextResponse }`. Handlers do `if ("error" in gate) return gate.error;`. `requireLearner` rejects admins with 403 (admins don't record learner activity).
- **Prisma singleton** — `src/lib/db.ts` exports a single `prisma` instance (guarded against hot-reload duplication).
- **Server→client label passing** — server components translate strings and pass them as a `labels` prop; client components never call `getTranslations`. Pluralized strings that need a count are resolved by calling `useTranslations` *inside* the client component (functions can't cross the RSC boundary).
- **Avatar pipeline** — `src/lib/avatar.ts` (client-safe initials/colour) + `src/lib/avatar-server.ts` (Node path helpers, `avatarUrl()` → `/api/avatars/<id>?v=<ts>`). Upload: `POST /api/profile/avatar` writes `public/avatars/<id>.jpg`; read: `GET /api/avatars/[userId]` streams the file from disk.
- **AvatarMenu** — generic click-outside/Esc dropdown driven by an items array, reused for learner and admin menus. The same dismiss pattern is mirrored in `HeroAvatarMenu` and `LanguageMultiPicker`.
- **Pure domain helpers** — `segments.ts` (dictation splitting), `streak.ts` (`computeStreakDays`), `analytics.ts`/`user-analytics.ts`, `learning-goals.ts` (`GOAL_OPTIONS`, `parseGoals`), `languages.ts` (`parseLanguages`), `countries.ts`. Kept Prisma-free where possible so they're unit-testable.

## Entry Points

- **HTTP / pages:** `src/app/[locale]/layout.tsx` → `src/app/[locale]/page.tsx` (home) and sibling route folders.
- **Middleware:** `src/middleware.ts` (next-intl).
- **API:** every `src/app/api/**/route.ts`.
- **Auth config:** `src/auth.ts`.
- **i18n config:** `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/navigation.ts`.
- **DB seed / content:** `prisma/seed.mjs`, `scripts/import-content.mjs`.

## Notable Decisions

- **Content lives in the database** (`Lesson`, `Exercise` tables), not JSON files. Seeded via `prisma/seed.mjs` and `scripts/import-content.mjs`.
- **Lesson audio is browser Web Speech API TTS** — no audio assets, no external TTS service.
- **Activity tracking via heartbeats** — `HeartbeatPing` posts to `/api/heartbeat`; `UserActivity` rows feed streak/active-minute analytics (`src/lib/streak.ts`, `src/lib/user-analytics.ts`).
- **Localized routing** uses `localePrefix: "as-needed"` so the default locale (`en`) is unprefixed while `es`/`fr`/`vi` are prefixed. The `LanguageSwitcher` must preserve `searchParams` on switch.

---

*Architecture analysis: 2026-05-25*
