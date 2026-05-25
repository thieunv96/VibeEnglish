# External Integrations

**Analysis Date:** 2026-05-25

## APIs & External Services

**Authentication & User Management:**
- Auth.js (next-auth) - Built-in, credential-based
  - Location: `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
  - Provider: Credentials (no OAuth/3rd-party providers integrated)
  - No external API calls; uses Prisma for user storage

## Data Storage

**Databases:**
- MariaDB 11
  - Connection: `DATABASE_URL` environment variable
  - Client: Prisma 6.19.3 (`@prisma/client`)
  - Docker: Defined in `docker-compose.yml`
    - Container: `vibeenglish-mariadb`
    - Port: 3307 (mapped from container port 3306)
    - Credentials: user `vibeenglish`, password `vibepass` (dev-only)
    - Volume: `mariadb_data` for persistence
    - Health check: Built-in MariaDB health check endpoint

**File Storage:**
- Local filesystem only (no cloud storage)
  - Avatar uploads: `public/avatars/` directory
  - Served via API route: `src/app/api/profile/avatar/route.ts`
  - File types: JPEG, PNG, WebP (500 KB max)
  - Access: `src/lib/avatar-server.ts` provides path utilities
  - No external CDN or S3-like integration

**Content Storage:**
- Lessons and exercises stored in MariaDB (Prisma models: `Lesson`, `Exercise`)
- Lesson segments stored as JSON: `segments` field in `Lesson` model
- Exercise questions stored as JSON: `questions` field in `Exercise` model
- Content import script: `scripts/import-content.mjs` (referenced in `package.json`)

**Caching:**
- None detected. No Redis, Memcached, or HTTP caching headers configured.

## Authentication & Identity

**Auth Provider:**
- Custom (Credentials-based)
  - Implementation: Email + password via `next-auth` Credentials provider
  - Location: `src/auth.ts` (provider configuration)
  - Password hashing: bcryptjs 3.0.3 (10 salt rounds in seed)
  - Session strategy: JWT
  - Token refresh: Automatic on session update; `isAdmin` refreshed from DB on trigger="update"

**User Roles:**
- `isAdmin` field on User model (boolean)
- Admin pages/API routes check `session.user.isAdmin`
- Location: `src/lib/api-auth.ts` likely contains role guards (not fully read but referenced)

## Monitoring & Observability

**Error Tracking:**
- None detected. No Sentry, DataDog, or similar integration.

**Logs:**
- Browser console logs only (development)
- Server-side: Node.js console.log (no structured logging framework)
- E2E test reporter: HTML report in `playwright-report/` directory

**Analytics:**
- User activity tracked in `UserActivity` model (user heartbeats at minute-level granularity)
- Table: `UserActivity` with `userId`, `minuteTs`, and unique constraint on (userId, minuteTs)
- API endpoint: `src/app/api/heartbeat/route.ts` to record activity
- No external analytics service (Google Analytics, Mixpanel, etc.)

## CI/CD & Deployment

**Hosting:**
- Not configured; ready for Vercel or similar Node.js hosting
- Dev: `npm run dev` on port 1998
- Prod: `npm run build && npm start` (Next.js standard)

**CI Pipeline:**
- None detected. No GitHub Actions, GitLab CI, or Travis CI configured.
- Manual test commands available:
  - `npm test` (Vitest unit tests)
  - `npm run e2e` (Playwright E2E tests)
  - `npm run typecheck` (TypeScript check)
  - `npm run lint` (ESLint)

## Webhooks & Callbacks

**Incoming:**
- Auth callback: `src/app/api/auth/[...nextauth]/route.ts` handles POST from next-auth middleware
- API routes accept form data and JSON payloads (no external webhooks detected)

**Outgoing:**
- None detected. No third-party webhook integrations.

## Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL` - MariaDB connection string (format: `mysql://user:pass@host:port/database`)
- `AUTH_SECRET` - JWT secret (base64-encoded 32-byte value, generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
- `AUTH_TRUST_HOST` - Set to `true` for localhost development
- `NEXTAUTH_URL` - Callback URL for auth (dev: `http://localhost:1998`)

**Optional Environment Variables:**
- `ADMIN_EMAIL` - Override default admin email in seed (default: `thieunv96@gmail.com`)
- `ADMIN_PASSWORD` - Override default admin password in seed (default: `123`)
- `ADMIN_NAME` - Override default admin name in seed (default: `Admin`)

**Secrets Location:**
- `.env` file (not version controlled; see `.env.example` for template)
- Auth.js uses `AUTH_SECRET` for JWT signing/verification

## Internal API Routes

**User/Profile Management:**
- `POST /api/register` - Register new user (`src/app/api/register/route.ts`)
- `GET/PATCH /api/profile` - Get/update user profile (`src/app/api/profile/route.ts`)
- `POST /api/profile/avatar` - Upload avatar (`src/app/api/profile/avatar/route.ts`)
- `DELETE /api/profile/avatar` - Delete avatar

**Learning Data:**
- `POST /api/progress` - Record lesson progress (`src/app/api/progress/route.ts`)
- `POST /api/attempts` - Record exercise attempts (`src/app/api/attempts/route.ts`)
- `GET/POST /api/vocab` - Manage vocabulary items (`src/app/api/vocab/route.ts`)
- `POST /api/ratings` - Submit lesson ratings (`src/app/api/ratings/route.ts`)

**Activity Tracking:**
- `POST /api/heartbeat` - Record user activity (`src/app/api/heartbeat/route.ts`)

**Admin Management:**
- `GET/POST /api/admin/lessons` - List/create lessons (`src/app/api/admin/lessons/route.ts`)
- `PATCH/DELETE /api/admin/lessons/[id]` - Update/delete lesson
- `GET/POST /api/admin/exercises` - List/create exercises (`src/app/api/admin/exercises/route.ts`)
- `PATCH/DELETE /api/admin/exercises/[id]` - Update/delete exercise

**Avatar Access:**
- `GET /api/avatars/[userId]` - Serve user avatar (`src/app/api/avatars/[userId]/route.ts`)

## Content & Media

**Text-to-Speech:**
- Web Speech API (browser-native)
  - No external TTS service (Polly, Google TTS, Azure Speech, etc.)
  - Used in: `src/components/DictationPlayer.tsx`
  - Uses: `window.speechSynthesis` and `SpeechSynthesisUtterance`
  - Fallback: Silent if `speechSynthesis` not available

**Content Format:**
- Lessons: JSON-serialized transcript + segments array stored in `Lesson.segments`
- Exercises: JSON-serialized questions array stored in `Exercise.questions`
- All content in MariaDB via Prisma

## No Third-Party Integrations Detected

The following are NOT integrated (confirmed by code review):
- Payment processors (Stripe, PayPal)
- Email service (SendGrid, Mailgun, AWS SES)
- Cloud storage (AWS S3, Google Cloud Storage, Azure Blob)
- External APIs (OpenAI, anthropic, etc.)
- OAuth providers (Google, GitHub, Microsoft)
- Error tracking (Sentry, Rollbar)
- APM/monitoring (DataDog, New Relic, Elastic)
- CDN (Cloudflare, Akamai)
- SMS service (Twilio)
- Media processing (ImageKit, Cloudinary)

---

*Integration audit: 2026-05-25*
