import { TopNav } from "@/components/top-nav";
import { FeedbackForm } from "./feedback-form";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";

export default async function FeedbackPage() {
  const session = await auth();
  const t = await getTranslations("feedback");
  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-stone-500 mt-1">{t("subtitle")}</p>
        </header>
        <FeedbackForm defaultEmail={session?.user?.email ?? ""} />
      </main>
    </div>
  );
}
