export const GOAL_OPTIONS = [
  "toeic",
  "toefl",
  "ielts",
  "oet",
  "conversation",
  "business",
  "travel",
  "movies-tv",
  "academic",
] as const;

export type GoalSlug = (typeof GOAL_OPTIONS)[number];

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
