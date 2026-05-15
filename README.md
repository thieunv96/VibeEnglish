# Vibe English

> Tự do học, tự tin nói.
> Nền tảng học tiếng Anh cá nhân hoá dựa trên AI, build theo `startup/CONTEXT.md`.

## Stack

| Layer | Choice |
|---|---|
| Repo | pnpm monorepo (`/web` Next.js, `/worker` placeholder cho pipeline AI ở pha 2) |
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind v4 · shadcn/ui · Radix primitives |
| Database | MariaDB 11 (Docker) · Drizzle ORM |
| Auth | Auth.js v5 — Credentials (argon2) + Google OAuth (optional) |
| AI client | OpenAI-compatible SDK (cấu hình tại `/admin/ai-settings` → trỏ tới vLLM endpoint) |

Pha 1 đã xong:
- Toàn bộ 10 màn theo `startup/CONTEXT.md` §5
- Schema DB đầy đủ (25 bảng) cho user + content + admin + AI
- Auth + session + middleware
- Stub AI service layer — khi đã cấu hình `/admin/ai-settings` thì gọi vLLM thật, chưa cấu hình thì trả mock data deterministic
- Seed data realistic để mọi screen render đẹp

## Yêu cầu môi trường

- Node ≥ 20 (đang test trên `nvm` 24.14.1)
- pnpm ≥ 11
- Docker + Docker Compose (cho MariaDB)

## Chạy lần đầu

```bash
# 1. MariaDB (port 13307 để tránh đụng port mặc định)
docker compose up -d mariadb

# 2. Cài deps cho cả workspace
pnpm install

# 3. Copy env mẫu — file /web/.env đã được commit sẵn cho dev
#    (chỉnh nếu cần Google OAuth)
cp .env.example web/.env   # nếu chưa tồn tại

# 4. Push schema Drizzle (sẽ tạo 25 bảng)
pnpm db:push

# 5. Seed dữ liệu demo
pnpm db:seed

# 6. Chạy dev
pnpm dev
```

Mở http://localhost:3000

### Demo accounts (sau khi seed)
- **Admin:** `admin@vibeenglish.local` / `vibevibe`
- **User:** `demo@vibeenglish.local` / `vibevibe`

## Cấu hình AI (vLLM / OpenAI-compatible)

Login bằng admin → `/admin/ai-settings`. Form có 3 nhóm:

1. **Chat / Generation** — vLLM endpoint OpenAI-compatible (`/v1`), API key, và model names cho chat / scoring / embedding
2. **Speech-to-text** — Whisper hoặc tương đương (dùng pha 2 cho transcribe video + speaking)
3. **Text-to-speech** — Tạo audio mẫu cho bài Speaking

Cấu hình lưu trong DB (bảng `ai_settings`) và có thể đổi bất kỳ lúc nào — không cần restart. Nút "Test kết nối" gọi thật `chat.completions.create` với prompt 1 token để verify.

Khi `baseUrl`/`apiKey` để trống → tất cả AI service rơi về stub deterministic (không lỗi).

## Cấu trúc thư mục

```
.
├── docker-compose.yml          # MariaDB service
├── pnpm-workspace.yaml
├── package.json                # Root scripts
├── startup/CONTEXT.md          # Spec gốc
├── web/                        # Next.js app
│   ├── app/
│   │   ├── auth/               # Màn 1
│   │   ├── onboarding/         # Màn 2 (6 bước)
│   │   ├── page.tsx + _library # Màn 3 (Content Library Dashboard)
│   │   ├── lessons/[id]/       # Màn 4 (Video + Transcript + 3 tab exercises)
│   │   ├── lessons/[id]/result # Màn 5 (Celebration + delta)
│   │   ├── profile/            # Màn 6
│   │   ├── settings/           # Màn 7
│   │   ├── feedback/           # Màn 8
│   │   ├── help/               # Màn 9
│   │   └── admin/              # Màn 10 (Dashboard + 10 sub-sections)
│   ├── components/
│   │   ├── ui/                 # shadcn primitives
│   │   ├── brand/              # Logo
│   │   ├── icons/              # Google, GitHub
│   │   ├── top-nav.tsx
│   │   └── lesson-card.tsx
│   ├── db/
│   │   ├── schema.ts           # 25 bảng + custom JSON type (MariaDB-aware)
│   │   ├── index.ts            # Drizzle pool
│   │   └── seed.ts             # Demo data
│   ├── lib/
│   │   ├── ai/index.ts         # AI service layer (vLLM client + stub fallback)
│   │   ├── data.ts             # Server queries
│   │   ├── constants.ts        # 10 goals, 10 industries, CEFR, types
│   │   └── utils.ts
│   ├── auth.ts                 # Auth.js v5 setup
│   ├── auth.config.ts          # Edge-safe (middleware)
│   ├── middleware.ts
│   └── drizzle.config.ts
└── worker/                     # Placeholder cho pha 2 (YouTube → AI pipeline)
```

