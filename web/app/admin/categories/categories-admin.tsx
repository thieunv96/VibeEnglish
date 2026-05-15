"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { createCategoryAction, deleteCategoryAction } from "./actions";
import type { Category } from "@/db/schema";

type Row = Category & { lessonCount: number };

export function CategoriesAdmin({ items }: { items: Row[] }) {
  const t = useTranslations("admin.categories");
  const tCommon = useTranslations("common");
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onCreate = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createCategoryAction({
        slug: String(formData.get("slug") ?? ""),
        title: String(formData.get("title") ?? ""),
        icon: String(formData.get("icon") ?? ""),
        description: String(formData.get("description") ?? ""),
        order: Number(formData.get("order") ?? 0),
      });
      if (result.ok) {
        setAdding(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const onDelete = (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      await deleteCategoryAction(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="size-4" /> {t("addBtn")}
        </Button>
      </div>

      {adding && (
        <form
          action={onCreate}
          className="rounded-xl border border-stone-200 bg-white p-5 space-y-3"
        >
          <h3 className="font-bold text-sm">{t("newTitle")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="slug">{t("slug")}</Label>
              <Input id="slug" name="slug" required placeholder={t("slugPlaceholder")} pattern="[a-z0-9-]+" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title">{t("displayName")}</Label>
              <Input id="title" name="title" required placeholder={t("displayPlaceholder")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="icon">{t("iconLabel")}</Label>
              <Input id="icon" name="icon" placeholder="🍜" maxLength={4} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order">{t("orderLabel")}</Label>
              <Input id="order" name="order" type="number" defaultValue={items.length} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("descLabel")}</Label>
            <Textarea id="description" name="description" rows={2} placeholder={t("descPlaceholder")} />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAdding(false)}>{tCommon("cancel")}</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />} {tCommon("save")}
            </Button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center text-stone-500">
          {t("empty")}
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-xs uppercase text-stone-500">
              <tr>
                <th className="text-left px-4 py-3">{t("headerIcon")}</th>
                <th className="text-left px-4 py-3">{t("slug")}</th>
                <th className="text-left px-4 py-3">{t("headerName")}</th>
                <th className="text-left px-4 py-3">{t("headerDesc")}</th>
                <th className="text-right px-4 py-3">{t("headerLessons")}</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50/50">
                  <td className="px-4 py-3 text-2xl">{c.icon || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">{c.slug}</td>
                  <td className="px-4 py-3 font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs max-w-md">
                    <span className="line-clamp-1">{c.description || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="outline">{c.lessonCount}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(c.id)}
                      disabled={pending}
                      title={tCommon("delete")}
                    >
                      <Trash2 className="size-3.5 text-red-500" />
                    </Button>
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
