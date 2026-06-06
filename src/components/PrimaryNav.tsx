"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

interface Item {
  href: string;
  label: string;
}

interface Props {
  items: Item[];
  className?: string;
}

/** Highlight rule:
 *  - If another item is a deeper child of this href (e.g. `/admin/lessons` is a
 *    child of `/admin`), only match the pathname exactly — otherwise the parent
 *    item would light up on every child page.
 *  - Otherwise, match exact OR any deeper sub-route, so `/lessons/foo` keeps the
 *    `/lessons` link highlighted. */
function isActive(pathname: string, href: string, allHrefs: string[]): boolean {
  const hasChild = allHrefs.some((other) => other !== href && other.startsWith(`${href}/`));
  if (hasChild) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNav({ items, className }: Props) {
  const pathname = usePathname();
  const hrefs = items.map((i) => i.href);
  return (
    <nav
      className={cn("hidden md:flex items-center gap-5 text-sm font-medium", className)}
      aria-label="Primary"
    >
      {items.map((l) => {
        const active = isActive(pathname, l.href, hrefs);
        return (
          <Link
            // Cast: items come from the strict Header href-union; PrimaryNav stays
            // generic so it can be reused if more links are added later.
            href={l.href as Parameters<typeof Link>[0]["href"]}
            key={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "transition-colors",
              active
                ? "text-brand font-semibold"
                : "text-foreground hover:text-brand",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
