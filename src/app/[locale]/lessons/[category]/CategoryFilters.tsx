"use client";

import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

const LEVELS = ["All", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

interface Props {
  category: string;
  counts: Record<string, number>;
  currentLevel: string | null;
  labels: { filterLevel: string; all: string };
}

export function CategoryFilters({ counts, currentLevel, labels }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function setLevel(level: string) {
    const params = new URLSearchParams(sp);
    if (level === "All") params.delete("level");
    else params.set("level", level);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2" data-testid="level-filters">
      <span className="text-sm font-semibold text-muted mr-2">{labels.filterLevel}:</span>
      {LEVELS.map((lvl) => {
        const active = (currentLevel ?? "All") === lvl;
        const label = lvl === "All" ? labels.all : lvl;
        return (
          <button
            key={lvl}
            type="button"
            data-testid={`filter-${lvl}`}
            onClick={() => setLevel(lvl)}
            className={cn(
              "rounded-md border px-3 py-1 text-sm font-medium transition-colors",
              active
                ? "border-brand bg-brand text-white"
                : "border-border bg-white text-foreground hover:border-brand",
            )}
          >
            {label} <span className="text-xs opacity-70">({counts[lvl] ?? 0})</span>
          </button>
        );
      })}
    </div>
  );
}
