# System Architecture

VibeEnglish is a Next.js 15 full-stack English learning platform with real-time progress tracking, exercise scoring, and guest conversion features. This document describes the core systems, data flow, and technical decisions.

---

## Routing & Middleware

All user-facing pages live under `src/app/[locale]/`, making every route locale-aware. The default locale (`en`) omits the prefix; others (`es`, `fr`, `vi`) include it.

**Locale detection & routing:** `src/middleware.ts` (next-intl v3) handles locale prefix detection and routing.

**Route groups (organized by domain):**
- `auth/` — Login, register, password reset
- `admin/` — Content import, bulk management, analytics
- `lessons/` — Lesson view & progress
- `practice/` — Exercise practice by skill
- `vocab/` — Vocabulary list & spaced-repetition review
- `profile/` — User settings, learning goals, avatar management
- `dashboard/` — User home, progress overview
- `history/` — Attempt history, performance insights
- `search/` — Content search & discovery
- `test-prep/` — IELTS/TOEFL prep lessons
- `sample-test/` — 10-question guest sample test (conversion hook)
- `sample-test/cefr/` — 25-question CEFR placement test (stratified, conversion hook)

---

## API Routes & Patterns

`src/app/api/` mirrors domain areas. **Every write endpoint** follows a strict four-step pattern:

1. **Auth gate** — Call `requireLearner()` or `requireAdmin()` from `src/lib/api-auth.ts`; early-return on `"error"` key
2. **Rate limit** — Call `rateLimit(clientKey(req, …))` before touching the DB
3. **Validate input** — Zod schema `.safeParse()`; return 400 on failure
4. **DB operation** — Prisma upsert/create/findFirst with **existence check before recording** (SEC-03 pattern)

**Example:** `/api/sample-test/claim`
```
requireLearner() → verify JWT signature → check submittedAt ≤ 30 min
→ for each exerciseSlug, verify Exercise exists (SEC-03)
→ create ExerciseAttempt rows → clear cookie → return 200
```

---

## Authentication (Auth.js v5)

`src/auth.ts` configures Auth.js with:
- **Provider:** Credentials (email + bcryptjs-hashed password)
- **Session type:** JWT-only (no database sessions)
- **Session refresh:** `isAdmin` flag embedded in JWT, refreshed on each session update via `auth()` call
- **API layer:** Use `requireAdmin()` / `requireLearner()` / `currentUser()` from `src/lib/api-auth.ts` in all API routes
  - **DO NOT** read the session directly in route handlers
  - Always call auth helpers, which return either user object or `{ error: "..." }` key

---

## Database (Prisma 6 + MariaDB 11)

**Schema location:** `prisma/schema.prisma`

**Key models:**
- `User` — learner account, email, hashed password, profile data, avatar
- `Lesson` — lesson content (title, description, level, duration, skill, category)
- `LessonProgress` — per-user lesson state (started, completed, rating)
- `LessonRating` — optional learner feedback (1–5 stars, text comment)
- `Exercise` — exercise content with nested `questions[]` JSON array
- `ExerciseAttempt` — per-user attempt record (score, timestamp); no unique constraint on `(userId, exerciseSlug)` — allows repeats
- `VocabItem` — vocabulary word with definitions, example sentence, CEFR level
- `UserActivity` — minute-level activity timestamps used by `computeStreakDays()`

**After schema changes:** Always run `npm run db:generate` to regenerate Prisma client.

---

## Internationalization (next-intl v3)

`messages/{en,es,fr,vi}.json` hold all UI strings. **All four files MUST have identical keys** — `tests/unit/i18n-parity.test.ts` enforces this and fails the entire test suite if any key is missing.

**API:**
- **Server Components:** `getTranslations(namespace)` (from next-intl)
- **Client Components:** `useTranslations(namespace)` (from next-intl)
- **Never hardcode user-facing strings**

**Namespaces:**
- `sampleTest` — 10-question guest test UI (22 keys)
- `cefrTest` — 25-question CEFR placement test UI (24 keys)
- (others for lessons, practice, profile, etc.)

