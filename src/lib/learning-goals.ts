export const GOAL_OPTIONS = [
  // Test prep
  "toeic",
  "toefl",
  "ielts",
  "oet",
  // General
  "conversation",
  "business",
  "travel",
  "movies-tv",
  "academic",
  // Per-skill
  "listening",
  "speaking",
  "reading",
  "writing",
  "pronunciation",
  // Mastery
  "grammar-mastery",
  "vocabulary-building",
  // Family
  "kids-family",
] as const;

export type GoalSlug = (typeof GOAL_OPTIONS)[number];

export const TEST_PREP_GOALS: ReadonlySet<GoalSlug> = new Set<GoalSlug>([
  "toeic",
  "toefl",
  "ielts",
  "oet",
]);

export function parseGoals(raw: string | null): GoalSlug[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter((g): g is GoalSlug => (GOAL_OPTIONS as readonly string[]).includes(g));
  } catch {
    return [];
  }
}
