import { describe, it, expect } from "vitest";
import {
  buildSkillBreakdown,
  pickWeakestSkill,
} from "../../src/lib/recommendation";
import type { ExerciseScore } from "../../src/lib/recommendation";

// ---------------------------------------------------------------------------
// buildSkillBreakdown
// ---------------------------------------------------------------------------
describe("buildSkillBreakdown", () => {
  it("aggregates scores from multiple exercises for the same skill", () => {
    const scores: ExerciseScore[] = [
      { slug: "a", skill: "grammar", title: "A", correct: 2, total: 3 },
      { slug: "b", skill: "grammar", title: "B", correct: 1, total: 2 },
      { slug: "c", skill: "vocabulary", title: "C", correct: 3, total: 3 },
    ];
    const breakdown = buildSkillBreakdown(scores);
    const grammar = breakdown.find((s) => s.skill === "grammar");
    const vocab = breakdown.find((s) => s.skill === "vocabulary");
    expect(grammar).toMatchObject({ correct: 3, total: 5, ratio: 3 / 5 });
    expect(vocab).toMatchObject({ correct: 3, total: 3, ratio: 1 });
  });

  it("returns empty array for empty input", () => {
    expect(buildSkillBreakdown([])).toEqual([]);
  });

  it("handles a single skill", () => {
    const scores: ExerciseScore[] = [
      { slug: "x", skill: "listening", title: "X", correct: 0, total: 4 },
    ];
    const breakdown = buildSkillBreakdown(scores);
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]).toMatchObject({ skill: "listening", ratio: 0 });
  });
});

// ---------------------------------------------------------------------------
// pickWeakestSkill — basic ordering
// ---------------------------------------------------------------------------
describe("pickWeakestSkill – basic ordering", () => {
  it("returns skills ordered weakest first", () => {
    const scores: ExerciseScore[] = [
      { slug: "a", skill: "grammar", title: "A", correct: 3, total: 4 },    // 0.75
      { slug: "b", skill: "vocabulary", title: "B", correct: 1, total: 4 }, // 0.25
      { slug: "c", skill: "listening", title: "C", correct: 2, total: 4 },  // 0.50
    ];
    const result = pickWeakestSkill(scores);
    expect(result[0]).toBe("vocabulary");
    expect(result[1]).toBe("listening");
    expect(result[2]).toBe("grammar");
  });

  it("returns empty array for empty input", () => {
    expect(pickWeakestSkill([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tie-break: equal ratio → highest total wins
// ---------------------------------------------------------------------------
describe("pickWeakestSkill – tie-break on total", () => {
  it("prefers the skill with more questions when ratios are equal", () => {
    const scores: ExerciseScore[] = [
      // Both 50% correct but "grammar" has more questions → more signal → first
      { slug: "a", skill: "grammar", title: "A", correct: 2, total: 4 },
      { slug: "b", skill: "vocabulary", title: "B", correct: 1, total: 2 },
    ];
    const result = pickWeakestSkill(scores);
    expect(result[0]).toBe("grammar"); // higher total, same ratio
    expect(result[1]).toBe("vocabulary");
  });

  it("handles multiple exercises for a skill in the tie case", () => {
    const scores: ExerciseScore[] = [
      { slug: "a", skill: "reading", title: "A", correct: 1, total: 2 },
      { slug: "b", skill: "reading", title: "B", correct: 1, total: 2 }, // reading: 2/4 = 0.5
      { slug: "c", skill: "writing", title: "C", correct: 1, total: 2 }, // writing: 1/2 = 0.5
    ];
    const result = pickWeakestSkill(scores);
    // reading has total=4, writing has total=2 → reading first
    expect(result[0]).toBe("reading");
    expect(result[1]).toBe("writing");
  });
});

// ---------------------------------------------------------------------------
// Tie-break: equal ratio AND equal total → alphabetical
// ---------------------------------------------------------------------------
describe("pickWeakestSkill – alphabetical tie-break", () => {
  it("falls back to alphabetical order when ratio and total are both tied", () => {
    const scores: ExerciseScore[] = [
      { slug: "z", skill: "writing", title: "Z", correct: 1, total: 2 },   // 0.5, total=2
      { slug: "a", skill: "grammar", title: "A", correct: 1, total: 2 },   // 0.5, total=2
      { slug: "m", skill: "listening", title: "M", correct: 1, total: 2 }, // 0.5, total=2
    ];
    const result = pickWeakestSkill(scores);
    expect(result[0]).toBe("grammar");    // g < l < w
    expect(result[1]).toBe("listening");
    expect(result[2]).toBe("writing");
  });
});

// ---------------------------------------------------------------------------
// Zero-score edge case
// ---------------------------------------------------------------------------
describe("pickWeakestSkill – zero scores", () => {
  it("places skills with zero correct at the front", () => {
    const scores: ExerciseScore[] = [
      { slug: "a", skill: "grammar", title: "A", correct: 0, total: 3 }, // 0%
      { slug: "b", skill: "vocabulary", title: "B", correct: 3, total: 3 }, // 100%
    ];
    const result = pickWeakestSkill(scores);
    expect(result[0]).toBe("grammar");
    expect(result[1]).toBe("vocabulary");
  });

  it("handles all zeros — falls back to alphabetical", () => {
    const scores: ExerciseScore[] = [
      { slug: "a", skill: "speaking", title: "A", correct: 0, total: 2 },
      { slug: "b", skill: "grammar", title: "B", correct: 0, total: 2 },
    ];
    const result = pickWeakestSkill(scores);
    expect(result[0]).toBe("grammar");
    expect(result[1]).toBe("speaking");
  });
});
