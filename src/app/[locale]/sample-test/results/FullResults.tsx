"use client";

/**
 * FullResults — authenticated full results display.
 * Extracted from ResultsClient.tsx to keep both files under 200 lines.
 *
 * Fetches recommended exercises on mount (client-side, after auth confirmed).
 */

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { SkillBreakdown } from "@/components/SkillBreakdown";
import { QuestionReview } from "@/components/QuestionReview";
import type { SkillScore, ExerciseScore, RecommendedExercise } from "@/lib/recommendation";
import { buildSkillBreakdown, pickWeakestSkill } from "@/lib/recommendation";
import type { ReviewQuestion } from "@/components/QuestionReview";

interface CookiePayload {
  testType?: string;
  sessionId?: string;
  questionIds?: string[];
  guestAnswers?: Record<string, string | Record<string, string>>;
  exerciseScores?: ExerciseScore[];
  submittedAt?: number;
}

interface Labels {
  fullResultsHeading: string;
  scoreLabel: string;
  skillBreakdownHeading: string;
  skillBreakdownItem: string;
  recommendationsHeading: string;
  recommendationsEmpty: string;
  reviewHeading: string;
  reviewCorrect: string;
  reviewIncorrect: string;
  reviewCorrectAnswer: string;
  retakeBtn: string;
}

interface Props {
  payload: CookiePayload;
  /** Per-question review rows built server-side from DB (BLOCKER-3 fix). */
  reviewQuestions: ReviewQuestion[];
  labels: Labels;
}

export function FullResults({ payload, reviewQuestions, labels }: Props) {
  const exerciseScores: ExerciseScore[] = payload.exerciseScores ?? [];
  const totalCorrect = exerciseScores.reduce((sum, es) => sum + es.correct, 0);
  const totalQuestions = exerciseScores.reduce((sum, es) => sum + es.total, 0);
  const skillBreakdown: SkillScore[] = buildSkillBreakdown(exerciseScores);

  // Client-side recommendation fetch
  const [recs, setRecs] = useState<RecommendedExercise[] | null>(null);
  const [recsLoaded, setRecsLoaded] = useState(false);

  useEffect(() => {
    const skillCandidates = pickWeakestSkill(exerciseScores);
    if (skillCandidates.length === 0) {
      setRecsLoaded(true);
      return;
    }
    fetch("/api/sample-test/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillCandidates }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { exercises: RecommendedExercise[] } | null) => {
        setRecs(data?.exercises ?? null);
      })
      .catch(() => setRecs(null))
      .finally(() => setRecsLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-question review data is built server-side (results/page.tsx) from the DB
  // using questionIds + guestAnswers from the result cookie (BLOCKER-3 fix).
  // One row per question with actual prompt, user answer, and correct answer.

  return (
    <div className="space-y-8" data-testid="full-results">
      <h1 className="text-3xl font-extrabold">{labels.fullResultsHeading}</h1>

      {/* Score */}
      <div className="rounded-xl border-2 border-brand bg-brand-soft/30 p-6 text-center">
        <p className="text-sm text-muted">{labels.scoreLabel}</p>
        <p className="mt-1 text-4xl font-extrabold text-brand-strong" data-testid="full-score">
          {totalCorrect} / {totalQuestions}
          <span className="ml-2 text-lg font-semibold text-brand">
            ({totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0}%)
          </span>
        </p>
      </div>

      {/* Skill breakdown */}
      <SkillBreakdown
        breakdown={skillBreakdown}
        headingLabel={labels.skillBreakdownHeading}
        itemLabel={labels.skillBreakdownItem}
      />

      {/* Question review — one row per question (AC-14 #3) */}
      <QuestionReview
        questions={reviewQuestions}
        headingLabel={labels.reviewHeading}
        correctLabel={labels.reviewCorrect}
        incorrectLabel={labels.reviewIncorrect}
        correctAnswerLabel={labels.reviewCorrectAnswer}
      />

      {/* Recommendations */}
      <section data-testid="recommendations">
        <h3 className="text-lg font-semibold mb-3">{labels.recommendationsHeading}</h3>
        {!recsLoaded && (
          <p className="text-muted text-sm">Loading recommendations…</p>
        )}
        {recsLoaded && (!recs || recs.length === 0) && (
          <p className="text-muted text-sm">{labels.recommendationsEmpty}</p>
        )}
        {recsLoaded && recs && recs.length > 0 && (
          <ul className="space-y-3">
            {recs.map((ex) => (
              <li key={ex.id} className="rounded-xl border border-border bg-white p-4">
                <Link
                  href={`/practice/${ex.skill}/${ex.slug}`}
                  className="font-semibold text-brand hover:underline"
                >
                  {ex.title}
                </Link>
                <p className="text-xs text-muted mt-0.5 uppercase">{ex.skill} · {ex.level}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/sample-test"
        className="inline-block text-sm text-muted hover:text-brand underline"
      >
        {labels.retakeBtn}
      </Link>
    </div>
  );
}
