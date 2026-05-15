"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, ThumbsUp, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/db/schema";
import { scoreQuizAction } from "./actions";

export function QuizTab({
  questions,
  onDone,
}: {
  questions: QuizQuestion[];
  onDone: (score: number) => void;
}) {
  const t = useTranslations("lesson.quiz");
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ qid: string; correct: boolean }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<null | {
    score: number;
    bySkill: Record<string, number>;
    strengths: string[];
    improvements: string[];
    tips: string[];
  }>(null);

  if (questions.length === 0) {
    return <p className="text-sm text-stone-500 py-4">{t("empty")}</p>;
  }
  const q = questions[idx];
  const finished = answers.length === questions.length;

  const handleSelect = (oi: number) => {
    if (feedback !== "idle") return;
    const correct = oi === q.correctIndex;
    setSelected(oi);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setTimeout(() => {
        next(true);
      }, 700);
    }
  };

  const next = (correct: boolean) => {
    setAnswers((a) => [...a, { qid: q.id, correct }]);
    setFeedback("idle");
    setSelected(null);
    if (idx + 1 < questions.length) setIdx(idx + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await scoreQuizAction({ answers });
    setAiFeedback(result);
    setSubmitting(false);
    onDone(result.score);
  };

  if (aiFeedback) {
    return <AIFeedbackBox feedback={aiFeedback} />;
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between text-xs text-stone-400">
        <span>
          {t("questionLabel", { current: idx + 1, total: questions.length, skill: q.skill })}
        </span>
        <span>{Math.round(((answers.length) / questions.length) * 100)}%</span>
      </div>
      <p className="text-base font-semibold leading-snug">{q.question}</p>
      <div className="space-y-2">
        {q.options.map((opt, oi) => {
          const isSel = selected === oi;
          const isCorrect = oi === q.correctIndex;
          const showOK = feedback === "correct" && isCorrect;
          const showBad = feedback === "wrong" && isSel;
          return (
            <button
              key={oi}
              onClick={() => handleSelect(oi)}
              disabled={feedback !== "idle"}
              className={cn(
                "w-full text-left rounded-full border-2 px-4 py-2.5 text-sm transition flex items-center gap-3",
                showOK && "border-emerald-500 bg-emerald-50",
                showBad && "border-red-400 bg-red-50",
                !showOK && !showBad && "border-stone-200 hover:border-brand-300 hover:bg-brand-50/30",
                feedback !== "idle" && "cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "size-7 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0",
                  showOK && "border-emerald-500 bg-emerald-500 text-white",
                  showBad && "border-red-400 bg-red-400 text-white",
                  !showOK && !showBad && "border-stone-300 text-stone-500"
                )}
              >
                {String.fromCharCode(65 + oi)}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {feedback === "wrong" && (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => next(false)}>
            {t("nextWrong")}
          </Button>
        </div>
      )}

      {finished && (
        <Button onClick={handleSubmit} size="lg" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />} {t("submit")}
        </Button>
      )}
    </div>
  );
}

function AIFeedbackBox({
  feedback,
}: {
  feedback: { score: number; bySkill: Record<string, number>; strengths: string[]; improvements: string[]; tips: string[] };
}) {
  const t = useTranslations("lesson.quiz");
  return (
    <div className="space-y-4 py-2 animate-[slide-up_0.3s_ease-out]">
      <div className="text-center">
        <div className="text-xs text-stone-500 mb-1">{t("scoreLabel")}</div>
        <div className="text-5xl font-bold text-brand-600">{feedback.score}</div>
        <div className="text-xs text-stone-400">/ 100</div>
      </div>
      <div className="rounded-xl bg-stone-50 p-4 space-y-3 border border-stone-200">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Lightbulb className="size-4 text-amber-500" /> {t("aiFeedback")}
        </div>
        {feedback.strengths.length > 0 && (
          <div>
            <div className="text-xs font-medium text-emerald-700 mb-1 flex items-center gap-1">
              <ThumbsUp className="size-3" /> {t("strengths")}
            </div>
            <ul className="text-sm space-y-1 text-stone-700">
              {feedback.strengths.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        )}
        {feedback.improvements.length > 0 && (
          <div>
            <div className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
              <AlertCircle className="size-3" /> {t("improvements")}
            </div>
            <ul className="text-sm space-y-1 text-stone-700">
              {feedback.improvements.map((s, i) => (
                <li key={i}>↗ {s}</li>
              ))}
            </ul>
          </div>
        )}
        {feedback.tips.length > 0 && (
          <div>
            <div className="text-xs font-medium text-brand-700 mb-1 flex items-center gap-1">
              <Lightbulb className="size-3" /> {t("tips")}
            </div>
            <ul className="text-sm space-y-1 text-stone-700">
              {feedback.tips.map((s, i) => (
                <li key={i}>💡 {s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
