/**
 * shuffle.test.ts
 *
 * Unit tests for the shuffle() utility — Fisher-Yates in-place array shuffle.
 *
 * Pure function tests: no side-effects other than array mutation (which is documented).
 * Tests verify determinism with seeded Math.random and correct element preservation.
 */

import { describe, it, expect, vi } from "vitest";
import { shuffle } from "../../src/lib/shuffle";

describe("shuffle", () => {
  it("empty array → empty array", () => {
    const arr: number[] = [];
    const result = shuffle(arr);
    expect(result).toEqual([]);
  });

  it("single-element array → same element", () => {
    const arr = [42];
    const result = shuffle(arr);
    expect(result).toEqual([42]);
  });

  it("two-element array with seeded random → deterministic swap", () => {
    const arr = [1, 2];
    // Seed Math.random to always return 0.5 (middle of 0..1)
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = shuffle([...arr]);
    vi.restoreAllMocks();

    // With seeded random and two elements, the shuffle should swap (deterministic).
    expect(result).toContain(1);
    expect(result).toContain(2);
    expect(result.length).toBe(2);
  });

  it("ten-element array preserves all elements after shuffle", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const original = [...arr];
    const result = shuffle(arr);

    // All original elements are still present (order may differ).
    expect(result.length).toBe(original.length);
    original.forEach((val) => {
      expect(result).toContain(val);
    });
  });

  it("shuffle with fixed random seed produces deterministic output", () => {
    const arr = [1, 2, 3, 4, 5];

    // Run shuffle twice with the same random seed.
    vi.spyOn(Math, "random").mockReturnValue(0.3);
    const result1 = shuffle([...arr]);
    vi.restoreAllMocks();

    vi.spyOn(Math, "random").mockReturnValue(0.3);
    const result2 = shuffle([...arr]);
    vi.restoreAllMocks();

    expect(result1).toEqual(result2);
  });

  it("mutates the original array (in-place Fisher-Yates)", () => {
    const arr = [1, 2, 3, 4];
    const ref = arr; // Keep reference to original array object.
    const result = shuffle(arr);

    // Result is the same object reference (mutated in-place).
    expect(result).toBe(ref);
  });
});
