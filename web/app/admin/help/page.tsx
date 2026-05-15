import { db } from "@/db";
import { helpCategories, helpArticles } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ThumbsUp, ThumbsDown } from "lucide-react";

export default async function HelpAdminPage() {
  const cats = await db.select().from(helpCategories).orderBy(helpCategories.order);
  const articles = await db.select().from(helpArticles).orderBy(helpArticles.order);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Help Content</h1>
          <p className="text-sm text-stone-500 mt-1">Quản lý FAQ và hướng dẫn cho user.</p>
        </div>
        <Button>
          <Plus className="size-4" /> Thêm article
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        <aside className="rounded-xl border border-stone-200 bg-white p-3">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2 px-1">Categories</div>
          <ul className="space-y-0.5">
            {cats.map((c) => {
              const count = articles.filter((a) => a.categoryId === c.id).length;
              return (
                <li key={c.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-stone-50 cursor-pointer">
                  <span>{c.icon}</span>
                  <span className="text-sm flex-1">{c.title}</span>
                  <span className="text-xs text-stone-400">{count}</span>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
          {articles.length === 0 && (
            <div className="p-8 text-center text-stone-500 text-sm">Chưa có article nào.</div>
          )}
          {articles.map((a) => {
            const cat = cats.find((c) => c.id === a.categoryId);
            const helpfulRate = a.helpfulCount + a.unhelpfulCount > 0
              ? Math.round((a.helpfulCount / (a.helpfulCount + a.unhelpfulCount)) * 100)
              : null;
            const flag = a.unhelpfulCount > a.helpfulCount && a.unhelpfulCount >= 3;
            return (
              <div key={a.id} className={`p-4 ${flag ? "bg-amber-50/50" : ""}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{cat?.title}</Badge>
                  <Badge variant={a.status === "published" ? "success" : "default"}>{a.status}</Badge>
                  {flag && <Badge variant="warning">Cần cải thiện</Badge>}
                </div>
                <h3 className="font-semibold">{a.title}</h3>
                <p className="text-sm text-stone-500 line-clamp-2 mt-1">{a.body}</p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <ThumbsUp className="size-3" /> {a.helpfulCount}
                  </span>
                  <span className="flex items-center gap-1 text-red-700">
                    <ThumbsDown className="size-3" /> {a.unhelpfulCount}
                  </span>
                  {helpfulRate !== null && (
                    <span className="text-stone-500">Helpful: {helpfulRate}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
