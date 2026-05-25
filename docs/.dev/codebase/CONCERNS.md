# Concerns

**Analysis Date:** 2026-05-25

Honest assessment of technical debt, fragile areas, and risks. Severity is relative to a local/self-hosted learning app, not a high-traffic production service.

## HIGH

### 1. `useSession()` race causes flaky E2E (and a real UX gap)
**Where:** `src/components/SaveWordButton.tsx`, `src/components/DictationPlayer.tsx`, `src/components/LessonRatingWidget.tsx`.
**Symptom:** these components early-return when `useSession()` status is anything other than `"authenticated"` (including `"loading"`). Specs `tests/e2e/{vocab,exercises,rating,progress}.spec.ts` register a user then immediately click; if the `/api/auth/session` fetch hasn't resolved, the click does nothing (no `/api/vocab` request fires) and the expected toast/UI change never appears. All 4 fail consistently in this environment.
**Also a real bug:** a fast human who clicks during session load gets a silent no-op or a misleading "sign in" toast.
**Fix direction:** treat `"loading"` distinctly (disable + spinner until resolved, then act), or have the spec `await` the session response before interacting. Don't gate the action on `=== "authenticated"` while still loading.

### 2. Developer-environment Node version mismatch
**Where:** system `node` is **v10.19.0**; the toolchain needs **v24** (only available by `source /home/thieunv/.claude/jobs/260ed33f/envrc.sh`, an nvm shim).
**Symptom:** `.claude/vibe/bin/vibe-tools.cjs` and friends crash on optional chaining (`SyntaxError: Unexpected token .`); `next`, `prisma`, `vitest`, `playwright` all require the newer Node. Any command run without sourcing the nvm env silently uses the wrong runtime.
**Risk:** confusing failures, broken migrations/builds for anyone who doesn't know the incantation.
**Fix direction:** add/commit `.nvmrc` (v24), document the env in README, or make scripts resolve Node via nvm. Consider removing the dependency on a hardcoded `jobs/<id>/envrc.sh` path (it's session-specific and will rot).

## MEDIUM

### 3. Runtime-uploaded avatars not served by `next start`
**Where:** `src/app/api/profile/avatar/route.ts` writes `public/avatars/<userId>.jpg`; served via `src/app/api/avatars/[userId]/route.ts`.
**Context:** `next start` does not reliably serve files added to `public/` after build, so a dedicated streaming route was added and `avatarUrl()` now returns `/api/avatars/<id>?v=<ts>` (`src/lib/avatar-server.ts`). Migration `20260524160324_profile_multi_native_lang` rewrites old `/avatars/*.jpg?v=` URLs.
**Residual risk:** uploads live on local disk only (not in DB/object storage) — they won't survive container/host replacement and don't scale horizontally. The read route sets `Cache-Control: private, max-age=0, must-revalidate`.

### 4. Screenshot capture hangs
**Where:** `scripts/capture-screenshots.mjs`, `scripts/capture-admin-screenshots.mjs`, and direct `page.screenshot()`.
**Symptom:** capture hangs after "fonts loaded" (both the CDP path and the Playwright API). Reference screenshots under `tests/screenshots/` cannot currently be regenerated.
**Likely cause:** system-wide Chromium/font issue in this environment, not app code.
**Fix direction:** investigate Chromium font config / headless flags; or capture with `--no-sandbox`/different font setup. Not blocking functionality.

### 5. No rate limiting on user-driven endpoints
**Where:** `src/app/api/{register,vocab,attempts,progress,ratings,heartbeat,profile,profile/avatar}/route.ts`.
**Risk:** registration spam, heartbeat/rating flooding, avatar upload abuse. Auth gates exist but no throttling.
**Fix direction:** add lightweight per-IP/per-user rate limiting (middleware or per-route).

### 6. Thin existence/ownership validation in tracking endpoints
**Where:** `src/app/api/progress/route.ts` accepts free-form `lessonSlug`/`category`/`title` strings with no check that the lesson exists; similar looseness likely in `attempts`. Means progress rows can reference non-existent content.
**Fix direction:** validate referenced lesson/exercise existence (or store FK ids) before writing analytics rows.

### 7. Weak password policy
**Where:** `src/app/api/register/route.ts` — `password: z.string().min(6)`.
**Risk:** 6-char minimum, no complexity/breach check.
**Fix direction:** raise minimum, optionally add a breached-password check; acceptable for a demo app but worth noting.

## LOW

### 8. Large multi-concern client components
**Where:** `src/components/DictationPlayer.tsx`, `src/components/ExerciseRunner.tsx`, `src/app/[locale]/profile/HeroAvatarMenu.tsx` (~270 lines, mixes menu + cropper + canvas + upload).
**Risk:** harder to test/maintain; cropper logic could be extracted.

### 9. Translation key drift risk
**Where:** four parallel catalogs `messages/{en,es,fr,vi}.json`. Adding a key requires editing all four by hand; nothing enforces parity.
**Fix direction:** a small CI check that all locales share the same key set.

### 10. JSON-in-Text columns instead of relational/JSON-typed fields
**Where:** `learningGoals`, `nativeLanguages` stored as JSON strings in `Text` columns; parsed with `parseGoals`/`parseLanguages`. Works, but unqueryable and unvalidated at the DB layer.

### 11. `src/generated/` is empty / reserved
Directory exists but is unused (Prisma client resolves from `node_modules`). Remove or document to avoid confusion.

## Security Notes
- Secrets live in `.env` (`DATABASE_URL`, `AUTH_SECRET`, etc.). `.env` should remain gitignored; only `.env.example` is committed. (No secret values were copied into these docs.)
- Auth uses JWT sessions; `isAdmin` is carried on the token and refreshed from DB on session-update — verify admin promotion/demotion propagates as expected.
- `requireLearner` deliberately 403s admins so admin accounts don't pollute learner analytics.

---

*Concerns analysis: 2026-05-25*
