"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { LESSON_TYPES } from "@/lib/constants";
import { Check, Clock } from "lucide-react";
import type { Lesson } from "@/db/schema";
import { cn } from "@/lib/utils";

export function LessonCard({
  lesson,
  completed = false,
  recommendation,
  view = "grid",
}: {
  lesson: Lesson;
  completed?: boolean;
  recommendation?: number; // 0..1, higher = better fit
  view?: "grid" | "list";
}) {
  const tTypes = useTranslations("lessonTypes");
  const tCommon = useTranslations("common");
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

  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className={cn(
        "card-lift group flex flex-col rounded-md border border-ink-200 bg-white overflow-hidden",
        completed && "opacity-90"
      )}
    >
      <div className={cn("relative aspect-video flex items-center justify-center text-4xl bg-ink-50", typeMeta.color)}>
        <span>{typeMeta.icon}</span>
        {completed && (
          <div className="absolute inset-0 bg-success-500/25 flex items-center justify-center">
            <div className="size-9 rounded-full bg-success-500 text-white flex items-center justify-center">
              <Check className="size-4" />
            </div>
          </div>
        )}
        <Badge
          variant="brand"
          className="absolute top-2 left-2 bg-white/95 backdrop-blur text-[10px] px-2 py-0.5 font-semibold tracking-wide"
        >
          {typeLabel}
        </Badge>
      </div>
      <div className="flex-1 p-3 flex flex-col">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5em] text-ink-900 group-hover:text-brand-700 transition-colors">
          {lesson.title}
        </h3>
        <div className="mt-2 flex items-center justify-between text-[11px] text-ink-500">
          <span className="font-semibold text-ink-600">{lesson.level}</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> {durationMin}p
          </span>
        </div>
        {typeof recommendation === "number" && (
          <div className="mt-2 h-1 rounded-full bg-ink-100 overflow-hidden">
            <div className="h-full bg-brand-700 rounded-full" style={{ width: `${recommendation * 100}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}
