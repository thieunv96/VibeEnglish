"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";

const labels: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  vi: "Tiếng Việt",
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Locale;
    const query = Object.fromEntries(searchParams.entries());
    startTransition(() => {
      router.replace({ pathname, query }, { locale: next });
    });
  }

  return (
    <label className="flex items-center gap-1.5 text-sm text-muted">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" />
      </svg>
      <select
        value={locale}
        onChange={onChange}
        disabled={isPending}
        data-testid="language-switcher"
        aria-label="Language"
        className="bg-transparent text-sm font-medium outline-none cursor-pointer"
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {labels[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
