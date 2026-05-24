import { prisma } from "@/lib/db";
import { AGE_BRACKETS, ageBracketOf, lessonHealth } from "@/lib/analytics-helpers";

export { AGE_BRACKETS, ageBracketOf, lessonHealth };

export interface OverviewTotals {
  totalUsers: number;
  learnerUsers: number;
  adminUsers: number;
  totalLessons: number;
  totalExercises: number;
  totalActivityMinutes: number;
  signupsLast7d: number;
  signupsLast30d: number;
}

export async function totalsOverview(): Promise<OverviewTotals> {
  const now = Date.now();
  const d7 = new Date(now - 7 * 86400_000);
  const d30 = new Date(now - 30 * 86400_000);

  const [totalUsers, adminUsers, totalLessons, totalExercises, totalActivityMinutes, s7, s30] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.lesson.count(),
      prisma.exercise.count(),
      prisma.userActivity.count(),
      prisma.user.count({ where: { createdAt: { gte: d7 } } }),
      prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    ]);

  return {
    totalUsers,
    learnerUsers: totalUsers - adminUsers,
    adminUsers,
    totalLessons,
    totalExercises,
    totalActivityMinutes,
    signupsLast7d: s7,
    signupsLast30d: s30,
  };
}

export async function dauWauMau(): Promise<{
  dauLast24h: number;
  wauLast7d: number;
  mauLast30d: number;
}> {
  const now = Date.now();
  const d1 = new Date(now - 86400_000);
  const d7 = new Date(now - 7 * 86400_000);
  const d30 = new Date(now - 30 * 86400_000);

  const [dau, wau, mau] = await Promise.all([
    prisma.userActivity.findMany({
      where: { minuteTs: { gte: d1 } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.userActivity.findMany({
      where: { minuteTs: { gte: d7 } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.userActivity.findMany({
      where: { minuteTs: { gte: d30 } },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  return { dauLast24h: dau.length, wauLast7d: wau.length, mauLast30d: mau.length };
}

export async function signupsByDay(daysBack = 30): Promise<Array<{ day: string; count: number }>> {
  const since = new Date(Date.now() - daysBack * 86400_000);
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since }, isAdmin: false },
    select: { createdAt: true },
  });
  const buckets = new Map<string, number>();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(Date.now() - i * 86400_000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const u of users) {
    const day = u.createdAt.toISOString().slice(0, 10);
    buckets.set(day, (buckets.get(day) ?? 0) + 1);
  }
  return Array.from(buckets, ([day, count]) => ({ day, count })).sort((a, b) =>
    a.day.localeCompare(b.day),
  );
}

export async function timeOnPlatformPerUser(limit = 20): Promise<
  Array<{ userId: string; email: string; minutes: number }>
> {
  const grouped = await prisma.userActivity.groupBy({
    by: ["userId"],
    _count: { _all: true },
    orderBy: { _count: { userId: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, email: true },
  });
  const emailById = new Map(users.map((u) => [u.id, u.email]));
  return grouped.map((g) => ({
    userId: g.userId,
    email: emailById.get(g.userId) ?? "(deleted)",
    minutes: g._count._all,
  }));
}

export async function ageBrackets(): Promise<Array<{ bracket: string; count: number }>> {
  const learners = await prisma.user.findMany({
    where: { isAdmin: false },
    select: { birthYear: true },
  });
  const counts = new Map<string, number>(AGE_BRACKETS.map((b) => [b, 0]));
  for (const l of learners) {
    const b = ageBracketOf(l.birthYear);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  return AGE_BRACKETS.map((b) => ({ bracket: b, count: counts.get(b) ?? 0 }));
}

export async function localeBreakdown(): Promise<Array<{ locale: string; count: number }>> {
  const grouped = await prisma.user.groupBy({
    by: ["locale"],
    where: { isAdmin: false },
    _count: { _all: true },
    orderBy: { _count: { locale: "desc" } },
  });
  return grouped.map((g) => ({ locale: g.locale, count: g._count._all }));
}

export interface LessonPerformanceRow {
  id: string;
  slug: string;
  category: string;
  title: string;
  level: string;
  attempts: number;
  avgAccuracy: number;
  completions: number;
  completionRate: number;
  healthScore: number;
}

export async function lessonsPerformance(): Promise<LessonPerformanceRow[]> {
  const lessons = await prisma.lesson.findMany({
    select: { id: true, slug: true, category: true, title: true, level: true },
  });
  const progress = await prisma.lessonProgress.findMany({
    select: {
      lessonSlug: true,
      category: true,
      accuracy: true,
      segmentsCompleted: true,
      totalSegments: true,
    },
  });

  type Agg = { attempts: number; accSum: number; completions: number };
  const agg = new Map<string, Agg>();
  const key = (cat: string, slug: string) => `${cat}::${slug}`;
  for (const p of progress) {
    const k = key(p.category, p.lessonSlug);
    const a = agg.get(k) ?? { attempts: 0, accSum: 0, completions: 0 };
    a.attempts += 1;
    a.accSum += p.accuracy;
    if (p.totalSegments > 0 && p.segmentsCompleted >= p.totalSegments) a.completions += 1;
    agg.set(k, a);
  }

  return lessons
    .map((l) => {
      const a = agg.get(key(l.category, l.slug)) ?? { attempts: 0, accSum: 0, completions: 0 };
      const avgAccuracy = a.attempts > 0 ? a.accSum / a.attempts : 0;
      const completionRate = a.attempts > 0 ? a.completions / a.attempts : 0;
      return {
        id: l.id,
        slug: l.slug,
        category: l.category,
        title: l.title,
        level: l.level,
        attempts: a.attempts,
        avgAccuracy,
        completions: a.completions,
        completionRate,
        healthScore: lessonHealth({ attempts: a.attempts, avgAccuracy, completionRate }),
      };
    })
    .sort((a, b) => b.healthScore - a.healthScore);
}

export interface ExercisePerformanceRow {
  id: string;
  slug: string;
  skill: string;
  title: string;
  level: string;
  type: string;
  attempts: number;
  avgScore: number;
}

export async function exercisesPerformance(): Promise<ExercisePerformanceRow[]> {
  const exercises = await prisma.exercise.findMany({
    select: { id: true, slug: true, skill: true, title: true, level: true, type: true },
  });
  const attempts = await prisma.exerciseAttempt.findMany({
    select: { exerciseSlug: true, skill: true, score: true },
  });

  type Agg = { attempts: number; scoreSum: number };
  const agg = new Map<string, Agg>();
  const key = (skill: string, slug: string) => `${skill}::${slug}`;
  for (const a of attempts) {
    const k = key(a.skill, a.exerciseSlug);
    const cur = agg.get(k) ?? { attempts: 0, scoreSum: 0 };
    cur.attempts += 1;
    cur.scoreSum += a.score;
    agg.set(k, cur);
  }

  return exercises
    .map((ex) => {
      const a = agg.get(key(ex.skill, ex.slug)) ?? { attempts: 0, scoreSum: 0 };
      return {
        ...ex,
        attempts: a.attempts,
        avgScore: a.attempts > 0 ? a.scoreSum / a.attempts : 0,
      };
    })
    .sort((a, b) => b.attempts - a.attempts);
}

export interface StalenessRow {
  bucket: "≤7d" | "≤30d" | "≤90d" | "≤365d" | ">365d";
  lessons: number;
  exercises: number;
}

export async function contentStaleness(): Promise<{
  rows: StalenessRow[];
  zeroEngagementLessons: number;
  zeroEngagementExercises: number;
}> {
  const now = Date.now();
  const buckets: StalenessRow[] = [
    { bucket: "≤7d", lessons: 0, exercises: 0 },
    { bucket: "≤30d", lessons: 0, exercises: 0 },
    { bucket: "≤90d", lessons: 0, exercises: 0 },
    { bucket: "≤365d", lessons: 0, exercises: 0 },
    { bucket: ">365d", lessons: 0, exercises: 0 },
  ];

  function bucketFor(updatedAt: Date): StalenessRow {
    const ageDays = (now - updatedAt.getTime()) / 86400_000;
    if (ageDays <= 7) return buckets[0];
    if (ageDays <= 30) return buckets[1];
    if (ageDays <= 90) return buckets[2];
    if (ageDays <= 365) return buckets[3];
    return buckets[4];
  }

  const [lessons, exercises, lessonPerf, exercisePerf] = await Promise.all([
    prisma.lesson.findMany({ select: { updatedAt: true } }),
    prisma.exercise.findMany({ select: { updatedAt: true } }),
    lessonsPerformance(),
    exercisesPerformance(),
  ]);

  for (const l of lessons) bucketFor(l.updatedAt).lessons += 1;
  for (const e of exercises) bucketFor(e.updatedAt).exercises += 1;

  return {
    rows: buckets,
    zeroEngagementLessons: lessonPerf.filter((l) => l.attempts === 0).length,
    zeroEngagementExercises: exercisePerf.filter((e) => e.attempts === 0).length,
  };
}

export interface ActivityFeedRow {
  kind: "progress" | "attempt" | "vocab";
  at: Date;
  email: string;
  detail: string;
}

export async function recentActivityFeed(limit = 20): Promise<ActivityFeedRow[]> {
  const [progress, attempts, vocab] = await Promise.all([
    prisma.lessonProgress.findMany({
      take: limit,
      orderBy: { lastOpenedAt: "desc" },
      include: { user: { select: { email: true } } },
    }),
    prisma.exerciseAttempt.findMany({
      take: limit,
      orderBy: { completedAt: "desc" },
      include: { user: { select: { email: true } } },
    }),
    prisma.vocabItem.findMany({
      take: limit,
      orderBy: { addedAt: "desc" },
      include: { user: { select: { email: true } } },
    }),
  ]);

  const rows: ActivityFeedRow[] = [
    ...progress.map((p) => ({
      kind: "progress" as const,
      at: p.lastOpenedAt,
      email: p.user.email,
      detail: `${Math.round(p.accuracy * 100)}% on "${p.title}"`,
    })),
    ...attempts.map((a) => ({
      kind: "attempt" as const,
      at: a.completedAt,
      email: a.user.email,
      detail: `${Math.round(a.score * 100)}% on "${a.title}"`,
    })),
    ...vocab.map((v) => ({
      kind: "vocab" as const,
      at: v.addedAt,
      email: v.user.email,
      detail: `saved "${v.word}"`,
    })),
  ];

  rows.sort((a, b) => b.at.getTime() - a.at.getTime());
  return rows.slice(0, limit);
}
