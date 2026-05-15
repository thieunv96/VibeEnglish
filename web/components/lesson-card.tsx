import Link from "next/link";
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
  const typeMeta = LESSON_TYPES.find((t) => t.id === lesson.type) ?? LESSON_TYPES[0];
  const durationMin = Math.max(1, Math.round(lesson.durationSec / 60));

  if (view === "list") {
    return (
      <Link
        href={`/lessons/${lesson.id}`}
        className="flex items-center gap-4 px-4 py-3 rounded-xl border border-stone-200 bg-white hover:border-brand-300 hover:bg-brand-50/30 transition"
      >
        <div className={cn("size-10 rounded-lg flex items-center justify-center text-lg border", typeMeta.color)}>
          {typeMeta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{lesson.title}</div>
          <div className="mt-0.5 text-xs text-stone-500 flex gap-2">
            <span>{lesson.level}</span>
            <span>·</span>
            <span>{durationMin} phút</span>
          </div>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex">{typeMeta.label}</Badge>
        {completed && <Check className="size-5 text-emerald-500" />}
      </Link>
    );
  }

  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className={cn(
        "group rounded-xl border border-stone-200 bg-white overflow-hidden transition hover:shadow-md hover:border-brand-300",
        completed && "opacity-90"
      )}
    >
      <div className={cn("relative aspect-video flex items-center justify-center text-5xl bg-stone-100", typeMeta.color)}>
        <span>{typeMeta.icon}</span>
        {completed && (
          <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
            <div className="size-12 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Check className="size-6" />
            </div>
          </div>
        )}
        <Badge variant="brand" className="absolute top-2 left-2 bg-white/95 backdrop-blur">
          {typeMeta.label}
        </Badge>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-brand-700 transition">
          {lesson.title}
        </h3>
        <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
          <span>{lesson.level}</span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" /> {durationMin}p
          </span>
        </div>
        {typeof recommendation === "number" && (
          <div className="mt-2 h-0.5 rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${recommendation * 100}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}
