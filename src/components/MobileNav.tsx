"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";

interface Item {
  href: "/lessons" | "/practice" | "/learn-from-youtube" | "/admin" | "/admin/lessons" | "/admin/exercises" | "/admin/analytics";
  label: string;
}

interface Props {
  items: Item[];
  labels: { open: string; close: string; menu: string };
}

export function MobileNav({ items, labels }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        data-testid="mobile-nav-open"
        className="md:hidden grid place-items-center h-9 w-9 rounded-md border border-border bg-white hover:bg-surface"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal
          aria-label={labels.menu}
          className="fixed inset-0 z-50 md:hidden"
          data-testid="mobile-nav-panel"
        >
          <button
            type="button"
            aria-label={labels.close}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <nav className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl flex flex-col" aria-label="Mobile">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-bold">{labels.menu}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={labels.close}
                data-testid="mobile-nav-close"
                className="grid place-items-center h-9 w-9 rounded-md border border-border hover:bg-surface"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>
            <ul className="flex flex-col py-2">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    data-testid={`mobile-nav-link-${item.href.replace(/\//g, "-")}`}
                    className="block px-5 py-3 text-base font-medium hover:bg-surface"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
