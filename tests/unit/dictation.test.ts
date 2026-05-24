import { describe, it, expect } from "vitest";
import { scoreDictation } from "../../src/lib/dictation";

describe("scoreDictation", () => {
  it("scores an exact match as 100%", () => {
    const r = scoreDictation("The cat sat on the mat.", "The cat sat on the mat.");
    expect(r.accuracy).toBe(1);
    expect(r.diff.every((d) => d.status === "ok")).toBe(true);
  });

  it("flags a missing word", () => {
    const r = scoreDictation("The cat sat on the mat.", "The cat on the mat.");
    expect(r.accuracy).toBeCloseTo(5 / 6, 3);
    const missing = r.diff.find((d) => d.status === "miss");
    expect(missing).toBeDefined();
    expect(missing?.word.toLowerCase()).toBe("sat");
  });

  it("flags an extra word", () => {
    const r = scoreDictation("The cat sat.", "The big cat sat.");
    expect(r.correct).toBe(3);
    expect(r.diff.some((d) => d.status === "extra" && d.word === "big")).toBe(true);
  });

  it("treats punctuation differences as equal", () => {
    const r = scoreDictation("Hello, world!", "hello world");
    expect(r.accuracy).toBe(1);
  });

  it("counts a typo as a miss", () => {
    const r = scoreDictation("The quick brown fox.", "The qiuck brown fox.");
    expect(r.correct).toBe(3);
    expect(r.diff.some((d) => d.status === "miss" && d.word.toLowerCase() === "quick")).toBe(true);
  });
});
