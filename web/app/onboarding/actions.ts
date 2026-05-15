"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { onboardingProfiles, skillScores, userProgress } from "@/db/schema";
import { auth } from "@/auth";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/constants";
import { revalidatePath } from "next/cache";

const submitSchema = z.object({
  goals: z.array(z.string()).min(1),
  industries: z.array(z.string()),
  dailyMinutes: z.number().int().refine((v) => [5, 15, 30].includes(v)),
  placement: z
    .object({
      answers: z.array(
        z.object({
          questionId: z.string(),
          correct: z.boolean(),
          skill: z.string(),
        })
      ),
      skillScores: z.record(z.string(), z.number()),
    })
    .nullable(),
});

function predictLevelFromScores(scores: Record<string, number>): CefrLevel {
  const values = Object.values(scores);
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  if (avg >= 85) return "C1";
  if (avg >= 70) return "B2";
  if (avg >= 55) return "B1";
  if (avg >= 35) return "A2";
  return "A1";
}

export async function submitOnboarding(input: z.infer<typeof submitSchema>) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
    const parsed = submitSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Validation failed" };
    }
    const { goals, industries, dailyMinutes, placement } = parsed.data;
    const level: CefrLevel = placement ? predictLevelFromScores(placement.skillScores) : "A1";
    const targetIdx = Math.min(CEFR_LEVELS.indexOf(level) + 2, CEFR_LEVELS.length - 1);
    const targetLevel = CEFR_LEVELS[targetIdx];

    await db
      .insert(onboardingProfiles)
      .values({
        userId: session.user.id,
        goals,
        industries,
        dailyMinutes,
        level,
        targetLevel,
        placementResult: placement,
        completedAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: { goals, industries, dailyMinutes, level, targetLevel, placementResult: placement, completedAt: new Date() },
      });

    if (placement) {
      for (const [skill, score] of Object.entries(placement.skillScores)) {
        await db
          .insert(skillScores)
          .values({
            userId: session.user.id,
            skill: skill as "vocabulary" | "grammar" | "reading" | "listening",
            score: Math.round(score),
          })
          .onDuplicateKeyUpdate({ set: { score: Math.round(score), updatedAt: new Date() } });
      }
    }

    await db
      .insert(userProgress)
      .values({ userId: session.user.id })
      .onDuplicateKeyUpdate({ set: { userId: session.user.id } });

    revalidatePath("/");
    return { ok: true as const, level };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function checkOnboardingDone() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const rows = await db
    .select()
    .from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, session.user.id))
    .limit(1);
  return rows.length > 0 && !!rows[0].completedAt;
}
