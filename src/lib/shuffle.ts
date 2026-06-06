/**
 * Fisher-Yates in-place shuffle.
 *
 * Extracted from `src/app/api/sample-test/start/route.ts` to avoid duplication
 * across all test-start routes (sample, CEFR, mock). Mutates and returns the array.
 *
 * Pure function — no Prisma, no network, no side-effects. Unit-testable in isolation.
 */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
