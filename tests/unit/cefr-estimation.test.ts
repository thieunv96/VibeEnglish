import { describe, it, expect } from "vitest";
import { computeCefrEstimate } from "../../src/lib/cefr-estimation";
import type { LevelScores } from "../../src/lib/cefr-estimation";

/** Helper: build a full LevelScores object, defaulting unused bands to 0/0. */
function scores(overrides: Partial<LevelScores>): LevelScores {
  const defaults: LevelScores = {
    A1: { correct: 0, total: 0 },
    A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 },
    B2: { correct: 0, total: 0 },
    C1: { correct: 0, total: 0 },
    C2: { correct: 0, total: 0 },
  };
  return { ...defaults, ...overrides };
}

describe("computeCefrEstimate", () => {
  // Test case 1: All correct, C2.total === 0 → "C1+"
  it("returns C1+ when all bands pass and C2 has no questions (current content state)", () => {
    const s = scores({
      A1: { correct: 4, total: 4 },
      A2: { correct: 4, total: 4 },
      B1: { correct: 5, total: 5 },
      B2: { correct: 8, total: 8 },
      C1: { correct: 4, total: 4 },
      C2: { correct: 0, total: 0 }, // no C2 content
    });
    expect(computeCefrEstimate(s)).toBe("C1+");
  });

  // Test case 2: All correct, C2.total > 0 → "C2"
  it("returns C2 when all bands pass and C2 has questions", () => {
    const s = scores({
      A1: { correct: 4, total: 4 },
      A2: { correct: 4, total: 4 },
      B1: { correct: 5, total: 5 },
      B2: { correct: 8, total: 8 },
      C1: { correct: 4, total: 4 },
      C2: { correct: 4, total: 4 },
    });
    expect(computeCefrEstimate(s)).toBe("C2");
  });

  // Test case 3: All wrong → "A1"
  it("returns A1 when no band reaches the pass threshold", () => {
    const s = scores({
      A1: { correct: 0, total: 4 },
      A2: { correct: 0, total: 4 },
      B1: { correct: 0, total: 5 },
      B2: { correct: 0, total: 8 },
      C1: { correct: 0, total: 4 },
      C2: { correct: 0, total: 0 },
    });
    expect(computeCefrEstimate(s)).toBe("A1");
  });

  // Test case 4: C1 passes, C2.total === 0 → "C1+"
  it("returns C1+ when C1 passes threshold and C2 has no content", () => {
    const s = scores({
      A1: { correct: 4, total: 4 },
      A2: { correct: 4, total: 4 },
      B1: { correct: 4, total: 5 },
      B2: { correct: 5, total: 8 },
      C1: { correct: 3, total: 4 }, // 75% ≥ 60% — passes
      C2: { correct: 0, total: 0 },
    });
    expect(computeCefrEstimate(s)).toBe("C1+");
  });

  // Test case 5: C1 passes, C2 has questions but fails → "C1"
  it("returns C1 when C1 passes but C2 has questions and fails threshold", () => {
    const s = scores({
      A1: { correct: 4, total: 4 },
      B2: { correct: 5, total: 8 },
      C1: { correct: 3, total: 4 }, // 75% — passes
      C2: { correct: 1, total: 3 }, // 33% — fails; C1+ substitution does NOT apply
    });
    expect(computeCefrEstimate(s)).toBe("C1");
  });

  // Test case 6: Score discontinuity — passes B2 but not B1 → "B2"
  it("returns highest passing band even with a discontinuity (passes B2 but fails B1)", () => {
    const s = scores({
      A1: { correct: 4, total: 4 },
      A2: { correct: 4, total: 4 },
      B1: { correct: 2, total: 5 }, // 40% — fails
      B2: { correct: 6, total: 8 }, // 75% — passes
      C1: { correct: 1, total: 4 }, // 25% — fails
    });
    expect(computeCefrEstimate(s)).toBe("B2");
  });

  // Test case 7: Zero-total band is skipped, does not affect estimate
  it("skips zero-total bands without affecting the estimate", () => {
    const s = scores({
      A1: { correct: 3, total: 4 }, // 75%
      A2: { correct: 3, total: 4 }, // 75%
      B1: { correct: 0, total: 0 }, // skipped — zero total
      B2: { correct: 5, total: 8 }, // 62.5% — passes
      C1: { correct: 0, total: 0 }, // skipped
      C2: { correct: 0, total: 0 }, // skipped
    });
    // Highest non-zero pass is B2
    expect(computeCefrEstimate(s)).toBe("B2");
  });

  // Additional: exact pass threshold (60%)
  it("accepts exactly 60% as a pass", () => {
    const s = scores({
      B1: { correct: 3, total: 5 }, // 60% — exactly at threshold
      C2: { correct: 0, total: 0 },
    });
    expect(computeCefrEstimate(s)).toBe("B1");
  });

  // Additional: just below pass threshold (59%)
  it("rejects 59% as insufficient (below pass threshold)", () => {
    const s = scores({
      A1: { correct: 4, total: 4 },
      B1: { correct: 2, total: 5 }, // 40% — fails; won't be reached via descend anyway
      B2: { correct: 5, total: 9 }, // ~55.6% — fails
      C1: { correct: 1, total: 4 }, // 25% — fails
    });
    // Best we can pass is A1 (only band with 100%)
    expect(computeCefrEstimate(s)).toBe("A1");
  });
});
