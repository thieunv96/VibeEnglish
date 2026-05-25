# Testing

**Analysis Date:** 2026-05-25

## Frameworks

| Layer | Tool | Config | Location |
|---|---|---|---|
| Unit | **Vitest 4** (+ `@vitest/coverage-v8`) | `vitest.config.ts` | `tests/unit/*.test.ts` |
| E2E | **Playwright 1.60** (Chromium only) | `playwright.config.ts` | `tests/e2e/*.spec.ts` |

Commands: `npm test` (`vitest run`), `npm run e2e` (`playwright test`).

**DURABLE PROJECT RULE:** every UI-affecting change must end with a green Playwright run — `tsc`/unit tests alone are not sufficient.

## Unit Tests (Vitest)

- Config includes only `tests/unit/**/*.test.ts`, `environment: "node"`.
- **No `@/` path alias is configured for Vitest** — unit tests import with relative paths: `import { parseLanguages } from "../../src/lib/languages"`. Using `@/lib/...` in a unit test fails with "Cannot find package".
- Target: pure, Prisma-free domain logic. Current suites:
  - `segments.test.ts`, `dictation.test.ts` — dictation splitting/scoring
  - `analytics.test.ts`, `user-analytics.test.ts` — stats aggregation
  - `countries.test.ts`, `languages.test.ts` — ISO list integrity + lookups/parsers
- Pattern: `describe` / `it` with `expect`. Keep logic that needs unit coverage out of components and inside `src/lib/`.

## E2E Tests (Playwright)

**Config highlights (`playwright.config.ts`):**
- `testDir: ./tests/e2e`, `fullyParallel: false`, `workers: 1`, `retries: 0`.
- `timeout: 90s`, `expect.timeout: 15s`, `actionTimeout: 30s`, `navigationTimeout: 60s`.
- `baseURL: http://localhost:1998`.
- `trace: retain-on-failure`, `screenshot: only-on-failure`.
- `contextOptions.reducedMotion: "reduce"` — disables CSS animations so the "element stable" check isn't fooled by sub-pixel reflows.
- **Single `chromium` project** (`devices["Desktop Chrome"]`). WebKit is not installed; any mobile coverage must also use Chromium device descriptors.
- `webServer.command: "npm run start"` with `reuseExistingServer: true` — Playwright targets a **production** server on port 1998 (build first), reusing one if already running.

**Established patterns:**
- Select by `getByTestId(...)`.
- Use `click({ force: true })` to bypass false "stability" failures from animations/reflows.
- Register a fresh user per test with a unique email (`` `pr-${Date.now()}@example.com` ``), then `waitForURL(/\/profile/)`.
- Assert persistence by mutating → `profile-submit` → toast → `page.reload()` → re-check values/`aria-pressed`.
- API-only checks use `page.request` / the `request` fixture (e.g. `avatar-api.spec.ts` asserts 404/400 on `/api/avatars/...`).

**Spec inventory (`tests/e2e/`):** `home`, `auth`, `i18n`, `search`, `lessons-flow`, `dictation`, `exercises`, `progress`, `vocab`, `rating`, `heartbeat`, `mobile-nav`, `static-pages`, `profile`, `profile-redesign`, `profile-avatar`, `avatar-api`, `avatar-menu`, and admin specs (`admin-auth`, `admin-content-crud`, `admin-analytics`, `admin-lockout`). Shared seed constants in `tests/e2e/_fixtures.ts`.

## Mocking & Fixtures

- Minimal mocking — E2E runs against the real app + real MariaDB; tests create their own users/data through the UI/API.
- No network stubbing layer; avatar tests POST real (tiny) JPEG bytes.

## Known Test Fragility

- **`useSession()` race (4 specs):** `vocab`, `exercises`, `rating`, `progress` can fail because `SaveWordButton` / `DictationPlayer` / `LessonRatingWidget` bail when session status is still `"loading"` at click time, and the test clicks before the `/api/auth/session` fetch resolves. The mutation never fires, so the expected UI change/toast never appears. See `CONCERNS.md`.
- **Stale `next-server`:** a leftover production server on port 1998 (from `reuseExistingServer: true`) running old code is the #1 cause of mysterious failures — kill it before re-running.
- **Screenshot capture** (`scripts/capture-screenshots.mjs` and `page.screenshot()`) currently hangs after "fonts loaded" in this environment; regenerating reference screenshots is blocked. See `CONCERNS.md`.

## Coverage

- `@vitest/coverage-v8` is available (`vitest run --coverage`); no enforced threshold is configured.

---

*Testing analysis: 2026-05-25*
