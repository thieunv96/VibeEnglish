/**
 * Content loader for exam-prep mock tests.
 *
 * Server-only — imports Prisma. Do NOT import from client components.
 * No imports from `next/headers`, `auth`, or any client code.
 */

import { prisma } from "@/lib/db";
import { shuffle } from "@/lib/shuffle";
import { MOCK_TEST_QUESTION_COUNT } from "@/lib/test-prep-constants";
import type { ExamSlug } from "@/lib/test-prep-constants";
import type { ExerciseQuestion } from "@/lib/content";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Flat tuple pairing a question with its source exercise metadata.
 * Mirrors the `QuestionTuple` shape used by `sample-test/start/route.ts`.
 */
export interface QuestionTuple {
  exerciseSlug: string;
  exerciseSkill: string;
  exerciseTitle: string;
  exerciseLevel: string;
  question: ExerciseQuestion;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sample `count` listening questions for the given exam from the database.
 *
 * Filters on `{ exam, skill: "listening" }`, flattens all matching questions,
 * shuffles via Fisher-Yates, then returns the first `count` entries.
 *
 * Returns an **empty array** (not a thrown error) when the pool has fewer
 * questions than `count`. The caller MUST handle this as a 503 `no_content`.
 *
 * @param exam   Exam slug — one of "toeic" | "toefl" | "ielts" | "oet".
 * @param count  Number of questions to sample (default: MOCK_TEST_QUESTION_COUNT = 25).
 */
export async function sampleListeningQuestions(
  exam: ExamSlug,
  count: number = MOCK_TEST_QUESTION_COUNT,
): Promise<QuestionTuple[]> {
  const exercises = await prisma.exercise.findMany({
    where: { exam, skill: "listening" },
    select: { slug: true, skill: true, title: true, level: true, questions: true },
  });

  const flat: QuestionTuple[] = [];
  for (const ex of exercises) {
    const questions = ex.questions as unknown as ExerciseQuestion[];
    for (const q of questions) {
      flat.push({
        exerciseSlug: ex.slug,
        exerciseSkill: ex.skill,
        exerciseTitle: ex.title,
        exerciseLevel: ex.level,
        question: q,
      });
    }
  }

  if (flat.length < count) {
    // Pool is too small — caller returns 503 no_content.
    return [];
  }

  return shuffle(flat).slice(0, count);
}
