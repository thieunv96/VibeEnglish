"use client";

/**
 * QuestionReview — per-question right/wrong + correct answer display.
 *
 * Owned by Phase 2. Importable by Phase 3 (CEFR test results).
 * Pure display component: no fetch, no session calls.
 */

import { cn } from "@/lib/cn";

export interface ReviewQuestion {
  id: string;
  prompt: string;
  userAnswer: string | Record<string, string>;
  correctAnswer: string | string[] | Record<string, string>;
  isCorrect: boolean;
}

interface Props {
  questions: ReviewQuestion[];
  headingLabel: string;
  correctLabel: string;
  incorrectLabel: string;
  /** Template with {answer} placeholder — e.g. "Correct answer: {answer}" */
  correctAnswerLabel: string;
}

function formatAnswer(answer: string | string[] | Record<string, string>): string {
  if (Array.isArray(answer)) return answer.join(", ");
  if (typeof answer === "object") {
    return Object.entries(answer)
      .map(([k, v]) => `${k} → ${v}`)
      .join("; ");
  }
  return String(answer);
}

export function QuestionReview({
  questions,
  headingLabel,
  correctLabel,
  incorrectLabel,
  correctAnswerLabel,
}: Props) {
  if (questions.length === 0) return null;

  return (
    <section data-testid="question-review">
      <h3 className="text-lg font-semibold mb-3">{headingLabel}</h3>
      <ol className="space-y-3">
        {questions.map((q, idx) => (
          <li
            key={q.id}
            className={cn(
              "rounded-xl border p-4",
              q.isCorrect
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50",
            )}
            data-testid={`review-q-${idx}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-sm">
                <span className="text-muted mr-2">{idx + 1}.</span>
                {q.prompt}
              </p>
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded shrink-0",
                  q.isCorrect
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800",
                )}
              >
                {q.isCorrect ? correctLabel : incorrectLabel}
              </span>
            </div>
            {!q.isCorrect && (
              <p className="mt-2 text-sm text-red-700">
                {correctAnswerLabel.replace(
                  "{answer}",
                  formatAnswer(q.correctAnswer),
                )}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
