"use client";

// CefrTestClient — state machine for the 25-Q CEFR placement test.
// State flow: idle → loading → started → submitting → teaser | claimed.

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { CefrTestRunner } from "./CefrTestRunner";
import type { SanitisedQuestion } from "@/lib/exercise-scoring";

type TestState = "idle" | "loading" | "started" | "submitting" | "teaser" | "claimed";

interface Labels {
  startBtn: string;
  /** Template with {correct}/{total} placeholders — interpolated client-side */
  teaserHeading: string;
  teaserSub: string;
  teaserSignUpBtn: string;
  teaserLoginPrompt: string;
  teaserLoginLink: string;
  retakeBtn: string;
  errorStart: string;
  errorSubmit: string;
  errorNetwork: string;
  redirecting: string;
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
  labels: Labels;
}

function interpolateScore(t: string, c: number, n: number) {
  return t.replace("{correct}", String(c)).replace("{total}", String(n));
}

export function CefrTestClient({ labels }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [state, setState] = useState<TestState>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SanitisedQuestion[]>([]);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derive mode once from session — never passed to runner as mutable state.
  const mode: "guest" | "loggedin" =
    status === "authenticated" && session?.user ? "loggedin" : "guest";

  async function handleStart() {
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/sample-test/cefr/start", { method: "POST" });
      if (!res.ok) {
        setError(labels.errorStart);
        setState("idle");
        return;
      }
      const data = (await res.json()) as {
        sessionId: string;
        questions: SanitisedQuestion[];
      };
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setState("started");
    } catch {
      setError(labels.errorNetwork);
      setState("idle");
    }
  }

  async function handleSubmit(answers: Record<string, string | Record<string, string>>) {
    if (!sessionId) return;
    setState("submitting");
    try {
      const res = await fetch("/api/sample-test/cefr/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers }),
      });
      if (!res.ok) {
        setError(labels.errorSubmit);
        setState("started");
        return;
      }
      const data = (await res.json()) as {
        correct: number;
        total: number;
        claimed?: boolean;
      };
      setScore({ correct: data.correct, total: data.total });

      if (data.claimed) {
        // Authenticated path: attempt already written; go straight to results.
        setState("claimed");
        router.push("/sample-test/cefr/results");
      } else {
        setState("teaser");
      }
    } catch {
      setError(labels.errorNetwork);
      setState("started");
    }
  }

  // ---- idle / loading ----
  if (state === "idle" || state === "loading") {
    return (
      <div className="text-center">
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <button
          type="button"
          onClick={handleStart}
          disabled={state === "loading"}
          data-testid="cefr-start-btn"
          className="inline-flex items-center gap-2 rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-8 py-3 text-lg disabled:opacity-50"
        >
          {state === "loading" ? "…" : labels.startBtn}
        </button>
      </div>
    );
  }

  // ---- questions ----
  if (state === "started" || state === "submitting") {
    return (
      <div className="space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <CefrTestRunner
          questions={questions}
          mode={mode}
          labels={labels.exercise}
          onSubmit={handleSubmit}
          disabled={state === "submitting"}
        />
      </div>
    );
  }

  // ---- teaser (guest submitted) ----
  if (state === "teaser" && score) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center space-y-6 shadow-sm">
        <h2
          className="text-4xl font-extrabold text-brand-strong"
          data-testid="cefr-teaser-score"
        >
          {interpolateScore(labels.teaserHeading, score.correct, score.total)}
        </h2>
        <p className="text-muted max-w-md mx-auto">{labels.teaserSub}</p>
        <div className="space-y-3">
          {/* AC-8 / Security Note 8: NO returnTo query param */}
          <Link
            href="/auth/register"
            className="block w-full rounded-md bg-brand hover:bg-brand-strong text-white font-semibold py-3 text-center"
            data-testid="cefr-teaser-signup-btn"
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
        <button
          type="button"
          onClick={() => {
            setScore(null);
            setSessionId(null);
            setQuestions([]);
            setState("idle");
          }}
          className="text-sm text-muted hover:text-brand underline"
        >
          {labels.retakeBtn}
        </button>
      </div>
    );
  }

  // ---- claimed / redirecting ----
  return <div className="text-center py-10 text-muted">{labels.redirecting}</div>;
}
