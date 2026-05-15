"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Film,
  Brain,
  Flag,
  MessageSquare,
  BarChart3,
  HelpCircle,
  Users,
  Settings,
  Megaphone,
  Cog,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon map — passed as string from the server component to avoid sending
// function components across the RSC boundary.
const ICONS = {
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Film,
  Brain,
  Flag,
  MessageSquare,
  BarChart3,
  HelpCircle,
  Users,
  Settings,
  Megaphone,
  Cog,
  FolderOpen,
} as const;
export type IconName = keyof typeof ICONS;

export type SidebarItem = {
  href: string;
  label: string;
  icon?: IconName;
  badge?: { count: number; color: "red" | "amber" };
};

export type SidebarGroup = {
  id: string;
  label: string;
  icon: IconName;
  items: SidebarItem[];
};

export function SidebarNav({ groups }: { groups: SidebarGroup[] }) {
  const pathname = usePathname();
  const initialOpen = new Set(
    groups
      .filter((g) => g.items.some((it) => pathname === it.href || pathname.startsWith(it.href + "/")))
      .map((g) => g.id)
  );
  const [open, setOpen] = useState<Set<string>>(initialOpen);

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <nav className="px-2 py-3 space-y-1 text-sm scrollbar-thin">
      {groups.map((g) => {
        const Icon = ICONS[g.icon];
        const isOpen = open.has(g.id);
        const totalBadge = g.items.reduce((sum, it) => sum + (it.badge?.count ?? 0), 0);
        const groupHasRed = g.items.some((it) => it.badge?.color === "red");
        return (
          <div key={g.id}>
            <button
              type="button"
              onClick={() => toggle(g.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-stone-300 hover:bg-stone-800 hover:text-white transition uppercase text-xs font-semibold tracking-wide"
              aria-expanded={isOpen}
            >
              <Icon className="size-4 text-stone-400" />
              <span className="flex-1 text-left">{g.label}</span>
              {totalBadge > 0 && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-px rounded-full font-medium",
                    groupHasRed ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                  )}
                >
                  {totalBadge}
                </span>
              )}
              <ChevronDown className={cn("size-3.5 text-stone-500 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div className="mt-0.5 pl-3 space-y-0.5">
                {g.items.map((it) => {
                  const ItemIcon = it.icon ? ICONS[it.icon] : null;
                  const active = pathname === it.href || (it.href !== "/admin" && pathname.startsWith(it.href + "/"));
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={cn(
                        "flex items-center gap-2.5 pl-4 pr-3 py-1.5 rounded-md transition relative",
                        active ? "bg-brand-600/20 text-white" : "text-stone-300 hover:bg-stone-800 hover:text-white"
                      )}
                    >
                      {ItemIcon && <ItemIcon className="size-3.5 text-stone-400" />}
                      <span className="flex-1 truncate">{it.label}</span>
                      {it.badge && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-px rounded-full font-medium",
                            it.badge.color === "red" ? "bg-red-500 text-white" : "bg-amber-500 text-white"
                          )}
                        >
                          {it.badge.count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
