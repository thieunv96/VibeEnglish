import { db } from "@/db";
import { aiSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AiSettingsForm } from "./form";

export default async function AiSettingsPage() {
  const [row] = await db.select().from(aiSettings).where(eq(aiSettings.id, 1)).limit(1);
  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">AI Settings</h1>
        <p className="text-sm text-stone-500 mt-1">
          Cấu hình endpoint vLLM (OpenAI-compatible). Mọi tác vụ AI sẽ dùng cấu hình này — đổi tại đây có hiệu lực ngay.
          Khi chưa cấu hình, hệ thống dùng stub data.
        </p>
      </header>
      <AiSettingsForm initial={row ?? null} />
    </div>
  );
}
