---
phase: 03-refactor-tooling-environment
plan: 01
subsystem: infra
tags: [nvm, node24, playwright, screenshots, i18n, next-intl, vitest, docs]

# Dependency graph
requires:
  - phase: 02-security-validation
    provides: rate limiting, password policy, existence checks (clean baseline to document)
provides:
  - .nvmrc pinning Node 24 for deterministic local setup
  - Real README documenting nvm/MariaDB-Docker/env vars/commands and avatar persistence limitation
  - Hard-timeout guard on both screenshot scripts (Promise.race, non-zero exit, no hang)
  - Removal of the empty reserved src/generated directory
  - Deep i18n key-parity unit test across en/es/fr/vi catalogs
affects: [verification, e2e-gate, future-i18n-edits, screenshot-regeneration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Promise.race hard-timeout guard with finally-close + non-zero exit for hang-prone external tooling"
    - "Deep recursive dotted-key comparison for locale-catalog parity, asserted with offending keys named"
key-files:
  created:
    - .nvmrc
    - tests/unit/i18n-parity.test.ts
  modified:
    - README.md
    - scripts/capture-screenshots.mjs
    - scripts/capture-admin-screenshots.mjs

key-decisions:
  - "rmdir src/generated rather than a marker file (Prisma resolves from node_modules; .gitignore already covers /src/generated/prisma)"
  - "Parity test reads catalogs via fs.readFileSync + JSON.parse with relative paths (avoids resolveJsonModule / @ alias issues under vitest node env)"
  - "Screenshot timeout default 60s, overridable via SCREENSHOT_TIMEOUT_MS"

patterns-established:
  - "Hang-prone scripts: wrap the run in Promise.race against a timeout, always close the browser in finally, exit(1) with a diagnostic that points to README/CONCERNS"
  - "i18n drift guard: deepKeys() recurses plain objects to dotted paths; assertion message lists missing/extra keys so failures are actionable"

requirements-completed: [ENV-01, ENV-02, ENV-03, ENV-04, REF-02, REF-03]

# Metrics
duration: 3min
completed: 2026-05-27
---

# Phase 03 Plan 01: Tooling, Environment, Docs & i18n Parity Summary

**Pinned Node 24 via .nvmrc, rewrote the README into real setup docs (nvm/MariaDB-Docker/env/commands + avatar local-disk limitation), made both hang-prone screenshot scripts fail loudly via a Promise.race timeout, removed the empty src/generated dir, and added a deep en/es/fr/vi key-parity test (45/45 unit green).**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-27T03:39:04Z
- **Completed:** 2026-05-27T03:42:01Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- **ENV-01:** Committed `.nvmrc` (`24`) so `nvm use` activates Node 24 deterministically; resolves the HIGH-2 version mismatch for fresh environments.
- **ENV-04:** Removed the empty reserved `src/generated/` directory (LOW-11).
- **ENV-03:** Both `scripts/capture-{screenshots,admin-screenshots}.mjs` now wrap the capture run in a `Promise.race` against a `SCREENSHOT_TIMEOUT_MS` (default 60s) timeout — on timeout they print a clear diagnostic, always close the browser in `finally`, and `process.exit(1)`. Verified empirically: a 1ms timeout exits non-zero with no zombie Chromium (MED-4).
- **REF-02:** Added `tests/unit/i18n-parity.test.ts` — a deep recursive (269 dotted keys, not 24 top-level) comparison asserting es/fr/vi have zero missing and zero extra keys vs en. Verified to fail (naming the offending key) on injected drift, and passes today (LOW-9).
- **ENV-02 / REF-03:** Rewrote stock `create-next-app` README into accurate setup docs — Node 24 via `nvm use`, MariaDB 11 via `npm run db:up` on :3307, the four env vars, dev/test/build/e2e commands on :1998, and an avatars/persistence section documenting local-disk serving via `/api/avatars/<id>`, the `next start` limitation, the INFRA-01 deferral, and the two E2E specs that verify it. No `envrc.sh` path, no `localhost:3000` boilerplate.

## Task Commits

Each task was committed atomically:

1. **Task 1: Pin Node, remove src/generated, guard screenshot scripts** - `f218a4c` (chore)
2. **Task 2: Add deep locale key-parity unit test** - `a2b93bc` (test)
3. **Task 3: Rewrite README + document avatar serving/persistence** - `ab1c26c` (docs)

_Note: Task 2 was `tdd="true"`. The catalogs already have full parity, so the test passes today by design (no separate RED data state); TDD discipline was satisfied by verifying the test fails on injected drift before committing — a single `test` commit._

## Files Created/Modified

- `.nvmrc` - Pins Node 24 for nvm.
- `tests/unit/i18n-parity.test.ts` - Deep recursive key-parity check across the four locale catalogs.
- `README.md` - Real project setup (nvm/MariaDB Docker/env/commands) + avatar local-disk serving and persistence limitation.
- `scripts/capture-screenshots.mjs` - Added Promise.race timeout guard, finally-close, non-zero exit, and a top-of-file note about the headless-Chromium font hang.
- `scripts/capture-admin-screenshots.mjs` - Same timeout guard; wrapped login + admin loop + profile shot in the race.

## Decisions Made

- `rmdir src/generated` over a marker file — the dir is unused (Prisma resolves from `node_modules`; `.gitignore` already covers `/src/generated/prisma`).
- Parity test loads catalogs via `fs.readFileSync` + `JSON.parse` with relative paths instead of JSON imports — sidesteps any `resolveJsonModule`/`@` alias concern under the vitest node-env config; matches the existing relative-import convention.
- Screenshot timeout default 60s, env-overridable via `SCREENSHOT_TIMEOUT_MS`.

## Deviations from Plan

None - plan executed exactly as written.

Note: the plan prose referenced "297 nested keys" while the actual deep count is 269. This is cosmetic — the parity test compares es/fr/vi against `en` dynamically, so the literal number is irrelevant and no catalog edits were made. A recursion sanity-check assertion (`enKeys.length > top-level count` and `> 100`) guards against the deepKeys helper silently regressing to top-level-only.

## Issues Encountered

None. Pre-existing untracked artifacts in the working tree (`.gitignore` Vibe-docs change, `tests/screenshots/home.png` and `lesson.png`) were left untouched as out-of-scope for this plan; only the five task files were staged/committed.

## User Setup Required

None - no external service configuration required. (The README now documents the local `nvm use` / `npm run db:up` / `.env` setup a developer performs themselves.)

## Verification Results

- `test -f .nvmrc && grep -qx "24" .nvmrc` — PASS (ENV-01)
- `test ! -d src/generated` — PASS (ENV-04)
- `node --check` both scripts + both contain `Promise.race` + `process.exit(1)`; 1ms-timeout run exits non-zero with no hang — PASS (ENV-03)
- `npm test -- i18n-parity` — 7/7 PASS (REF-02)
- README greps (nvm use, db:up, 3307, 1998, DATABASE_URL, AUTH_SECRET, api/avatars, local disk; no envrc.sh, no localhost:3000) — PASS (ENV-02/REF-03)
- `npm test` (full suite) — 45/45 PASS (was 38; +7 parity)
- `npm run typecheck` — exit 0

## Next Phase Readiness

- Toolchain pinned and documented; a fresh developer can set up deterministically.
- i18n parity is now enforced by `npm test`, catching future catalog drift.
- Screenshot scripts can no longer hang the process; the underlying headless-Chromium font hang remains an environment issue (documented in README/CONCERNS, not blocking functionality).
- REF-03 runtime avatar serving is exercised by the existing `avatar-api` + `profile-avatar` E2E specs — to be confirmed green in the phase E2E gate (this plan does not modify those specs).
- Plan 03-02 is the remaining plan in this phase.

## Self-Check: PASSED

All created files exist (`.nvmrc`, `tests/unit/i18n-parity.test.ts`, `README.md`, both screenshot scripts, this SUMMARY); `src/generated/` confirmed removed; all three task commits (`f218a4c`, `a2b93bc`, `ab1c26c`) present in git history.

---
*Phase: 03-refactor-tooling-environment*
*Completed: 2026-05-27*