---

## Key Utilities in `src/lib/`

| Module | Purpose |
|---|---|
| `db.ts` | Prisma singleton — **always import `prisma` from here**, never `new PrismaClient()` |
| `api-auth.ts` | `requireAdmin()`, `requireLearner()`, `currentUser()` — use in all API routes, never read session directly |
| `rate-limit.ts` | In-memory sliding-window limiter; `clientKey(req, scope)` helper for IP/user-based keys |
| `streak.ts` | Pure `computeStreakDays(timestamps[])` — evaluates minute-level activity to compute current streak |
| `avatar-crop.ts` | Pure canvas geometry for avatar cropping; `cropDrawParams()` returns canvas transform matrix (unit tested) |
| `avatar.ts` | Client-safe helpers: `initialsOf(name)`, `avatarColor(userId)` (hash-stable color) |
| `avatar-server.ts` | Server-only: `AVATAR_DIR`, `avatarPath(userId)`, `isSafeUserId(userId)` |
| `password-policy.ts` | `isStrongPassword(pwd)` — 8+ chars, letter + digit required |
| `content.ts` | DB loaders + TS types: `loadLessons()`, `loadExercises()`, types for `Lesson`, `Exercise`, `CefrLevel`; `isCategory()`, `isSkill()` validators |
| `segments.ts` | `splitSegments(text)` — sentence-level split on `.`, `!`, `?` for dictation feedback |
| `dictation.ts` | `scoreDictation(transcript, reference)` — LCS-based word-level accuracy scoring (pure function, unit tested) |
| `exercise-scoring.ts` | **NEW:** Extracted `checkAnswer(question, given)`, `normalize(str)`, `sanitiseQuestion(q)` — reused by sample & CEFR tests |
| `sample-test-jwt.ts` | **NEW:** JWT sign/verify helpers using `jose` library; `signResultCookie()`, `verifyResultCookie()` for stateless guest sessions |
| `cefr-estimation.ts` | **NEW:** Pure `computeCefrEstimate(levelScores): CefrEstimate` — returns `CefrLevel \| "C1+"` based on 60% pass threshold per band |
| `cefr-sampling.ts` | **NEW:** `sampleCefrQuestions(exercisePool)` — stratified sampler across CEFR levels with composite-key dedup (`${slug}:${questionId}`) |
| `recommendation.ts` | **NEW:** `buildSkillBreakdown()`, `pickWeakestSkill()` — derives per-skill breakdown from attempt scores, identifies weakest skill for recommendations |
| `analytics.ts` | DB-backed analytics: `totalsOverview()`, `dauWauMau()`, `lessonsPerformance()`, etc. |
| `analytics-helpers.ts` | Pure: `ageBracketOf(age)`, `lessonHealth()` composite score |
| `user-analytics.ts` | `userStats(userId)`, `userRecentActivity(userId)` (uses `streak.ts`) |
| `learning-goals.ts` | `GOAL_OPTIONS` (16 goal types), `parseGoals()` validator |
| `languages.ts` | 73 ISO 639-1 language codes with autonyms; `languageByCode()`, `parseLanguages()` |
| `countries.ts` | ISO 3166-1 alpha-2 country codes with flag emoji; `countryByCode()`, `flagOf()` |
| `cn.ts` | classnames shorthand (`cn(…)`) for conditional class assembly |

---

## Guest Conversion Features (NEW in June 2026)

### Sample Test (10-Question Guest Hook)

**Routes:**
- `GET /[locale]/sample-test` — Landing page (Server Component)
- `POST /api/sample-test/start` — Sampler (rate-limited 5/min per IP); returns 10 sanitized questions
- `POST /api/sample-test/submit` — Scorer; returns raw score; sets JWT cookie
- `GET /[locale]/sample-test/results` — Results page (teaser for guests, full for authed)
- `POST /api/sample-test/claim` — Shared endpoint; writes ExerciseAttempt rows post-signup

