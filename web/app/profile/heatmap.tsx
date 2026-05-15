"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function Heatmap({ activity }: { activity: Record<string, number> }) {
  const today = useMemo(() => new Date(), []);
  const days: { date: string; count: number; isToday: boolean }[] = [];
  for (let i = 119; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      date: key,
      count: activity[key] ?? 0,
      isToday: i === 0,
    });
  }
  // Group by weeks (7 per column)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const shadeForCount = (c: number) => {
    if (c === 0) return "bg-stone-100";
    if (c === 1) return "bg-brand-200";
    if (c === 2) return "bg-brand-400";
    if (c <= 4) return "bg-brand-600";
    return "bg-brand-800";
  };

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-thin py-1">
      {weeks.map((week, i) => (
        <div key={i} className="flex flex-col gap-1">
          {week.map((day) => (
            <div
              key={day.date}
              className={cn(
                "size-3 rounded-sm transition",
                shadeForCount(day.count),
                day.isToday && "ring-2 ring-brand-600 ring-offset-1"
              )}
              title={`${day.date}: ${day.count} bài`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
