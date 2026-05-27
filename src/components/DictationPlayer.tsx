"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import type { Lesson } from "@/lib/content";
import { scoreDictation, type DiffWord } from "@/lib/dictation";
import { cn } from "@/lib/cn";

interface Props {
  lesson: Lesson;
  labels: {
    play: string;
    stop: string;
    speed: string;
    submit: string;
    showAnswer: string;
    hideAnswer: string;
    nextSegment: string;
    saveWord: string;
    transcript: string;
    segments: string;
    yourInput: string;
    accuracy: string;
    loginToSave: string;
  };
}

export function DictationPlayer({ lesson, labels }: Props) {
  const { status } = useSession();
  const loading = status === "loading";
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [diff, setDiff] = useState<DiffWord[] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [perSegment, setPerSegment] = useState<Record<number, number>>({});
  const [hasReportedProgress, setHasReportedProgress] = useState(false);
  const loginToastShown = useRef(false);

  const segments = lesson.segments;
  const segment = segments[idx];

  const overallAccuracy = useMemo(() => {
    const vals = Object.values(perSegment);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [perSegment]);

  useEffect(() => {
    // Reset per-segment state when moving.
    setInput("");
    setDiff(null);
    setAccuracy(null);
    setShowAnswer(false);
  }, [idx]);

  function play() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(segment.text);
    utter.lang = "en-US";
    utter.rate = speed;
    utter.onstart = () => setIsPlaying(true);
    utter.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utter);
  }

  function stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }

  function submit() {
    const result = scoreDictation(segment.text, input);
    setDiff(result.diff);
    setAccuracy(result.accuracy);
    setPerSegment((prev) => ({ ...prev, [idx]: result.accuracy }));

    // Nudge unauthenticated learners once per page so they know progress
    // could be saved if they sign in.
    if (status === "unauthenticated" && !loginToastShown.current) {
      toast.info(labels.loginToSave);
      loginToastShown.current = true;
    }
  }

  async function reportProgress(completed: number, acc: number) {
    if (status !== "authenticated") return;
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonSlug: lesson.slug,
          category: lesson.category,
          title: lesson.title,
          segmentsCompleted: completed,
          totalSegments: segments.length,
          accuracy: acc,
        }),
      });
      setHasReportedProgress(true);
    } catch {
      /* swallow */
    }
  }

  function next() {
    const completed = Math.max(idx + 1, Object.keys(perSegment).length);
    void reportProgress(completed, overallAccuracy);
    if (idx < segments.length - 1) {
      setIdx(idx + 1);
    }
  }

  const completedCount = Object.keys(perSegment).length;
  const finished = idx === segments.length - 1 && diff != null;

  // Auto-report when finished.
  useEffect(() => {
    if (finished && !hasReportedProgress) {
      void reportProgress(completedCount, overallAccuracy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  return (
    <div className="space-y-6" data-testid="dictation-player">
      {/* Segment selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted mr-2">{labels.segments}:</span>
        {segments.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            className={cn(
              "h-8 w-8 rounded-md text-xs font-semibold border transition-colors",
              i === idx
                ? "bg-brand text-white border-brand"
                : perSegment[i] != null
                ? "bg-brand-soft text-brand-strong border-brand-soft"
                : "bg-white text-foreground border-border hover:border-brand",
            )}
            aria-label={`Segment ${i + 1}`}
            data-testid={`segment-${i}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Player controls */}
      <div className="rounded-xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={isPlaying ? stop : play}
            data-testid="play-segment"
            className="inline-flex items-center gap-2 rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-4 py-2"
          >
            {isPlaying ? `■ ${labels.stop}` : `▶ ${labels.play}`}
          </button>
          <label className="inline-flex items-center gap-2 text-sm">
            <span className="text-muted">{labels.speed}:</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="rounded-md border border-border bg-white px-2 py-1 text-sm"
            >
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
            </select>
          </label>
          <span className="ml-auto text-sm text-muted">
            Segment {idx + 1} / {segments.length}
          </span>
        </div>
      </div>

      {/* Input */}
      <div className="rounded-xl border border-border bg-white p-5 space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={3}
          data-testid="dictation-input"
          placeholder={labels.yourInput}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={submit}
            data-testid="dictation-submit"
            className="rounded-md bg-brand hover:bg-brand-strong text-white font-semibold px-4 py-2"
          >
            {labels.submit}
          </button>
          <button
            type="button"
            onClick={() => setShowAnswer((v) => !v)}
            data-testid="dictation-show-answer"
            className="rounded-md border border-border bg-white text-foreground hover:bg-surface px-4 py-2 font-semibold"
          >
            {showAnswer ? labels.hideAnswer : labels.showAnswer}
          </button>
          {idx < segments.length - 1 && (
            <button
              type="button"
              onClick={next}
              disabled={loading}
              data-testid="dictation-next"
              className="rounded-md border-2 border-brand text-brand hover:bg-brand-soft px-4 py-2 font-semibold ml-auto disabled:opacity-50"
            >
              {labels.nextSegment} →
            </button>
          )}
        </div>

        {diff && (
          <div data-testid="dictation-diff" className="rounded-md border border-border bg-surface p-3">
            <div className="text-xs text-muted mb-1">
              {labels.accuracy}: {Math.round((accuracy ?? 0) * 100)}%
            </div>
            <p className="leading-relaxed">
              {diff.map((d, i) => (
                <span key={i} className={`dict-${d.status}`}>
                  {d.word}{" "}
                </span>
              ))}
            </p>
          </div>
        )}
        {showAnswer && (
          <div data-testid="dictation-answer" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
            <div className="text-xs text-emerald-700 mb-1">Answer:</div>
            <p className="leading-relaxed font-medium">{segment.text}</p>
          </div>
        )}
      </div>

      {finished && (
        <div className="rounded-xl border border-brand-soft bg-brand-soft/40 p-4 text-center" data-testid="lesson-finished">
          🎉 Lesson complete! Overall accuracy: <strong>{Math.round(overallAccuracy * 100)}%</strong>
        </div>
      )}
    </div>
  );
}
