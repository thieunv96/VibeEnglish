"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { submitFeedback } from "./actions";
import { Star, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPES = [
  { id: "feature_request", icon: "💡", label: "Đề xuất tính năng" },
  { id: "ui_bug", icon: "🐛", label: "Báo lỗi giao diện" },
  { id: "content_feedback", icon: "📚", label: "Góp ý nội dung học" },
  { id: "experience_rating", icon: "⭐", label: "Đánh giá trải nghiệm" },
  { id: "other", icon: "💬", label: "Khác" },
] as const;

export function FeedbackForm({ defaultEmail }: { defaultEmail: string }) {
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
      setError("Vui lòng nhập ít nhất vài câu mô tả.");
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
        <h2 className="text-lg font-bold text-emerald-900 mb-1">Cảm ơn bạn!</h2>
        <p className="text-sm text-emerald-700">
          Góp ý của bạn giúp Vibe English tốt hơn mỗi ngày. Chúng tôi đã ghi nhận.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Loại góp ý</label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={cn(
                "px-3.5 py-2 rounded-full border-2 text-sm transition flex items-center gap-1.5",
                type === t.id
                  ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              )}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {type === "experience_rating" && (
        <div>
          <label className="text-sm font-medium mb-2 block">Đánh giá tổng thể</label>
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
        <label className="text-sm font-medium mb-2 block">Nội dung</label>
        <Textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Chia sẻ chi tiết để team hiểu rõ hơn..."
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
            <div className="text-sm font-medium">Muốn nhận phản hồi từ team</div>
            <div className="text-xs text-stone-500">Chúng tôi sẽ liên hệ qua email khi cần thêm thông tin.</div>
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
        {pending && <Loader2 className="size-4 animate-spin" />} Gửi góp ý
      </Button>
    </form>
  );
}
