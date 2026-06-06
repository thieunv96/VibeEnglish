/**
 * Progress aggregation for exam-prep mock tests.
 *
 * Server-only — imports Prisma. Do NOT import from client components.
 * No imports from `next/headers`, `auth`, or any client code.
 *
 * Queries `MockTestAttempt` directly — one row per session.
 * Replaces the previous heuristic minute-bucketing approach over `ExerciseAttempt`.
 */

import { prisma } from "@/lib/db";
import type { ExamSlug } from "@/lib/test-prep-constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExamProgress {
  /** Total number of mock test sessions submitted for this (userId, exam) pair. */
  attemptCount: number;
  /**
   * Best score across all attempts as a 0.0–1.0 ratio
   * (correctAnswers / totalQuestions). `null` when no attempts exist.
   */
  bestScore: number | null;
  /** Date of the most recent attempt. `null` when no attempts exist. */
  lastAttemptDate: Date | null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Return aggregated progress for a single (userId, exam) pair.
 *
 * Fetches all `MockTestAttempt` rows for the pair, sorted descending by
 * `completedAt`. Aggregation is done in application code (small N per user
 * per exam, so no DB-level aggregation is needed in V1).
 *
 * @param userId  The authenticated user's ID.
 * @param exam    One of the four supported exam slugs.
 */
export async function getExamProgress(
  userId: string,
  exam: ExamSlug,
): Promise<ExamProgress> {
  const rows = await prisma.mockTestAttempt.findMany({
    where: { userId, exam },
    select: { score: true, completedAt: true },
    orderBy: { completedAt: "desc" },
  });

  if (rows.length === 0) {
    return { attemptCount: 0, bestScore: null, lastAttemptDate: null };
  }

  const bestScore = Math.max(...rows.map((r) => r.score));
  const lastAttemptDate = rows[0].completedAt;

  return {
    attemptCount: rows.length,
    bestScore,
    lastAttemptDate,
  };
}
