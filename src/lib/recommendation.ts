/**
 * recommendation.ts
 *
 * Pure weakest-skill picker for sample-test and CEFR-test results pages.
 * Zero side effects — no Prisma, no fetch, no Date.now().
 *
 * The DB query (recommendForSkill) lives in:
 *   src/app/api/sample-test/recommendations/route.ts  (called client-side)
 *
 * Tie-break rule (spec §Recommendation Algorithm, Step 2):
 *   1. Lowest ratio (correct / total) wins.
 *   2. Tie on ratio → skill with the HIGHEST total count wins (more signal).
 *   3. Tie on total → alphabetical order among tied skills for determinism.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExerciseScore {
  slug: string;
  skill: string;
  title: string;
  correct: number;
  total: number;
}

export interface SkillScore {
  skill: string;
  correct: number;
  total: number;
  ratio: number;
}

export interface RecommendedExercise {
  id: string;
  slug: string;
  title: string;
  skill: string;
  level: string;
}

// ---------------------------------------------------------------------------
// Pure: aggregate exerciseScores → per-skill breakdown
// ---------------------------------------------------------------------------

export function buildSkillBreakdown(exerciseScores: ExerciseScore[]): SkillScore[] {
  const map = new Map<string, { correct: number; total: number }>();

  for (const es of exerciseScores) {
    const existing = map.get(es.skill) ?? { correct: 0, total: 0 };
    map.set(es.skill, {
      correct: existing.correct + es.correct,
      total: existing.total + es.total,
    });
  }

  return Array.from(map.entries()).map(([skill, { correct, total }]) => ({
    skill,
    correct,
    total,
    ratio: total > 0 ? correct / total : 0,
  }));
}

// ---------------------------------------------------------------------------
// Pure: pick weakest-first ordered list of skills
//
// Tie-break rule (documented here per spec requirement):
//   1. Lowest ratio first (weakest skill has lowest correct/total ratio).
//   2. Equal ratio → highest total first (more questions answered → more signal).
//   3. Equal ratio AND equal total → alphabetical order for determinism.
// ---------------------------------------------------------------------------

export function pickWeakestSkill(exerciseScores: ExerciseScore[]): string[] {
  const breakdown = buildSkillBreakdown(exerciseScores);

  if (breakdown.length === 0) return [];

  return breakdown
    .slice()
    .sort((a, b) => {
      // Primary: lower ratio is weaker
      if (a.ratio !== b.ratio) return a.ratio - b.ratio;
      // Secondary: higher total is more signal → comes first in weakest list
      if (a.total !== b.total) return b.total - a.total;
      // Tertiary: alphabetical for determinism
      return a.skill.localeCompare(b.skill);
    })
    .map((s) => s.skill);
}
