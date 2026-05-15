"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { onboardingProfiles } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const updateSchema = z.object({
  goals: z.array(z.string()).min(1),
  industries: z.array(z.string()),
  dailyMinutes: z.number().int().refine((v) => [5, 15, 30].includes(v)),
  targetLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
});

export async function updateGoalsAction(input: z.infer<typeof updateSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.message };

  await db
    .update(onboardingProfiles)
    .set({
      goals: parsed.data.goals,
      industries: parsed.data.industries,
      dailyMinutes: parsed.data.dailyMinutes,
      targetLevel: parsed.data.targetLevel,
    })
    .where(eq(onboardingProfiles.userId, session.user.id));
  revalidatePath("/");
  revalidatePath("/profile");
  return { ok: true as const };
}

export async function resetPlacementAction() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const };
  await db
    .update(onboardingProfiles)
    .set({ completedAt: null })
    .where(eq(onboardingProfiles.userId, session.user.id));
  return { ok: true as const };
}
