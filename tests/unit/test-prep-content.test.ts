/**
 * test-prep-content.test.ts
 *
 * Unit tests for sampleListeningQuestions() — the exam+skill-filtered question sampler.
 *
 * Prisma is mocked (no real DB connection). Tests verify:
 *   - Filter includes { exam, skill: "listening" }
 *   - Correct pool sizing: >= MOCK_TEST_QUESTION_COUNT returns full set; < count returns empty
 *   - Output shape (exerciseSlug, question tuple)
 *   - Answer fields are preserved (trust boundary test — caller must sanitise)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => {
  return {
    prisma: {
      exercise: {
        findMany: vi.fn(),
      },
    },
  };
});

import { prisma } from "../../src/lib/db";
import { sampleListeningQuestions } from "../../src/lib/test-prep-content";
import type { ExamSlug } from "../../src/lib/test-prep-constants";

const mockFindMany = vi.mocked(prisma.exercise.findMany);

describe("sampleListeningQuestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("empty pool → returns empty array", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    const result = await sampleListeningQuestions("toeic");

    expect(result).toEqual([]);
  });

  it("includes { exam, skill: 'listening' } in where clause", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    await sampleListeningQuestions("ielts");

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { exam: "ielts", skill: "listening" },
      select: { slug: true, skill: true, title: true, level: true, questions: true },
    });
  });

  it("pool of 5 exercises × 5 questions each (25 total) → returns 25 tuples", async () => {
    const fixtures = Array.from({ length: 5 }, (_, i) => ({
      slug: `ex-${i + 1}`,
      skill: "listening",
      title: `Exercise ${i + 1}`,
      level: "B1",
      type: "mcq",
      exam: "toefl",
      questions: Array.from({ length: 5 }, (_, j) => ({
        id: `q${j + 1}`,
        type: "mcq",
        prompt: `Question ${j + 1}`,
        options: ["A", "B", "C", "D"],
        answer: "A", // Trust boundary: answer is present in output
      })),
    }));

    mockFindMany.mockResolvedValueOnce(fixtures as any);

    const result = await sampleListeningQuestions("toefl");

    expect(result).toHaveLength(25);
    // Result is shuffled, so we just check properties are present
    expect(result[0]).toHaveProperty("exerciseSlug");
    expect(result[0]).toHaveProperty("exerciseSkill", "listening");
    expect(result[0]).toHaveProperty("question");
    expect(result[0].question.answer).toBe("A"); // Answer preserved
    // Verify all original exercises are represented
    const exerciseSlugs = new Set(result.map((r) => r.exerciseSlug));
    expect(exerciseSlugs.size).toBe(5);
  });

  it("pool of 3 exercises × 4 questions each (12 total) → returns empty (< 25)", async () => {
    const fixtures = Array.from({ length: 3 }, (_, i) => ({
      slug: `ex-${i + 1}`,
      skill: "listening",
      title: `Exercise ${i + 1}`,
      level: "B2",
      type: "mcq",
      exam: "oet",
      questions: Array.from({ length: 4 }, (_, j) => ({
        id: `q${j + 1}`,
        type: "mcq",
        prompt: `Question ${j + 1}`,
        options: ["A", "B", "C", "D"],
        answer: "C",
      })),
    }));

    mockFindMany.mockResolvedValueOnce(fixtures as any);

    const result = await sampleListeningQuestions("oet");

    // Pool < 25 → returns empty array; caller returns 503 no_content
    expect(result).toHaveLength(0);
  });

  it("pool too small (< 25) returns empty array", async () => {
    const fixtures = [
      {
        slug: "ex-a",
        skill: "listening",
        title: "Exercise A",
        level: "A1",
        type: "mcq",
        exam: "toeic",
        questions: [
          { id: "q1", type: "mcq", prompt: "Q1", options: ["A"], answer: "A" },
          { id: "q2", type: "mcq", prompt: "Q2", options: ["B"], answer: "B" },
        ],
      },
      {
        slug: "ex-b",
        skill: "listening",
        title: "Exercise B",
        level: "A2",
        type: "mcq",
        exam: "toeic",
        questions: [
          { id: "q1", type: "mcq", prompt: "Q3", options: ["C"], answer: "C" },
        ],
      },
    ];

    mockFindMany.mockResolvedValueOnce(fixtures as any);

    const result = await sampleListeningQuestions("toeic");

    // Pool has 3 questions (2 + 1), which is < 25
    expect(result).toHaveLength(0);
  });
});
