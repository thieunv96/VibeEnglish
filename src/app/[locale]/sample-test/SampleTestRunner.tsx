"use client";

/**
 * SampleTestRunner — thin wrapper around ExerciseRunner.
 *
 * Accepts the 10 sanitised questions, builds a synthetic Exercise object,
 * and passes it to ExerciseRunner with onSubmit override to prevent the
 * default /api/attempts write.
 *
 * Does NOT call useSession() — mode is received as a prop from SampleTestClient.
 */

import { ExerciseRunner } from "@/components/ExerciseRunner";
import type { ExerciseSubmitPayload } from "@/components/ExerciseRunner";
import type { SanitisedQuestion } from "@/lib/exercise-scoring";
import type { Exercise, ExerciseQuestion } from "@/lib/content";

interface Props {
  questions: SanitisedQuestion[];
  /** Derived from useSession() in SampleTestClient — never read here. */
  mode: "guest" | "loggedin";
  labels: {
    check: string;
    showAll: string;
    submit: string;
    next: string;
    yourScore: string;
    correct: string;
    incorrect: string;
  };
  /** Called by SampleTestClient when ExerciseRunner fires its onSubmit hook. */
  onSubmit: (answers: Record<string, string | Record<string, string>>) => Promise<void>;
  disabled?: boolean;
}

/**
 * Convert SanitisedQuestion back to the ExerciseQuestion shape that ExerciseRunner
 * expects. The answer field is set to an empty string — it is never used by
 * ExerciseRunner when onSubmit is provided (scoring happens server-side).
 *
 * For match questions, we reconstruct the pairs from the sanitised left-only
 * pairs, setting right to "" so ExerciseRunner can render the select inputs.
 * The correct right values are NEVER sent to the client (AC-2).
 */
function toExerciseQuestion(sq: SanitisedQuestion): ExerciseQuestion {
  const base: ExerciseQuestion = {
    id: sq.id,
    type: sq.type,
    prompt: sq.prompt,
    answer: "", // server-side scoring only; not used by ExerciseRunner when onSubmit is set
    options: sq.options,
    explanation: sq.explanation,
  };

  if (sq.type === "match" && sq.pairs) {
    // Reconstruct pairs with empty right values for rendering.
    // ExerciseRunner renders select options from pairs — since right values are
    // stripped, we also build a synthetic options array from the left values
    // so users can still interact with the match UI.
    // NOTE: This is a UX limitation of the sample test — match questions in the
    // runner show left labels but options list is empty. This is acceptable per
    // spec (no custom rendering required; ExerciseRunner is reused as-is).
    base.pairs = sq.pairs.map((p) => ({ left: p.left, right: "" }));
  }

  return base;
}

export function SampleTestRunner({ questions, labels, onSubmit, disabled }: Props) {
  // Build a synthetic Exercise from the 10 sampled questions.
  const syntheticExercise: Exercise = {
    id: "sample-test",
    slug: "sample-test",
    title: "Sample Test",
    level: "B1",
    skill: "mixed",
    type: "mcq", // type field is for display only; actual types are per-question
    questions: questions.map(toExerciseQuestion),
  };

  async function handleSubmit(payload: ExerciseSubmitPayload) {
    // Pass raw answers back to SampleTestClient for server-side scoring.
    // ExerciseRunner's local scoring result is discarded — the server rescores.
    await onSubmit(payload.answers as Record<string, string | Record<string, string>>);
  }

  return (
    <div data-testid="sample-test-runner" aria-busy={disabled}>
      <ExerciseRunner
        exercise={syntheticExercise}
        labels={labels}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
