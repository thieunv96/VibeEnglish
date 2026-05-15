import { db } from "@/db";
import { categories, lessons } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { CategoriesAdmin } from "./categories-admin";

export default async function CategoriesPage() {
  const rows = await db.select().from(categories).orderBy(categories.order);
  const counts = await db
    .select({ id: lessons.categoryId, c: sql<number>`count(*)` })
    .from(lessons)
    .where(eq(lessons.status, "published"))
    .groupBy(lessons.categoryId);
  const countMap: Record<string, number> = {};
  for (const r of counts) if (r.id) countMap[r.id] = Number(r.c);
  const t = await getTranslations("admin.categories");
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-stone-500 mt-1">{t("subtitle")}</p>
      </header>
      <CategoriesAdmin items={rows.map((r) => ({ ...r, lessonCount: countMap[r.id] ?? 0 }))} />
    </div>
  );
}