**Data Flow:**
1. Guest clicks "Start test" → `POST /api/sample-test/start`
2. Server samples 10 random Exercise rows, flattens questions, strips answers, signs JWT session
3. Guest submits answers → `POST /api/sample-test/submit`
4. Server scores each answer via `checkAnswer()`, computes per-skill breakdown, signs result JWT cookie (30-min TTL)
5. Teaser shown ("7/10 correct — sign up to see which questions you missed")
6. Guest signs up → `RegisterForm` calls `POST /api/sample-test/claim` after successful signin
7. Claim endpoint reads cookie, verifies JWT signature, writes ExerciseAttempt rows, clears cookie
8. Browser redirects to `/sample-test/results` (full results now visible)

**Cookie Design (Critical for Scale):**
- **Name:** `sample_test_result`
- **Payload compression:** To stay under 4 KB browser limit:
  - Exercise scores stored as `[slug, correct, total]` tuples (not objects)
  - Guest answers stored as `answersByIndex[]` array (indexed by position in `questionCompositeIds`)
  - Title, skill, level re-fetched from `Exercise` table at claim time and results-page render
- **Composite keys:** Questions unique only within exercise (`q1`–`q5`). All cross-exercise operations use `${exerciseSlug}:${questionId}` keys:
  - In `pickedIds` set during sampling (dedup)
  - In `questionMap` for scoring
  - In `questionCompositeIds[]` array in cookie (positional index for answer lookup)

**Shared Infrastructure:**
- `src/lib/exercise-scoring.ts` — `checkAnswer()` extracted for reuse (prevents client-side cheating)
- `src/lib/sample-test-jwt.ts` — JWT helpers reused by CEFR test too
- `/api/sample-test/claim` endpoint — Shared with CEFR test, distinguished by `testType` JWT field

---

### CEFR Placement Test (25-Question Stratified Test)

**Routes:**
- `GET /[locale]/sample-test/cefr` — Landing page (Server Component); states 25 questions
- `POST /api/sample-test/cefr/start` — Stratified sampler (rate-limited 3/min per IP); returns 25 stratified questions
- `POST /api/sample-test/cefr/submit` — Scorer; computes CEFR estimate; sets JWT cookie with `testType: "cefr"`
- `GET /[locale]/sample-test/cefr/results` — Results page (disclaimer always visible; teaser for guests, full for authed)
- `POST /api/sample-test/claim` — Shared endpoint; reads `testType` field to route to correct persist logic

**Stratified Sampling Algorithm:**

Questions distributed across CEFR levels based on current DB content audit:

| CEFR Level | Available Exercises | Target Questions | Strategy |
|---|---|---|---|
| A1 | 12 | 4 | Baseline competency check |
| A2 | 23 | 4 | Well-represented baseline |
| B1 | 30 | 5 | Diagnostically important; extra question |
| B2 | 33 | 8 | Largest pool; serves as C2-proxy (over-samples by 2 to fill C2 gap) |
| C1 | 4 | 4 | Hard cap — all 4 available exercises drawn |
| C2 | 0 | 0 | No content exists; slots filled by B2 "stretch" questions |

**Algorithm (server-side in `/api/sample-test/cefr/start`):**
1. For each CEFR level, fetch Exercise rows at that level
2. Flatten to question tuples: `{ exerciseSlug, skill, level, question }`
3. Fisher-Yates shuffle per level; take first N tuples per target count
4. If shortfall (fewer available than target), fall back to adjacent level (C1 → B2, A1 → A2, etc.)
5. Build `levelMap: { [questionId]: CefrLevel }` — tags each question with the level it was drawn from
6. Sign session JWT with `testType: "cefr"`, `levelMap`, `grouping` (slug-keyed)
7. Return 25 sanitized questions

**CEFR Estimation Algorithm:**

`computeCefrEstimate(levelScores): CefrEstimate`

- **Pass threshold:** ≥60% accuracy per CEFR band (lower than formal pass to account for 4–8 questions per band)
- **Primary logic:** Evaluate bands in descending order (C2 → A1); return the highest band with ≥60% accuracy
- **C1+ special case:** If highest passing band would be C1 AND `levelScores.C2.total === 0` (no C2 content drawn):
  - Return `"C1+"` instead of `"C1"`
  - Signals user has C1-level competency but test can't confirm C2 (content gap)
