/**
 * cefr-estimation.ts
 *
 * Pure CEFR level estimation algorithm.
 * Zero side effects — no Prisma, no fetch, no Date.now().
 */

import type { CefrLevel } from "@/lib/content";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Extended CEFR label that includes "C1+" to signal that the user passed C1
 * but the test could not confirm C2 due to absent C2 content.
 */
export type CefrEstimate = CefrLevel | "C1+";

export interface LevelScore {
  correct: number;
  total: number;
}

/** Input type: per-level correct/total tallies from a CEFR test session. */
export type LevelScores = Record<CefrLevel, LevelScore>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Descending band evaluation order per spec algorithm. */
const BANDS_DESCENDING: CefrLevel[] = ["C2", "C1", "B2", "B1", "A2", "A1"];

/** Accuracy threshold (≥ this ratio is a pass). */
const PASS_THRESHOLD = 0.6;

// ---------------------------------------------------------------------------
// Algorithm
// ---------------------------------------------------------------------------

/**
 * Compute a CEFR level estimate from per-level scoring data.
 *
 * Algorithm (spec-compliant):
 * 1. Evaluate bands in descending order: C2 → C1 → B2 → B1 → A2 → A1.
 * 2. Skip any level where `total === 0` (no questions drawn).
 * 3. Check `correct / total >= 0.60` at each level.
 * 4. C1+ special case (evaluated BEFORE returning "C1"):
 *    If the highest passing band is C1 AND `levelScores.C2.total === 0`
 *    (no C2 content was available), return "C1+" instead of "C1".
 * 5. Return the first (highest) passing level (with the C1+ substitution).
 * 6. If no level passes, return "A1".
 */
export function computeCefrEstimate(levelScores: LevelScores): CefrEstimate {
  for (const level of BANDS_DESCENDING) {
    const band = levelScores[level];

    // Step 2: skip bands with no questions.
    if (!band || band.total === 0) continue;

    // Step 3: check pass threshold.
    if (band.correct / band.total >= PASS_THRESHOLD) {
      // Step 4: C1+ special case.
      if (level === "C1" && (levelScores.C2?.total ?? 0) === 0) {
        return "C1+";
      }
      return level;
    }
  }

  // Step 6: floor is A1.
  return "A1";
}
