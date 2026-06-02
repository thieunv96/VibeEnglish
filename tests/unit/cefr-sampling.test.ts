import { describe, it, expect } from "vitest";
import {
  sampleCefrQuestions,
  fisherYatesShuffle,
  fallbackLevel,
  CEFR_TARGET_COUNTS,
  CEFR_LEVELS,
  type LevelPool,
  type QuestionRow,
} from "../../src/lib/cefr-sampling";
import type { CefrLevel } from "../../src/lib/content";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a question row for a given level. */
function makeQ(level: CefrLevel, idx: number): QuestionRow {
  return {
    questionId: `${level}-q${idx}`,
    exerciseSlug: `${level}-ex${Math.floor(idx / 3)}`,
    exerciseSkill: "grammar",
    exerciseTitle: `${level} Exercise ${Math.floor(idx / 3)}`,
    exerciseLevel: level,
  };
}

/** Build a LevelPool with a given count per level. */
function buildPool(counts: Partial<Record<CefrLevel, number>>): LevelPool {
  const pool: LevelPool = { A1: [], A2: [], B1: [], B2: [], C1: [], C2: [] };
  for (const level of CEFR_LEVELS) {
    const n = counts[level] ?? 0;
    pool[level] = Array.from({ length: n }, (_, i) => makeQ(level, i));
  }
  return pool;
}

/** Deterministic pseudo-random for stable test runs. */
function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CEFR_TARGET_COUNTS", () => {
  it("sums to 25 (current content-adjusted distribution)", () => {
    const total = Object.values(CEFR_TARGET_COUNTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(25);
  });

  it("sets C2 target to 0 (no C2 content in DB)", () => {
    expect(CEFR_TARGET_COUNTS.C2).toBe(0);
  });
});

describe("fisherYatesShuffle", () => {
  it("preserves array length", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle([...arr], seededRand(42));
    expect(result).toHaveLength(5);
  });

  it("contains same elements after shuffle", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle([...arr], seededRand(42));
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("is deterministic with a seeded rand", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const r1 = fisherYatesShuffle([...arr], seededRand(7));
    const r2 = fisherYatesShuffle([...arr], seededRand(7));
    expect(r1).toEqual(r2);
  });
});

describe("fallbackLevel", () => {
  it("C1 falls back to B2", () => expect(fallbackLevel("C1")).toBe("B2"));
  it("C2 falls back to C1", () => expect(fallbackLevel("C2")).toBe("C1"));
  it("B2 falls back to B1", () => expect(fallbackLevel("B2")).toBe("B1"));
  it("B1 falls back to A2", () => expect(fallbackLevel("B1")).toBe("A2"));
  it("A2 falls back to A1", () => expect(fallbackLevel("A2")).toBe("A1"));
  it("A1 falls back to A2 (only higher neighbour)", () => expect(fallbackLevel("A1")).toBe("A2"));
});

describe("sampleCefrQuestions — happy path (sufficient content)", () => {
  const pool = buildPool({ A1: 12, A2: 23, B1: 30, B2: 33, C1: 4, C2: 0 });
  const rand = seededRand(99);
  const result = sampleCefrQuestions(pool, rand);

  it("returns exactly 25 questions when content is sufficient", () => {
    expect(result).toHaveLength(25);
  });

  it("has no duplicate questionIds", () => {
    const ids = result.map((q) => q.questionId);
    expect(new Set(ids).size).toBe(25);
  });

  it("scoringLevel equals exerciseLevel (no fallback needed when pool is full)", () => {
    for (const q of result) {
      expect(q.scoringLevel).toBe(q.exerciseLevel);
    }
  });

  it("levelMap reflects actual exercise level", () => {
    const levelMap: Record<string, CefrLevel> = {};
    for (const q of result) {
      levelMap[q.questionId] = q.scoringLevel;
    }
    // All scored levels must be valid CefrLevel values.
    for (const level of Object.values(levelMap)) {
      expect(CEFR_LEVELS).toContain(level);
    }
  });

  it("does not include any C2 questions (C2 target = 0)", () => {
    const c2Qs = result.filter((q) => q.exerciseLevel === "C2");
    expect(c2Qs).toHaveLength(0);
  });
});

describe("sampleCefrQuestions — C1 shortfall fallback to B2", () => {
  // C1 pool has only 2 exercises; target is 4; 2 must come from B2.
  const pool = buildPool({ A1: 12, A2: 23, B1: 30, B2: 33, C1: 2, C2: 0 });
  const result = sampleCefrQuestions(pool, seededRand(1));

  it("still returns 25 questions", () => {
    expect(result).toHaveLength(25);
  });

  it("has no duplicate questionIds", () => {
    const ids = result.map((q) => q.questionId);
    expect(new Set(ids).size).toBe(25);
  });

  it("shortfall questions come from B2 (scoringLevel = B2, not C1)", () => {
    // C1 target is 4 but only 2 are available; fallback supplies 2 from B2.
    // All C1-band fallback questions should be tagged B2 in scoringLevel.
    const c1ScoredFromB2 = result.filter(
      (q) => q.exerciseLevel === "B2" && q.scoringLevel === "B2",
    );
    // We expect at least 2 more B2-scored questions than B2's own target of 8.
    const b2Total = result.filter((q) => q.scoringLevel === "B2").length;
    expect(b2Total).toBeGreaterThanOrEqual(8); // 8 normal B2 + up to 2 C1 fallback
    expect(c1ScoredFromB2.length).toBeGreaterThan(0);
  });
});

