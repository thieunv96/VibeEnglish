# Technology Stack

**Analysis Date:** 2026-05-25

## Languages

**Primary:**
- TypeScript 5 - All source code in `src/` and test files
- JavaScript - Build scripts and configuration files (`next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`)

**Secondary:**
- CSS 3 - Styling via Tailwind CSS v4 in `src/app/globals.css`
- SQL - MariaDB 11 database (no direct SQL; all queries via Prisma ORM)

## Runtime

**Environment:**
- Node.js 24 (required for optional chaining and modern JavaScript features)
- Development: nvm managed (`.nvmrc` available)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 15.5.18 - Full-stack framework with App Router
  - Location: `src/app/` for pages, layouts, API routes
  - Dev port: 1998 (`npm run dev`)
  - Build: standard Next.js build process

**UI & Styling:**
- React 19.1.0 - Component framework
- Tailwind CSS 4 - Utility-first CSS framework
  - Config: `@tailwindcss/postcss` plugin with PostCSS
  - Theming: Custom CSS variables in `src/app/globals.css` (emerald/green palette)
  - No `tailwind.config.ts` — inline `@theme` configuration in globals.css

**Internationalization (i18n):**
- next-intl v4.12.0 - Multi-language support
  - Location: `src/i18n/` for routing and request config
  - Locales: en, es, fr, vi
  - Messages: JSON files in `messages/` (en.json, es.json, fr.json, vi.json)
  - Config: `src/i18n/routing.ts`, `src/i18n/request.ts`

**Authentication:**
- Auth.js v5.0.0-beta.31 (next-auth) - User sessions and credentials
  - Strategy: JWT sessions
  - Provider: Credentials (email/password)
  - Location: `src/auth.ts` (main config), `src/app/api/auth/[...nextauth]/route.ts` (handler)
  - Adapter: Prisma adapter (`@auth/prisma-adapter` v2.11.2)

**UI Components & Utilities:**
- react-easy-crop v5.5.7 - Image cropping (used in avatar upload)
- sonner v2.0.7 - Toast notifications
- zod v4.4.3 - Schema validation

## Key Dependencies

**Critical:**
- `@prisma/client` 6.19.3 - Database client
- `bcryptjs` 3.0.3 - Password hashing for Credentials auth
- `react-dom` 19.1.0 - DOM rendering

**Infrastructure:**
- `prisma` 6.19.3 - ORM and schema management
  - Schema: `prisma/schema.prisma`
  - Provider: MySQL (MariaDB 11)
  - Migrations: `prisma/migrations/`

**Development:**
- `eslint` 9 with `eslint-config-next` - Code linting
  - Config: `eslint.config.mjs` (flat config)
  - Rules: extends "next/core-web-vitals" and "next/typescript"
- `typescript` 5 - Type checking
  - Config: `tsconfig.json` (bundler module resolution, path alias `@/*`)
- `vitest` 4.1.7 - Unit testing framework
  - Config: `vitest.config.ts`
  - Coverage: `@vitest/coverage-v8`
- `@playwright/test` 1.60.0 - E2E testing
  - Config: `playwright.config.ts`
  - Base URL: http://localhost:1998
  - Browser: Chromium only
- `dotenv` 17.4.2 - Environment variable loading

## Configuration

**Environment:**
- `.env` file required (see `.env.example`)
- Key vars:
  - `DATABASE_URL` - MariaDB connection string
  - `AUTH_SECRET` - JWT secret (generate with crypto)
  - `AUTH_TRUST_HOST` - Set to true for localhost development
  - `NEXTAUTH_URL` - Auth callback URL (http://localhost:1998)

**Build:**
- `next.config.ts` - Next.js configuration with next-intl plugin
- `tsconfig.json` - TypeScript compiler options (target ES2017, strict mode)
- `postcss.config.mjs` - PostCSS with Tailwind plugin
- `.eslintrc*` - Not used; ESLint uses `eslint.config.mjs` (flat config format)

**Database:**
- `prisma/schema.prisma` - Database schema
- Provider: MySQL (MariaDB 11)
- Data models: User, Lesson, Exercise, LessonProgress, ExerciseAttempt, VocabItem, UserActivity, LessonRating

## Platform Requirements

**Development:**
- Node.js 24+ (optional chaining required)
- npm 10+
- Docker + Docker Compose (for MariaDB)
- Bash or compatible shell (npm scripts)

**Production:**
- Node.js 24+
- MariaDB 11+ database
- Environment variables configured

**Deployment:**
- Targets Vercel or any Node.js-compatible hosting
- Static export not supported (dynamic API routes required)

## Special Notes

- **Tailwind CSS v4**: Uses new `@import "tailwindcss"` syntax with inline `@theme`; no traditional config file
- **Auth.js v5 beta**: Latest version; Credentials provider with bcrypt password hashing
- **Web Speech API**: Used for text-to-speech in lessons (browser-native, no external TTS service)
- **Avatars**: Stored locally in `public/avatars/` via API route `src/app/api/profile/avatar/route.ts`
- **Localization**: Uses dynamic message imports in `src/i18n/request.ts`; supports locale prefix routing with "as-needed" strategy

---

*Stack analysis: 2026-05-25*
