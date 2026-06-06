/**
 * test-prep-bands.test.ts
 *
 * Unit tests for estimateBand() — the per-exam band threshold lookup.
 *
 * Pure function tests: no Prisma, no network. Each exam (TOEIC/TOEFL/IELTS/OET)
 * is tested with boundary cases: 0/25 (first band), all correct (last band),
 * exact boundaries, mid-range, and total=0 edge case.
 */

import { describe, it, expect } from "vitest";
import { estimateBand } from "../../src/lib/test-prep-bands";

describe("estimateBand — IELTS (0.5 steps, 11 bands)", () => {
  it("0/25 (ratio=0.0) → Band 4.0 (lowest)", () => {
    const result = estimateBand(0, 25, "ielts");
    expect(result.band).toBe("Band 4.0");
    expect(result.rangeLow).toBe(0.0);
  });

  it("4/25 (ratio≈0.16) → Band 4.0 (< 0.18)", () => {
    const result = estimateBand(4, 25, "ielts");
    expect(result.band).toBe("Band 4.0");
  });

  it("5/25 (ratio=0.20) → Band 4.5 (>= 0.18)", () => {
    const result = estimateBand(5, 25, "ielts");
    expect(result.band).toBe("Band 4.5");
  });

  it("9/25 (ratio=0.36) → Band 5.5 (>= 0.36)", () => {
    const result = estimateBand(9, 25, "ielts");
    expect(result.band).toBe("Band 5.5");
  });

  it("16/25 (ratio=0.64) → Band 7.0 (>= 0.64)", () => {
    const result = estimateBand(16, 25, "ielts");
    expect(result.band).toBe("Band 7.0");
  });

  it("23/25 (ratio=0.92) → Band 8.5 (>= 0.91)", () => {
    const result = estimateBand(23, 25, "ielts");
    expect(result.band).toBe("Band 8.5");
  });

  it("25/25 (ratio=1.0) → Band 9.0 (highest)", () => {
    const result = estimateBand(25, 25, "ielts");
    expect(result.band).toBe("Band 9.0");
  });

  it("total=0 → Band 4.0 (lowest band)", () => {
    const result = estimateBand(0, 0, "ielts");
    expect(result.band).toBe("Band 4.0");
  });
});

describe("estimateBand — TOEIC (100/200 steps, 5 bands)", () => {
  it("0/25 (ratio=0.0) → 200 (lowest)", () => {
    const result = estimateBand(0, 25, "toeic");
    expect(result.band).toBe("200");
  });

  it("7/25 (ratio=0.28) → 200 (< 0.30)", () => {
    const result = estimateBand(7, 25, "toeic");
    expect(result.band).toBe("200");
  });

  it("8/25 (ratio=0.32) → 400 (>= 0.30)", () => {
    const result = estimateBand(8, 25, "toeic");
    expect(result.band).toBe("400");
  });

  it("13/25 (ratio=0.52) → 600 (>= 0.50)", () => {
    const result = estimateBand(13, 25, "toeic");
    expect(result.band).toBe("600");
  });

  it("18/25 (ratio=0.72) → 800 (>= 0.70)", () => {
    const result = estimateBand(18, 25, "toeic");
    expect(result.band).toBe("800");
  });

  it("23/25 (ratio=0.92) → 900 (>= 0.90)", () => {
    const result = estimateBand(23, 25, "toeic");
    expect(result.band).toBe("900");
  });

  it("25/25 (ratio=1.0) → 900 (highest)", () => {
    const result = estimateBand(25, 25, "toeic");
    expect(result.band).toBe("900");
  });

  it("total=0 → 200 (lowest band)", () => {
    const result = estimateBand(0, 0, "toeic");
    expect(result.band).toBe("200");
  });
});

describe("estimateBand — TOEFL (integer steps, 5 bands)", () => {
  it("0/25 (ratio=0.0) → 0 (lowest)", () => {
    const result = estimateBand(0, 25, "toefl");
    expect(result.band).toBe("0");
  });

  it("8/25 (ratio=0.32) → 10 (>= 0.33 boundary near)", () => {
    const result = estimateBand(8, 25, "toefl");
    expect(result.band).toBe("0");
  });

  it("9/25 (ratio=0.36) → 10 (>= 0.33)", () => {
    const result = estimateBand(9, 25, "toefl");
    expect(result.band).toBe("10");
  });

  it("14/25 (ratio=0.56) → 18 (>= 0.56)", () => {
    const result = estimateBand(14, 25, "toefl");
    expect(result.band).toBe("18");
  });

  it("19/25 (ratio=0.76) → 24 (>= 0.73)", () => {
    const result = estimateBand(19, 25, "toefl");
    expect(result.band).toBe("24");
  });

  it("22/25 (ratio=0.88) → 28 (>= 0.87)", () => {
    const result = estimateBand(22, 25, "toefl");
    expect(result.band).toBe("28");
  });

  it("25/25 (ratio=1.0) → 28 (highest)", () => {
    const result = estimateBand(25, 25, "toefl");
    expect(result.band).toBe("28");
  });

  it("total=0 → 0 (lowest band)", () => {
    const result = estimateBand(0, 0, "toefl");
    expect(result.band).toBe("0");
  });
});

describe("estimateBand — OET (letter steps, 5 bands)", () => {
  it("0/25 (ratio=0.0) → E (lowest)", () => {
    const result = estimateBand(0, 25, "oet");
    expect(result.band).toBe("E");
  });

  it("7/25 (ratio=0.28) → E (< 0.30)", () => {
    const result = estimateBand(7, 25, "oet");
    expect(result.band).toBe("E");
  });

  it("8/25 (ratio=0.32) → D (>= 0.30)", () => {
    const result = estimateBand(8, 25, "oet");
    expect(result.band).toBe("D");
  });

  it("13/25 (ratio=0.52) → C (>= 0.50)", () => {
    const result = estimateBand(13, 25, "oet");
    expect(result.band).toBe("C");
  });

  it("18/25 (ratio=0.72) → B (>= 0.70)", () => {
    const result = estimateBand(18, 25, "oet");
    expect(result.band).toBe("B");
  });

  it("23/25 (ratio=0.92) → A (>= 0.90)", () => {
    const result = estimateBand(23, 25, "oet");
    expect(result.band).toBe("A");
  });

  it("25/25 (ratio=1.0) → A (highest)", () => {
    const result = estimateBand(25, 25, "oet");
    expect(result.band).toBe("A");
  });

  it("total=0 → E (lowest band)", () => {
    const result = estimateBand(0, 0, "oet");
    expect(result.band).toBe("E");
  });
});
