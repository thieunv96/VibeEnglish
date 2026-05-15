"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { setLocaleAction } from "@/app/(account)/actions";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const choose = (l: "vi" | "en") => {
    if (l === locale) return;
    startTransition(async () => {
      await setLocaleAction(l);
      router.refresh();
    });
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full p-0.5 text-xs font-medium border",
        variant === "light"
          ? "bg-white border-stone-200 text-stone-600"
          : "bg-white/15 border-white/20 text-white backdrop-blur"
      )}
    >
      <Globe className="size-3.5 mx-1.5 opacity-60" />
      {(["vi", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          disabled={pending}
          className={cn(
            "h-6 px-2.5 rounded-full transition uppercase",
            locale === l
              ? variant === "light"
                ? "bg-brand-600 text-white"
                : "bg-white text-brand-700"
              : "hover:bg-stone-100 dark:hover:bg-white/10"
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
