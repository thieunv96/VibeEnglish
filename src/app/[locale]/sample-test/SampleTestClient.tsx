"use client";

import { useState } from "react";
import { SampleTestRunner } from "./SampleTestRunner";
import { SkillBreakdown } from "@/components/SkillBreakdown";
import { QuestionReview } from "@/components/QuestionReview";
import { Link } from "@/i18n/navigation";
import type { SanitisedQuestion } from "@/lib/exercise-scoring";
import { buildSkillBreakdown } from "@/lib/recommendation";

type TestState = "idle" | "loading" | "running" | "submitting" | "results";

interface ExerciseScore {
  slug: string;
  skill: string;
  title: string;
  correct: number;
  total: number;
}

interface ReviewQuestion {
  id: string;
  prompt: string;
  userAnswer: string | Record<string, string>;
  correctAnswer: string | Record<string, string>;
  isCorrect: boolean;
}

interface Recommendation {
  slug: string;
  skill: string;
  title: string;
  level: string;
}

interface Results {
  correct: number;
  total: number;
  exerciseScores: ExerciseScore[];
  reviewQuestions: ReviewQuestion[];
  weakestSkill: string | null;
  recommendations: Recommendation[];
}

interface Labels {
  startBtn: string;
  questionCount: string;
  submitBtn: string;
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
  errorStart: string;
  errorSubmit: string;
  errorNetwork: string;
  exercise: {
    check: string;
    showAll: string;
    submit: string;
    next: string;
    yourScore: string;
    correct: string;
    incorrect: string;
  };
}

export function SampleTestClient({ labels }: { labels: Labels }) {
  const [state, setState] = useState<TestState>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SanitisedQuestion[]>([]);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/sample-test/start", { method: "POST" });
      if (!res.ok) {
        setError(labels.errorStart);
        setState("idle");
        return;
      }
      const data = (await res.json()) as { sessionId: string; questions: SanitisedQuestion[] };
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setState("running");
    } catch {
      setError(labels.errorNetwork);
      setState("idle");
    }
  }

  async function handleSubmit(answers: Record<string, string | Record<string, string>>) {
    if (!sessionId) return;
    setState("submitting");
    try {
      const res = await fetch("/api/sample-test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers }),
      });
      if (!res.ok) {
        setError(labels.errorSubmit);
        setState("running");
        return;
      }
      setResults((await res.json()) as Results);
      setState("results");
    } catch {
      setError(labels.errorNetwork);
      setState("running");
    }
  }

  function handleRetake() {
    setSessionId(null);
    setQuestions([]);
    setResults(null);
    setError(null);
    setState("idle");
  }

  function interp(t: string, vars: Record<string, string | number>): string {
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), t);
  }

  if (state === "idle" || state === "loading") {
    return (
      <div className="text-center space-y-6">
        <p className="text-sm text-muted">{labels.questionCount}</p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="button"
          onClick={handleStart}
          disabled={state === "loading"}
          data-testid="start-test-btn"
          className="inline-flex items-center gap-2 rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-8 py-3 text-lg disabled:opacity-50"
        >
          {state === "loading" ? "…" : labels.startBtn}
        </button>
      </div>
    );
  }

  if (state === "running" || state === "submitting") {
    return (
      <div className="space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <SampleTestRunner
          questions={questions}
          labels={labels.exercise}
          onSubmit={handleSubmit}
          disabled={state === "submitting"}
        />
      </div>
    );
  }

  if (state === "results" && results) {
    return (
      <div className="space-y-8" data-testid="sample-results">
        <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <h2 className="text-4xl font-extrabold text-brand-strong" data-testid="results-score">
            {interp(labels.scoreLabel, { correct: results.correct, total: results.total })}
          </h2>
          <h3 className="mt-2 text-lg font-semibold text-muted">{labels.fullResultsHeading}</h3>
        </div>

        <SkillBreakdown
          breakdown={buildSkillBreakdown(results.exerciseScores)}
          headingLabel={labels.skillBreakdownHeading}
          itemLabel={labels.skillBreakdownItem}
        />

        <section data-testid="recommendations">
          <h3 className="text-lg font-bold mb-3">{labels.recommendationsHeading}</h3>
          {results.recommendations.length === 0 ? (
            <p className="text-sm text-muted">{labels.recommendationsEmpty}</p>
          ) : (
            <ul className="space-y-2">
              {results.recommendations.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/practice/${r.skill}/${r.slug}`}
                    className="block rounded-md border border-border bg-white p-3 hover:border-brand"
                  >
                    <span className="font-semibold">{r.title}</span>
                    <span className="ml-2 text-xs text-muted">{r.level}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <QuestionReview
          questions={results.reviewQuestions}
          headingLabel={labels.reviewHeading}
          correctLabel={labels.reviewCorrect}
          incorrectLabel={labels.reviewIncorrect}
          correctAnswerLabel={labels.reviewCorrectAnswer}
        />

        <div className="text-center">
          <button
            type="button"
            onClick={handleRetake}
            data-testid="retake-btn"
            className="rounded-md border border-border px-6 py-2 font-semibold hover:bg-surface"
          >
            {labels.retakeBtn}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
