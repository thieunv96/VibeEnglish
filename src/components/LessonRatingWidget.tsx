"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Stars } from "./Stars";

interface Props {
  lessonId: string;
  initialAvg: number;
  initialCount: number;
  initialYou: number | null;
}

export function LessonRatingWidget({
  lessonId,
  initialAvg,
  initialCount,
  initialYou,
}: Props) {
  const { status } = useSession();
  const t = useTranslations("rating");
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [you, setYou] = useState<number | null>(initialYou);

  async function rate(stars: number) {
    if (status !== "authenticated") {
      toast.info(t("signInToRate"));
      return;
    }
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, stars }),
    });
    if (!res.ok) {
      toast.error(t("saveFailed"));
      return;
    }
    const data = (await res.json()) as { avg: number; count: number; you: number };
    setAvg(data.avg);
    setCount(data.count);
    setYou(data.you);
    toast.success(t("thanks"));
  }

  return (
    <section
      className="rounded-xl border border-border bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3"
      data-testid="lesson-rating"
    >
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{t("title")}</div>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted">
          <Stars value={avg} size={18} testId="lesson-rating-avg" />
          <span>
            <strong className="text-foreground">{avg > 0 ? avg.toFixed(1) : "—"}</strong>
            {" · "}
            {t("count", { n: count })}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-start sm:items-end gap-1">
        <Stars
          value={you ?? 0}
          size={28}
          interactive
          onChange={rate}
          testId="lesson-rating-you"
        />
        {you !== null && (
          <div className="text-xs text-muted">{t("youRated", { stars: you })}</div>
        )}
      </div>
    </section>
  );
}
