"use client";

import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, List } from "lucide-react";
import { LESSON_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type LibraryFilter = "all" | (typeof LESSON_TYPES)[number]["id"];

export function LibraryToolbar({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  view,
  onViewChange,
}: {
  filter: LibraryFilter;
  onFilterChange: (f: LibraryFilter) => void;
  search: string;
  onSearchChange: (s: string) => void;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên bài..."
          className="pl-10"
        />
      </div>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <FilterChip active={filter === "all"} onClick={() => onFilterChange("all")}>
          Tất cả
        </FilterChip>
        {LESSON_TYPES.map((t) => (
          <FilterChip key={t.id} active={filter === t.id} onClick={() => onFilterChange(t.id)}>
            <span className="text-xs">{t.icon}</span> {t.label}
          </FilterChip>
        ))}
        <div className="ml-auto flex items-center bg-stone-100 rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => onViewChange("grid")}
            className={cn(
              "size-8 rounded-md flex items-center justify-center",
              view === "grid" ? "bg-white shadow-sm text-brand-700" : "text-stone-500"
            )}
            title="Lưới"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => onViewChange("list")}
            className={cn(
              "size-8 rounded-md flex items-center justify-center",
              view === "list" ? "bg-white shadow-sm text-brand-700" : "text-stone-500"
            )}
            title="Danh sách"
          >
            <List className="size-4" />
          </button>
        </div>
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
