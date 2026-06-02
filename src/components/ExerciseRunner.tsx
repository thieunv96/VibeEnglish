"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Exercise, ExerciseQuestion } from "@/lib/content";
import { checkAnswer } from "@/lib/exercise-scoring";
import { cn } from "@/lib/cn";

type AnswerMap = Record<string, string | Record<string, string>>;
type FeedbackMap = Record<string, "correct" | "incorrect">;

/** Payload shape passed to the optional onSubmit override. */
export interface ExerciseSubmitPayload {
  answers: AnswerMap;
  feedback: FeedbackMap;
  correctCount: number;
  score: number;
}

interface Props {
  exercise: Exercise;
  labels: {
    check: string;
    showAll: string;
    submit: string;
    next: string;
    yourScore: string;
    correct: string;
    incorrect: string;
  };
  /**
   * When provided, suppresses the default `/api/attempts` write so callers can
   * route submissions elsewhere (e.g. sample-test, CEFR test).
   */
  onSubmit?: (payload: ExerciseSubmitPayload) => Promise<void> | void;
}

export function ExerciseRunner({ exercise, labels, onSubmit }: Props) {
  const { status } = useSession();
  const loading = status === "loading";
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [feedback, setFeedback] = useState<FeedbackMap>({});
  const [showAll, setShowAll] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [scoreReported, setScoreReported] = useState(false);

  function setAnswer(qId: string, value: string | Record<string, string>) {
    setAnswers((p) => ({ ...p, [qId]: value }));
  }

  function checkOne(q: ExerciseQuestion) {
    const given = answers[q.id] ?? "";
    setFeedback((f) => ({ ...f, [q.id]: checkAnswer(q, given) ? "correct" : "incorrect" }));
  }

  async function submitAll() {
    const fb: FeedbackMap = {};
    exercise.questions.forEach((q) => {
      fb[q.id] = checkAnswer(q, answers[q.id] ?? "") ? "correct" : "incorrect";
    });
    setFeedback(fb);
    setSubmitted(true);

    const correctCount = Object.values(fb).filter((v) => v === "correct").length;
    const score = correctCount / exercise.questions.length;

    if (onSubmit) {
      // onSubmit override: bypass the default /api/attempts write entirely.
      // The caller (e.g. SampleTestRunner, CefrTestRunner) handles persistence.
      await onSubmit({ answers, feedback: fb, correctCount, score });
      setScoreReported(true);
      return;
    }

    if (status === "authenticated" && !scoreReported) {
      try {
        await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseSlug: exercise.slug,
            skill: exercise.skill,
            title: exercise.title,
            score,
          }),
        });
        setScoreReported(true);
      } catch {
        /* swallow */
      }
    }
  }

  const correctCount = Object.values(feedback).filter((v) => v === "correct").length;
  const score = submitted ? correctCount / exercise.questions.length : null;

  return (
    <div className="space-y-6" data-testid="exercise-runner">
      <ol className="space-y-5">
        {exercise.questions.map((q, idx) => {
          const fb = feedback[q.id];
          const reveal = showAll || submitted;

          return (
            <li
              key={q.id}
              data-testid={`question-${idx}`}
              className={cn(
                "rounded-xl border bg-white p-5",
                fb === "correct" && "border-emerald-300 bg-emerald-50",
                fb === "incorrect" && "border-red-300 bg-red-50",
                !fb && "border-border",
              )}
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <p className="font-medium">
                  <span className="text-muted mr-2">{idx + 1}.</span>
                  {q.prompt}
                </p>
                {fb && (
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded",
                      fb === "correct" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800",
                    )}
                    data-testid={`feedback-${idx}`}
                  >
                    {fb === "correct" ? labels.correct : labels.incorrect}
                  </span>
                )}
              </div>

              {q.type === "mcq" && q.options && (
                <div className="space-y-2" role="radiogroup">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt;
                    const isAnswer = Array.isArray(q.answer)
                      ? q.answer.includes(opt)
                      : q.answer === opt;
                    return (
                      <label
                        key={opt}
                        className={cn(
                          "flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer",
                          selected ? "border-brand bg-brand-soft/40" : "border-border hover:bg-surface",
                          reveal && isAnswer && "border-emerald-400 bg-emerald-50",
                        )}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={selected}
                          onChange={() => setAnswer(q.id, opt)}
                          data-testid={`q${idx}-opt-${opt}`}
                          className="accent-blue-600"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {q.type === "fill" && (
                <input
                  type="text"
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  data-testid={`q${idx}-fill`}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2"
                  placeholder="Your answer…"
                />
              )}

              {q.type === "match" && q.pairs && (
                <div className="grid gap-3 sm:grid-cols-2" data-testid={`q${idx}-match`}>
                  {q.pairs.map((p) => {
                    // For sanitised questions (sample/CEFR tests), right values are
                    // stripped from pairs and exposed as a shuffled `options` array.
                    // Fall back to pairs[].right for regular practice exercises.
                    const matchOptions: string[] =
                      q.options && q.options.length > 0
                        ? q.options
                        : q.pairs!.map((pp) => pp.right).filter(Boolean);
                    return (
                      <div key={p.left} className="flex items-center gap-2">
                        <span className="font-medium min-w-40">{p.left}</span>
                        <select
                          value={(answers[q.id] as Record<string, string> | undefined)?.[p.left] ?? ""}
                          onChange={(e) => {
                            const current = (answers[q.id] as Record<string, string>) ?? {};
                            setAnswer(q.id, { ...current, [p.left]: e.target.value });
                          }}
                          className="flex-1 rounded-md border border-border bg-white px-2 py-1.5"
                        >
                          <option value="">— choose —</option>
                          {matchOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}

              {(reveal || fb) && q.explanation && (
                <p className="mt-3 text-sm text-muted">💡 {q.explanation}</p>
              )}
              {reveal && !fb && (
                <p className="mt-3 text-sm text-emerald-700">
                  Answer: <strong>{Array.isArray(q.answer) ? q.answer.join(", ") : q.answer}</strong>
                </p>
              )}

              {!submitted && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => checkOne(q)}
                    data-testid={`q${idx}-check`}
                    className="text-xs font-semibold text-brand hover:text-brand-strong"
                  >
                    {labels.check}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={submitAll}
          disabled={loading}
          data-testid="exercise-submit"
          className="rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-5 py-2.5 disabled:opacity-50"
        >
          {labels.submit}
        </button>
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          data-testid="exercise-show-all"
          className="rounded-md border border-border bg-white hover:bg-surface px-5 py-2.5 font-semibold"
        >
          {labels.showAll}
        </button>
      </div>

      {submitted && (
        <div
          className="rounded-xl border-2 border-brand bg-brand-soft/40 p-5 text-center"
          data-testid="exercise-score"
        >
          <div className="text-sm text-muted">{labels.yourScore}</div>
          <div className="mt-1 text-3xl font-extrabold text-brand-strong">
            {correctCount} / {exercise.questions.length}{" "}
            <span className="text-base font-semibold text-brand">
              ({Math.round((score ?? 0) * 100)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
