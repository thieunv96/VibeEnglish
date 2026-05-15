import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { onboardingProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { TopNav } from "@/components/top-nav";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const [profile] = await db
    .select()
    .from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, session.user.id))
    .limit(1);
  if (!profile) redirect("/onboarding");
  const t = await getTranslations("settings");

  return (
    <div className="min-h-screen bg-stone-50">
      <TopNav />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-stone-500 mt-1">{t("subtitle")}</p>
        </header>
        <SettingsForm profile={profile} />
      </main>
    </div>
  );
}
