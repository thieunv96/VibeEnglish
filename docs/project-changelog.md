# Project Changelog

All notable changes to VibeEnglish are documented here. Date format: YYYY-MM-DD.

---

## 2026-06-06 — Exam-Prep Listening Mocks V1 (TOEIC/TOEFL/IELTS/OET)

### Schema Delta — MockTestAttempt Table

A new `MockTestAttempt` model persists listening mock test sessions:
- `(userId, exam, completedAt)` — ordered history per exam
- `(exam, completedAt)` — admin analytics index
- FK: `userId` → `User` (cascade delete)
- Fields: `bandEstimate` (rounded-down single value, placeholder thresholds pending SME sign-off NQ-1), `correctAnswers`, `totalQuestions`, `score` (ratio 0.0–1.0)

Companion additions to existing models:
- `Exercise.exam String?` — nullable; indexed. Tags exercises by exam slug.
- `ExerciseAttempt.attemptType String @default("practice")` — enum values: "practice", "sample", "cefr", "mock". Enables history filtering by test type.

### Feature — Listening Mocks (V1)

**Routes:**
- `GET/POST /[locale]/test-prep/[exam]/mock` — Single-page state machine (idle → running → results inline). Landing page & test host on same URL.
- `GET /[locale]/admin/test-prep` — Admin analytics: 4 exam cards, band distribution table, summary stats.
- `POST /api/test-prep/[exam]/mock/start` — Auth-required; rate-limit 2/min/IP. Samples 25 listening questions. Returns sanitized questions + session JWT (`testType: "mock-{exam}"` prevents cross-exam replay).
- `POST /api/test-prep/[exam]/mock/submit` — Auth-required; rate-limit 10/min/IP. Scores answers. Computes band. **Atomically writes 1 `MockTestAttempt` + N `ExerciseAttempt` rows (attemptType="mock") in a single transaction.** Returns inline results blob with band.
- `GET /api/admin/test-prep/analytics` — requireAdmin; rate-limit 30/min/userId. Per-exam aggregates: unique users, attempt count, average band, band distribution.

**Scope:** Listening-only (reading deferred to V2 / NQ-3). All four exams (TOEIC, TOEFL, IELTS, OET).

**Disclaimer:** Server-rendered on landing page AND results panel (AC-10 requirement).

**Band Format:** Single rounded-down value per exam (e.g. "Band 5.5", "600", "B", "28"). **Thresholds are placeholders pending SME sign-off (NQ-1).**

### Admin Nav & Analytics

- New `/admin/test-prep` page (4 exam cards, band histogram).
- Admin nav gains "Test Prep" entry (between Exercises and Import).
- `nav.adminTestPrep` i18n key added (forward-looking; admin nav still hardcoded, consolidation deferred to later refactor).

### Shared Infrastructure

**New utilities extracted/added:**
- `src/lib/shuffle.ts` — Fisher-Yates shuffle (extracted from inline sampling; reused by sample-test + test-prep).
- `src/lib/test-prep-constants.ts` — Exam slug enum, `attemptType` enum, `MOCK_TEST_QUESTION_COUNT = 25`.
- `src/lib/test-prep-bands.ts` — `estimateBand(exam, correct, total)` returning `{ band, rangeLow?, rangeHigh? }`. Band value is single rounded-down step (never range, never midpoint).
- `src/lib/test-prep-content.ts` — `sampleListeningQuestions(exam, count)` — server-side sampler for listening-only questions by exam.
- `src/lib/test-prep-progress.ts` — `getExamProgress(userId, exam)` — aggregates `MockTestAttempt` records.
- `src/lib/test-prep-admin-analytics.ts` — `getTestPrepAnalytics()` — per-exam stats for admin API + page.

**Existing utilities extended:**
- `ExerciseAttempt` table: all sample-test, CEFR, and practice attempts now write `attemptType: "sample"` / `"cefr"` / `"practice"` / `"mock"` respectively (previously untagged).

### i18n

New `testPrep` namespace added to all four locales (en, es, fr, vi). es/fr/vi ship **English placeholders** pending translation (parallel workstream). New `nav.adminTestPrep` key in all four files.

