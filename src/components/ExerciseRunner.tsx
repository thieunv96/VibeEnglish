"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { Exercise, ExerciseQuestion } from "@/lib/content";
import { checkAnswer, normalize } from "@/lib/exercise-scoring";
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

  /** Per-pair check for match questions, keyed by `${q.id}__${left}`. Only
   * usable when the pair's `right` value is present (regular practice). For
   * sanitised sample/CEFR tests the correct value is stripped server-side. */
  function checkPair(q: ExerciseQuestion, left: string, correctRight: string) {
    const current = (answers[q.id] as Record<string, string> | undefined)?.[left] ?? "";
    const ok = normalize(current) === normalize(correctRight);
    setFeedback((f) => ({ ...f, [`${q.id}__${left}`]: ok ? "correct" : "incorrect" }));
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
  const reveal = showAll || submitted;

  // Flatten match questions so each pair renders as its own numbered card.
  // Regular mcq/fill questions render as themselves.
  type RenderItem =
    | { kind: "q"; q: ExerciseQuestion }
    | { kind: "pair"; q: ExerciseQuestion; left: string; correctRight: string; options: string[] };
  const renderItems: RenderItem[] = [];
  for (const q of exercise.questions) {
    if (q.type === "match" && q.pairs) {
      // For sanitised sample/CEFR tests, pairs[].right is stripped and the
      // shuffled choices live on q.options. For regular practice the pairs
      // carry their own right value and we just collect them.
      const options =
        q.options && q.options.length > 0
          ? q.options
          : q.pairs.map((pp) => pp.right).filter(Boolean);
      for (const p of q.pairs) {
        renderItems.push({ kind: "pair", q, left: p.left, correctRight: p.right ?? "", options });
      }
    } else {
      renderItems.push({ kind: "q", q });
    }
  }

  return (
    <div className="space-y-6" data-testid="exercise-runner">
      <ol className="space-y-5">
        {renderItems.map((item, idx) => {
          const { q } = item;
          const fbKey = item.kind === "pair" ? `${q.id}__${item.left}` : q.id;
          const fb = feedback[fbKey];

          // Per-pair: prompt = left; main: prompt = q.prompt.
          const promptText = item.kind === "pair" ? item.left : q.prompt;

          return (
            <li
              key={fbKey}
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
                  {promptText}
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

              {item.kind === "q" && q.type === "mcq" && q.options && (
                <div className="space-y-2" role="radiogroup">
                  {q.options.map((opt) => {
                    const selected = answers[q.id] === opt;
                    const isAnswer = Array.isArray(q.answer)
                      ? q.answer.includes(opt)
                      : q.answer === opt;
                    const wrongPick = reveal && selected && !isAnswer;
                    return (
                      <label
                        key={opt}
                        className={cn(
                          "flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer",
                          selected ? "border-brand bg-brand-soft/40" : "border-border hover:bg-surface",
                          reveal && isAnswer && "border-emerald-400 bg-emerald-50",
                          wrongPick && "border-red-400 bg-red-50",
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

              {item.kind === "q" && q.type === "fill" && (
                <input
                  type="text"
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  data-testid={`q${idx}-fill`}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2"
                  placeholder="Your answer…"
                />
              )}

              {item.kind === "pair" && (() => {
                const current = (answers[q.id] as Record<string, string> | undefined)?.[item.left] ?? "";
                const wrongPick =
                  reveal && current !== "" && item.correctRight !== "" &&
                  normalize(current) !== normalize(item.correctRight);
                return (
                  <div data-testid={`q${idx}-match`} className="flex items-center gap-2">
                    <select
                      value={current}
                      onChange={(e) => {
                        const cur = (answers[q.id] as Record<string, string>) ?? {};
                        setAnswer(q.id, { ...cur, [item.left]: e.target.value });
                      }}
                      className={cn(
                        "flex-1 rounded-md border bg-white px-3 py-2",
                        wrongPick ? "border-red-400 bg-red-50" : "border-border",
                      )}
                    >
                      <option value="">— choose —</option>
                      {item.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}

              {(reveal || fb) && q.explanation && (
                <p className="mt-3 text-sm text-muted">💡 {q.explanation}</p>
              )}
              {reveal && !fb && item.kind === "q" && (
                <p className="mt-3 text-sm text-emerald-700">
                  Answer: <strong>{Array.isArray(q.answer) ? q.answer.join(", ") : q.answer}</strong>
                </p>
              )}
              {reveal && !fb && item.kind === "pair" && item.correctRight && (
                <p className="mt-3 text-sm text-emerald-700">
                  Answer: <strong>{item.correctRight}</strong>
                </p>
              )}

              {!submitted && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() =>
                      item.kind === "pair"
                        ? checkPair(q, item.left, item.correctRight)
                        : checkOne(q)
                    }
                    // Hide the per-pair check button when correct answer is
                    // stripped (sanitised sample/CEFR tests have no right value
                    // to compare against client-side).
                    disabled={item.kind === "pair" && !item.correctRight}
                    data-testid={`q${idx}-check`}
                    className="text-xs font-semibold text-brand hover:text-brand-strong disabled:opacity-40 disabled:cursor-not-allowed"
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
          disabled={submitted}
          data-testid="exercise-show-all"
          className="rounded-md border border-border bg-white hover:bg-surface px-5 py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
