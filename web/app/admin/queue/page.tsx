import { db } from "@/db";
import { lessons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { LESSON_TYPES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { QueueRowActions } from "./row-actions";

export default async function QueuePage() {
  const queued = await db
    .select()
    .from(lessons)
    .where(eq(lessons.status, "queued"))
    .orderBy(lessons.createdAt);
  const t = await getTranslations("admin.queue");
  const tTypes = await getTranslations("lessonTypes");
  const locale = await getLocale();

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-stone-500">{t("subtitle")}</p>
        </div>
        <Badge variant="warning">{t("waiting", { n: queued.length })}</Badge>
      </div>

      {queued.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-stone-300">
          <p className="text-stone-500">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queued.map((l) => {
            const lt = LESSON_TYPES.find((x) => x.id === l.type)!;
            return (
              <div key={l.id} className="rounded-xl border border-stone-200 bg-white p-4 flex items-center gap-4">
                <div className={`size-10 rounded-lg flex items-center justify-center text-lg border ${lt.color}`}>
                  {lt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{l.title}</div>
                  <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                    <Badge variant="outline">{l.level}</Badge>
                    <span>{tTypes(lt.id)}</span>
                    <span>· {new Date(l.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN")}</span>
                  </div>
                </div>
                <QueueRowActions id={l.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