### Test Coverage

E2E + unit tests:
- 31/31 Playwright E2E pass (12 test-prep mock + 4 admin analytics + 15 regression sample/CEFR)
- 185/185 unit tests pass (including new band estimation, constants, content sampler tests)
- JWT forgery rejection confirmed (cross-exam replay rejects on testType mismatch)
- Pre-existing E2E bug fixed: `sample-test.spec.ts` and `cefr-test.spec.ts` asserted `pairs[].right === ""` post-sanitisation; corrected to `expect(p.right).toBeUndefined()` (sanitiseQuestion strips the key entirely)

### Composite Question-ID Convention (Documented Pattern)

Extended documentation: the `${exerciseSlug}:${questionId}` convention now spans three systems (sample-test, CEFR placement, test-prep mocks). Documented in `system-architecture.md` as a project-wide pattern to prevent answer collisions when multiple exercises contribute a local `"q1"`.

### Non-Blocking Follow-Ups

- **NQ-1:** Band threshold SME sign-off (current values placeholders only)
- **NQ-3, NQ-5:** Reading mock + IELTS Academic/General Training split (V2)
- **PQ-3:** `/api/test-prep/[exam]/progress` route (client component doesn't need it today)
- **Admin nav i18n:** Migrate entire admin nav from hardcoded labels to `nav.*` namespace

---

## 2026-06-04 — Sample Test + CEFR: auth-gated single-page rewrite

The 10-Q sample test and 25-Q CEFR placement are no longer guest-accessible. The
guest conversion-hook design from 2026-06-03 has been replaced with an auth gate
on both landings and both API routes.

**Behaviour change:**
- Anonymous visitors to `/[locale]/sample-test` or `/[locale]/sample-test/cefr`
  are now redirected to `/auth/login`.
- `POST /api/sample-test/start`, `/api/sample-test/cefr/start`, and both submit
  endpoints now require a logged-in session (401 otherwise).
- Landing → test → results is now a single client state machine on the original
  URL. The separate `/results` pages are deleted.
- After submit the client renders score, skill breakdown, per-question review,
  recommendations (10-Q) or CEFR estimate + level breakdown (CEFR) inline.
- The CEFR disclaimer renders server-side on the landing page (visible *before*
  the user starts) instead of on a results page.
- Retake button on the inline results resets state back to the landing.

**Removed:**
- `/api/sample-test/claim` and `/api/sample-test/recommendations` endpoints.
- `/[locale]/sample-test/results` and `/[locale]/sample-test/cefr/results`
  routes (including all child components: `ResultsClient`, `FullResults`,
  `CefrResultsClient`, `CefrEstimate` wrapper page).
- `signResultCookie` / `verifyResultCookie` helpers from
  `src/lib/sample-test-jwt.ts` (the session JWT helpers stay — they bind
  `/start` to `/submit` so users can't forge question lists).
- `RegisterForm`'s post-signin claim hook and the `claimFailed` label / i18n key.
- Guest-only i18n keys in both namespaces: `teaserHeading`, `teaserSub`,
  `teaserSignUpBtn`, `teaserLoginPrompt`, `teaserLoginLink`, `noResultsHeading`,
  `noResultsBody`, `noResultsLink`, `expiredBody`, `redirecting`, `claimFailed`.
- All guest E2E scenarios (teaser, signup-claim, no-cookie/expired-cookie,
  forged result cookie) — auth-gate replaces them.

**Implementation note worth keeping:** the client→server answers payload is now
keyed by composite `${slug}:${questionId}` IDs (the synthetic ExerciseRunner
question ids are also composite). This fixes a pre-existing collision class
where two source exercises both contributing a question with bare id `"q1"`
would lose one of the user's answers in the runner's answers map.

**Submit response shape (inline results):**
- 10-Q: `{ correct, total, exerciseScores, reviewQuestions, weakestSkill, recommendations }`
- CEFR: `{ correct, total, exerciseScores, reviewQuestions, levelScores, cefrEstimate }`

No schema changes. No new environment variables. The `sampleTest` and `cefrTest`
i18n namespaces shrink to 19 keys + 21 keys respectively. Coverage stays at
124 unit tests; E2E drops from 29 (mostly guest scenarios) to 15 (auth-gated +
forged-session + redirect + happy paths).

The previous guest-flow specs at `plans/specs/sample-test-spec.md` and
`plans/specs/cefr-test-spec.md` are superseded by this change; the
authentication-required behaviour is the current source of truth.

---

## 2026-06-03 — Sample Test (10-Question Guest Conversion Hook)

**Routes:** `GET/POST /[locale]/sample-test`, `GET /[locale]/sample-test/results`

**Features:**
- Guest visitors take 10 random questions without signup
- Raw score ("7/10 correct") shown immediately; full results gated behind signup
- Per-skill breakdown, per-question review, and lesson recommendations visible post-signup
- Logged-in users bypass the signup gate; results shown immediately
- All attempts written to `ExerciseAttempt` table on signup/claim

**Infrastructure Added:**
- `src/lib/exercise-scoring.ts` — Pure `checkAnswer()`, `normalize()`, `sanitiseQuestion()` extracted for reuse
- `src/lib/sample-test-jwt.ts` — JWT sign/verify helpers for stateless guest sessions (HS256 via `AUTH_SECRET`)
- `/api/sample-test/start` — Rate-limited (5/min per IP); samples 10 questions; returns sanitized list (no answers)
- `/api/sample-test/submit` — Scores answers server-side; sets HttpOnly JWT cookie (30-min TTL); returns raw score
- `/api/sample-test/claim` — Post-signup claim endpoint; writes `ExerciseAttempt` rows; clears cookie
- Cookie design: 4 KB size limit via tuple compression (`[slug, correct, total]`); re-hydration from `Exercise` table on read

**i18n:** New `sampleTest` namespace with 22 keys in all four locales (en, es, fr, vi).

**Test Coverage:** Unit + E2E per spec in `plans/specs/sample-test-spec.md`.

**See also:** `plans/specs/sample-test-spec.md` for acceptance criteria and security notes.

---

## 2026-06-03 — CEFR Placement Test (25-Question Stratified Test)

**Routes:** `GET/POST /[locale]/sample-test/cefr`, `GET /[locale]/sample-test/cefr/results`

**Features:**
- Guest visitors take 25 questions stratified across CEFR levels (A1–C2)
- Stratified distribution: A1=4, A2=4, B1=5, B2=8, C1=4, C2=0 (content gap — see below)
- CEFR estimate computed server-side (A1–C2 or "C1+" when C2 content absent)
- Server-rendered disclaimer: "Please note: this is not an official exam..."
- Identical signup-gate pattern to sample test; CEFR level revealed post-signup
- Logged-in users see CEFR estimate immediately
- All attempts written to `ExerciseAttempt` table via shared claim endpoint

**Infrastructure Added:**
- `src/lib/cefr-sampling.ts` — Stratified sampler with composite-key dedup (`${slug}:${questionId}`)
- `src/lib/cefr-estimation.ts` — Pure `computeCefrEstimate(levelScores): CefrEstimate` function; returns `CefrLevel | "C1+"`
  - Pass threshold: ≥60% accuracy per CEFR band
  - C1+ special case: Returned when user passes C1 AND `levelScores.C2.total === 0` (no C2 content exists)
  - Fallback: Returns `A1` if no band reaches 60%
- `/api/sample-test/cefr/start` — Rate-limited (3/min per IP); returns 25 stratified questions
- `/api/sample-test/cefr/submit` — Computes per-level scores and CEFR estimate; sets result cookie with `testType: "cefr"`
- **Shared `/api/sample-test/claim`** — Extended to handle both test types via `testType` JWT field; returns `{ ok, testType }` for correct post-claim redirect
- Cookie design: Extended `sample_test_result` cookie with `testType`, `levelScores`, `cefrEstimate` fields; same 4 KB compression strategy
- Disclaimer: Server-rendered via `getTranslations()` in page Server Component (AC-9 requirement)

**i18n:** New `cefrTest` namespace with 24 keys in all four locales (en, es, fr, vi). Includes C1+ explanation tooltip.

**Content Gap (Non-Blocking Follow-Up):**
- DB audit (current state): A1=12, A2=23, B1=30, B2=33, C1=4, **C2=0 exercises**
- This sprint ships with **B2 over-sampling** to fill C2 slots (8 questions vs. planned 6 if C2 existed)
- C2 band will always have `total: 0`, triggering C1+ labeling when C1 passes 60% threshold
- **Action item (parallel, non-blocking):** Content team to author C2 exercises (and additional C1). Once delivered:
  1. Update `CEFR_TARGET_COUNTS` constant in `/api/sample-test/cefr/start/route.ts`
  2. Remove or condition the C1+ special case in `computeCefrEstimate()` (return "C2" when C2 content exists and passes threshold)
  3. Add unit tests covering real C2 pass scenario in `tests/unit/cefr-estimation.test.ts`
- No blocking constraint; CEFR feature ships as-is with C1+ placeholder.

**Test Coverage:** Unit + E2E per spec in `plans/specs/cefr-test-spec.md`.

**See also:** `plans/specs/cefr-test-spec.md` for acceptance criteria, stratified sampling algorithm, CEFR estimation algorithm, and security notes.

---

## 2026-05-27 — Initial MVP Launch

**Status:** Complete

Core features shipped:
- User authentication (Credentials provider + JWT)
- Lesson delivery with progress tracking
- Exercise engine (MCQ, fill-in, matching, dictation)
- Practice section with per-exercise & per-skill analytics
- Streak tracking (minute-level activity time-series)
- Avatar system (disk-backed, server-streamed routes)
- Admin content import UI + bulk-upload support
- Rate limiting (in-memory, IP-based + user-based)
- Internationalization (4 locales: en, es, fr, vi)
- Unit + E2E test suite (Vitest + Playwright)

---

## Technical Notes

### Guest Session & Cookie Design

Both sample and CEFR tests use **stateless JWT-based guest sessions** to minimize server storage:

- **Cookie name:** `sample_test_result`
- **Signing:** HS256 via `AUTH_SECRET` (from `src/auth.ts`); uses `jose` library
- **TTL:** 30 minutes (`Max-Age=1800`); `exp` claim in payload validated on verify
- **Attributes:** `HttpOnly`, `SameSite=Lax`, `Secure` (production only)
- **Size constraint:** 4 KB browser limit enforced via tuple compression:
  - Exercise scores stored as `[slug, correct, total]` tuples, not objects
  - Guest answers stored as parallel array indexed by position in `questionCompositeIds`
  - Title, skill, level re-fetched from `Exercise` table at claim time and results-page render
- **Composite-key dedup:** Questions are unique only within an exercise (`q1`–`q5`). Cross-exercise operations use `${exerciseSlug}:${questionId}` keys throughout.

### Shared Infrastructure

Both tests leverage:
- `checkAnswer()` from `src/lib/exercise-scoring.ts` — shared answer validation
- `sample-test-jwt.ts` helpers — `signResultCookie()`, `verifyResultCookie()`
- `/api/sample-test/claim` endpoint — Distinguished by `testType` JWT field
- `RegisterForm.tsx` — Single claim call, branched redirect via `testType` response

### Why No Schema Changes

Both tests persist via the existing `ExerciseAttempt` model (one row per source exercise). No schema migration required; no new columns for test type or source flag. This is an **intentional product trade-off**: sample & CEFR attempts are indistinguishable from full exercise attempts in learner history.

### CEFR Estimation Confidence

The CEFR estimate is **a guide, not a formal assessment**:
- Pass threshold set at ≥60% per band (lower than formal pass to account for limited question counts)
- "Highest passing band" algorithm is simple to explain and robust to small sample sizes
- C1+ label honestly communicates the content gap (no C2 content yet)
- Alternative approaches (e.g. weighted band scoring, adaptive testing) require larger sample sizes — deferred to Phase 3+

