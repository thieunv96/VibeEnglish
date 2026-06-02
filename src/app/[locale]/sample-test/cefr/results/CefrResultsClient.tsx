"use client";

// Three branches: no-results (AC-E8) | teaser (guest) | full results (authed).

import { Link } from "@/i18n/navigation";
import { CefrEstimate } from "./CefrEstimate";
import { LevelBreakdown } from "@/components/LevelBreakdown";
import { SkillBreakdown } from "@/components/SkillBreakdown";
import { QuestionReview } from "@/components/QuestionReview";
import { buildSkillBreakdown } from "@/lib/recommendation";
import type { CefrLevel } from "@/lib/content";
import type { CefrEstimate as CefrEstimateType } from "@/lib/cefr-estimation";
import type { ExerciseScore } from "@/lib/recommendation";
import type { ReviewQuestion } from "@/components/QuestionReview";

interface LevelScore {
  correct: number;
  total: number;
}

/** Shape of the decoded result cookie payload for testType "cefr". */
export interface CefrCookiePayload {
  testType: "cefr";
  sessionId?: string;
  /** Parallel array of "${slug}:${questionId}" — composite-key fix. */
  questionCompositeIds?: string[];
  /** Parallel-ordered guest answers by index — kept compact so the cookie stays under 4 KB. */
  answersByIndex?: (string | Record<string, string>)[];
  exerciseScores?: ExerciseScore[];
  levelScores?: Record<CefrLevel, LevelScore>;
  cefrEstimate?: CefrEstimateType;
  submittedAt?: number;
}

interface Labels {
  fullResultsHeading: string;
  scoreLabel: string;
  estimatedLevelLabel: string;
  c1PlusExplanation: string;
  levelBreakdownHeading: string;
  levelBreakdownItem: string;
  skillBreakdownHeading: string;
  skillBreakdownItem: string;
  reviewHeading: string;
  reviewCorrect: string;
  reviewIncorrect: string;
  reviewCorrectAnswer: string;
  retakeBtn: string;
  teaserSub: string;
  teaserSignUpBtn: string;
  teaserLoginPrompt: string;
  teaserLoginLink: string;
  noResultsHeading: string;
  noResultsBody: string;
  noResultsLink: string;
  expiredBody: string;
}

interface Props {
  payload: CefrCookiePayload | null;
  isAuthed: boolean;
  isExpired?: boolean;
  /** Per-question review rows built server-side from DB (BLOCKER-3 fix). */
  reviewQuestions: ReviewQuestion[];
  labels: Labels;
}

export function CefrResultsClient({ payload, isAuthed, isExpired, reviewQuestions, labels }: Props) {
  // ---- No results state (AC-E8) ----
  if (!payload && !isAuthed) {
    return (
      <div className="text-center space-y-4 py-8" data-testid="cefr-no-results">
        {isExpired ? (
          <p className="text-muted">{labels.expiredBody}</p>
        ) : (
          <>
            <h2 className="text-2xl font-bold">{labels.noResultsHeading}</h2>
            <p className="text-muted">{labels.noResultsBody}</p>
          </>
        )}
        <Link
          href="/sample-test/cefr"
          className="inline-block rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-6 py-2"
        >
          {labels.noResultsLink}
        </Link>
      </div>
    );
  }

  // ---- Teaser (guest with valid cookie) ----
  if (!isAuthed && payload) {
    const exerciseScores = payload.exerciseScores ?? [];
    const totalCorrect = exerciseScores.reduce((s, e) => s + e.correct, 0);
    const totalQuestions = exerciseScores.reduce((s, e) => s + e.total, 0);

    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center space-y-6 shadow-sm" data-testid="cefr-teaser">
        <h2 className="text-4xl font-extrabold text-brand-strong" data-testid="cefr-teaser-score">
          {totalCorrect} / {totalQuestions} correct
        </h2>
        <p className="text-muted max-w-md mx-auto">{labels.teaserSub}</p>
        <div className="space-y-3">
          {/* AC-8: NO returnTo query param */}
          <Link
            href="/auth/register"
            className="block w-full rounded-md bg-brand hover:bg-brand-strong text-white font-semibold py-3 text-center"
            data-testid="cefr-signup-btn"
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
        <Link href="/sample-test/cefr" className="text-sm text-muted hover:text-brand underline block">
          {labels.retakeBtn}
        </Link>
      </div>
    );
  }

  // ---- Full results (authenticated) ----
  const exerciseScores: ExerciseScore[] = payload?.exerciseScores ?? [];
  const levelScores = payload?.levelScores ?? {
    A1: { correct: 0, total: 0 }, A2: { correct: 0, total: 0 },
    B1: { correct: 0, total: 0 }, B2: { correct: 0, total: 0 },
    C1: { correct: 0, total: 0 }, C2: { correct: 0, total: 0 },
  };
  const cefrEstimate = payload?.cefrEstimate ?? "A1";
  const totalCorrect = exerciseScores.reduce((s, e) => s + e.correct, 0);
  const totalQuestions = exerciseScores.reduce((s, e) => s + e.total, 0);
  const skillBreakdown = buildSkillBreakdown(exerciseScores);

  // Per-question review data is built server-side (cefr/results/page.tsx) from the
  // DB using questionIds + guestAnswers from the result cookie (BLOCKER-3 fix).
  // One row per question with actual prompt, user answer, and correct answer.

  return (
    <div className="space-y-8" data-testid="cefr-full-results">
      <h1 className="text-3xl font-extrabold">{labels.fullResultsHeading}</h1>

      {/* Score */}
      <div className="rounded-xl border-2 border-brand bg-brand-soft/30 p-6 text-center">
        <p className="text-sm text-muted">{labels.scoreLabel}</p>
        <p className="mt-1 text-4xl font-extrabold text-brand-strong" data-testid="cefr-full-score">
          {totalCorrect} / {totalQuestions}
          {totalQuestions > 0 && (
            <span className="ml-2 text-lg font-semibold text-brand">
              ({Math.round((totalCorrect / totalQuestions) * 100)}%)
            </span>
          )}
        </p>
      </div>

      {/* CEFR Estimate headline */}
      <CefrEstimate
        estimate={cefrEstimate}
        estimatedLevelLabel={labels.estimatedLevelLabel}
        c1PlusExplanation={labels.c1PlusExplanation}
      />

      {/* Level breakdown */}
      <LevelBreakdown
        levelScores={levelScores}
        heading={labels.levelBreakdownHeading}
        itemTemplate={labels.levelBreakdownItem}
      />

      {/* Skill breakdown (reused from Phase 2) */}
      <SkillBreakdown
        breakdown={skillBreakdown}
        headingLabel={labels.skillBreakdownHeading}
        itemLabel={labels.skillBreakdownItem}
      />

      {/* Question review — one row per question (AC-15 #5) */}
      <QuestionReview
        questions={reviewQuestions}
        headingLabel={labels.reviewHeading}
        correctLabel={labels.reviewCorrect}
        incorrectLabel={labels.reviewIncorrect}
        correctAnswerLabel={labels.reviewCorrectAnswer}
      />

      <Link
        href="/sample-test/cefr"
        className="inline-block text-sm text-muted hover:text-brand underline"
      >
        {labels.retakeBtn}
      </Link>
    </div>
  );
}
