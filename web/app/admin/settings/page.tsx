import { db } from "@/db";
import { aiSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const [row] = await db.select().from(aiSettings).where(eq(aiSettings.id, 1)).limit(1);
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-stone-500 mt-1">
          Quản lý cấu hình hệ thống. AI Models cấu hình endpoint vLLM dùng cho mọi tác vụ AI.
        </p>
      </header>
      <SettingsTabs initialTab={sp.tab ?? "ai"} aiSettings={row ?? null} />
    </div>
  );
}
