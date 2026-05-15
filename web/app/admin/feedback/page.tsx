import { db } from "@/db";
import { feedback, users } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const TYPE: Record<string, { label: string; color: "brand" | "danger" | "warning" | "info" | "default" }> = {
  feature_request: { label: "💡 Feature", color: "brand" },
  ui_bug: { label: "🐛 UI bug", color: "danger" },
  content_feedback: { label: "📚 Nội dung", color: "info" },
  experience_rating: { label: "⭐ Rating", color: "warning" },
  other: { label: "💬 Khác", color: "default" },
};

export default async function FeedbackAdminPage() {
  const list = await db.select().from(feedback).orderBy(desc(feedback.createdAt));
  const userIds = [...new Set(list.map((f) => f.userId).filter(Boolean))] as string[];
  const userMap = userIds.length
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Feedback</h1>
        <p className="text-sm text-stone-500 mt-1">Góp ý từ user về sản phẩm.</p>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-stone-300 text-stone-500">
          Chưa có feedback nào.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((f) => {
            const t = TYPE[f.type];
            const u = userMap.find((x) => x.id === f.userId);
            const lowRating = f.rating != null && f.rating <= 2;
            return (
              <div
                key={f.id}
                className={`rounded-xl border bg-white p-4 ${lowRating ? "border-amber-300 bg-amber-50/40" : "border-stone-200"}`}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={t.color}>{t.label}</Badge>
                  <Badge variant={f.status === "new" ? "warning" : f.status === "resolved" ? "success" : "default"}>
                    {f.status === "new" ? "Mới" : f.status === "resolved" ? "Đã xử lý" : "Đã đọc"}
                  </Badge>
                  {f.rating && (
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`size-3.5 ${n <= f.rating! ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
                        />
                      ))}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-stone-500">
                    {u?.email ?? "Anonymous"} · {new Date(f.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                <p className="text-sm">{f.content}</p>
                {f.contactEmail && f.wantsReply && (
                  <p className="text-xs text-stone-500 mt-2">📧 Muốn nhận phản hồi: {f.contactEmail}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline">Đánh dấu đã đọc</Button>
                  <Button size="sm" variant="success">Đã xử lý</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
