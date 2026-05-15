"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RotateCcw } from "lucide-react";
import type { Exercise } from "@/db/schema";
import { scoreWritingAction } from "./actions";
import { cn } from "@/lib/utils";

export function WritingTab({
  exercise,
  level,
  onDone,
}: {
  exercise: Exercise;
  level: string;
  onDone: () => void;
}) {
  const t = useTranslations("lesson.writing");
  const payload = exercise.payload as Extract<Exercise["payload"], { kind: "writing" }>;
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | {
    annotated: { text: string; type: "ok" | "error" | "good" }[];
    skillScores: Record<string, number>;
    suggestions: { quote: string; suggestion: string }[];
  }>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = async () => {
    if (wordCount < (payload.minWords ?? 30)) return;
    setSubmitting(true);
    const r = await scoreWritingAction({ text, level, exerciseId: exercise.id });
    setResult(r);
    setSubmitting(false);
    onDone();
  };

  const handleReset = () => {
    setResult(null);
  };

  if (result) {
    return (
      <div className="space-y-4 py-2 animate-[slide-up_0.3s_ease-out]">
        <div className="rounded-lg bg-stone-50 border border-stone-200 p-4 leading-relaxed text-sm">
          {result.annotated.map((token, i) => (
            <span
              key={i}
              className={cn(
                token.type === "error" && "underline decoration-wavy decoration-red-500 underline-offset-2",
                token.type === "good" && "bg-emerald-100 rounded px-0.5"
              )}
            >
              {token.text}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          {Object.entries(result.skillScores).map(([k, v]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="text-xs w-24 capitalize text-stone-500">{k}</span>
              <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${v}%` }} />
              </div>
              <span className="text-xs font-medium w-8 text-right">{v}</span>
            </div>
          ))}
        </div>

        {result.suggestions.length > 0 && (
          <div className="rounded-lg border border-stone-200 bg-white p-3 space-y-2">
            <div className="text-xs font-semibold text-stone-600">{t("suggestions")}</div>
            {result.suggestions.map((s, i) => (
              <div key={i} className="text-xs">
                <span className="text-red-600 line-through">{s.quote}</span>
                <span className="mx-1.5 text-stone-400">→</span>
                <span className="text-emerald-700 font-medium">{s.suggestion}</span>
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleReset} variant="outline" size="sm">
          <RotateCcw className="size-3.5" /> {t("rewrite")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <div className="rounded-lg bg-stone-50 border border-stone-200 p-3 text-sm">
        <div className="text-xs font-semibold text-stone-500 mb-1">{t("promptLabel")}</div>
        <p>{payload.prompt}</p>
        {payload.minWords && (
          <p className="text-xs text-stone-400 mt-1">{t("minWordsHint", { n: payload.minWords })}</p>
        )}
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={t("placeholder")}
      />
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "text-xs",
            payload.minWords && wordCount >= payload.minWords ? "text-emerald-600" : "text-stone-500"
          )}
        >
          {t("wordCount", { n: wordCount })}
          {payload.minWords && ` ${t("wordTarget", { n: payload.minWords })}`}
        </div>
        <Button onClick={handleSubmit} disabled={submitting || (payload.minWords ? wordCount < payload.minWords : wordCount < 10)}>
          {submitting && <Loader2 className="size-4 animate-spin" />} {t("submit")}
        </Button>
      </div>
    </div>
  );
}
