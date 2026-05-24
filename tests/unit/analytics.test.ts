import { describe, it, expect } from "vitest";
import { ageBracketOf, lessonHealth } from "../../src/lib/analytics-helpers";

describe("ageBracketOf", () => {
  const ref = new Date("2026-05-24T00:00:00Z");
  it("returns 'unknown' for null", () => {
    expect(ageBracketOf(null, ref)).toBe("unknown");
  });
  it("returns 'unknown' for impossible years", () => {
    expect(ageBracketOf(1800, ref)).toBe("unknown");
    expect(ageBracketOf(2100, ref)).toBe("unknown");
  });
  it("buckets common ages", () => {
    expect(ageBracketOf(2020, ref)).toBe("<13");      // age 6
    expect(ageBracketOf(2010, ref)).toBe("13–17");     // age 16
    expect(ageBracketOf(2003, ref)).toBe("18–24");     // age 23
    expect(ageBracketOf(1996, ref)).toBe("25–34");     // age 30
    expect(ageBracketOf(1986, ref)).toBe("35–44");     // age 40
    expect(ageBracketOf(1976, ref)).toBe("45–54");     // age 50
    expect(ageBracketOf(1966, ref)).toBe("55–64");     // age 60
    expect(ageBracketOf(1956, ref)).toBe("65+");       // age 70
  });
});

describe("lessonHealth", () => {
  it("is 0 with no attempts", () => {
    expect(lessonHealth({ attempts: 0, avgAccuracy: 1, completionRate: 1 })).toBe(0);
  });
  it("rewards both accuracy and popularity", () => {
    const a = lessonHealth({ attempts: 1, avgAccuracy: 1, completionRate: 1 });
    const b = lessonHealth({ attempts: 100, avgAccuracy: 1, completionRate: 1 });
    expect(b).toBeGreaterThan(a);
  });
  it("low accuracy lowers score even with high traffic", () => {
    const lowAcc = lessonHealth({ attempts: 100, avgAccuracy: 0.2, completionRate: 0.5 });
    const highAcc = lessonHealth({ attempts: 10, avgAccuracy: 0.95, completionRate: 0.9 });
    expect(highAcc).toBeGreaterThan(lowAcc);
  });
  it("completion-rate weight is bounded between 0.5x and 1x", () => {
    const noCompletion = lessonHealth({ attempts: 4, avgAccuracy: 1, completionRate: 0 });
    const fullCompletion = lessonHealth({ attempts: 4, avgAccuracy: 1, completionRate: 1 });
    expect(noCompletion).toBeCloseTo(2 * 0.5, 5); // sqrt(4)*1*0.5 = 1
    expect(fullCompletion).toBeCloseTo(2 * 1, 5); // sqrt(4)*1*1 = 2
  });
});
