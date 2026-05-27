---
phase: 03-refactor-tooling-environment
plan: 02
subsystem: ui
tags: [react, canvas, react-easy-crop, refactor, vitest, avatar]

# Dependency graph
requires:
  - phase: 01-baseline-stabilization-session-race-fix
    provides: committed profile/avatar/HeroAvatarMenu baseline that this refactor restructures
provides:
  - "src/lib/avatar-crop.ts — reusable, importable crop→JPEG-blob module (renderCroppedJpeg + pure cropDrawParams)"
  - "Slimmer HeroAvatarMenu.tsx consuming the extracted module; all 9 hero-avatar-* testids and behavior intact"
  - "tests/unit/avatar-crop.test.ts — node-env unit coverage of the crop geometry"
affects: [refactor, ui, avatar, testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Extract pure geometry (cropDrawParams) from browser-canvas side-effects (renderCroppedJpeg) so the math is unit-testable in node without a DOM/canvas"
    - "App code imports the new lib via @/ alias; unit tests use relative import (no @/ alias in vitest)"

key-files:
  created:
    - src/lib/avatar-crop.ts
    - tests/unit/avatar-crop.test.ts
  modified:
    - src/app/[locale]/profile/HeroAvatarMenu.tsx

key-decisions:
  - "Split renderCroppedJpeg into a pure cropDrawParams helper (returns the exact ctx.drawImage args + canvas dims) plus the canvas side-effect, so the testable seam runs in node without jsdom/canvas — identical draw call, zero behavior change"

patterns-established:
  - "Pure/impure split for browser-API logic: pure args computed by a testable function, side-effecting DOM call kept thin"

requirements-completed: [REF-01]

# Metrics
duration: 19min
completed: 2026-05-27
---

# Phase 03 Plan 02: Avatar Crop Logic Extraction Summary

**Extracted HeroAvatarMenu's canvas crop→JPEG pipeline into reusable `src/lib/avatar-crop.ts` (pure `cropDrawParams` + `renderCroppedJpeg`), unit-tested in node, with all 9 hero-avatar-* testids and runtime behavior preserved (REF-01 / LOW-8).**

## Performance

- **Duration:** 19 min
- **Started:** 2026-05-27T03:44:29Z
- **Completed:** 2026-05-27T04:04:27Z
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- Moved `renderCroppedJpeg` + private `loadImage` verbatim out of the 272-line `HeroAvatarMenu.tsx` into a focused `src/lib/avatar-crop.ts` module, resolving the multi-concern client component concern (REF-01 / LOW-8).
- Introduced a pure `cropDrawParams(area, outSize)` helper that returns the exact numeric `ctx.drawImage` args + canvas dimensions, isolating the crop geometry from the browser canvas so it is unit-testable in vitest's node env. `renderCroppedJpeg` consumes it, producing the identical draw call (same source rect, 256×256 output, JPEG quality 0.9).
- Added `tests/unit/avatar-crop.test.ts` (relative import, node env, no DOM/canvas) — 2 passing assertions on `cropDrawParams` (source-rect passthrough + outSize-controlled square).
- Proved zero behavior change: typecheck exit 0, full build exit 0, full unit suite 47/47, and the avatar/profile E2E specs (profile-avatar, avatar-api, avatar-menu) all green (5/5) against a production build.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract crop/canvas logic into src/lib/avatar-crop.ts and wire HeroAvatarMenu** - `8c09797` (refactor)
2. **Task 2: Unit-test the extracted crop logic** - `89159cf` (test)

_Note: Task 2 is a single `test` commit — the implementation (`cropDrawParams`) already existed from the Task 1 extraction by plan design, so the TDD RED step (failing-because-missing) did not apply; the test was added GREEN to lock in the extracted geometry._

## Files Created/Modified
- `src/lib/avatar-crop.ts` - Extracted, importable canvas crop logic: `renderCroppedJpeg` (canvas side-effect), `cropDrawParams` (pure geometry), private `loadImage` helper.
- `src/app/[locale]/profile/HeroAvatarMenu.tsx` - Now imports `renderCroppedJpeg` from `@/lib/avatar-crop`; local crop/loadImage functions removed. JSX, Props interface, exported name, and all 9 `hero-avatar-*` testids unchanged.
- `tests/unit/avatar-crop.test.ts` - Vitest unit coverage of `cropDrawParams` (relative import, node env).

## Decisions Made
- Split `renderCroppedJpeg` into a pure `cropDrawParams` helper + thin canvas side-effect so the crop math is testable in the node vitest env (no jsdom/canvas available). The refactor is behavior-preserving: the destructured params feed `ctx.drawImage` to yield the identical draw call as before.
- Kept the `type Area` import in HeroAvatarMenu (still used by `croppedArea`/`onCropComplete` state), and used the `@/` alias for the app-code import while the unit test uses a relative import per the vitest config (no `@/` alias).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- REF-01 (refactor large multi-concern client components) is satisfied for the avatar crop seam; `src/lib/avatar-crop.ts` is now a reusable unit if other components need crop→JPEG.
- No blockers. Phase 03 plans complete (03-01, 03-02). Ready for phase verification / transition.

## Self-Check: PASSED

All created files exist (src/lib/avatar-crop.ts, tests/unit/avatar-crop.test.ts, 03-02-SUMMARY.md) and HeroAvatarMenu.tsx is present. Both task commits (8c09797, 89159cf) found in git history.

---
*Phase: 03-refactor-tooling-environment*
*Completed: 2026-05-27*
