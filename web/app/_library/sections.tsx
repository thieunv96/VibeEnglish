"use client";

import { useState, useMemo } from "react";
import { LessonCard } from "@/components/lesson-card";
import { LibraryToolbar, type LibraryFilter } from "./toolbar";
import type { Lesson } from "@/db/schema";
import { Sparkles } from "lucide-react";

type LessonWithScore = Lesson & { score?: number };
type CompletedLesson = Lesson & { score: number | null; completedAt: Date | null };

export function LibrarySections({
  all,
  recommended,
  completed,
}: {
  all: Lesson[];
  recommended: LessonWithScore[];
  completed: CompletedLesson[];
}) {
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filteredAll = useMemo(() => {
    return all.filter((l) => {
      if (filter !== "all" && l.type !== filter) return false;
      if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [all, filter, search]);

  const completedIds = new Set(completed.map((c) => c.id));
  const pending = filteredAll.filter((l) => !completedIds.has(l.id));

  return (
    <>
      {/* Recommended */}
      {recommended.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-brand-500" /> Gợi ý cho bạn
            </h2>
            <button className="text-sm text-brand-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((l) => (
              <LessonCard key={l.id} lesson={l} recommendation={l.score} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-bold mb-4">Tất cả bài học</h2>
        <LibraryToolbar
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
          view={view}
          onViewChange={setView}
        />

        <div className="mt-5">
          {pending.length === 0 ? (
            <EmptyState />
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map((l) => (
                <LessonCard key={l.id} lesson={l} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pending.map((l) => (
                <LessonCard key={l.id} lesson={l} view="list" />
              ))}
            </div>
          )}
        </div>
      </section>

      {completed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Đã hoàn thành</h2>
            <span className="text-sm text-stone-500">{completed.length} bài</span>
          </div>
          {view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completed.slice(0, 6).map((l) => (
                <LessonCard key={l.id} lesson={l} completed />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {completed.slice(0, 10).map((l) => (
                <LessonCard key={l.id} lesson={l} completed view="list" />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
      Không có bài học phù hợp với bộ lọc hiện tại.
    </div>
  );
}
