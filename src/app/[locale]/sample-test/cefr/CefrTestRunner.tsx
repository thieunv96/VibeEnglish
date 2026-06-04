"use client";

/**
 * CefrTestRunner — thin wrapper around ExerciseRunner for the 25-Q CEFR test.
 *
 * Accepts the 25 sanitised questions and builds a synthetic Exercise for
 * ExerciseRunner. Does NOT duplicate MCQ/fill/match rendering logic.
 */

import { ExerciseRunner } from "@/components/ExerciseRunner";
import type { ExerciseSubmitPayload } from "@/components/ExerciseRunner";
import type { SanitisedQuestion } from "@/lib/exercise-scoring";
import type { Exercise, ExerciseQuestion } from "@/lib/content";

interface Props {
  questions: SanitisedQuestion[];
  /** i18n labels sourced from CefrTestClient (which gets them from cefr/page.tsx). */
  labels: {
    check: string;
    showAll: string;
    submit: string;
    next: string;
    yourScore: string;
    correct: string;
    incorrect: string;
  };
  /** Called by CefrTestClient when ExerciseRunner fires its onSubmit hook. */
  onSubmit: (answers: Record<string, string | Record<string, string>>) => Promise<void>;
  disabled?: boolean;
}

/**
 * Convert SanitisedQuestion back to ExerciseQuestion for ExerciseRunner.
 * answer is set to "" — server-side scoring only (AC-2).
 * For match questions, pairs[].right is "" (stripped by start endpoint).
 * The shuffled right values are preserved in options for dropdown rendering.
 */
function toExerciseQuestion(sq: SanitisedQuestion): ExerciseQuestion {
  // Use composite "${slug}:${id}" as the synthetic question id so the
  // ExerciseRunner answers map remains unique even when two source exercises
  // both have a "q1".
  const base: ExerciseQuestion = {
    id: `${sq.sourceExerciseSlug}:${sq.id}`,
    type: sq.type,
    prompt: sq.prompt,
    answer: "",
    options: sq.options,
    explanation: sq.explanation,
  };

  if (sq.type === "match" && sq.pairs) {
    base.pairs = sq.pairs.map((p) => ({ left: p.left, right: "" }));
  }

  return base;
}

export function CefrTestRunner({ questions, labels, onSubmit, disabled }: Props) {
  const syntheticExercise: Exercise = {
    id: "cefr-test",
    slug: "cefr-test",
    title: "CEFR Placement Test",
    level: "B1",
    skill: "mixed",
    type: "mcq",
    questions: questions.map(toExerciseQuestion),
  };

  async function handleSubmit(payload: ExerciseSubmitPayload) {
    await onSubmit(payload.answers as Record<string, string | Record<string, string>>);
  }

  return (
    <div data-testid="cefr-test-runner" aria-busy={disabled}>
      <ExerciseRunner
        exercise={syntheticExercise}
        labels={labels}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
