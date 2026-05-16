"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { LESSON_TYPES } from "@/lib/constants";
import { Check, Star } from "lucide-react";
import type { Lesson, Category } from "@/db/schema";
import { cn } from "@/lib/utils";

export type LessonCardProps = {
  lesson: Lesson;
  completed?: boolean;
  recommendation?: number; // 0..1, higher = better fit
  view?: "grid" | "list";
  /** Optional overlay badge (e.g. "Đề xuất hàng đầu") rendered on the cover top-right. */
  statusBadge?: string;
  /** Optional category info — used to render the Coursera-style partner row above the title. */
  category?: Pick<Category, "icon" | "slug" | "title"> | null;
  /** Optional category slug → translated name. Caller usually passes the i18n-resolved name via `categoryName`. */
  categoryName?: string;
  /** Optional review count to show after the rating star. */
  ratingCount?: number;
};

export function LessonCard({
  lesson,
  completed = false,
  recommendation,
  view = "grid",
  statusBadge,
  category,
  categoryName,
  ratingCount,
}: LessonCardProps) {
  const tTypes = useTranslations("lessonTypes");
  const tCommon = useTranslations("common");
  const tCard = useTranslations("lessonCard");
  const typeMeta = LESSON_TYPES.find((t) => t.id === lesson.type) ?? LESSON_TYPES[0];
  const typeLabel = tTypes(typeMeta.id);
  const durationMin = Math.max(1, Math.round(lesson.durationSec / 60));
  const partnerLabel = categoryName ?? category?.title ?? null;
  const partnerIcon = category?.icon ?? null;

  if (view === "list") {
    return (
      <Link
        href={`/lessons/${lesson.id}`}
        className="flex items-center gap-3 px-3 py-2 rounded-md border border-ink-200 bg-white hover:border-brand-700 hover:bg-brand-50/30 transition-colors"
      >
        <div className={cn("size-8 rounded-md flex items-center justify-center text-base border shrink-0", typeMeta.color)}>
          {typeMeta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate text-ink-900">{lesson.title}</div>
          <div className="mt-0.5 text-[11px] text-ink-500 flex gap-1.5">
            <span>{lesson.level}</span>
            <span>·</span>
            <span>{durationMin} {tCommon("minutes")}</span>
          </div>
        </div>
        <Badge variant="outline" className="hidden md:inline-flex text-[10px]">{typeLabel}</Badge>
        {completed && <Check className="size-4 text-success-500 shrink-0" />}
      </Link>
    );
  }

  // Coursera ProductCard anatomy — order top to bottom:
  // 1. Cover image (16:9) + status badge top-right
  // 2. Partner row (small icon + category name)
  // 3. Title (bold, line-clamp-2, larger than meta)
  // 4. Rating row (★ value · count)
  // 5. Meta line (level · type · duration)
  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className={cn(
        "card-lift group flex flex-col rounded-md border border-ink-200 bg-white overflow-hidden h-full",
        completed && "opacity-90"
      )}
    >
      <div className={cn("relative aspect-video flex items-center justify-center text-5xl bg-ink-50", typeMeta.color)}>
        <span aria-hidden>{typeMeta.icon}</span>
        {completed && (
          <div className="absolute inset-0 bg-success-500/25 flex items-center justify-center">
            <div className="size-9 rounded-full bg-success-500 text-white flex items-center justify-center">
              <Check className="size-4" />
            </div>
          </div>
        )}
        {statusBadge && (
          <div className="absolute top-2 right-2 inline-flex items-center rounded-sm bg-amber-100 text-amber-900 text-[10px] font-semibold px-1.5 py-0.5">
            {statusBadge}
          </div>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col gap-2">
        {/* Partner row (Coursera shows institution logo + name; here the category stands in) */}
        {partnerLabel && (
          <div className="flex items-center gap-1.5 min-h-[20px]">
            {partnerIcon && (
              <span className="inline-flex size-5 items-center justify-center text-sm leading-none">
                {partnerIcon}
              </span>
            )}
            <p className="text-xs font-medium text-ink-600 truncate">{partnerLabel}</p>
          </div>
        )}

        {/* Title — slightly larger than body, bold */}
        <h3 className="font-bold text-[17px] leading-[1.3] line-clamp-2 min-h-[2.6em] text-ink-900 group-hover:text-brand-700 transition-colors">
          {lesson.title}
        </h3>

        {/* Optional description as "skills" line — Coursera uses a "Kỹ năng bạn sẽ đạt được:" muted line */}
        {lesson.description && (
          <p className="text-xs text-ink-500 line-clamp-2 leading-snug">
            {lesson.description}
          </p>
        )}

        {/* Rating row */}
        <div className="flex items-center gap-1 text-xs mt-auto pt-1">
          {lesson.rating != null ? (
            <>
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-ink-700 tabular-nums">
                {lesson.rating.toFixed(1)}
              </span>
              {typeof ratingCount === "number" && ratingCount > 0 && (
                <>
                  <span className="text-ink-400">·</span>
                  <span className="text-ink-500">
                    {tCard("reviewCount", { n: ratingCount })}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="text-ink-400 inline-flex items-center gap-1">
              <Star className="size-3.5" /> {tCard("noRating")}
            </span>
          )}
        </div>

        {/* Meta line — level · type · duration */}
        <p className="text-xs text-ink-500 leading-snug">
          {lesson.level} · {typeLabel} · {tCard("durationMin", { n: durationMin })}
        </p>

        {typeof recommendation === "number" && (
          <div className="h-1 rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full bg-brand-700 rounded-full"
              style={{ width: `${recommendation * 100}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
