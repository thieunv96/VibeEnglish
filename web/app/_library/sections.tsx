"use client";

import { useState, useMemo, useEffect } from "react";
import { LessonCard } from "@/components/lesson-card";
import { LibraryToolbar, type LibraryFilter } from "./toolbar";
import type { Lesson, Category } from "@/db/schema";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type LessonWithScore = Lesson & { score?: number };
type CompletedLesson = Lesson & { score: number | null; completedAt: Date | null };

export function LibrarySections({
  all,
  recommended,
  completed,
  categories,
  initialSearch = "",
}: {
  all: Lesson[];
  recommended: LessonWithScore[];
  completed: CompletedLesson[];
  categories: Category[];
  initialSearch?: string;
}) {
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<string | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const filteredAll = useMemo(() => {
    return all.filter((l) => {
      if (filter !== "all" && l.type !== filter) return false;
      if (category !== "all" && l.categoryId !== category) return false;
      if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [all, filter, search, category]);

  const completedIds = new Set(completed.map((c) => c.id));
  const pending = filteredAll.filter((l) => !completedIds.has(l.id));

  return (
    <>
      {/* Categories chip row */}
      {categories.length > 0 && (
        <section>
          <h2 className="text-base font-bold mb-3 text-stone-900">Khám phá theo chủ đề</h2>
          <div className="flex flex-wrap gap-2">
            <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>
              Tất cả
            </CategoryChip>
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                active={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                <span className="text-base">{c.icon}</span> {c.title}
              </CategoryChip>
            ))}
          </div>
        </section>
      )}

      {/* Recommended */}
      {recommended.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="size-4 text-brand-500" /> Gợi ý cho bạn
            </h2>
            <button className="text-sm text-brand-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {recommended.map((l) => (
              <LessonCard key={l.id} lesson={l} recommendation={l.score} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-base font-bold mb-3">Tất cả bài học</h2>
        <LibraryToolbar
          filter={filter}
          onFilterChange={setFilter}
          view={view}
          onViewChange={setView}
        />

        <div className="mt-4 min-h-[480px]" style={{ contain: "layout" }}>
          {pending.length === 0 ? (
            <EmptyState />
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
              {pending.map((l) => (
                <LessonCard key={l.id} lesson={l} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
              {pending.map((l) => (
                <LessonCard key={l.id} lesson={l} view="list" />
              ))}
            </div>
          )}
        </div>
      </section>

      {completed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Đã hoàn thành</h2>
            <span className="text-sm text-stone-500">{completed.length} bài</span>
          </div>
          {view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
              {completed.slice(0, 12).map((l) => (
                <LessonCard key={l.id} lesson={l} completed />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
              {completed.slice(0, 12).map((l) => (
                <LessonCard key={l.id} lesson={l} completed view="list" />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-sm font-medium transition border",
        active
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white border-stone-200 text-stone-600 hover:border-brand-300 hover:bg-brand-50/40"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
      Không có bài học phù hợp với bộ lọc hiện tại.
    </div>
  );
}
