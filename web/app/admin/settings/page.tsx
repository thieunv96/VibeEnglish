import { db } from "@/db";
import { aiSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const [row] = await db.select().from(aiSettings).where(eq(aiSettings.id, 1)).limit(1);
  const t = await getTranslations("admin.settings");
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-stone-500 mt-1">{t("subtitle")}</p>
      </header>
      <SettingsTabs initialTab={sp.tab ?? "ai"} aiSettings={row ?? null} />
    </div>
  );
}
