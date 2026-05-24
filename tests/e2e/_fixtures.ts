// Stable seed-data fixtures used across specs. These slugs exist in the DB
// because they were imported from src/content/lessons/... before that folder
// was deleted (see scripts/import-content.mjs + scripts/seed-content.mjs).

export const SHORT_STORY = {
  category: "short-stories" as const,
  slug: "the-fox-and-the-grapes",
  firstSegmentText: "A hungry fox sees some grapes hanging from a high vine.",
};

export const GRAMMAR_MCQ = {
  skill: "grammar" as const,
  slug: "articles-a-an-the",
  // First MCQ question's correct answer (verified from seed-content.mjs).
  // Matches data-testid="q0-opt-an".
  firstAnswer: "an",
  // 5 questions total in this exercise.
  questionsAnswers: ["an", "the", "an", "the", "a"],
};
