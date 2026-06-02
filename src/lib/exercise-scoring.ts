/**
 * exercise-scoring.ts
 *
 * Pure scoring helpers extracted from ExerciseRunner.tsx.
 * Zero side effects — no Prisma, no fetch, no Date.now().
 */

import type { ExerciseQuestion } from "@/lib/content";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** ExerciseQuestion with answer fields stripped for client delivery. */
export interface SanitisedQuestion {
  id: string;
  type: ExerciseQuestion["type"];
  prompt: string;
  /** Present for mcq. Options are safe to expose. */
  options?: string[];
  /**
   * For `match` type: only the `left` side is included.
   * The correct `right` values are stripped; the caller supplies a separate
   * shuffled `options` array derived from the `right` values for UI rendering.
   */
  pairs?: { left: string }[];
  /** Non-revealing hint text; safe to expose. */
  explanation?: string;
  /** Identifies which exercise contributed this question (for grouping). */
  sourceExerciseSlug: string;
  /** Skill of the source exercise (for per-skill scoring). */
  sourceExerciseSkill: string;
  /** CEFR level of the source exercise (for per-level scoring in CEFR test). */
  sourceExerciseLevel?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a string for case-insensitive, punctuation-tolerant comparison.
 * Behaviour is identical to the inline version in ExerciseRunner.tsx.
 */
export function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[^\p{L}\p{N}'$€.]/gu, "");
}

/**
 * Check whether a given answer is correct for the supplied question.
 * Supports mcq, fill, and match question types.
 * Behaviour is identical to the inline version in ExerciseRunner.tsx.
 */
export function checkAnswer(
  q: ExerciseQuestion,
  given: string | Record<string, string>,
): boolean {
  if (q.type === "match" && q.pairs) {
    if (typeof given !== "object") return false;
    return q.pairs.every(
      (p) => normalize(given[p.left] ?? "") === normalize(p.right),
    );
  }
  const want = Array.isArray(q.answer) ? q.answer : [q.answer];
  return want.some((w) => normalize(String(w)) === normalize(String(given)));
}

/**
 * Fisher-Yates shuffle — returns a new shuffled array (non-mutating).
 * Used internally by sanitiseQuestion for match-option randomisation.
 */
function shuffleArray<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Strip answer-revealing fields from a question before sending it to a client.
 *
 * Rules:
 * - `answer` field is removed entirely.
 * - For `match` questions: `pairs[].right` values are removed; only `left`
 *   is retained. This prevents client-side answer reconstruction.
 *   The `right` values are collected, shuffled, and exposed as `options` so
 *   ExerciseRunner can populate the dropdown without revealing the mapping.
 * - `options` (MCQ) are safe and are retained as-is.
 * - `explanation` is retained; it reveals no answer by itself.
 * - `sourceExerciseSlug`, `sourceExerciseSkill`, `sourceExerciseLevel` must be
 *   supplied by the caller and are included in the returned object.
 */
export function sanitiseQuestion(
  q: ExerciseQuestion,
  source: {
    slug: string;
    skill: string;
    level?: string;
  },
): SanitisedQuestion {
  const base: SanitisedQuestion = {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    sourceExerciseSlug: source.slug,
    sourceExerciseSkill: source.skill,
  };

  if (source.level !== undefined) {
    base.sourceExerciseLevel = source.level;
  }

  if (q.options) {
    base.options = q.options;
  }

  if (q.type === "match" && q.pairs) {
    // Strip `right` values; preserve only `left` for client-side rendering.
    base.pairs = q.pairs.map((p) => ({ left: p.left }));
    // Expose shuffled right values as `options` so ExerciseRunner dropdowns
    // have selectable choices without leaking the correct mapping (AC-2).
    base.options = shuffleArray(q.pairs.map((p) => p.right));
  }

  if (q.explanation) {
    base.explanation = q.explanation;
  }

  return base;
}
