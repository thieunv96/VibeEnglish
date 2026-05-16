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
  subtitle,
  icon,
  lessons,
  showRecommendationBar = false,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  lessons: LessonWithScore[];
  showRecommendationBar?: boolean;
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
    <section className={cn("space-y-4", className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl md:text-3xl font-bold tracking-tight text-ink-900">
            {icon} {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm md:text-base text-ink-500">{subtitle}</p>}
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            disabled={!canScrollLeft}
            aria-label={t("scrollPrev")}
            className="size-9 inline-flex items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 hover:text-ink-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            disabled={!canScrollRight}
            aria-label={t("scrollNext")}
            className="size-9 inline-flex items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 hover:text-ink-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="size-5" />
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
            />
          </div>
        ))}
        {/* trailing spacer so last card isn't clipped by main edge */}
        <div className="w-1 shrink-0" aria-hidden />
      </div>
    </section>
  );
}
