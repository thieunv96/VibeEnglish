"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Search, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HelpCategory, HelpArticle } from "@/db/schema";

type CategoryWithArticles = HelpCategory & { articles: HelpArticle[] };

export function HelpSearch({ categories }: { categories: CategoryWithArticles[] }) {
  const t = useTranslations("help");
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(categories[0]?.id ?? null);

  const filtered = useMemo(() => {
    if (!q.trim()) return null;
    const needle = q.toLowerCase();
    return categories
      .flatMap((c) => c.articles.map((a) => ({ ...a, category: c.title })))
      .filter((a) => a.title.toLowerCase().includes(needle) || a.body.toLowerCase().includes(needle))
      .slice(0, 20);
  }, [q, categories]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search")}
          className="pl-10 h-12 text-base"
        />
      </div>

      {filtered ? (
        <div>
          <h3 className="text-sm text-stone-500 mb-3">
            {t("resultsFor", { n: filtered.length, q })}
          </h3>
          {filtered.length === 0 ? (
            <p className="text-sm text-stone-500 text-center py-8">
              {t("noResults")}
            </p>
          ) : (
            <Accordion type="single" collapsible className="bg-white rounded-xl border border-stone-200 px-4">
              {filtered.map((a) => (
                <AccordionItem key={a.id} value={a.id}>
                  <AccordionTrigger>
                    <div className="text-left">
                      <div className="text-xs text-brand-600 mb-0.5">{a.category}</div>
                      {a.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ArticleBody article={a} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={cn(
                  "rounded-xl border-2 p-3 text-left transition flex items-center gap-2",
                  activeCat === c.id ? "border-brand-500 bg-brand-50" : "border-stone-200 bg-white hover:border-stone-300"
                )}
              >
                <span className="text-xl">{c.icon}</span>
                <span className="text-sm font-medium">{c.title}</span>
              </button>
            ))}
          </div>

          {activeCat &&
            (() => {
              const cat = categories.find((c) => c.id === activeCat);
              if (!cat) return null;
              return (
                <Accordion type="single" collapsible className="bg-white rounded-xl border border-stone-200 px-4">
                  {cat.articles.length === 0 && (
                    <p className="text-sm text-stone-500 py-6 text-center">{t("noArticles")}</p>
                  )}
                  {cat.articles.map((a) => (
                    <AccordionItem key={a.id} value={a.id}>
                      <AccordionTrigger>{a.title}</AccordionTrigger>
                      <AccordionContent>
                        <ArticleBody article={a} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              );
            })()}
        </>
      )}
    </div>
  );
}

function ArticleBody({ article }: { article: HelpArticle }) {
  const t = useTranslations("help");
  return (
    <div className="space-y-3">
      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-stone-700">{article.body}</div>
      <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
        <span className="text-xs text-stone-500">{t("usefulQuestion")}</span>
        <button className="rounded-full bg-stone-100 hover:bg-emerald-100 hover:text-emerald-700 transition px-3 py-1 text-xs flex items-center gap-1">
          <ThumbsUp className="size-3" /> {article.helpfulCount}
        </button>
        <button className="rounded-full bg-stone-100 hover:bg-red-100 hover:text-red-700 transition px-3 py-1 text-xs flex items-center gap-1">
          <ThumbsDown className="size-3" /> {article.unhelpfulCount}
        </button>
      </div>
    </div>
  );
}
