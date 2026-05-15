import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { db } from "@/db";
import { helpCategories, helpArticles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
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

  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold">Trung tâm hỗ trợ</h1>
          <p className="text-stone-500 mt-1">Tìm câu trả lời nhanh hoặc gửi câu hỏi cho team.</p>
        </header>

        <HelpSearch categories={grouped} />

        <div className="text-center rounded-xl border border-stone-200 bg-white p-6">
          <p className="text-sm text-stone-600">Vẫn không tìm được câu trả lời?</p>
          <Link href="/feedback" className="mt-2 inline-flex text-brand-600 font-medium hover:underline">
            Gửi góp ý cho chúng tôi →
          </Link>
        </div>
      </main>
    </div>
  );
}
