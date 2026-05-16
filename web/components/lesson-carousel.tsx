"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LessonCard } from "@/components/lesson-card";
import type { Lesson } from "@/db/schema";
import { cn } from "@/lib/utils";

type LessonWithScore = Lesson & { score?: number };

export function LessonCarousel({
  title,
  lessons,
  showRecommendationBar = false,
  statusBadge,
  className,
}: {
  title: string;
  lessons: LessonWithScore[];
  showRecommendationBar?: boolean;
  /** Optional badge to overlay on each card (e.g. "Top recommendation"). */
  statusBadge?: string;
  className?: string;
}) {
  const t = useTranslations("home");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, lessons.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(280, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (lessons.length === 0) return null;

  return (
    <section className={cn("space-y-3", className)}>
      {/* Title row — Coursera pattern: bare h2, no subtitle, no inline icon, chevrons on the right edge */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-ink-900">
          {title}
        </h2>
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={!canScrollLeft}
            aria-label={t("scrollPrev")}
            className="size-8 inline-flex items-center justify-center rounded-full border border-ink-300 bg-white text-ink-700 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
            aria-label={t("scrollNext")}
            className="size-8 inline-flex items-center justify-center rounded-full border border-ink-300 bg-white text-ink-700 hover:bg-ink-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 flex gap-4 overflow-x-auto scrollbar-thin snap-x snap-mandatory scroll-smooth pb-2"
      >
        {lessons.map((l) => (
          <div
            key={l.id}
            className="w-[260px] sm:w-[280px] md:w-[300px] shrink-0 snap-start"
          >
            <LessonCard
              lesson={l}
              recommendation={showRecommendationBar ? l.score : undefined}
              statusBadge={statusBadge}
            />
          </div>
        ))}
        <div className="w-1 shrink-0" aria-hidden />
      </div>
    </section>
  );
}
