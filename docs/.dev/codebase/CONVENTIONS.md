# Code Conventions

**Analysis Date:** 2026-05-25

## Language & Compiler

- **TypeScript strict mode** (`tsconfig.json`), target ES2017, `moduleResolution: bundler`, path alias `@/*` → `src/*`.
- **ESLint flat config** (`eslint.config.mjs`) extending `next/core-web-vitals` and `next/typescript`.
- Verify with `npm run typecheck` (`tsc --noEmit`) and `npm run lint`.

## Server vs Client Components

- Server Components are the default. Add `"use client"` **only** when a component needs state, effects, events, browser APIs, or `useSession`.
- **Translations stay on the server.** Server components call `getTranslations()` and pass plain string `labels` props into client components. Client components do **not** call `getTranslations`.
- **Functions cannot cross the RSC boundary.** When a client form needs a pluralized/parameterized string, call `useTranslations` *inside* that client component rather than passing a formatter function as a prop. Example: `ProfileForm.tsx` does `const t = useTranslations("profile")` and calls `t("nativeLanguagesSummary", { n })` locally; only static strings come through `labels`.

```tsx
// page.tsx (server)            // ProfileForm.tsx (client)
const t = await getTranslations("profile");   "use client";
<ProfileForm labels={{                          const t = useTranslations("profile");
  country: t("country"),                        // static labels via props,
  countryNone: t("countryNone"),                // counted strings via local t()
}} />
```

## Naming

- **Files:** PascalCase for components (`DictationPlayer.tsx`), lowercase/kebab for libs (`api-auth.ts`, `user-analytics.ts`).
- **Functions/vars:** camelCase. **Types/interfaces/components:** PascalCase. **Constants:** SCREAMING_SNAKE for module-level config arrays (`GOAL_OPTIONS`, `COUNTRY_CODES`).
- **Route handlers:** exported HTTP verb functions (`export async function PATCH(req)`).

## API Route Handler Pattern

Every mutating handler follows the same shape:

```ts
export async function PATCH(req: Request) {
  const gate = await requireLearner();          // or requireAdmin()
  if ("error" in gate) return gate.error;       // 401/403 short-circuit
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);   // zod validation
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }
  const user = await prisma.user.update({ ... });
  return NextResponse.json({ ok: true, user });
}
```

- **Auth gating** via `requireLearner` / `requireAdmin` from `src/lib/api-auth.ts`.
- **Validation** via per-route **zod** schemas. Note the `nullableInt(min, max)` helper — number-or-empty unions must also accept `z.null()` because forms send `null` when a field is cleared. Enum-backed fields (country, language, goal codes) validate against the canonical lists in `src/lib/{countries,languages,learning-goals}.ts` and are normalized (upper/lowercased) before persistence.
- **Array fields stored as JSON strings** in `Text` columns (e.g. `learningGoals`, `nativeLanguages`) — `JSON.stringify` on write, `parseGoals` / `parseLanguages` on read.

## Error Handling & Feedback

- **All transient user feedback uses sonner toasts** (`toast.success` / `toast.error` / `toast.info`), rendered by the `<Toaster>` in the locale layout. There are no inline error/success paragraphs.
- Client `fetch` calls check `res.ok`, read `data.error` for the message, and toast accordingly.
- Failed `JSON.parse` of request bodies is swallowed with `.catch(() => null)` and turned into a 400.

## Styling

- **Tailwind CSS v4** with `@import "tailwindcss"` and an inline `@theme` block in `src/app/globals.css` — no `tailwind.config.ts`.
- **Brand palette via CSS variables:** `--brand` (#059669 emerald-600), `--brand-strong` (#065F46), `--brand-soft` (#A7F3D0), `--accent` (#0D9488 teal), `--surface` (#ECFDF5), `--border` (#BBF7D0). Use the `brand`/`surface`/`border` utility classes rather than raw hex.
- Logo is a text **"VE"** badge in `bg-brand` (no image logo).
- `CefrBadge` level→colour mapping (A1 emerald, A2 teal, B1 sky, …) is intentional and must be preserved.

## Testability Conventions

- **`data-testid` on interactive elements.** Specs select by test id (`getByTestId`), not by text/role where avoidable. Keep ids stable and descriptive (`profile-country`, `hero-avatar-trigger`, `lang-option-vi`, `goal-listening`).
- Toggle state is exposed via `aria-pressed` on goal chips so specs can assert persistence.

## Comments

- Comments are sparse and explain *why*, not *what* — typically flagging non-obvious decisions (e.g. why avatars are served via an API route, why animations are disabled in tests). Match this density; avoid narrating obvious code.

---

*Conventions analysis: 2026-05-25*
