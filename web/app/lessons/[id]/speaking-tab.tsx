"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, Square, RotateCcw } from "lucide-react";
import type { Exercise } from "@/db/schema";
import { scoreSpeakingAction } from "./actions";
import { cn } from "@/lib/utils";

export function SpeakingTab({
  exercise,
  onDone,
}: {
  exercise: Exercise;
  onDone: () => void;
}) {
  const payload = exercise.payload as Extract<Exercise["payload"], { kind: "speaking" }>;
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | {
    score: number;
    words: { word: string; quality: "good" | "okay" | "poor"; note?: string }[];
    overall: string;
  }>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await submitAudio(blob);
      };
      mr.start();
      setRecording(true);
    } catch (e) {
      alert("Không truy cập được mic. Hãy cấp quyền cho trình duyệt.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const submitAudio = async (_blob: Blob) => {
    setSubmitting(true);
    // Phase 1: skip audio upload, send target text to stub
    const r = await scoreSpeakingAction({
      targetText: payload.targetText,
      exerciseId: exercise.id,
    });
    setResult(r);
    setSubmitting(false);
    onDone();
  };

  const handleRetry = () => {
    setResult(null);
  };

  return (
    <div className="space-y-5 py-2">
      <div className="rounded-lg border-l-4 border-brand-500 bg-brand-50/50 p-4">
        <div className="text-xs font-semibold text-brand-700 mb-1">Đọc to câu sau:</div>
        <p className="text-lg leading-snug">{payload.targetText}</p>
      </div>

      {!result && (
        <div className="flex flex-col items-center gap-3 py-2">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={submitting}
            className={cn(
              "relative size-20 rounded-full flex items-center justify-center transition shadow-lg",
              recording
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-brand-600 hover:bg-brand-700 text-white"
            )}
          >
            {recording ? (
              <Square className="size-7 fill-current" />
            ) : submitting ? (
              <Loader2 className="size-7 animate-spin" />
            ) : (
              <Mic className="size-7" />
            )}
            {recording && (
              <span className="absolute inset-0 rounded-full animate-[pulse-ring_1.6s_ease-out_infinite] pointer-events-none" />
            )}
          </button>
          <p className="text-xs text-stone-500">
            {recording ? "Đang thu âm... nhấn để dừng" : submitting ? "AI đang phân tích..." : "Nhấn để bắt đầu thu âm"}
          </p>
        </div>
      )}

      {result && (
        <div className="space-y-4 animate-[slide-up_0.3s_ease-out]">
          <div className="text-center">
            <div className="text-xs text-stone-500 mb-1">Điểm phát âm</div>
            <div className="text-5xl font-bold text-brand-600">{result.score}</div>
            <div className="text-xs text-stone-400">/ 100</div>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {result.words.map((w, i) => (
              <span
                key={i}
                title={w.note}
                className={cn(
                  "px-2 py-1 rounded-md text-sm font-medium border",
                  w.quality === "good" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                  w.quality === "okay" && "bg-amber-50 text-amber-700 border-amber-200",
                  w.quality === "poor" && "bg-red-50 text-red-700 border-red-200"
                )}
              >
                {w.word}
              </span>
            ))}
          </div>
          <p className="text-sm text-center text-stone-600">{result.overall}</p>
          <div className="flex justify-center">
            <Button onClick={handleRetry} variant="outline" size="sm">
              <RotateCcw className="size-3.5" /> Thu âm lại
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