## Database schema

Drizzle ORM với MariaDB. 25 bảng:

| Group | Tables |
|---|---|
| Auth | `users`, `accounts`, `sessions`, `verification_tokens` |
| User profile | `onboarding_profiles`, `user_progress`, `skill_scores`, `user_badges` |
| Content | `series`, `videos`, `transcript_segments`, `lessons`, `exercises`, `quiz_questions` |
| Attempts | `lesson_attempts`, `exercise_responses` |
| Gamification | `badges` |
| Feedback | `reports`, `feedback` |
| Help CMS | `help_categories`, `help_articles`, `help_votes` |
| AI ops | `ai_settings` (singleton), `ai_jobs` (audit log), `content_intel_suggestions` |

> ⚠️ MariaDB lưu JSON dưới dạng LONGTEXT. Trong Drizzle schema, type `json()` được wrap bằng `customType` (`db/schema.ts`) để tự parse/stringify — không cần xử lý thủ công ở caller.

## Trạng thái pha 1 vs pha sau

| Tính năng | Pha 1 (xong) | Pha 2 | Pha 3 |
|---|---|---|---|
| Onboarding flow | ✅ Static placement bank | AI customize quiz theo mục tiêu | — |
| Content Library | ✅ Heuristic recommendation | Recommendation engine + embedding | — |
| Lesson Detail (video + transcript sync) | ✅ YouTube IFrame API | — | — |
| Quiz scoring | ✅ Stub (đếm đúng/sai) | — | LLM giải thích sâu |
| Writing scoring | ✅ Stub + chuẩn bị gọi LLM thật | Wire LLM annotate lỗi | — |
| Speaking scoring | ✅ Stub deterministic | — | Speechace/Azure tích hợp |
| Lesson Queue admin | ✅ Approve/Reject thủ công | — | — |
| Video Manager | ✅ UI + DB | YouTube Data API + ingest pipeline | — |
| Content Intelligence | ✅ Seed sample suggestions | AI tự sinh suggestion từ data | — |
| Help CMS | ✅ Read-only | CRUD UI | — |
| AI Settings | ✅ Full form + test kết nối | — | — |

## Scripts root

```bash
pnpm dev           # Start Next.js dev (port 3000, hoặc 3001 nếu busy)
pnpm build         # Production build
pnpm start         # Production server
pnpm db:up         # docker compose up -d mariadb
pnpm db:down       # docker compose down
pnpm db:push       # Push schema (drizzle-kit push)
pnpm db:studio     # Mở Drizzle Studio
pnpm db:seed       # Reset + seed demo data
```

## E2E testing (Playwright)

```bash
pnpm --filter web test:e2e        # Run all e2e specs (cần dev/prod server đang chạy)
pnpm --filter web test:e2e:ui     # Mở Playwright UI inspector
pnpm --filter web test:e2e:debug  # Step-through debug mode
```

64 test cases trải đều 10 màn hình theo CONTEXT.md §5. Chạy headless Chromium, ~45s. Yêu cầu:
1. MariaDB up (`pnpm db:up`)
2. DB đã seed (`pnpm db:seed`)
3. Server đang chạy ở `E2E_BASE_URL` (mặc định `http://localhost:3001`). **Khuyến nghị production build** (`pnpm build && PORT=3001 pnpm --filter web start`) vì HMR dev server có thể gây flaky.

Specs tổ chức theo screen:
- `tests/e2e/01-auth.spec.ts` — 9 test login/register/social
- `tests/e2e/02-onboarding.spec.ts` — 2 test full-flow + skip-quiz
- `tests/e2e/03-library.spec.ts` — 9 test TopNav/hero/filter/search/grid-list
- `tests/e2e/04-lesson-detail.spec.ts` — 9 test video+transcript+3 tab exercises
- `tests/e2e/05-result-profile-settings.spec.ts` — 13 test 3 màn cuối user
- `tests/e2e/06-feedback-help.spec.ts` — 9 test feedback form + help FAQ
- `tests/e2e/07-admin.spec.ts` — 13 test admin panel + AI Settings

## Lỗi thường gặp

**Port 13307 đang bận** — đổi `docker-compose.yml` + `web/.env`.

**`mariadb` healthcheck pending** — đợi ~10 giây sau `docker compose up`, MariaDB cần thời gian khởi tạo lần đầu.

**Argon2 build fail trên Linux** — `pnpm rebuild argon2` (cần `python3` + `build-essential`).

**Google OAuth không xuất hiện** — chưa set `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` trong `web/.env`. Để trống là OK, sẽ chỉ hiện nút Credentials.

**Lesson detail trả 500 với "q.options.map is not a function"** — schema custom JSON type chưa kích hoạt, đảm bảo restart dev server sau khi sửa `db/schema.ts`.
