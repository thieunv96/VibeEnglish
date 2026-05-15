"use client";

import { useTranslations } from "next-intl";
import { LayoutGrid, List } from "lucide-react";
import { LESSON_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type LibraryFilter = "all" | (typeof LESSON_TYPES)[number]["id"];

export function LibraryToolbar({
  filter,
  onFilterChange,
  view,
  onViewChange,
}: {
  filter: LibraryFilter;
  onFilterChange: (f: LibraryFilter) => void;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
}) {
  const tCommon = useTranslations("common");
  const tTypes = useTranslations("lessonTypes");
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
      <FilterChip active={filter === "all"} onClick={() => onFilterChange("all")}>
        {tCommon("all")}
      </FilterChip>
      {LESSON_TYPES.map((t) => (
        <FilterChip key={t.id} active={filter === t.id} onClick={() => onFilterChange(t.id)}>
          <span className="text-xs">{t.icon}</span> {tTypes(t.id)}
        </FilterChip>
      ))}
      <div className="ml-auto flex items-center bg-stone-100 rounded-lg p-0.5 shrink-0">
        <button
          onClick={() => onViewChange("grid")}
          className={cn(
            "size-8 rounded-md flex items-center justify-center",
            view === "grid" ? "bg-white shadow-sm text-brand-700" : "text-stone-500"
          )}
          title="Grid"
        >
          <LayoutGrid className="size-4" />
        </button>
        <button
          onClick={() => onViewChange("list")}
          className={cn(
            "size-8 rounded-md flex items-center justify-center",
            view === "list" ? "bg-white shadow-sm text-brand-700" : "text-stone-500"
          )}
          title="List"
        >
          <List className="size-4" />
        </button>
      </div>
    </div>
  );
}

function FilterChip({
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
        "h-9 px-3 rounded-full text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap shrink-0",
        active
          ? "bg-brand-600 text-white"
          : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
      )}
    >
      {children}
    </button>
  );
}
