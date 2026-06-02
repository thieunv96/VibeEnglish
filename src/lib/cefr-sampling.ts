/**
 * cefr-sampling.ts
 *
 * Pure stratified question-sampling helpers for the 25-Q CEFR placement test.
 * Zero side effects — no Prisma, no fetch, no Date.now().
 * All DB interaction is done in the start route; this module is purely
 * in-memory so it can be unit-tested without a DB connection.
 */

import type { CefrLevel } from "@/lib/content";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Target question counts per CEFR level.
 * C2 = 0: no C2 content exists in the current DB.
 * B2 over-samples by 2 to absorb the missing C2 slots.
 * Update this (and add C2 content) when the content team delivers C2.
 */
export const CEFR_TARGET_COUNTS: Record<CefrLevel, number> = {
  A1: 4,
  A2: 4,
  B1: 5,
  B2: 8,
  C1: 4,
  C2: 0,
};

/** Ordered CEFR levels for iteration. */
export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Flat question tuple — one entry per question (not per exercise). */
export interface QuestionRow {
  questionId: string;
  exerciseSlug: string;
  exerciseSkill: string;
  exerciseTitle: string;
  exerciseLevel: CefrLevel;
}

/** Input pool keyed by level — all available questions per level. */
export type LevelPool = Record<CefrLevel, QuestionRow[]>;

/** Sampled question; scoringLevel always reflects the actual exercise level. */
export interface SampledQuestion extends QuestionRow {
  scoringLevel: CefrLevel;
}

// ---------------------------------------------------------------------------
// Fisher-Yates shuffle (injectable rand for deterministic tests)
// ---------------------------------------------------------------------------

/**
 * In-place Fisher-Yates shuffle. Returns the same array after mutation.
 * @param arr   Array to shuffle (mutated in place).
 * @param rand  Random function returning [0, 1) — injectable for determinism.
 */
export function fisherYatesShuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Fallback level resolution
// ---------------------------------------------------------------------------

/**
 * Return the fallback level when a given level is under-represented.
 * Per spec:
 *   C1 → B2  (largest adjacent pool)
 *   A1 → A2  (only higher neighbour available)
 *   All others → immediately lower level
 *   C2 → C1  (spec: C2 is empty, but if it ever isn't, fall to C1)
 */
export function fallbackLevel(level: CefrLevel): CefrLevel | null {
  const map: Partial<Record<CefrLevel, CefrLevel>> = {
    C2: "C1",
    C1: "B2",
    B2: "B1",
    B1: "A2",
    A2: "A1",
    A1: "A2",
  };
  return map[level] ?? null;
}

// ---------------------------------------------------------------------------
// Core sampling algorithm
// ---------------------------------------------------------------------------

/**
 * Perform stratified sampling from the given level pools.
 *
 * Algorithm (spec-compliant):
 * 1. For each level in [A1, A2, B1, B2, C1, C2]:
 *    a. Skip if target === 0.
 *    b. Shuffle pool; take up to target unique questions.
 *    c. If shortfall: draw from fallback level (using actual exercise level as scoringLevel).
 * 2. Final shuffle so questions are not in level order.
 *
 * @param pools   Available questions per level.
 * @param rand    Injectable random fn for test determinism.
 * @returns       Shuffled array of sampled questions (may be < 25 if pool exhausted).
 */
export function sampleCefrQuestions(
  pools: LevelPool,
  rand: () => number = Math.random,
): SampledQuestion[] {
  const result: SampledQuestion[] = [];
  // Composite key "${exerciseSlug}:${questionId}" prevents cross-exercise collisions.
  // Question IDs in Exercise.questions JSON are only unique within one exercise ("q1"–"q5"),
  // so bare questionId dedup causes almost every question from later levels to be skipped.
  const pickedKeys = new Set<string>();

  for (const level of CEFR_LEVELS) {
    const target = CEFR_TARGET_COUNTS[level];
    if (target === 0) continue;

    // Shuffle a copy — don't mutate the caller's pools.
    const pool = fisherYatesShuffle([...pools[level]], rand);
    let needed = target;

    for (const q of pool) {
      if (needed <= 0) break;
      const key = `${q.exerciseSlug}:${q.questionId}`;
      if (pickedKeys.has(key)) continue;
      pickedKeys.add(key);
      result.push({ ...q, scoringLevel: q.exerciseLevel });
      needed--;
    }

    if (needed <= 0) continue;

    // Fallback: fill remaining slots from adjacent levels.
    let fb: CefrLevel | null = fallbackLevel(level);
    let guardCount = 0;

    while (needed > 0 && fb !== null && guardCount < CEFR_LEVELS.length) {
      guardCount++;
      const fbPool = fisherYatesShuffle([...pools[fb]], rand);

      for (const q of fbPool) {
        if (needed <= 0) break;
        const key = `${q.exerciseSlug}:${q.questionId}`;
        if (pickedKeys.has(key)) continue;
        pickedKeys.add(key);
        // Tag with ACTUAL exercise level — scoring is accurate to source level.
        result.push({ ...q, scoringLevel: q.exerciseLevel });
        needed--;
      }

      fb = fallbackLevel(fb);
    }
  }

  // Final shuffle: do not present questions in level order.
  fisherYatesShuffle(result, rand);
  return result;
}
