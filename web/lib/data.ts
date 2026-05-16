import "server-only";
import { db } from "@/db";
import {
  lessons,
  videos,
  series,
  categories,
  onboardingProfiles,
  userProgress,
  skillScores,
  lessonAttempts,
  userBadges,
  badges,
  exercises,
  quizQuestions,
  transcriptSegments,
  users,
} from "@/db/schema";
import { and, eq, desc, sql, inArray, isNotNull } from "drizzle-orm";
import type { CefrLevel } from "@/lib/constants";

export async function getAllCategories() {
  return db.select().from(categories).orderBy(categories.order);
}

export async function getUserContext(userId: string) {
  const [profile] = await db
    .select()
    .from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, userId))
    .limit(1);
  const [progress] = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .limit(1);
  const skills = await db
    .select()
    .from(skillScores)
    .where(eq(skillScores.userId, userId));
  return {
    profile: profile ?? null,
    progress: progress ?? null,
    skills,
  };
}

export async function getPublishedLessons() {
  return db
    .select()
    .from(lessons)
    .where(eq(lessons.status, "published"))
    .orderBy(desc(lessons.publishedAt));
}

export async function getRecommendedLessons(userId: string, level: CefrLevel, limit = 3) {
  // Phase 1 heuristic: same level, not yet completed, ordered by recency.
  const completed = await db
    .select({ id: lessonAttempts.lessonId })
    .from(lessonAttempts)
    .where(and(eq(lessonAttempts.userId, userId), eq(lessonAttempts.status, "completed")));
  const completedIds = completed.map((c) => c.id);

  const rows = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.status, "published"), eq(lessons.level, level)))
    .orderBy(desc(lessons.publishedAt))
    .limit(20);

  const filtered = rows.filter((l) => !completedIds.includes(l.id));
  // Phase 1 'score': decreasing with index, randomized stable
  return filtered.slice(0, limit).map((l, i) => ({ ...l, score: 0.95 - i * 0.05 }));
}

export async function getCompletedLessons(userId: string) {
  const attempts = await db
    .select({
      lessonId: lessonAttempts.lessonId,
      score: lessonAttempts.score,
      completedAt: lessonAttempts.completedAt,
    })
    .from(lessonAttempts)
    .where(and(eq(lessonAttempts.userId, userId), eq(lessonAttempts.status, "completed")))
    .orderBy(desc(lessonAttempts.completedAt));
  if (attempts.length === 0) return [];
  const ids = attempts.map((a) => a.lessonId);
  const ls = await db.select().from(lessons).where(inArray(lessons.id, ids));
  return attempts.map((a) => {
    const lesson = ls.find((l) => l.id === a.lessonId)!;
    return { ...lesson, score: a.score, completedAt: a.completedAt };
  });
}

