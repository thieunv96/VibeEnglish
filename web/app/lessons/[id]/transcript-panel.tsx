"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import type { TranscriptSegment } from "@/db/schema";
import { cn, formatTimestamp } from "@/lib/utils";

type Mode = "bilingual" | "en" | "vi";

export function TranscriptPanel({
  segments,
  currentTime,
}: {
  segments: TranscriptSegment[];
  currentTime: number;
}) {
  const [mode, setMode] = useState<Mode>("bilingual");
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeIdx = useMemo(() => {
    return segments.findIndex((s) => currentTime >= s.startSec && currentTime < s.endSec);
  }, [segments, currentTime]);

  useEffect(() => {
    if (!autoScroll || activeIdx < 0 || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    if (el)
      el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx, autoScroll]);

  const handleSeekClick = (seg: TranscriptSegment) => {
    window.dispatchEvent(new CustomEvent("vibe:seek", { detail: { sec: seg.startSec } }));
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Transcript</h3>
          {activeIdx >= 0 && <span className="size-2 rounded-full bg-red-500 animate-pulse" title="Đang sync" />}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-stone-500 cursor-pointer">
            <span>Auto-scroll</span>
            <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
          </label>
          <div className="flex rounded-md border border-stone-200 overflow-hidden text-xs">
            {(["en", "bilingual", "vi"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-2.5 py-1 transition",
                  mode === m ? "bg-brand-600 text-white" : "bg-white text-stone-600 hover:bg-stone-50"
                )}
              >
                {m === "en" ? "EN" : m === "vi" ? "VI" : "Song ngữ"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === "bilingual" && (
        <div className="px-4 py-2 grid grid-cols-2 text-xs font-medium text-stone-500 border-b border-stone-100">
          <span>🇬🇧 English</span>
          <span>🇻🇳 Tiếng Việt</span>
        </div>
      )}

      <div
        ref={containerRef}
        className="max-h-[420px] overflow-y-auto scrollbar-thin px-3 py-2 space-y-1"
      >
        {segments.map((seg) => {
          const isActive = currentTime >= seg.startSec && currentTime < seg.endSec;
          const isPast = currentTime >= seg.endSec;
          return (
            <button
              key={seg.id}
              data-idx={segments.indexOf(seg)}
              onClick={() => handleSeekClick(seg)}
              className={cn(
                "w-full text-left rounded-md px-2 py-1.5 transition flex gap-3",
                isActive && "bg-brand-50",
                !isActive && "hover:bg-stone-50",
                isPast && !isActive && "opacity-50"
              )}
            >
              <span
                className={cn(
                  "font-mono text-[11px] mt-0.5 shrink-0 w-12",
                  isActive ? "text-brand-700 font-semibold" : "text-stone-400"
                )}
              >
                {formatTimestamp(seg.startSec)}
              </span>
              {mode === "bilingual" ? (
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <p className={cn("text-sm", isActive && "font-semibold text-stone-900")}>{seg.en}</p>
                  <p className={cn("text-sm text-stone-500", isActive && "text-stone-700")}>{seg.vi}</p>
                </div>
              ) : (
                <p className={cn("text-sm flex-1", isActive && "font-semibold text-stone-900")}>
                  {mode === "en" ? seg.en : seg.vi}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
