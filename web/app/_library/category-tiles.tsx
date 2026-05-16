"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CATEGORIES } from "@/lib/categories";
import type { Category, Lesson } from "@/db/schema";
import { cn } from "@/lib/utils";

const VISIBLE_TILES = 12; // top tiles shown on home

export function CategoryTiles({
  categories,
  all,
}: {
  categories: Category[];
  all: Lesson[];
}) {
  const t = useTranslations("home");
  const tCat = useTranslations("categoriesList");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");

  const lessonCountByCategoryId = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of all) {
      if (!l.categoryId) continue;
      map.set(l.categoryId, (map.get(l.categoryId) ?? 0) + 1);
    }
    return map;
  }, [all]);

  const withCount = useMemo(
    () =>
      categories
        .map((c) => ({ ...c, lessonCount: lessonCountByCategoryId.get(c.id) ?? 0 }))
        .filter((c) => c.lessonCount > 0)
        .sort((a, b) => b.lessonCount - a.lessonCount),
    [categories, lessonCountByCategoryId]
  );

  const topTiles = withCount.slice(0, VISIBLE_TILES);

  const categoryIdBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.slug, c.id);
    return map;
  }, [categories]);

  const safeTCat = (slug: string) => {
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

  if (withCount.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-ink-900">
          {t("discover")}
        </h2>
        <Dialog
          open={modalOpen}
          onOpenChange={(o) => {
            setModalOpen(o);
            if (!o) setModalSearch("");
          }}
        >
          <DialogTrigger asChild>
            <button className="text-sm font-semibold text-brand-700 hover:underline shrink-0">
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
                className="w-full h-10 pl-10 pr-3 rounded-md border border-ink-200 bg-white text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700"
              />
            </div>
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              {modalEntries.length === 0 ? (
                <p className="text-center text-sm text-ink-500 py-8">{t("categoryNoMatch")}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {modalEntries.map((e) => {
                    const hasLessons = e.lessonCount > 0;
                    const href = hasLessons && e.dbId ? `/?cat=${e.dbId}#all` : "#";
                    return (
                      <Link
                        key={e.slug}
                        data-slug={e.slug}
                        href={href}
                        onClick={(ev) => {
                          if (!hasLessons) ev.preventDefault();
                          else {
                            setModalOpen(false);
                            setModalSearch("");
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition",
                          hasLessons
                            ? "border-ink-200 bg-white hover:border-brand-700 hover:bg-brand-50/40 text-ink-800"
                            : "border-ink-100 bg-ink-50 text-ink-400 cursor-not-allowed pointer-events-none"
                        )}
                      >
                        <span className="text-base shrink-0">{e.icon}</span>
                        <span className="flex-1 truncate">{e.name}</span>
                        {hasLessons ? (
                          <span className="text-xs font-medium text-brand-700 shrink-0">
                            {e.lessonCount}
                          </span>
                        ) : (
                          <span className="text-[10px] text-ink-400 shrink-0">
                            {t("categoryNoLessons")}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tile grid — Coursera-style "Browse" tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {topTiles.map((c) => (
          <Link
            key={c.id}
            href={`/?cat=${c.id}#all`}
            className="card-lift group flex items-center gap-3 rounded-md border border-ink-200 bg-white p-4 hover:border-brand-700"
          >
            <span className="size-10 rounded-md bg-brand-50 text-2xl flex items-center justify-center shrink-0">
              {c.icon || "📚"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-ink-900 truncate group-hover:text-brand-700">
                {safeTCat(c.slug)}
              </div>
              <div className="text-xs text-ink-500">
                {t("categoryWithLessons", { n: c.lessonCount })}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
