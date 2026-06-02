# Project Changelog

All notable changes to VibeEnglish are documented here. Date format: YYYY-MM-DD.

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

