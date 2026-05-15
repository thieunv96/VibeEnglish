import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { db } from "@/db";
import { helpCategories, helpArticles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { HelpSearch } from "./help-search";

export default async function HelpPage() {
  const cats = await db.select().from(helpCategories).orderBy(helpCategories.order);
  const articles = await db
    .select()
    .from(helpArticles)
    .where(eq(helpArticles.status, "published"))
    .orderBy(helpArticles.order);
  const grouped = cats.map((c) => ({
    ...c,
    articles: articles.filter((a) => a.categoryId === c.id),
  }));
  const t = await getTranslations("help");

  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-stone-500 mt-1">{t("subtitle")}</p>
        </header>

        <HelpSearch categories={grouped} />

        <div className="text-center rounded-xl border border-stone-200 bg-white p-6">
          <p className="text-sm text-stone-600">{t("stillNeed")}</p>
          <Link href="/feedback" className="mt-2 inline-flex text-brand-600 font-medium hover:underline">
            {t("stillNeedCta")}
          </Link>
        </div>
      </main>
    </div>
  );
}
