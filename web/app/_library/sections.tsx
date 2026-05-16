"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { LessonCard } from "@/components/lesson-card";
import { LibraryToolbar, type LibraryFilter } from "./toolbar";
import type { Lesson, Category } from "@/db/schema";
import { Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, getCategoryIcon } from "@/lib/categories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type LessonWithScore = Lesson & { score?: number };
type CompletedLesson = Lesson & { score: number | null; completedAt: Date | null };

const MAX_VISIBLE_CHIPS = 12;

export function LibrarySections({
  all,
  recommended,
  completed,
  categories,
  initialSearch = "",
  initialCategory = "all",
  hideTopChips = false,
  hideRecommended = false,
  useCarouselSizing = false,
  maxLessons,
  categoryMap,
}: {
  all: Lesson[];
  recommended: LessonWithScore[];
  completed: CompletedLesson[];
  categories: Category[];
  initialSearch?: string;
  initialCategory?: string | "all";
  hideTopChips?: boolean;
  hideRecommended?: boolean;
  /** When true, the "All lessons" grid uses the same card width as the carousel rows (4-col grid). */
  useCarouselSizing?: boolean;
  /** Optional cap on the number of lessons rendered in the "All lessons" grid. */
  maxLessons?: number;
  /** Map id → category, used by LessonCard to render the partner row. */
  categoryMap?: Map<string, Category>;
}) {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("categoriesList");
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<string | "all">(initialCategory);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  // Count lessons per category id (for "with lessons" filter + sort)
  const lessonCountByCategoryId = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of all) {
      if (!l.categoryId) continue;
      map.set(l.categoryId, (map.get(l.categoryId) ?? 0) + 1);
    }
    return map;
  }, [all]);

  // Categories that have at least 1 lesson — sorted by lesson count desc
  const visibleCategories = useMemo(() => {
    const withLessons = categories
      .map((c) => ({ ...c, lessonCount: lessonCountByCategoryId.get(c.id) ?? 0 }))
      .filter((c) => c.lessonCount > 0)
      .sort((a, b) => b.lessonCount - a.lessonCount);
    return withLessons;
  }, [categories, lessonCountByCategoryId]);

  const topChips = visibleCategories.slice(0, MAX_VISIBLE_CHIPS);

  // Build the master modal list (all 178 from CATEGORIES, augmented with lesson count + DB id when available)
  const categoryIdBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.slug, c.id);
    return map;
  }, [categories]);

  const safeTCat = (slug: string) => {
    // Fallback: if translation key missing, return slug (shouldn't happen since we keep parity)
    try {
      return tCat(slug);
    } catch {
      return slug;
    }
  };

  const modalEntries = useMemo(() => {
    const q = modalSearch.trim().toLowerCase();
    const entries = CATEGORIES.map((c) => {
      const dbId = categoryIdBySlug.get(c.slug);
      return {
        slug: c.slug,
        icon: c.icon,
        name: safeTCat(c.slug),
        dbId,
        lessonCount: dbId ? lessonCountByCategoryId.get(dbId) ?? 0 : 0,
      };
    });
    if (!q) return entries;
    return entries.filter((e) => e.name.toLowerCase().includes(q) || e.slug.includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalSearch, categoryIdBySlug, lessonCountByCategoryId]);

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
  const capped = typeof maxLessons === "number" ? pending.slice(0, maxLessons) : pending;

  // Resolve category info per lesson (for the LessonCard partner row)
  const renderCard = (l: Lesson, opts?: { completed?: boolean; view?: "grid" | "list" }) => {
    const cat = l.categoryId ? categoryMap?.get(l.categoryId) : undefined;
    let catName: string | undefined;
    if (cat) {
      try {
        catName = tCat(cat.slug);
      } catch {
        catName = cat.title;
      }
    }
    return (
      <LessonCard
        key={l.id}
        lesson={l}
        completed={opts?.completed}
        view={opts?.view}
        category={cat ?? null}
        categoryName={catName}
      />
    );
  };

  return (
    <>
      {/* Categories chip row */}
      {!hideTopChips && visibleCategories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-ink-900">{t("discover")}</h2>
            <Dialog open={modalOpen} onOpenChange={(o) => { setModalOpen(o); if (!o) setModalSearch(""); }}>
              <DialogTrigger asChild>
                <button className="text-sm text-brand-700 hover:underline font-medium">
                  {t("viewAllCategories", { n: CATEGORIES.length })}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>{t("categoryModalTitle")}</DialogTitle>
                  <DialogDescription>
                    {t("categoryModalSubtitle", { n: CATEGORIES.length })}
                  </DialogDescription>
                </DialogHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
                  <input
                    autoFocus
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder={t("categorySearchPlaceholder")}
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-ink-200 bg-white text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400"
                  />
                </div>
                <div className="flex-1 overflow-y-auto -mx-6 px-6">
                  {modalEntries.length === 0 ? (
                    <p className="text-center text-sm text-ink-500 py-8">
                      {t("categoryNoMatch")}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {modalEntries.map((e) => {
                        const hasLessons = e.lessonCount > 0;
                        return (
                          <button
                            key={e.slug}
                            data-slug={e.slug}
                            disabled={!hasLessons}
                            onClick={() => {
                              if (e.dbId) setCategory(e.dbId);
                              setModalOpen(false);
                              setModalSearch("");
                            }}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                              hasLessons
                                ? "border-ink-200 bg-white hover:border-brand-700 hover:bg-brand-50/40 text-ink-800"
                                : "border-ink-100 bg-ink-50 text-ink-400 cursor-not-allowed"
                            )}
                          >
                            <span className="text-base shrink-0">{e.icon}</span>
                            <span className="flex-1 truncate">{e.name}</span>
                            {hasLessons ? (
                              <span className="text-xs font-medium text-brand-600 shrink-0">
                                {e.lessonCount}
                              </span>
                            ) : (
                              <span className="text-[10px] text-ink-400 shrink-0">
                                {t("categoryNoLessons")}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-2">
            <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>
              {tCommon("all")}
            </CategoryChip>
            {topChips.map((c) => (
              <CategoryChip
                key={c.id}
                active={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                <span className="text-base">{c.icon || getCategoryIcon(c.slug)}</span>{" "}
                {safeTCat(c.slug)}
              </CategoryChip>
            ))}
          </div>
        </section>
      )}

      {/* Recommended */}
      {!hideRecommended && recommended.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2 text-ink-900">
              <Sparkles className="size-5 text-brand-700" /> {t("recommended")}
            </h2>
            <button className="text-sm text-brand-700 hover:underline">{t("viewAll")}</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {recommended.map((l) => (
              <LessonCard key={l.id} lesson={l} recommendation={l.score} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-ink-900 mb-4">{t("allLessons")}</h2>
        {!useCarouselSizing && (
          <LibraryToolbar
            filter={filter}
            onFilterChange={setFilter}
            view={view}
            onViewChange={setView}
          />
        )}

        <div
          className={useCarouselSizing ? "mt-4" : "mt-4 min-h-[480px]"}
          style={useCarouselSizing ? undefined : { contain: "layout" }}
        >
          {capped.length === 0 ? (
            <EmptyState />
          ) : useCarouselSizing ? (
            // Carousel-sized grid: same card width as the rows above (~300px), capped at 4 cards
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {capped.map((l) => renderCard(l))}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
              {capped.map((l) => renderCard(l))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
              {capped.map((l) => renderCard(l, { view: "list" }))}
            </div>
          )}
        </div>
      </section>

      {completed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-ink-900">{t("completed")}</h2>
            <span className="text-sm text-ink-500">{t("completedCount", { n: completed.length })}</span>
          </div>
          {useCarouselSizing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {completed.slice(0, 4).map((l) => renderCard(l, { completed: true }))}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
              {completed.slice(0, 12).map((l) => renderCard(l, { completed: true }))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
              {completed.slice(0, 12).map((l) => renderCard(l, { completed: true, view: "list" }))}
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
          ? "bg-brand-700 text-white border-brand-700"
          : "bg-white border-ink-200 text-stone-600 hover:border-brand-700 hover:bg-brand-50/40"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  const t = useTranslations("home");
  return (
    <div className="rounded-xl border border-dashed border-ink-300 p-12 text-center text-ink-500">
      {t("empty")}
    </div>
  );
}
