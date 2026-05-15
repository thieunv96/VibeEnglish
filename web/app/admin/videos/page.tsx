import { db } from "@/db";
import { videos } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Film, RefreshCw } from "lucide-react";
import { formatDuration } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "default" | "warning" | "info" | "success" | "danger"> = {
  pending: "default",
  processing: "info",
  indexed: "success",
  error: "danger",
};

export default async function VideosPage() {
  const list = await db.select().from(videos).orderBy(desc(videos.createdAt));
  const t = await getTranslations("admin.videos");
  const tItems = await getTranslations("admin.items");
  const locale = await getLocale();
  const statusKey = (s: string) =>
    s === "pending" ? "statusPending" : s === "processing" ? "statusProcessing" : s === "indexed" ? "statusIndexed" : "statusError";
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-6">{tItems("videos")}</h1>
      {list.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-stone-300 text-stone-500">
          {t("empty")}
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-xs uppercase text-stone-500">
              <tr>
                <th className="text-left px-4 py-3">{t("headerVideo")}</th>
                <th className="text-left px-4 py-3">{t("headerStatus")}</th>
                <th className="text-left px-4 py-3">{t("headerDuration")}</th>
                <th className="text-left px-4 py-3">{t("headerUpdated")}</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {list.map((v) => (
                <tr key={v.id} className="hover:bg-stone-50/50">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <div className="size-12 rounded-lg bg-stone-200 flex items-center justify-center text-stone-500">
                      <Film className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{v.title}</div>
                      <div className="text-xs text-stone-500">{v.youtubeId ?? "—"}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[v.status]}>{t(statusKey(v.status))}</Badge></td>
                  <td className="px-4 py-3">{formatDuration(v.durationSec)}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs">{new Date(v.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "vi-VN")}</td>
                  <td className="px-4 py-3 text-right">
                    {v.status === "error" && (
                      <Button size="sm" variant="outline">
                        <RefreshCw className="size-3.5" /> {t("reindex")}
                      </Button>
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
