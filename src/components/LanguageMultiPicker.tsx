"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGES, languageByCode } from "@/lib/languages";
import { cn } from "@/lib/cn";

interface Props {
  value: string[];                       // selected ISO codes
  onChange: (codes: string[]) => void;
  labels: {
    placeholder: string;                  // "Pick languages…"
    summary: (n: number) => string;       // "{n} selected"
    search: string;                       // "Search"
    none: string;                         // "No matches"
  };
}

export function LanguageMultiPicker({ value, onChange, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = useMemo(() => new Set(value.map((v) => v.toLowerCase())), [value]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function toggle(code: string) {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    onChange(Array.from(next));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.english.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.code.includes(q),
    );
  }, [query]);

  return (
    <div ref={containerRef} className="relative" data-testid="language-picker">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid="language-picker-trigger"
        className="w-full text-left rounded-md border border-border bg-surface px-3 py-2 flex items-center justify-between"
      >
        <span className={cn(value.length === 0 && "text-muted")}>
          {value.length === 0 ? labels.placeholder : labels.summary(value.length)}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" data-testid="language-picker-chips">
          {value.map((code) => {
            const lang = languageByCode(code);
            if (!lang) return null;
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggle(code)}
                data-testid={`lang-chip-${code}`}
                className="inline-flex items-center gap-1 rounded-full bg-brand text-white px-2.5 py-0.5 text-xs font-medium hover:bg-brand-strong"
                title={`Remove ${lang.english}`}
              >
                <span>{lang.english}</span>
                <span aria-hidden>×</span>
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <div
          role="listbox"
          aria-multiselectable
          data-testid="language-picker-popover"
          className="absolute z-20 mt-2 w-full max-w-sm rounded-xl border border-border bg-white shadow-lg overflow-hidden"
        >
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.search}
            data-testid="language-picker-search"
            className="w-full border-b border-border px-3 py-2 text-sm focus:outline-none"
          />
          <ul className="max-h-64 overflow-y-auto text-sm">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-muted text-center">{labels.none}</li>
            ) : (
              filtered.map((lang) => {
                const on = selected.has(lang.code);
                return (
                  <li key={lang.code}>
                    <label
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-surface",
                        on && "bg-brand-soft/50",
                      )}
                      data-testid={`lang-option-${lang.code}`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(lang.code)}
                        className="accent-emerald-600"
                      />
                      <span className="flex-1">{lang.english}</span>
                      <span className="text-muted text-xs">{lang.name}</span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
