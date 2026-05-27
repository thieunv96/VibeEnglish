# VibeEnglish — Audit & Hardening Milestone

## What This Is

VibeEnglish is a self-hosted, full-stack English-learning web app (Next.js 15 App Router + MariaDB via Prisma, Auth.js v5, next-intl in en/es/fr/vi). Learners register, work through database-driven lessons (browser TTS dictation), practice exercises, save vocabulary, rate lessons, and track streaks/progress; admins manage content and view analytics. **This milestone is not new product work** — it is a brownfield audit/hardening pass: review the existing codebase, refactor and fix bugs across the documented concern list, stabilize the in-progress profile/avatar/multi-language work, and prove the whole thing works via a green end-to-end test suite.

## Core Value

The app builds, runs, and demonstrably works end-to-end — every documented concern is resolved and the full Playwright E2E suite passes against a production build.

## Requirements

### Validated

<!-- Existing, working capabilities inferred from the codebase map (docs/.dev/codebase/). -->

- ✓ Localized UI in en/es/fr/vi with `as-needed` locale prefixing and searchParams-preserving switcher — existing
- ✓ Email/password auth (Auth.js v5, JWT sessions, bcrypt), register + login + session persistence — existing
- ✓ Learner/admin role gating via `requireLearner`/`requireAdmin` — existing
- ✓ Database-driven lessons with browser Web Speech API TTS dictation + scoring — existing
- ✓ Practice exercises with attempt tracking — existing
- ✓ Saved vocabulary, lesson star ratings, learning history — existing
- ✓ Profile (hero, stats, multi-native-language, learning goals) + avatar upload/crop served via streaming API route — existing (in-progress, uncommitted)
- ✓ Activity heartbeats feeding streak/active-minute analytics — existing
- ✓ Admin dashboard: content CRUD + analytics + role lockout — existing
- ✓ Vitest unit suite (pure domain logic) + Playwright E2E suite (Chromium, production server on :1998) — existing

### Active

<!-- This milestone's scope: resolve every concern in docs/.dev/codebase/CONCERNS.md + stabilize WIP + prove it works. -->

- [ ] Stabilize and commit the in-progress profile/avatar/multi-native-language work as a clean baseline
- [ ] Fix the `useSession()` "loading" race that silently no-ops mutations and breaks 4 E2E specs (HIGH-1)
- [ ] Resolve dev-environment Node version mismatch: commit `.nvmrc`, document setup, drop the session-specific envrc path dependency (HIGH-2)
- [ ] Harden runtime avatar serving / document its local-disk persistence limitation (MED-3)
- [ ] Restore screenshot capture or document/route around the headless-Chromium hang (MED-4)
- [ ] Add lightweight rate limiting to user-driven endpoints (MED-5)
- [ ] Validate lesson/exercise existence & ownership in tracking endpoints (MED-6)
- [ ] Strengthen the password policy (MED-7)
- [ ] Refactor large multi-concern client components (MED/LOW-8)
- [ ] Add a translation key-parity check across the four locale catalogs (LOW-9)
- [ ] Address JSON-in-Text columns (`learningGoals`, `nativeLanguages`) — validate or restructure (LOW-10)
- [ ] Remove or document the empty/reserved `src/generated/` directory (LOW-11)
- [ ] Demo the finish line: full Playwright E2E suite green against a production build, with at least one feature verified working on `/`

### Out of Scope

<!-- Explicit boundaries for this milestone. -->

- New features / new learning content — this is a stabilization pass, not product expansion
- Migrating avatars to object storage / horizontal-scale infra — documented as a known limitation, not fixed here (single self-hosted instance)
- WebKit / Safari E2E coverage — Chromium-only is the established, deliberate test setup
- Production deployment / CI pipeline build-out — local self-hosted target; CI parity check is the only CI-adjacent item in scope
- Auth provider expansion (OAuth, magic link, 2FA) — email/password is sufficient for this app

## Context

- **Codebase map exists** at `docs/.dev/codebase/` (analyzed 2026-05-25): ARCHITECTURE, STACK, STRUCTURE, CONVENTIONS, INTEGRATIONS, TESTING, CONCERNS. CONCERNS.md is the authoritative punch-list for this milestone.
- **Environment reality (verified 2026-05-27):** Node v24.14.1 + npm 11 are active in this session (the HIGH-2 mismatch does not bite here, but the `.nvmrc`/docs gap is real for other environments). MariaDB 11 is up and healthy in Docker on host port 3307. No stale server on :1998.
- **28 uncommitted changes** are in the working tree: the profile redesign, avatar upload pipeline, multi-native-language picker, ratings, and supporting tests/migrations. User decision: stabilize and commit these as a clean baseline before/within the audit.
- **Test discipline:** every UI-affecting change must end with a green Playwright run — `tsc`/unit tests alone are insufficient. E2E runs against a production build (`npm run build` then `npm run start`); a stale `next-server` on :1998 is the #1 cause of false failures — kill it before re-running.
- **Known E2E fragility:** the `useSession()` race makes `vocab`, `exercises`, `rating`, `progress` specs flaky; screenshot capture currently hangs after "fonts loaded".

## Constraints

- **Tech stack**: Next.js 15.5 / React 19 / TypeScript 5 / Prisma 6 / MariaDB 11 / Auth.js v5 / next-intl v4 / Tailwind v4 — fixed; do not introduce parallel frameworks.
- **Runtime**: Node.js 24+ required (optional chaining, modern syntax) — toolchain crashes on older Node.
- **Testing**: Vitest unit tests import via relative paths (no `@/` alias configured); Playwright is Chromium-only and targets a production server on :1998.
- **i18n**: any new translatable string must be added to all four `messages/{en,es,fr,vi}.json` catalogs.
- **Persistence**: MariaDB via Prisma only; schema changes go through `prisma migrate dev`.
- **Compatibility**: don't break the established server→client `labels`-prop pattern or the `requireLearner`/`requireAdmin` gate contract.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Audit scope = all 11 concerns (HIGH+MEDIUM+LOW) | User chose full coverage, not just critical | — Pending |
| Stabilize & commit the 28 WIP changes | Establish a clean, verifiable baseline before/within hardening | — Pending |
| Finish line = full green Playwright E2E suite vs production build | "Demo at least 1 feature on /" → automated end-to-end proof | — Pending |
| Avatar object-storage migration explicitly deferred | Single self-hosted instance; document limitation instead of over-engineering | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/vibe-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/vibe-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-27 after initialization*
