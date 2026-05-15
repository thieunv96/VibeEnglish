import { sql } from "drizzle-orm";
import {
  mysqlTable,
  varchar,
  int,
  text,
  mediumtext,
  timestamp,
  boolean,
  mysqlEnum,
  index,
  primaryKey,
  uniqueIndex,
  double,
  customType,
} from "drizzle-orm/mysql-core";

// MariaDB's JSON is LONGTEXT under the hood — mysql2 returns it as a string
// because prepared-statement metadata never reports it as MySQL JSON. We wrap
// the column type so reads parse and writes stringify automatically.
const jsonCol = <T = unknown>(name: string) =>
  customType<{ data: T; driverData: string }>({
    dataType() {
      // Use LONGTEXT (not "json") so Drizzle's built-in JSON handling stays out
      // of the way — we control parse/stringify in fromDriver/toDriver below.
      return "longtext";
    },
    toDriver(v) {
      return JSON.stringify(v);
    },
    fromDriver(v) {
      if (v == null) return v as T;
      if (typeof v === "string") {
        if (v === "") return null as unknown as T;
        try {
          return JSON.parse(v) as T;
        } catch {
          return v as unknown as T;
        }
      }
      return v as T;
    },
  })(name);
const json = jsonCol;

// ---------- Auth.js core tables ----------

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { fsp: 3 }),
  image: varchar("image", { length: 500 }),
  // base64 data-URI of 128x128 PNG. Only latest is kept (overwritten).
  // MEDIUMTEXT fits any 128x128 PNG including complex photos.
  avatarData: mediumtext("avatar_data"),
  locale: mysqlEnum("locale", ["vi", "en"]).notNull().default("vi"),
  yearOfBirth: int("year_of_birth"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  passwordHash: varchar("password_hash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).notNull().default("user"),
  createdAt: timestamp("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export const accounts = mysqlTable(
  "accounts",
  {
    userId: varchar("user_id", { length: 36 }).notNull(),
    type: varchar("type", { length: 32 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 191 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: varchar("token_type", { length: 32 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

export const sessions = mysqlTable("sessions", {
  sessionToken: varchar("session_token", { length: 191 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  expires: timestamp("expires", { fsp: 3 }).notNull(),
});

export const verificationTokens = mysqlTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 191 }).notNull(),
    token: varchar("token", { length: 191 }).notNull(),
    expires: timestamp("expires", { fsp: 3 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// ---------- Onboarding & user profile ----------

export const onboardingProfiles = mysqlTable("onboarding_profiles", {
  userId: varchar("user_id", { length: 36 }).primaryKey(),
  goals: json("goals").$type<string[]>().notNull(),
  industries: json("industries").$type<string[]>().notNull(),
  dailyMinutes: int("daily_minutes").notNull().default(15),
  level: mysqlEnum("level", ["A1", "A2", "B1", "B2", "C1"]).notNull().default("A1"),
  targetLevel: mysqlEnum("target_level", ["A1", "A2", "B1", "B2", "C1"]).notNull().default("B2"),
  placementResult: json("placement_result").$type<{
    answers: { questionId: string; correct: boolean; skill: string }[];
    skillScores: Record<string, number>;
    summary?: string;
  } | null>(),
  completedAt: timestamp("completed_at", { fsp: 3 }),
});

export const userProgress = mysqlTable("user_progress", {
  userId: varchar("user_id", { length: 36 }).primaryKey(),
  xp: int("xp").notNull().default(0),
  streakDays: int("streak_days").notNull().default(0),
  longestStreak: int("longest_streak").notNull().default(0),
  lastActiveDate: varchar("last_active_date", { length: 10 }), // YYYY-MM-DD
  totalLessons: int("total_lessons").notNull().default(0),
  totalMinutes: int("total_minutes").notNull().default(0),
});

export const skillScores = mysqlTable(
  "skill_scores",
  {
    userId: varchar("user_id", { length: 36 }).notNull(),
    skill: mysqlEnum("skill", ["vocabulary", "grammar", "reading", "listening", "speaking", "writing"]).notNull(),
    score: int("score").notNull().default(0), // 0-100
    updatedAt: timestamp("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skill] })]
);

// ---------- Content: videos, series, lessons, transcripts ----------

export const videos = mysqlTable(
  "videos",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    youtubeId: varchar("youtube_id", { length: 32 }).unique(),
    title: varchar("title", { length: 500 }).notNull(),
    durationSec: int("duration_sec").notNull().default(0),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
    status: mysqlEnum("status", ["pending", "processing", "indexed", "error"]).notNull().default("pending"),
    errorMessage: text("error_message"),
    publishedAt: timestamp("published_at", { fsp: 3 }),
    indexedAt: timestamp("indexed_at", { fsp: 3 }),
    createdAt: timestamp("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("status_idx").on(t.status)]
);

export const transcriptSegments = mysqlTable(
  "transcript_segments",
  {
    id: int("id").autoincrement().primaryKey(),
    videoId: varchar("video_id", { length: 36 }).notNull(),
    idx: int("idx").notNull(),
    startSec: double("start_sec").notNull(),
    endSec: double("end_sec").notNull(),
    en: text("en").notNull(),
    vi: text("vi"),
  },
  (t) => [
    index("video_idx").on(t.videoId, t.idx),
    uniqueIndex("video_uniq").on(t.videoId, t.idx),
  ]
);

export const series = mysqlTable("series", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  level: mysqlEnum("level", ["A1", "A2", "B1", "B2", "C1"]),
  coverUrl: varchar("cover_url", { length: 500 }),
  createdAt: timestamp("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 128 }).notNull(),
  icon: varchar("icon", { length: 32 }),
  description: text("description"),
  order: int("order").notNull().default(0),
  createdAt: timestamp("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export const lessons = mysqlTable(
  "lessons",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    type: mysqlEnum("type", ["video_quiz", "quiz", "audio_quiz", "writing", "speaking"]).notNull(),
    level: mysqlEnum("level", ["A1", "A2", "B1", "B2", "C1"]).notNull(),
    videoId: varchar("video_id", { length: 36 }),
    seriesId: varchar("series_id", { length: 36 }),
    categoryId: varchar("category_id", { length: 36 }),
    orderInSeries: int("order_in_series"),
    durationSec: int("duration_sec").notNull().default(0),
    tags: json("tags").$type<string[]>().notNull().default([]),
    status: mysqlEnum("status", ["draft", "queued", "published", "rejected"]).notNull().default("queued"),
    rejectReason: text("reject_reason"),
    rating: double("rating"),
    createdBy: varchar("created_by", { length: 36 }),
    createdAt: timestamp("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    publishedAt: timestamp("published_at", { fsp: 3 }),
  },
  (t) => [
    index("status_level_idx").on(t.status, t.level),
    index("series_order_idx").on(t.seriesId, t.orderInSeries),
    index("category_idx").on(t.categoryId),
  ]
);

// Exercises are sub-units of a lesson. A lesson can have multiple (quiz + writing + speaking).
export const exercises = mysqlTable(
  "exercises",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    lessonId: varchar("lesson_id", { length: 36 }).notNull(),
    kind: mysqlEnum("kind", ["quiz", "writing", "speaking"]).notNull(),
    order: int("order").notNull().default(0),
    // For writing & speaking, the prompt/target lives here.
    payload: json("payload").$type<
      | { kind: "quiz" }
      | {
          kind: "writing";
          prompt: string;
          sampleAnswer?: string;
          minWords?: number;
          maxWords?: number;
        }
      | {
          kind: "speaking";
          targetText: string;
          sampleAudioUrl?: string;
        }
    >().notNull(),
  },
  (t) => [index("lesson_order_idx").on(t.lessonId, t.order)]
);

export const quizQuestions = mysqlTable(
  "quiz_questions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    exerciseId: varchar("exercise_id", { length: 36 }).notNull(),
    order: int("order").notNull().default(0),
    skill: mysqlEnum("skill", ["vocabulary", "grammar", "reading", "listening"]).notNull(),
    question: text("question").notNull(),
    options: json("options").$type<string[]>().notNull(),
    correctIndex: int("correct_index").notNull(),
    explanation: text("explanation"),
  },
  (t) => [index("exercise_order_idx").on(t.exerciseId, t.order)]
);

// ---------- Attempts ----------

export const lessonAttempts = mysqlTable(
  "lesson_attempts",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    lessonId: varchar("lesson_id", { length: 36 }).notNull(),
    status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).notNull().default("in_progress"),
    score: int("score"),
    rating: int("rating"), // user 1-5 star rating after completion
    xpAwarded: int("xp_awarded").notNull().default(0),
    startedAt: timestamp("started_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    completedAt: timestamp("completed_at", { fsp: 3 }),
    aiFeedback: json("ai_feedback").$type<{
      strengths?: string[];
      improvements?: string[];
      tips?: string[];
      vocabulary?: string[];
    } | null>(),
  },
  (t) => [index("user_lesson_idx").on(t.userId, t.lessonId)]
);

export const exerciseResponses = mysqlTable(
  "exercise_responses",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    attemptId: varchar("attempt_id", { length: 36 }).notNull(),
    exerciseId: varchar("exercise_id", { length: 36 }).notNull(),
    response: json("response").notNull(), // shape varies by kind
    score: int("score"),
    aiFeedback: json("ai_feedback"),
    submittedAt: timestamp("submitted_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("attempt_idx").on(t.attemptId)]
);

// ---------- Gamification ----------

export const badges = mysqlTable("badges", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 32 }).notNull(),
  criteria: json("criteria").$type<Record<string, unknown>>().notNull(),
});

export const userBadges = mysqlTable(
  "user_badges",
  {
    userId: varchar("user_id", { length: 36 }).notNull(),
    badgeId: varchar("badge_id", { length: 36 }).notNull(),
    earnedAt: timestamp("earned_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })]
);

// ---------- Reports & feedback ----------

export const reports = mysqlTable("reports", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  lessonId: varchar("lesson_id", { length: 36 }).notNull(),
  category: mysqlEnum("category", ["wrong_answer", "unclear_question", "translation_error", "audio_issue", "other"]).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["open", "resolved", "ignored"]).notNull().default("open"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  resolvedAt: timestamp("resolved_at", { fsp: 3 }),
});

export const feedback = mysqlTable("feedback", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }),
  type: mysqlEnum("type", ["feature_request", "ui_bug", "content_feedback", "experience_rating", "other"]).notNull(),
  content: text("content").notNull(),
  rating: int("rating"), // 1-5, only for experience_rating
  contactEmail: varchar("contact_email", { length: 255 }),
  wantsReply: boolean("wants_reply").notNull().default(false),
  status: mysqlEnum("status", ["new", "read", "resolved"]).notNull().default("new"),
  createdAt: timestamp("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

// ---------- Help / FAQ ----------

export const helpCategories = mysqlTable("help_categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 128 }).notNull(),
  icon: varchar("icon", { length: 32 }).notNull(),
  order: int("order").notNull().default(0),
});

export const helpArticles = mysqlTable(
  "help_articles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    categoryId: varchar("category_id", { length: 36 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    status: mysqlEnum("status", ["draft", "published"]).notNull().default("published"),
    order: int("order").notNull().default(0),
    helpfulCount: int("helpful_count").notNull().default(0),
    unhelpfulCount: int("unhelpful_count").notNull().default(0),
    createdAt: timestamp("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [index("category_order_idx").on(t.categoryId, t.order)]
);

export const helpVotes = mysqlTable(
  "help_votes",
  {
    userId: varchar("user_id", { length: 36 }).notNull(),
    articleId: varchar("article_id", { length: 36 }).notNull(),
    helpful: boolean("helpful").notNull(),
    votedAt: timestamp("voted_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [primaryKey({ columns: [t.userId, t.articleId] })]
);

// ---------- Content Intelligence ----------

export const contentIntelSuggestions = mysqlTable("content_intel_suggestions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  reason: text("reason").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).notNull().default("medium"),
  skill: mysqlEnum("skill", ["vocabulary", "grammar", "reading", "listening", "speaking", "writing"]),
  level: mysqlEnum("level", ["A1", "A2", "B1", "B2", "C1"]),
  stats: json("stats").$type<{
    usersStruggling?: number;
    failedSearches?: number;
    userRequests?: number;
  }>().notNull().default({}),
  status: mysqlEnum("status", ["new", "outline_generated", "dismissed", "in_progress", "published"]).notNull().default("new"),
  outline: text("outline"),
  createdAt: timestamp("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

// ---------- AI settings (singleton row id=1) ----------

export const aiSettings = mysqlTable("ai_settings", {
  id: int("id").primaryKey().default(1),
  baseUrl: varchar("base_url", { length: 500 }),
  apiKey: varchar("api_key", { length: 500 }),
  modelChat: varchar("model_chat", { length: 128 }),
  modelScoring: varchar("model_scoring", { length: 128 }),
  modelEmbedding: varchar("model_embedding", { length: 128 }),
  whisperBaseUrl: varchar("whisper_base_url", { length: 500 }),
  whisperApiKey: varchar("whisper_api_key", { length: 500 }),
  whisperModel: varchar("whisper_model", { length: 128 }),
  ttsBaseUrl: varchar("tts_base_url", { length: 500 }),
  ttsApiKey: varchar("tts_api_key", { length: 500 }),
  ttsModel: varchar("tts_model", { length: 128 }),
  updatedAt: timestamp("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export const aiJobs = mysqlTable("ai_jobs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  kind: varchar("kind", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["pending", "running", "success", "error"]).notNull().default("pending"),
  request: json("request"),
  response: json("response"),
  error: text("error"),
  durationMs: int("duration_ms"),
  createdAt: timestamp("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

// ---------- Type exports ----------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type TranscriptSegment = typeof transcriptSegments.$inferSelect;
export type Series = typeof series.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type LessonAttempt = typeof lessonAttempts.$inferSelect;
export type OnboardingProfile = typeof onboardingProfiles.$inferSelect;
export type SkillScore = typeof skillScores.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type HelpCategory = typeof helpCategories.$inferSelect;
export type HelpArticle = typeof helpArticles.$inferSelect;
export type ContentIntelSuggestion = typeof contentIntelSuggestions.$inferSelect;
export type AiSettings = typeof aiSettings.$inferSelect;
