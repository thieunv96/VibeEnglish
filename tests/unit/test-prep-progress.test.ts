/**
 * test-prep-progress.test.ts
 *
 * Unit tests for getExamProgress() — the per-exam mock attempt aggregator.
 *
 * Prisma is mocked (no real DB connection). Tests verify:
 *   - Queries MockTestAttempt (not ExerciseAttempt)
 *   - Filters by (userId, exam)
 *   - Computes attemptCount, bestScore (max), lastAttemptDate
 *   - Returns correct shape: ExamProgress { attemptCount, bestScore, lastAttemptDate }
 *   - Zero attempts → { attemptCount: 0, bestScore: null, lastAttemptDate: null }
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      mockTestAttempt: {
        findMany: vi.fn(),
      },
    },
  };
});

import { prisma } from "../../src/lib/db";
import { getExamProgress } from "../../src/lib/test-prep-progress";

const mockFindMany = vi.mocked(prisma.mockTestAttempt.findMany);

describe("getExamProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("zero attempts → { attemptCount: 0, bestScore: null, lastAttemptDate: null }", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    const result = await getExamProgress("user-123", "toeic");

    expect(result).toEqual({
      attemptCount: 0,
      bestScore: null,
      lastAttemptDate: null,
    });
  });

  it("filters by userId and exam in the where clause", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await getExamProgress("user-456", "ielts");

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "user-456", exam: "ielts" },
      select: { score: true, completedAt: true },
      orderBy: { completedAt: "desc" },
    });
  });

  it("one attempt → { attemptCount: 1, bestScore: 0.72, lastAttemptDate: <date> }", async () => {
    const now = new Date("2026-06-06T10:00:00Z");
    mockFindMany.mockResolvedValueOnce([
      {
        id: "mta-1",
        userId: "user-789",
        exam: "toefl",
        totalQuestions: 25,
        correctAnswers: 18,
        score: 0.72,
        completedAt: now,
        bandEstimate: "24",
      } as any,
    ]);

    const result = await getExamProgress("user-789", "toefl");

    expect(result.attemptCount).toBe(1);
    expect(result.bestScore).toBe(0.72);
    expect(result.lastAttemptDate).toEqual(now);
  });

  it("three attempts with different scores → bestScore = max, lastAttemptDate = most recent", async () => {
    const date1 = new Date("2026-06-01T10:00:00Z");
    const date2 = new Date("2026-06-03T10:00:00Z");
    const date3 = new Date("2026-06-06T10:00:00Z");

    mockFindMany.mockResolvedValueOnce([
      {
        id: "mta-3",
        userId: "user-abc",
        exam: "oet",
        totalQuestions: 25,
        correctAnswers: 22,
        score: 0.88,
        completedAt: date3, // Most recent (first in desc order)
        bandEstimate: "A",
      },
      {
        id: "mta-2",
        userId: "user-abc",
        exam: "oet",
        totalQuestions: 25,
        correctAnswers: 20,
        score: 0.80,
        completedAt: date2,
        bandEstimate: "B",
      },
      {
        id: "mta-1",
        userId: "user-abc",
        exam: "oet",
        totalQuestions: 25,
        correctAnswers: 15,
        score: 0.60,
        completedAt: date1,
        bandEstimate: "C",
      },
    ] as any);

    const result = await getExamProgress("user-abc", "oet");

    expect(result.attemptCount).toBe(3);
    expect(result.bestScore).toBe(0.88); // max
    expect(result.lastAttemptDate).toEqual(date3); // most recent
  });

  it("ignores attempts from different exams", async () => {
    const date1 = new Date("2026-06-06T10:00:00Z");

    // Mock returns only IELTS attempts (filtered by where clause).
    mockFindMany.mockResolvedValueOnce([
      {
        id: "mta-1",
        userId: "user-multi",
        exam: "ielts",
        totalQuestions: 25,
        correctAnswers: 20,
        score: 0.80,
        completedAt: date1,
        bandEstimate: "Band 7.0",
      } as any,
    ]);

    const result = await getExamProgress("user-multi", "ielts");

    expect(result.attemptCount).toBe(1);
    expect(result.bestScore).toBe(0.80);
    // TOEIC attempts (if any) are filtered out by the where clause
  });

  it("ignores attempts from different users", async () => {
    const date1 = new Date("2026-06-06T10:00:00Z");

    // Mock returns only attempts for user-X (filtered by userId in where clause).
    mockFindMany.mockResolvedValueOnce([
      {
        id: "mta-1",
        userId: "user-X",
        exam: "toeic",
        totalQuestions: 25,
        correctAnswers: 18,
        score: 0.72,
        completedAt: date1,
        bandEstimate: "600",
      } as any,
    ]);

    const result = await getExamProgress("user-X", "toeic");

    expect(result.attemptCount).toBe(1);
    expect(result.bestScore).toBe(0.72);
    // user-Y attempts (if any) are filtered out by the where clause
  });
});
