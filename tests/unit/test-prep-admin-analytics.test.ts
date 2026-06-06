/**
 * test-prep-admin-analytics.test.ts
 *
 * Unit tests for getTestPrepAnalytics() — the shared helper that aggregates
 * MockTestAttempt rows into the AdminTestPrepAnalytics shape.
 *
 * Prisma is mocked so no DB connection is needed. Tests focus on the shape
 * transformation logic: all 4 exams always present, zero-attempt exams get
 * empty defaults, band distribution is sorted by count desc.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock the db module. vi.mock is hoisted, so we cannot reference const
// variables in the factory — instead we capture the mock fns via vi.fn() and
// expose them from the mock factory, then retrieve them via vi.mocked() below.
// ---------------------------------------------------------------------------
vi.mock("@/lib/db", () => {
  const groupBy = vi.fn();
  const findMany = vi.fn();
  return {
    prisma: {
      mockTestAttempt: {
        groupBy,
        findMany,
      },
    },
  };
});

// Import after mock is registered.
import { prisma } from "../../src/lib/db";
import {
  getTestPrepAnalytics,
} from "../../src/lib/test-prep-admin-analytics";
import type { AdminTestPrepAnalytics } from "../../src/lib/test-prep-admin-analytics";

// Typed references to the mocked fns.
const mockGroupBy = vi.mocked(prisma.mockTestAttempt.groupBy);
const mockFindMany = vi.mocked(prisma.mockTestAttempt.findMany);

// ---------------------------------------------------------------------------
// Helper: build a minimal groupBy result for a single exam.
// ---------------------------------------------------------------------------
function makeGroupByRow(exam: string, count: number, avgScore: number | null) {
  return {
    exam,
    _count: { _all: count },
    _avg: { score: avgScore },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getTestPrepAnalytics()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all 4 exams even when MockTestAttempt table is empty", async () => {
    mockGroupBy.mockResolvedValue([]);
    mockFindMany.mockResolvedValue([]);

    const result: AdminTestPrepAnalytics = await getTestPrepAnalytics();

    expect(result.perExam).toHaveLength(4);
    const exams = result.perExam.map((e) => e.exam);
    expect(exams).toContain("toeic");
    expect(exams).toContain("toefl");
    expect(exams).toContain("ielts");
    expect(exams).toContain("oet");
  });

  it("zero-attempt exams have attemptCount=0 and averageScore=null", async () => {
    mockGroupBy.mockResolvedValue([]);
    mockFindMany.mockResolvedValue([]);

    const result = await getTestPrepAnalytics();

    for (const ex of result.perExam) {
      expect(ex.currentMonth.attemptCount).toBe(0);
      expect(ex.currentMonth.averageScore).toBeNull();
      expect(ex.allTime.attemptCount).toBe(0);
      expect(ex.allTime.averageScore).toBeNull();
      expect(ex.bandDistribution).toEqual([]);
    }
  });

  it("maps non-zero all-time aggregates to the correct exam", async () => {
    // First call = monthAgg (empty), second = allTimeAgg with toeic data.
    mockGroupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([makeGroupByRow("toeic", 10, 0.72)]);
    mockFindMany.mockResolvedValue([]);

    const result = await getTestPrepAnalytics();

    const toeic = result.perExam.find((e) => e.exam === "toeic")!;
    expect(toeic.allTime.attemptCount).toBe(10);
    expect(toeic.allTime.averageScore).toBeCloseTo(0.72);
    expect(toeic.currentMonth.attemptCount).toBe(0);
    expect(toeic.currentMonth.averageScore).toBeNull();
  });

  it("maps current-month aggregates independently from all-time", async () => {
    mockGroupBy
      .mockResolvedValueOnce([makeGroupByRow("ielts", 3, 0.6)])
      .mockResolvedValueOnce([makeGroupByRow("ielts", 15, 0.55)]);
    mockFindMany.mockResolvedValue([]);

    const result = await getTestPrepAnalytics();

    const ielts = result.perExam.find((e) => e.exam === "ielts")!;
    expect(ielts.currentMonth.attemptCount).toBe(3);
    expect(ielts.currentMonth.averageScore).toBeCloseTo(0.6);
    expect(ielts.allTime.attemptCount).toBe(15);
    expect(ielts.allTime.averageScore).toBeCloseTo(0.55);
  });

  it("builds band distribution sorted by count descending", async () => {
    mockGroupBy.mockResolvedValue([]);
    mockFindMany.mockResolvedValue([
      { exam: "toeic", bandEstimate: "600" },
      { exam: "toeic", bandEstimate: "800" },
      { exam: "toeic", bandEstimate: "600" },
      { exam: "toeic", bandEstimate: "800" },
      { exam: "toeic", bandEstimate: "800" },
      { exam: "toeic", bandEstimate: "400" },
    ]);

    const result = await getTestPrepAnalytics();

    const toeic = result.perExam.find((e) => e.exam === "toeic")!;
    expect(toeic.bandDistribution[0]).toEqual({ band: "800", count: 3 });
    expect(toeic.bandDistribution[1]).toEqual({ band: "600", count: 2 });
    expect(toeic.bandDistribution[2]).toEqual({ band: "400", count: 1 });
  });

  it("groups null bandEstimate under 'unknown'", async () => {
    mockGroupBy.mockResolvedValue([]);
    mockFindMany.mockResolvedValue([
      { exam: "oet", bandEstimate: null },
      { exam: "oet", bandEstimate: null },
      { exam: "oet", bandEstimate: "B" },
    ]);

    const result = await getTestPrepAnalytics();

    const oet = result.perExam.find((e) => e.exam === "oet")!;
    const unknown = oet.bandDistribution.find((b) => b.band === "unknown");
    const bBand = oet.bandDistribution.find((b) => b.band === "B");
    expect(unknown?.count).toBe(2);
    expect(bBand?.count).toBe(1);
    // sorted desc — "unknown" (2) before "B" (1)
    expect(oet.bandDistribution[0].band).toBe("unknown");
  });

  it("band distribution only contains rows for the correct exam", async () => {
    mockGroupBy.mockResolvedValue([]);
    mockFindMany.mockResolvedValue([
      { exam: "toeic", bandEstimate: "600" },
      { exam: "ielts", bandEstimate: "Band 6.0" },
      { exam: "toefl", bandEstimate: "18" },
    ]);

    const result = await getTestPrepAnalytics();

    const toeic = result.perExam.find((e) => e.exam === "toeic")!;
    expect(toeic.bandDistribution).toHaveLength(1);
    expect(toeic.bandDistribution[0].band).toBe("600");

    const ielts = result.perExam.find((e) => e.exam === "ielts")!;
    expect(ielts.bandDistribution).toHaveLength(1);
    expect(ielts.bandDistribution[0].band).toBe("Band 6.0");
  });

  it("returns a generatedAt ISO timestamp string", async () => {
    mockGroupBy.mockResolvedValue([]);
    mockFindMany.mockResolvedValue([]);

    const result = await getTestPrepAnalytics();

    expect(typeof result.generatedAt).toBe("string");
    expect(isNaN(Date.parse(result.generatedAt))).toBe(false);
  });
});
