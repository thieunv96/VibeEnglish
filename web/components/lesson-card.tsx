"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { LESSON_TYPES } from "@/lib/constants";
import { Check, Clock, Star } from "lucide-react";
import type { Lesson } from "@/db/schema";
import { cn } from "@/lib/utils";

export function LessonCard({
  lesson,
  completed = false,
  recommendation,
  view = "grid",
  statusBadge,
}: {
  lesson: Lesson;
  completed?: boolean;
  recommendation?: number; // 0..1, higher = better fit
  view?: "grid" | "list";
  /** Optional overlay badge (e.g. "Top recommendation") rendered on the cover top-right. */
  statusBadge?: string;
}) {
  const tTypes = useTranslations("lessonTypes");
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");
  const typeMeta = LESSON_TYPES.find((t) => t.id === lesson.type) ?? LESSON_TYPES[0];
  const typeLabel = tTypes(typeMeta.id);
  const durationMin = Math.max(1, Math.round(lesson.durationSec / 60));

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

  // Grid card — Coursera anatomy:
  // image (16:9, dominant), status badge top-right, partner/category pill above title,
  // title (line-clamp 2), footer with type + rating + duration.
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

      <div className="flex-1 p-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[11px] text-ink-500 font-medium">
          <span>{typeLabel}</span>
          <span aria-hidden>·</span>
          <span>{lesson.level}</span>
        </div>
        <h3 className="font-semibold text-[15px] leading-snug line-clamp-2 min-h-[2.6em] text-ink-900 group-hover:text-brand-700 transition-colors">
          {lesson.title}
        </h3>
        <div className="mt-auto flex items-center justify-between text-[11px] text-ink-500 pt-1">
          {lesson.rating != null ? (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-ink-700">{lesson.rating.toFixed(1)}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-ink-400">
              <Star className="size-3" />
              <span>—</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {tHome("lessonTypeCourse", { duration: durationMin })}
          </span>
        </div>
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
