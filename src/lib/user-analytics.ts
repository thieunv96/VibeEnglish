import { prisma } from "@/lib/db";
import { computeStreakDays } from "@/lib/streak";

export { computeStreakDays };

export interface UserStats {
  activeMinutesTotal: number;
  activeMinutes30d: number;
  lessonsStarted: number;
  lessonsCompleted: number;
  avgAccuracy: number;          // 0..1
  exercisesAttempted: number;
  avgExerciseScore: number;     // 0..1
  vocabSaved: number;
  ratingsGiven: number;
  streakDays: number;
}

export async function userStats(userId: string): Promise<UserStats> {
  const now = Date.now();
  const d30 = new Date(now - 30 * 86400_000);

  const [
    activeTotal,
    active30d,
    progress,
    exerciseAgg,
    vocabCount,
    ratingsCount,
    activityDays,
  ] = await Promise.all([
    prisma.userActivity.count({ where: { userId } }),
    prisma.userActivity.count({ where: { userId, minuteTs: { gte: d30 } } }),
    prisma.lessonProgress.findMany({
      where: { userId },
      select: { accuracy: true, segmentsCompleted: true, totalSegments: true },
    }),
    prisma.exerciseAttempt.aggregate({
      where: { userId },
      _avg: { score: true },
      _count: { _all: true },
    }),
    prisma.vocabItem.count({ where: { userId } }),
    prisma.lessonRating.count({ where: { userId } }),
    prisma.userActivity.findMany({
      where: { userId },
      select: { minuteTs: true },
      orderBy: { minuteTs: "desc" },
      // 90 days × 1440 minutes/day is the upper bound; clamp to 5000 to keep
      // the query cheap. Streak realistically can't be measured beyond that.
      take: 5000,
    }),
  ]);

  const completed = progress.filter(
    (p) => p.totalSegments > 0 && p.segmentsCompleted >= p.totalSegments,
  ).length;
  const accSum = progress.reduce((s, p) => s + p.accuracy, 0);
  const avgAccuracy = progress.length > 0 ? accSum / progress.length : 0;

  return {
    activeMinutesTotal: activeTotal,
    activeMinutes30d: active30d,
    lessonsStarted: progress.length,
    lessonsCompleted: completed,
    avgAccuracy,
    exercisesAttempted: exerciseAgg._count._all,
    avgExerciseScore: exerciseAgg._avg.score ?? 0,
    vocabSaved: vocabCount,
    ratingsGiven: ratingsCount,
    streakDays: computeStreakDays(activityDays.map((r) => r.minuteTs)),
  };
}


export interface UserActivityRow {
  kind: "progress" | "attempt" | "vocab" | "rating";
  at: Date;
  detail: string;
}

export async function userRecentActivity(userId: string, limit = 15): Promise<UserActivityRow[]> {
  const [prog, att, vocab, ratings] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId },
      orderBy: { lastOpenedAt: "desc" },
      take: limit,
    }),
    prisma.exerciseAttempt.findMany({
      where: { userId },
      orderBy: { completedAt: "desc" },
      take: limit,
    }),
    prisma.vocabItem.findMany({
      where: { userId },
      orderBy: { addedAt: "desc" },
      take: limit,
    }),
    prisma.lessonRating.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: { lesson: { select: { title: true } } },
    }),
  ]);

  const rows: UserActivityRow[] = [
    ...prog.map((p) => ({
      kind: "progress" as const,
      at: p.lastOpenedAt,
      detail: `${Math.round(p.accuracy * 100)}% on "${p.title}"`,
    })),
    ...att.map((a) => ({
      kind: "attempt" as const,
      at: a.completedAt,
      detail: `${Math.round(a.score * 100)}% on "${a.title}"`,
    })),
    ...vocab.map((v) => ({
      kind: "vocab" as const,
      at: v.addedAt,
      detail: `saved "${v.word}"`,
    })),
    ...ratings.map((r) => ({
      kind: "rating" as const,
      at: r.updatedAt,
      detail: `rated ${r.stars}★ "${r.lesson.title}"`,
    })),
  ];

  rows.sort((a, b) => b.at.getTime() - a.at.getTime());
  return rows.slice(0, limit);
}