- **Floor:** Return `A1` if no band reaches 60%
- **Return type:** `CefrEstimate = CefrLevel | "C1+"` (type union)

**Cookie Design:**

- **Extended payload** includes `testType: "cefr"`, `levelScores`, `cefrEstimate`
- **Composite keys & tuple compression** — same as sample test
- **Server-rendered disclaimer** — HTML includes "Please note: this is not an official exam..." from `getTranslations()` in page Server Component (not client-rendered)

**Content Gap (Non-Blocking):**

Current DB state: C2 = 0 exercises. This sprint:
- B2 over-samples (8 questions vs 6 if C2 existed) to fill the gap
- `levelScores.C2.total` always 0
- C1+ label signals the gap to users
- **Follow-up (parallel, non-blocking):** Content team to author C2 + additional C1
  - Update `CEFR_TARGET_COUNTS` constant in start route
  - Remove C1+ special case from estimation (return "C2" when C2 content passes 60%)
  - Update unit tests

**Shared Infrastructure:**
- `src/lib/exercise-scoring.ts` — `checkAnswer()`, `normalize()` (same as sample test)
- `src/lib/sample-test-jwt.ts` — JWT helpers (same as sample test)
- `/api/sample-test/claim` — Shared endpoint; reads `testType` from JWT, branches logic
- `RegisterForm.tsx` — Single claim call; reads `testType` from response to route redirect

---

## Content Storage

Lessons and exercises live in the **database** (`Exercise` table), not in flat JSON files.

- `npm run db:seed` — Loads admin user + 5 demo lessons
- `npm run content:import` — Bulk-imports from `tests/import/seed-content/` (generated by `scripts/seed-content.mjs`)
- **Admin UI** — `/admin/import` supports JSON/YAML upload (no filesystem involved; writes to Prisma directly)

`src/lib/content.ts` exposes:
- `loadLessons()`, `loadExercises()` — DB loaders
- TypeScript types: `Lesson`, `Exercise`, `ExerciseQuestion`, `CefrLevel`
- Validators: `isCategory()`, `isSkill()`

---

## Dictation / TTS

Dictation exercises use the **browser Web Speech API** (`SpeechSynthesis`) — **no audio files, no external TTS service**.

`src/lib/dictation.ts` exports `scoreDictation(transcript, reference)`:
- Normalizes both strings (lowercase, trim, punctuation removal)
- Computes longest-common-subsequence (LCS) alignment
- Returns word-level accuracy (0.0–1.0)
- Pure function; unit tested

---

## Avatar Storage

Avatars stored on local disk at `public/avatars/<userId>.jpg` — **not in the database**.

