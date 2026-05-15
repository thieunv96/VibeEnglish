"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { rateAttemptAction } from "./actions";

export function RatingCard({ attemptId, initialRating }: { attemptId: string; initialRating: number | null }) {
  const t = useTranslations("lesson.result");
  const [rating, setRating] = useState<number | null>(initialRating);
  const [hover, setHover] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(initialRating != null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const choose = (n: number) => {
    setRating(n);
    startTransition(async () => {
      const r = await rateAttemptAction({ attemptId, rating: n });
      if (r.ok) {
        setSubmitted(true);
        router.refresh();
      }
    });
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 text-center">
      <h3 className="font-bold mb-1">
        {submitted ? t("rateThank") : t("rateTitle")}
      </h3>
      <p className="text-xs text-stone-500 mb-3">
        {submitted ? t("rateThankHint") : t("rateHint")}
      </p>
      <div className="flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const showFilled = (hover ?? rating ?? 0) >= n;
          return (
            <button
              key={n}
              type="button"
              disabled={pending}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              onClick={() => choose(n)}
              className="p-1 transition disabled:opacity-50"
              aria-label={t("starsLabel", { n })}
            >
              <Star
                className={cn(
                  "size-7 transition",
                  showFilled ? "fill-amber-400 text-amber-400" : "text-stone-300"
                )}
              />
            </button>
          );
        })}
      </div>
      {submitted && rating && (
        <p className="text-xs text-stone-500 mt-2">{t("rateStars", { n: rating })}</p>
      )}
    </div>
  );
}
