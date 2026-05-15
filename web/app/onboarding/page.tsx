import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "./onboarding-flow";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { onboardingProfiles } from "@/db/schema";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const rows = await db
    .select()
    .from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, session.user.id))
    .limit(1);
  if (rows[0]?.completedAt) redirect("/");
  return <OnboardingFlow userName={session.user.name ?? ""} />;
}
