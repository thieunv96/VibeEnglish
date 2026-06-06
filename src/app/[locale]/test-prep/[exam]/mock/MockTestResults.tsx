"use client";

import { SkillBreakdown } from "@/components/SkillBreakdown";
import { QuestionReview } from "@/components/QuestionReview";
import type { MockSubmitResponse, MockTestLabels } from "./MockTestClient";

interface Props {
  results: MockSubmitResponse;
  examDisplayLabel: string;
  labels: MockTestLabels;
  onRetake: () => void;
}

function interp(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    template,
  );
}

export function MockTestResults({ results, examDisplayLabel, labels, onRetake }: Props) {
  return (
    <div className="space-y-8" data-testid="mock-results">
      {/* Score + band estimate */}
      <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
          {labels.resultsHeading}
        </h2>
        <p
          className="text-4xl font-extrabold text-brand-strong mt-4"
          data-testid="results-score"
        >
          {interp(labels.scoreLabel, { correct: results.correct, total: results.total })}
        </p>
        <p
          className="mt-3 text-lg font-semibold text-muted"
          data-testid="band-estimate"
        >
          {interp(labels.bandEstimateLabel, {
            exam: examDisplayLabel,
            band: results.bandResult.band,
          })}
        </p>

        {/* Band disclaimer (AC-16) */}
        <p
          className="text-xs text-muted italic mt-4 max-w-md mx-auto"
          data-testid="mock-band-disclaimer"
        >
          {labels.bandDisclaimerLabel}
        </p>
      </div>

      {/* Skill breakdown */}
      <SkillBreakdown
        breakdown={results.skillBreakdown}
        headingLabel={labels.skillBreakdownHeading}
        itemLabel={labels.skillBreakdownItem}
      />

      {/* Question review */}
      <QuestionReview
        questions={results.reviewQuestions}
        headingLabel={labels.reviewHeading}
        correctLabel={labels.reviewCorrect}
        incorrectLabel={labels.reviewIncorrect}
        correctAnswerLabel={labels.reviewCorrectAnswer}
      />

      {/* Retake */}
      <div className="text-center">
        <button
          type="button"
          onClick={onRetake}
          data-testid="retake-btn"
          className="rounded-md border border-border px-6 py-2 font-semibold hover:bg-surface"
        >
          {labels.retakeBtn}
        </button>
      </div>
    </div>
  );
}
