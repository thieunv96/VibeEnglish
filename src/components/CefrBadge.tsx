import { cn } from "@/lib/cn";
import type { CefrLevel } from "@/lib/content";

const colors: Record<CefrLevel, string> = {
  A1: "bg-emerald-100 text-emerald-800 border-emerald-200",
  A2: "bg-teal-100 text-teal-800 border-teal-200",
  B1: "bg-sky-100 text-sky-800 border-sky-200",
  B2: "bg-indigo-100 text-indigo-800 border-indigo-200",
  C1: "bg-violet-100 text-violet-800 border-violet-200",
  C2: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
};

export function CefrBadge({ level, className }: { level: CefrLevel; className?: string }) {
  return (
    <span
      data-testid={`cefr-${level}`}
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        colors[level],
        className,
      )}
    >
      {level}
    </span>
  );
}
