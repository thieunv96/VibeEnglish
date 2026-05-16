import { db } from "@/db";
import { categories, lessons } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/categories";

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
  const tCat = await getTranslations("categoriesList");

  // Build display rows ordered by master CATEGORIES list (stable canonical order)
  const dbBySlug = new Map(rows.map((r) => [r.slug, r] as const));
  const items = CATEGORIES.map((c) => {
    const dbRow = dbBySlug.get(c.slug);
    return {
      slug: c.slug,
      icon: c.icon,
      name: tCat(c.slug),
      lessonCount: dbRow ? countMap[dbRow.id] ?? 0 : 0,
      inDb: !!dbRow,
    };
  });
  const totalCount = items.length;
  const withLessons = items.filter((i) => i.lessonCount > 0).length;
  const withoutLessons = totalCount - withLessons;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-stone-500 mt-1 max-w-3xl">{t("subtitle")}</p>
        <div className="mt-4 flex gap-2 text-xs">
          <span className="rounded-md bg-stone-100 px-2 py-1 text-stone-700">
            {t("totalLabel")}: <strong>{totalCount}</strong>
          </span>
          <span className="rounded-md bg-brand-50 px-2 py-1 text-brand-700">
            {t("withLessonsLabel")}: <strong>{withLessons}</strong>
          </span>
          <span className="rounded-md bg-stone-50 px-2 py-1 text-stone-500">
            {t("withoutLessonsLabel")}: <strong>{withoutLessons}</strong>
          </span>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
          {t("empty")}
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-xs uppercase text-stone-500">
              <tr>
                <th className="text-left px-4 py-3 w-16">{t("headerIcon")}</th>
                <th className="text-left px-4 py-3">{t("headerSlug")}</th>
                <th className="text-left px-4 py-3">{t("headerName")}</th>
                <th className="text-right px-4 py-3 w-32">{t("headerLessons")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((c) => (
                <tr key={c.slug} className="hover:bg-stone-50/50">
                  <td className="px-4 py-2.5 text-2xl">{c.icon}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-stone-500">{c.slug}</td>
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="px-4 py-2.5 text-right">
                    {c.lessonCount > 0 ? (
                      <Badge>{c.lessonCount}</Badge>
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