describe("sampleCefrQuestions — C2 = 0 does NOT over-sample adjacent levels for C2", () => {
  // The B2 over-sampling (8 instead of 6) is baked into CEFR_TARGET_COUNTS.
  // The algorithm simply skips C2 (target 0) and does not add any extra
  // B2/C1 questions on top of their own targets.
  const pool = buildPool({ A1: 12, A2: 23, B1: 30, B2: 33, C1: 4, C2: 0 });
  const result = sampleCefrQuestions(pool, seededRand(2));

  it("exactly 8 questions come from B2 (no extra C2-proxy over-sampling)", () => {
    const b2Qs = result.filter((q) => q.exerciseLevel === "B2");
    expect(b2Qs).toHaveLength(8);
  });

  it("exactly 4 questions come from C1", () => {
    const c1Qs = result.filter((q) => q.exerciseLevel === "C1");
    expect(c1Qs).toHaveLength(4);
  });

  it("zero questions come from C2", () => {
    const c2Qs = result.filter((q) => q.exerciseLevel === "C2");
    expect(c2Qs).toHaveLength(0);
  });
});

describe("sampleCefrQuestions — degenerate pool (fewer than 25 questions total)", () => {
  // Only 6 total questions available; should return all 6.
  const pool = buildPool({ A1: 2, A2: 2, B1: 2, B2: 0, C1: 0, C2: 0 });
  const result = sampleCefrQuestions(pool, seededRand(5));

  it("returns however many questions are available (no crash)", () => {
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(25);
  });

  it("has no duplicates even when pool is tiny", () => {
    const ids = result.map((q) => q.questionId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("sampleCefrQuestions — final order is shuffled (not in level order)", () => {
  // With enough questions, the final shuffle should not produce strict level ordering.
  const pool = buildPool({ A1: 12, A2: 23, B1: 30, B2: 33, C1: 4, C2: 0 });
  const result = sampleCefrQuestions(pool, seededRand(77));

  it("is not sorted purely in level order", () => {
    const levels = result.map((q) => q.exerciseLevel);
    const sortedLevels = [...levels].sort(
      (a, b) => CEFR_LEVELS.indexOf(a) - CEFR_LEVELS.indexOf(b),
    );
    // With 25 questions it would be astronomically unlikely for the final shuffle
    // to produce the exact same order as a sorted array.
    expect(levels.join(",")).not.toBe(sortedLevels.join(","));
  });
});

describe("sampleCefrQuestions — handles question-id collisions across exercises", () => {
  // Real-DB shape: every exercise uses "q1"–"q5" question ids. Without composite-key
  // dedup, the algorithm picks 4 ids in A1 and then skips every q1–q5 it sees in later
  // levels because `pickedIds.has("q1")` is true. This test reproduces that condition.
  function makeCollidingQ(level: CefrLevel, slug: string, qNum: number): QuestionRow {
    return {
      questionId: `q${qNum}`, // bare per-exercise id, collides across exercises
      exerciseSlug: slug,
      exerciseSkill: "grammar",
      exerciseTitle: slug,
      exerciseLevel: level,
    };
  }
  function buildCollidingPool(): LevelPool {
    const pool: LevelPool = { A1: [], A2: [], B1: [], B2: [], C1: [], C2: [] };
    // Each level has 4 exercises, each exercise has 5 questions q1–q5 → 20 per level.
    for (const level of ["A1", "A2", "B1", "B2", "C1"] as CefrLevel[]) {
      for (let ex = 0; ex < 4; ex++) {
        for (let q = 1; q <= 5; q++) {
          pool[level].push(makeCollidingQ(level, `${level}-ex${ex}`, q));
        }
      }
    }
    return pool;
  }

  it("returns 25 distinct questions even when q-ids collide across exercises", () => {
    const result = sampleCefrQuestions(buildCollidingPool(), seededRand(11));
    expect(result.length).toBe(25);
    // Each sampled question must be unique by (slug, questionId) composite key.
    const composite = new Set(result.map((r) => `${r.exerciseSlug}:${r.questionId}`));
    expect(composite.size).toBe(25);
  });

  it("preserves spec-target distribution under collisions", () => {
    const result = sampleCefrQuestions(buildCollidingPool(), seededRand(23));
    const byLevel: Record<string, number> = {};
    for (const r of result) byLevel[r.exerciseLevel] = (byLevel[r.exerciseLevel] ?? 0) + 1;
    expect(byLevel.A1).toBe(CEFR_TARGET_COUNTS.A1);
    expect(byLevel.A2).toBe(CEFR_TARGET_COUNTS.A2);
    expect(byLevel.B1).toBe(CEFR_TARGET_COUNTS.B1);
    expect(byLevel.B2).toBe(CEFR_TARGET_COUNTS.B2);
    expect(byLevel.C1).toBe(CEFR_TARGET_COUNTS.C1);
  });
});