**Serving:** Via `/api/avatars/[userId]` streaming route (not the `public/` static folder, which isn't reliable after `next build`).

**Server helpers:** `src/lib/avatar-server.ts`
- `avatarPath(userId)` — File path on disk
- `isSafeUserId(userId)` — Validates userId format to prevent directory traversal

**This is an intentional single-instance design** (tracked as INFRA-01). Multi-instance deployments would need a shared storage layer (S3, etc.) — deferred to Phase 3+.

---

## Rate Limiting

**Location:** `src/lib/rate-limit.ts` — in-memory sliding-window limiter (no external service)

**Scope:** IP-based (most endpoints) or user-based (post-auth endpoints)

**Key function:** `clientKey(req, scope)` — derives IP or userId from request/session

**Sample/CEFR Test Limits:**

| Endpoint | Key | Limit | Window | Rationale |
|---|---|---|---|---|
| `POST /api/sample-test/start` | IP | 5/min | 60 sec | One test ≈ 5 min; prevents bulk-scraping 10 Qs/request |
| `POST /api/sample-test/submit` | IP | 10/min | 60 sec | Loosely; submit is low-value to scrape |
| `POST /api/sample-test/cefr/start` | IP | 3/min | 60 sec | Longer test (25 Qs); higher abuse cost per call |
| `POST /api/sample-test/cefr/submit` | IP | 10/min | 60 sec | Same as sample test |
| `POST /api/sample-test/claim` | userId | 10/min | 60 sec | Post-auth; normal pattern |

**In Test/CI:** `RATE_LIMIT_DISABLED=1` bypasses all limiters.

**Caveat:** Resets on server restart; not shared across processes. Single self-hosted instance only (acceptable per current architecture).

---

## Testing Strategy

### Unit Tests (Vitest, `tests/unit/`)

Pure functions only — no Prisma, no HTTP. Fast, no external dependencies.

**Coverage:**
- `streak.ts` — streak computation edge cases
- `avatar-crop.ts` — canvas geometry transforms
- `exercise-scoring.ts` — `checkAnswer()` across all question types
- `cefr-estimation.ts` — CEFR band pass logic, C1+ special case, edge cases
- `dictation.ts` — LCS-based scoring
- `i18n-parity.test.ts` — enforces all four message files have identical keys

### E2E Tests (Playwright, `tests/e2e/`)

Full user flows against a running production server (single worker, 90 sec timeout).

**Coverage:**
- Auth flows (register, login, password reset)
- Lesson progress tracking
- Exercise attempt recording
- Sample test (guest → signup → claim → full results)
- CEFR test (stratified sampling, CEFR estimate, results page)

**Setup:**
1. `npm run start` — Start production server on port 1998
2. `npm run e2e` — Run all tests
3. `RATE_LIMIT_DISABLED=1` — Env var ensures rate limiters don't interfere

---

## Security Patterns

**SEC-03 (Existence Check Before Write):**
All write endpoints verify foreign-key references exist before persisting:
```ts
const exercise = await prisma.exercise.findUnique({ where: { slug } });
if (!exercise) return { error: "not_found" };
// safe to write
await prisma.exerciseAttempt.create({ ... });
```

**JWT Forgery Prevention:**
Guest session and result cookies signed with `AUTH_SECRET` (HS256 via `jose`). Submit endpoint returns only `{ correct, total }` — full answer breakdown lives only in the signed cookie. Forged payload fails signature verification.

**Answer Stripping (Server-Enforced):**
Sample/CEFR start endpoints MUST strip `answer` and `pairs[].right` fields before returning to client. Verified by acceptance criteria and unit tests (`sanitiseQuestion()`).

**Rate Limiting:**
Prevents bulk-scraping of `Exercise.questions` content (sample test: 5/min, CEFR test: 3/min per IP).

---

## Deployment & Operations

**Single-Instance Design:**
- Rate limiter: in-memory (resets on restart; not shared across processes)
- Avatar storage: local disk (would need S3/CDN for multi-instance)
- Session store: JWT-only (stateless; no external store needed)

**Scaling Constraints (Phase 3+):**
- Move rate limiter to Redis
- Move avatar storage to S3
- No changes to session architecture (JWT already stateless)

---

## Key Decision Points

1. **No DB schema changes for guest tests** — Sample & CEFR tests persist via existing `ExerciseAttempt` model. No source flag or new columns. Intentional trade-off.

2. **Composite-key dedup** — Questions unique only within exercise. Cross-exercise operations use `${slug}:${questionId}` throughout (session, cookie, results).

3. **Slim cookie design** — Tuple compression + re-hydration from DB keeps payload under 4 KB. Title/skill/level fetched on read, not stored in cookie.

4. **JWT-based guest sessions** — Stateless; no server-side session store. 30-min TTL; signature prevents forgery.

5. **Shared claim endpoint** — One endpoint for both test types, distinguished by `testType` JWT field. Eliminates code duplication.

6. **Server-rendered disclaimer** — CEFR results page includes disclaimer in HTML at SSR time (AC-9 requirement); not client-rendered.

7. **C1+ label for content gap** — Shipped as-is with C2=0. Placeholder until content team delivers C2 exercises; then update `CEFR_TARGET_COUNTS` and remove special case.