export async function getInProgressAttempt(userId: string, lessonId: string) {
  const rows = await db
    .select()
    .from(lessonAttempts)
    .where(
      and(
        eq(lessonAttempts.userId, userId),
        eq(lessonAttempts.lessonId, lessonId),
        eq(lessonAttempts.status, "in_progress")
      )
    )
    .orderBy(desc(lessonAttempts.startedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLastCompletedAttempt(userId: string, lessonId: string) {
  const rows = await db
    .select()
    .from(lessonAttempts)
    .where(
      and(
        eq(lessonAttempts.userId, userId),
        eq(lessonAttempts.lessonId, lessonId),
        eq(lessonAttempts.status, "completed")
      )
    )
    .orderBy(desc(lessonAttempts.completedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLessonPreview(lessonId: string) {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!lesson) return null;
  const video = lesson.videoId
    ? (await db.select().from(videos).where(eq(videos.id, lesson.videoId)).limit(1))[0] ?? null
    : null;
  const exs = await db.select().from(exercises).where(eq(exercises.lessonId, lessonId)).orderBy(exercises.order);
  const seriesRow = lesson.seriesId
    ? (await db.select().from(series).where(eq(series.id, lesson.seriesId)).limit(1))[0]
    : null;
  const category = lesson.categoryId
    ? (await db.select().from(categories).where(eq(categories.id, lesson.categoryId)).limit(1))[0]
    : null;
  return { lesson, video, exercises: exs, series: seriesRow, category };
}

export async function getLessonReviews(lessonId: string, limit = 6) {
  const rows = await db
    .select({
      attemptId: lessonAttempts.id,
      rating: lessonAttempts.rating,
      completedAt: lessonAttempts.completedAt,
      userName: users.name,
      avatarData: users.avatarData,
    })
    .from(lessonAttempts)
    .innerJoin(users, eq(users.id, lessonAttempts.userId))
    .where(and(eq(lessonAttempts.lessonId, lessonId), isNotNull(lessonAttempts.rating)))
    .orderBy(desc(lessonAttempts.completedAt))
    .limit(limit);

  const [agg] = await db
    .select({
      count: sql<number>`count(*)`,
      avg: sql<number>`avg(${lessonAttempts.rating})`,
    })
    .from(lessonAttempts)
    .where(and(eq(lessonAttempts.lessonId, lessonId), isNotNull(lessonAttempts.rating)));

  return {
    reviews: rows,
    count: Number(agg?.count ?? 0),
    avg: agg?.avg ? Number(agg.avg) : null,
  };
}

export async function getLessonAttemptCount(lessonId: string) {
  const [row] = await db
    .select({ c: sql<number>`count(distinct ${lessonAttempts.userId})` })
    .from(lessonAttempts)
    .where(eq(lessonAttempts.lessonId, lessonId));
  return Number(row?.c ?? 0);
}

export async function getLessonFull(lessonId: string) {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!lesson) return null;
  const video = lesson.videoId
    ? (await db.select().from(videos).where(eq(videos.id, lesson.videoId)).limit(1))[0] ?? null
    : null;
  const segments = video
    ? await db
        .select()
        .from(transcriptSegments)
        .where(eq(transcriptSegments.videoId, video.id))
        .orderBy(transcriptSegments.idx)
    : [];
  const exs = await db
    .select()
    .from(exercises)
    .where(eq(exercises.lessonId, lessonId))
    .orderBy(exercises.order);
  const exIds = exs.map((e) => e.id);
  const questions =
    exIds.length > 0
      ? await db.select().from(quizQuestions).where(inArray(quizQuestions.exerciseId, exIds)).orderBy(quizQuestions.order)
      : [];
  const seriesRow = lesson.seriesId
    ? (await db.select().from(series).where(eq(series.id, lesson.seriesId)).limit(1))[0]
    : null;
  return { lesson, video, segments, exercises: exs, questions, series: seriesRow };
}

export async function getNextLessonInSeries(lessonId: string) {
  const [current] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!current?.seriesId || current.orderInSeries == null) return null;
  const [next] = await db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.seriesId, current.seriesId),
        eq(lessons.status, "published"),
        sql`${lessons.orderInSeries} > ${current.orderInSeries}`
      )
    )
    .orderBy(lessons.orderInSeries)
    .limit(1);
  return next ?? null;
}

export async function getRecentAttempts(userId: string, limit = 10) {
  const attempts = await db
    .select()
    .from(lessonAttempts)
    .where(eq(lessonAttempts.userId, userId))
    .orderBy(desc(lessonAttempts.startedAt))
    .limit(limit);
  if (attempts.length === 0) return [];
  const ids = [...new Set(attempts.map((a) => a.lessonId))];
  const ls = await db.select().from(lessons).where(inArray(lessons.id, ids));
  return attempts.map((a) => ({
    ...a,
    lesson: ls.find((l) => l.id === a.lessonId)!,
  }));
}

export async function getUserBadges(userId: string) {
  const owned = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const all = await db.select().from(badges);
  return all.map((b) => ({
    ...b,
    earned: owned.find((u) => u.badgeId === b.id) ?? null,
  }));
}
