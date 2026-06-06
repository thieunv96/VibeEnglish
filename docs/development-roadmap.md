# Development Roadmap

## Overview

VibeEnglish is a full-stack English learning platform with adaptive lessons, vocabulary practice, streak tracking, and conversational features. This roadmap tracks the major phases and milestones from initial MVP through advanced features.

---

## Phase 1: MVP & Core Infrastructure (Completed)

**Status:** Complete (May 2026)

- Authentication & user management (Credentials + JWT)
- Lesson delivery with progress tracking
- Exercise engine (MCQ, fill-in, matching, dictation)
- Practice section with performance analytics
- Streak tracking (minute-level activity)
- Avatar system (disk-backed, server-streamed)
- Rate limiting (in-memory)
- Internationalization (4 locales: en, es, fr, vi)
- Admin content import & bulk management
- E2E test suite (Playwright)

---

## Phase 2: Conversion & Guest Features + Exam-Prep Mocks (In Progress)

**Status:** Complete (June 2026)

### 2a. Sample Test (10-Question Guest Test)
- **Route:** `GET/POST /[locale]/sample-test` + `/[locale]/sample-test/results`
- **Features:**
  - 10-question random sampler for unauthenticated guests
  - Raw score teaser (signup gate before full results)
  - Per-skill breakdown & per-question review for authenticated users
  - Lesson recommendations based on weakest skill
  - Automatic attempt logging via `/api/sample-test/claim` post-signup
- **Infrastructure:**
  - `src/lib/exercise-scoring.ts` — shared `checkAnswer()` + `normalize()`
  - `src/lib/sample-test-jwt.ts` — HS256 JWT helpers for session & result cookies
  - Shared cookie design: 4 KB size limit, tuple-compressed payloads
  - `/api/sample-test/{start,submit,claim}` endpoints
- **Completed:** June 2026

### 2b. CEFR Placement Test (25-Question Stratified Test)
- **Route:** `GET/POST /[locale]/sample-test/cefr` + `/[locale]/sample-test/cefr/results`
- **Features:**
  - 25-question stratified sampler across CEFR levels (A1–C2)
  - CEFR-level estimation with C1+ labeling (when C2 content absent)
  - Per-level breakdown & server-rendered disclaimer
  - Identical signup-gate pattern to sample test
  - Shared `/api/sample-test/claim` endpoint (branched by `testType`)
- **Infrastructure:**
  - `src/lib/cefr-estimation.ts` — `computeCefrEstimate(levelScores): CefrEstimate`
  - `src/lib/cefr-sampling.ts` — stratified sampling with composite-key dedup
  - `CEFR_TARGET_COUNTS` distribution: A1=4, A2=4, B1=5, B2=8, C1=4, C2=0
  - Result cookie extended with `testType`, `levelScores`, `cefrEstimate`
  - `/api/sample-test/cefr/{start,submit}` endpoints
- **Content Gap (Non-Blocking Follow-Up):** C2 exercises = 0. B2 over-samples to fill. C1+ label signals gap. Content team to deliver C2 + additional C1 in parallel workstream.
- **Completed:** June 2026

### 2c. Exam-Prep Listening Mocks V1 (TOEIC / TOEFL / IELTS / OET)
- **Route:** `GET/POST /[locale]/test-prep/[exam]/mock`
- **Features:**
  - Listening-only mock tests (25 questions each) for 4 exams
  - Single-page state machine (idle → running → results inline)
  - Band estimation per exam (placeholder thresholds, pending SME sign-off NQ-1)
  - Atomic persistence: one `MockTestAttempt` parent + N `ExerciseAttempt` children in single transaction
  - Admin analytics page (`/admin/test-prep`) with per-exam stats + band distribution histogram
  - JWT session binding prevents cross-exam replay attacks
- **Infrastructure:**
  - New `MockTestAttempt` model with `(userId, exam, completedAt)` + `(exam, completedAt)` indices
  - `Exercise.exam String?` column + `ExerciseAttempt.attemptType` enum (tracks "practice", "sample", "cefr", "mock")
  - `src/lib/test-prep-bands.ts` — Per-exam band estimation (currently placeholder values)
  - `src/lib/test-prep-content.ts` — Listening-only question sampler by exam
  - `src/lib/test-prep-progress.ts` — Exam progress aggregator
  - `src/lib/test-prep-admin-analytics.ts` — Admin dashboard aggregates
  - `src/lib/shuffle.ts` — Extracted Fisher-Yates utility (reused by sample-test + test-prep)
  - `/api/test-prep/[exam]/mock/{start,submit}` endpoints + `/api/admin/test-prep/analytics`
  - `testPrep` i18n namespace added to all 4 locales (es/fr/vi = English placeholders pending translation)
- **Non-Blocking Follow-Ups:**
  - **NQ-1:** Band threshold SME sign-off (current values placeholders)
  - **NQ-3, NQ-5:** Reading mock + IELTS Academic/General Training split (V2)
  - **PQ-3:** `/api/test-prep/[exam]/progress` route if needed by client
  - **Translation:** es/fr/vi for `testPrep` namespace
- **Completed:** June 2026

---

## Phase 3: Advanced Features (Planned)

### 3a. Adaptive Difficulty & Personalized Learning Paths
- Lesson recommendations based on CEFR level
- Adaptive exercise difficulty based on performance
- Spaced repetition for vocabulary retention
- Learning goals integration with content filtering

### 3b. Vocabulary Mastery
- Spaced-repetition review scheduling
- Flashcard-style practice
- Progress milestones & achievement badges

### 3c. Social & Gamification
- Leaderboards (weekly, monthly)
- Community challenges
- Social sharing of achievements

---

## Key Technical Decisions

1. **No schema changes for guest tests** — Sample & CEFR tests persist via existing `ExerciseAttempt` model. No source flag or new columns.

2. **JWT-based guest sessions** — Stateless, signed cookies (`AUTH_SECRET` + HS256) reduce server storage. 30-min TTL.

3. **Composite-key dedup in CEFR sampling** — Questions are unique only within an exercise (q1–q5). Cross-exercise dedup uses `${exerciseSlug}:${questionId}` throughout the session, cookie, and result pages.

4. **Slim result-cookie design** — Payload compressed to `[slug, correct, total]` tuples + parallel answer array to stay under 4 KB browser limit. Title/skill/level re-fetched from DB at claim time.

5. **C2 content gap** — Accepted trade-off for MVP delivery. When C2 exercises are authored, `CEFR_TARGET_COUNTS` and estimation logic updated. No C1+ label when C2 exists.

6. **Shared `/api/sample-test/claim`** — Single endpoint, branched by `testType` field (JWT-protected). Eliminates duplication of SEC-03 checks and attempt-write logic.

---

## Milestones & Dates

| Milestone | Target | Status |
|-----------|--------|--------|
| MVP Launch (Phase 1) | May 2026 | ✓ Complete |
| Sample Test (10-Q) | June 2026 | ✓ Complete |
| CEFR Test (25-Q) | June 2026 | ✓ Complete |
| Exam-Prep Listening Mocks V1 (Phase 2c) | June 2026 | ✓ Complete |
| Adaptive Lessons (Phase 3a) | TBD | Planned |
| Vocabulary Mastery (Phase 3b) | TBD | Planned |
| Leaderboards & Gamification (Phase 3c) | TBD | Planned |

---

## Open Items

- **C2 & C1 content delivery** (non-blocking): Content team to author additional C1 and C2 exercises. Once available, update `CEFR_TARGET_COUNTS` in start route and remove C1+ special case from estimation logic. See `docs/project-changelog.md` for detailed notes on the content gap.

