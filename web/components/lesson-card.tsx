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
        className="flex items-center gap-3 px-3 py-2 rounded-lg border border-stone-200 bg-white hover:border-brand-300 hover:bg-brand-50/30 transition"
      >
        <div className={cn("size-8 rounded-md flex items-center justify-center text-base border shrink-0", typeMeta.color)}>
          {typeMeta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{lesson.title}</div>
          <div className="mt-0.5 text-[11px] text-stone-500 flex gap-1.5">
            <span>{lesson.level}</span>
            <span>·</span>
            <span>{durationMin} phút</span>
          </div>
        </div>
        <Badge variant="outline" className="hidden md:inline-flex text-[10px]">{typeMeta.label}</Badge>
        {completed && <Check className="size-4 text-emerald-500 shrink-0" />}
      </Link>
    );
  }

  return (
    <Link
      href={`/lessons/${lesson.id}`}
      className={cn(
        "group rounded-lg border border-stone-200 bg-white overflow-hidden transition hover:shadow-md hover:border-brand-300",
        completed && "opacity-90"
      )}
    >
      <div className={cn("relative aspect-[4/3] flex items-center justify-center text-3xl bg-stone-100", typeMeta.color)}>
        <span>{typeMeta.icon}</span>
        {completed && (
          <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
            <div className="size-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Check className="size-4" />
            </div>
          </div>
        )}
        <Badge variant="brand" className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur text-[10px] px-1.5 py-0">
          {typeMeta.icon}
        </Badge>
      </div>
      <div className="p-2">
        <h3 className="font-semibold text-xs leading-snug line-clamp-2 min-h-[2.1em] group-hover:text-brand-700 transition">
          {lesson.title}
        </h3>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-500">
          <span className="font-medium">{lesson.level}</span>
          <span className="flex items-center gap-0.5">
            <Clock className="size-2.5" /> {durationMin}p
          </span>
        </div>
        {typeof recommendation === "number" && (
          <div className="mt-1.5 h-0.5 rounded-full bg-stone-100 overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${recommendation * 100}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}
