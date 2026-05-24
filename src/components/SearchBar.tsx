"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";

export function SearchBar({ placeholder, openLabel = "Search" }: { placeholder: string; openLabel?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [mobileOpen]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setMobileOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <>
      {/* Desktop inline */}
      <form
        onSubmit={submit}
        className="hidden md:flex flex-1 max-w-md items-center gap-2"
        role="search"
        aria-label="Site search"
        data-testid="searchbar"
      >
        <div className="relative flex-1">
          <SearchIcon />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            data-testid="searchbar-input"
            className="w-full rounded-md border border-border bg-white pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </form>

      {/* Mobile icon trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label={openLabel}
        data-testid="searchbar-mobile-trigger"
        className="md:hidden grid place-items-center h-9 w-9 rounded-md border border-border bg-white hover:bg-surface"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>

      {/* Mobile fullscreen modal */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal
          aria-label={openLabel}
          className="fixed inset-0 z-50 md:hidden bg-black/40"
          onClick={() => setMobileOpen(false)}
          data-testid="searchbar-mobile-modal"
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-4 shadow-lg flex items-center gap-2"
            role="search"
          >
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close"
              className="grid place-items-center h-9 w-9 rounded-md border border-border"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
            <div className="relative flex-1">
              <SearchIcon />
              <input
                type="search"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={placeholder}
                data-testid="searchbar-mobile-input"
                className="w-full rounded-md border border-border bg-white pl-9 pr-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-brand text-white text-sm font-semibold px-3 py-2"
            >
              Go
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
