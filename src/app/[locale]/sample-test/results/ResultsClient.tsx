"use client";

/**
 * ResultsClient — dispatches between three result states:
 *   (a) no cookie + not authed  → "no results" message
 *   (b) cookie + not authed     → teaser (raw score + signup CTA)
 *   (c) authed                  → full results (score + skills + review + recs)
 */

import { Link } from "@/i18n/navigation";
import type { ExerciseScore } from "@/lib/recommendation";
import { FullResults } from "./FullResults";
import type { ReviewQuestion } from "@/components/QuestionReview";

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
  noResultsHeading: string;
  noResultsBody: string;
  noResultsLink: string;
  expiredBody: string;
  teaserHeading: string;
  teaserSub: string;
  teaserSignUpBtn: string;
  teaserLoginPrompt: string;
  teaserLoginLink: string;
}

interface CookiePayload {
  testType?: string;
  sessionId?: string;
  questionIds?: string[];
  guestAnswers?: Record<string, string | Record<string, string>>;
  exerciseScores?: ExerciseScore[];
  submittedAt?: number;
}

interface Props {
  isAuthenticated: boolean;
  cookiePayload: Record<string, unknown> | null;
  userId: string | null;
  /** Per-question review data built server-side (BLOCKER-3). */
  reviewQuestions: ReviewQuestion[];
  labels: Labels;
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    template,
  );
}

export function ResultsClient({ isAuthenticated, cookiePayload, reviewQuestions, labels }: Props) {
  const payload = cookiePayload as CookiePayload | null;

  // ---- (a) No results ----
  if (!isAuthenticated && !payload) {
    return (
      <div className="text-center py-16 space-y-4" data-testid="no-results">
        <h1 className="text-2xl font-bold">{labels.noResultsHeading}</h1>
        <p className="text-muted">{labels.noResultsBody}</p>
        <Link
          href="/sample-test"
          className="inline-block rounded-md bg-brand text-white font-semibold px-6 py-2.5 hover:bg-brand-strong"
        >
          {labels.noResultsLink}
        </Link>
      </div>
    );
  }

  // ---- (b) Guest teaser (cookie present but not authed) ----
  if (!isAuthenticated && payload) {
    const exerciseScores = payload.exerciseScores ?? [];
    const totalCorrect = exerciseScores.reduce((sum, es) => sum + es.correct, 0);
    const totalQuestions = exerciseScores.reduce((sum, es) => sum + es.total, 0);

    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center space-y-6 shadow-sm" data-testid="teaser-results">
        <h2 className="text-4xl font-extrabold text-brand-strong" data-testid="teaser-score">
          {interpolate(labels.teaserHeading, { correct: totalCorrect, total: totalQuestions })}
        </h2>
        <p className="text-muted max-w-md mx-auto">{labels.teaserSub}</p>
        <div className="space-y-3">
          <Link
            href="/auth/register?returnTo=/sample-test/results"
            className="block w-full rounded-md bg-brand hover:bg-brand-strong text-white font-semibold py-3 text-center"
          >
            {labels.teaserSignUpBtn}
          </Link>
          <p className="text-sm text-muted">
            {labels.teaserLoginPrompt}{" "}
            <Link href="/auth/login" className="font-semibold text-brand hover:underline">
              {labels.teaserLoginLink}
            </Link>
          </p>
        </div>
        <Link href="/sample-test" className="text-sm text-muted hover:text-brand underline">
          {labels.retakeBtn}
        </Link>
      </div>
    );
  }

  // ---- (c) Authenticated full results ----
  // If authed but no cookie, show expired message with retake link.
  if (!payload) {
    return (
      <div className="text-center py-16 space-y-4" data-testid="expired-results">
        <h1 className="text-2xl font-bold">{labels.noResultsHeading}</h1>
        <p className="text-muted">{labels.expiredBody}</p>
        <Link
          href="/sample-test"
          className="inline-block rounded-md bg-brand text-white font-semibold px-6 py-2.5 hover:bg-brand-strong"
        >
          {labels.retakeBtn}
        </Link>
      </div>
    );
  }

  return (
    <FullResults
      payload={payload}
      reviewQuestions={reviewQuestions}
      labels={labels}
    />
  );
}

