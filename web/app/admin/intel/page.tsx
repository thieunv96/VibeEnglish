import { db } from "@/db";
import { contentIntelSuggestions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, X } from "lucide-react";

export default async function IntelPage() {
  const list = await db
    .select()
    .from(contentIntelSuggestions)
    .orderBy(desc(contentIntelSuggestions.createdAt));
  const t = await getTranslations("admin.intel");
  const locale = await getLocale();
  const priorityLabel = (p: string) => p === "high" ? t("priorityHigh") : p === "medium" ? t("priorityMedium") : t("priorityLow");

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="size-5 text-brand-600" /> {t("title")}
        </h1>
        <p className="text-sm text-stone-500 mt-1">{t("subtitle")}</p>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-stone-300 text-stone-500">
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((s) => (
            <div key={s.id} className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={s.priority === "high" ? "danger" : s.priority === "medium" ? "warning" : "default"}
                >
                  {priorityLabel(s.priority)}
                </Badge>
                {s.skill && <Badge variant="info">{s.skill}</Badge>}
                {s.level && <Badge variant="outline">{s.level}</Badge>}
                <span className="ml-auto text-xs text-stone-400">{new Date(s.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN")}</span>
              </div>
              <h3 className="font-bold">{s.title}</h3>
              <p className="text-sm text-stone-600">{s.reason}</p>
              {(s.stats.usersStruggling || s.stats.failedSearches || s.stats.userRequests) && (
                <div className="text-xs text-stone-500 grid grid-cols-3 gap-2 pt-2 border-t border-stone-100">
                  {s.stats.usersStruggling !== undefined && (
                    <div><div className="font-semibold text-stone-700">{s.stats.usersStruggling}</div>{t("statUsersStruggling")}</div>
                  )}
                  {s.stats.failedSearches !== undefined && (
                    <div><div className="font-semibold text-stone-700">{s.stats.failedSearches}</div>{t("statFailedSearches")}</div>
                  )}
                  {s.stats.userRequests !== undefined && (
                    <div><div className="font-semibold text-stone-700">{s.stats.userRequests}</div>{t("statUserRequests")}</div>
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline">
                  <X className="size-3.5" /> {t("dismiss")}
                </Button>
                <Button size="sm">
                  <Sparkles className="size-3.5" /> {t("createOutline")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
