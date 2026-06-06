/**
 * test-prep-admin-analytics.ts
 *
 * Shared aggregation helper for exam-prep mock test analytics (AC-14).
 * Called by both the API endpoint and the admin page to avoid duplication.
 *
 * Server-only — imports Prisma. Do NOT import from client components.
 * Pure in the sense that it has no side effects beyond DB reads.
 */

import { prisma } from "@/lib/db";
import { EXAMS } from "@/lib/test-prep-constants";
import type { ExamSlug } from "@/lib/test-prep-constants";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ExamAttemptSummary {
  attemptCount: number;
  averageScore: number | null;
}

export interface ExamAnalytics {
  exam: ExamSlug;
  currentMonth: ExamAttemptSummary;
  allTime: ExamAttemptSummary;
  /** Band distribution, sorted by count descending. */
  bandDistribution: { band: string; count: number }[];
}

export interface AdminTestPrepAnalytics {
  perExam: ExamAnalytics[];
  /** ISO timestamp of when this snapshot was generated. */
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function startOfCurrentMonth(): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function buildBandDistribution(
  bandRows: { exam: string; bandEstimate: string | null }[],
  examSlug: ExamSlug,
): { band: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of bandRows) {
    if (row.exam !== examSlug) continue;
    const key = row.bandEstimate ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([band, count]) => ({ band, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute per-exam mock-test analytics from MockTestAttempt rows.
 *
 * Returns all 4 exams even when they have zero attempts (so the UI can render
 * all 4 cards consistently).
 */
export async function getTestPrepAnalytics(): Promise<AdminTestPrepAnalytics> {
  const startOfMonth = startOfCurrentMonth();

  const [monthAgg, allTimeAgg, bandRows] = await Promise.all([
    prisma.mockTestAttempt.groupBy({
      by: ["exam"],
      where: { completedAt: { gte: startOfMonth } },
      _count: { _all: true },
      _avg: { score: true },
    }),
    prisma.mockTestAttempt.groupBy({
      by: ["exam"],
      _count: { _all: true },
      _avg: { score: true },
    }),
    prisma.mockTestAttempt.findMany({
      select: { exam: true, bandEstimate: true },
    }),
  ]);

  // Index the aggregates by exam for O(1) lookup.
  const monthMap = new Map(monthAgg.map((r) => [r.exam, r]));
  const allTimeMap = new Map(allTimeAgg.map((r) => [r.exam, r]));

  const perExam: ExamAnalytics[] = EXAMS.map((examSlug) => {
    const m = monthMap.get(examSlug);
    const a = allTimeMap.get(examSlug);

    return {
      exam: examSlug,
      currentMonth: {
        attemptCount: m?._count._all ?? 0,
        averageScore: m?._avg.score ?? null,
      },
      allTime: {
        attemptCount: a?._count._all ?? 0,
        averageScore: a?._avg.score ?? null,
      },
      bandDistribution: buildBandDistribution(bandRows, examSlug),
    };
  });

  return {
    perExam,
    generatedAt: new Date().toISOString(),
  };
}
