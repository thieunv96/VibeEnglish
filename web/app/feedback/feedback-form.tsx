"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { submitFeedback } from "./actions";
import { Star, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES = [
  { id: "feature_request", icon: "💡", labelKey: "typeFeature" },
  { id: "ui_bug", icon: "🐛", labelKey: "typeUiBug" },
  { id: "content_feedback", icon: "📚", labelKey: "typeContent" },
  { id: "experience_rating", icon: "⭐", labelKey: "typeRating" },
  { id: "other", icon: "💬", labelKey: "typeOther" },
] as const;

export function FeedbackForm({ defaultEmail }: { defaultEmail: string }) {
  const t = useTranslations("feedback");
  const [type, setType] = useState<(typeof TYPES)[number]["id"]>("feature_request");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [wantsReply, setWantsReply] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (content.length < 5) {
      setError(t("errorShort"));
      return;
    }
    startTransition(async () => {
      const r = await submitFeedback({
        type,
        content,
        rating: type === "experience_rating" ? rating : null,
        wantsReply,
        contactEmail: wantsReply ? email : null,
      });
      if (r.ok) {
        setSubmitted(true);
      } else {
        setError(r.error || "Gửi không thành công");
      }
    });
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="size-14 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center mb-3">
          <Check className="size-7" />
        </div>
        <h2 className="text-lg font-bold text-emerald-900 mb-1">{t("thankTitle")}</h2>
        <p className="text-sm text-emerald-700">{t("thankBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">{t("typeLabel")}</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setType(opt.id)}
              className={cn(
                "px-3.5 py-2 rounded-full border-2 text-sm transition flex items-center gap-1.5",
                type === opt.id
                  ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              )}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {type === "experience_rating" && (
        <div>
          <label className="text-sm font-medium mb-2 block">{t("overallRating")}</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => setRating(n)}
                className="p-1"
              >
                <Star
                  className={cn(
                    "size-8 transition",
                    (hoverRating ?? rating ?? 0) >= n
                      ? "fill-amber-400 text-amber-400"
                      : "text-stone-300"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium mb-2 block">{t("contentLabel")}</label>
        <Textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("contentPlaceholder")}
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <Checkbox
            checked={wantsReply}
            onCheckedChange={(c) => setWantsReply(c === true)}
            className="mt-0.5"
          />
          <div>
            <div className="text-sm font-medium">{t("wantReply")}</div>
            <div className="text-xs text-stone-500">{t("wantReplyHint")}</div>
          </div>
        </label>
        {wantsReply && (
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            required={wantsReply}
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />} {t("submit")}
      </Button>
    </form>
  );
}
