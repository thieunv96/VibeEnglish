import { db } from "@/db";
import { feedback, users } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const TYPE_COLOR: Record<string, "brand" | "danger" | "warning" | "info" | "default"> = {
  feature_request: "brand",
  ui_bug: "danger",
  content_feedback: "info",
  experience_rating: "warning",
  other: "default",
};
const TYPE_KEY: Record<string, string> = {
  feature_request: "typeFeature",
  ui_bug: "typeUiBug",
  content_feedback: "typeContent",
  experience_rating: "typeRating",
  other: "typeOther",
};

export default async function FeedbackAdminPage() {
  const list = await db.select().from(feedback).orderBy(desc(feedback.createdAt));
  const userIds = [...new Set(list.map((f) => f.userId).filter(Boolean))] as string[];
  const userMap = userIds.length
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  const t = await getTranslations("admin.feedback");
  const locale = await getLocale();

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-stone-500 mt-1">{t("subtitle")}</p>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-stone-300 text-stone-500">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((f) => {
            const u = userMap.find((x) => x.id === f.userId);
            const lowRating = f.rating != null && f.rating <= 2;
            return (
              <div
                key={f.id}
                className={`rounded-xl border bg-white p-4 ${lowRating ? "border-amber-300 bg-amber-50/40" : "border-stone-200"}`}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant={TYPE_COLOR[f.type]}>{t(TYPE_KEY[f.type])}</Badge>
                  <Badge variant={f.status === "new" ? "warning" : f.status === "resolved" ? "success" : "default"}>
                    {f.status === "new" ? t("statusNew") : f.status === "resolved" ? t("statusResolved") : t("statusRead")}
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
                    {u?.email ?? t("anonymous")} · {new Date(f.createdAt).toLocaleString(locale === "en" ? "en-US" : "vi-VN")}
                  </span>
                </div>
                <p className="text-sm">{f.content}</p>
                {f.contactEmail && f.wantsReply && (
                  <p className="text-xs text-stone-500 mt-2">📧 {t("wantReply")} {f.contactEmail}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline">{t("markRead")}</Button>
                  <Button size="sm" variant="success">{t("markResolved")}</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
