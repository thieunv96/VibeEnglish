"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

interface Item {
  href: string;
  label: string;
}

interface Props {
  items: Item[];
  email?: string | null;
}

/** Same active rule as PrimaryNav — parent links (e.g. `/admin`) only match
 * exactly when sibling items are deeper children (`/admin/lessons` etc.).
 * Leaf items match exact OR deeper child paths. */
function isActive(pathname: string, href: string, allHrefs: string[]): boolean {
  const hasChild = allHrefs.some((other) => other !== href && other.startsWith(`${href}/`));
  if (hasChild) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ items, email }: Props) {
  const pathname = usePathname();
  const hrefs = items.map((i) => i.href);
  return (
    <nav
      className="mb-6 flex flex-wrap items-center gap-4 border-b border-border pb-4"
      aria-label="Admin"
    >
      <span className="text-xs font-bold uppercase tracking-widest text-brand">Admin</span>
      {items.map((l) => {
        const active = isActive(pathname, l.href, hrefs);
        return (
          <Link
            href={l.href as Parameters<typeof Link>[0]["href"]}
            key={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-sm transition-colors",
              active
                ? "text-brand font-semibold border-b-2 border-brand -mb-px pb-1"
                : "font-medium text-foreground hover:text-brand",
            )}
          >
            {l.label}
          </Link>
        );
      })}
      {email && <span className="ml-auto text-xs text-muted">Signed in as {email}</span>}
    </nav>
  );
}
