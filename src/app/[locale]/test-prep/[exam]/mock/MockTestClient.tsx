"use client";

import { useState } from "react";
import { SampleTestRunner } from "@/app/[locale]/sample-test/SampleTestRunner";
import { MockTestResults } from "./MockTestResults";
import type { SanitisedQuestion } from "@/lib/exercise-scoring";
import type { ExamSlug } from "@/lib/test-prep-constants";

type TestState = "idle" | "loading" | "running" | "submitting" | "results";

export interface MockSubmitResponse {
  correct: number;
  total: number;
  exam: ExamSlug;
  bandResult: { band: string; rangeLow: number; rangeHigh: number };
  exerciseScores: { slug: string; skill: string; title: string; correct: number; total: number }[];
  skillBreakdown: { skill: string; correct: number; total: number; ratio: number }[];
  reviewQuestions: {
    id: string;
    prompt: string;
    userAnswer: string | Record<string, string>;
    correctAnswer: string | Record<string, string>;
    isCorrect: boolean;
  }[];
}

export interface MockTestLabels {
  startBtn: string;
  listeningOnlyNote: string;
  submitBtn: string;
  retakeBtn: string;
  resultsHeading: string;
  scoreLabel: string;
  bandEstimateLabel: string;
  bandDisclaimerLabel: string;
  skillBreakdownHeading: string;
  skillBreakdownItem: string;
  reviewHeading: string;
  reviewCorrect: string;
  reviewIncorrect: string;
  reviewCorrectAnswer: string;
  sessionExpiredError: string;
  noContentError: string;
  rateLimitError: string;
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

interface Props {
  exam: ExamSlug;
  examDisplayLabel: string;
  labels: MockTestLabels;
}

export function MockTestClient({ exam, examDisplayLabel, labels }: Props) {
  const [state, setState] = useState<TestState>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SanitisedQuestion[]>([]);
  const [results, setResults] = useState<MockSubmitResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setState("loading");
    setError(null);
    try {
      const res = await fetch(`/api/test-prep/${exam}/mock/start`, { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/auth/login";
        return;
      }
      if (res.status === 503) {
        setError(labels.noContentError);
        setState("idle");
        return;
      }
      if (res.status === 429) {
        setError(labels.rateLimitError);
        setState("idle");
        return;
      }
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
      const res = await fetch(`/api/test-prep/${exam}/mock/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (body.error === "invalid_session") {
          setError(labels.sessionExpiredError);
          setState("idle");
          return;
        }
        setError(labels.errorSubmit);
        setState("running");
        return;
      }
      setResults((await res.json()) as MockSubmitResponse);
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

  if (state === "idle" || state === "loading") {
    return (
      <div className="text-center space-y-6">
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
      <MockTestResults
        results={results}
        examDisplayLabel={examDisplayLabel}
        labels={labels}
        onRetake={handleRetake}
      />
    );
  }

  return null;
}
