"use server";

import { z } from "zod";
import { eq, and, avg } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { lessonAttempts, lessons } from "@/db/schema";
import { revalidatePath } from "next/cache";

const schema = z.object({
  attemptId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
});

export async function rateAttemptAction(input: z.infer<typeof schema>) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };

  // Verify the attempt belongs to the user
  const [attempt] = await db
    .select()
    .from(lessonAttempts)
    .where(
      and(eq(lessonAttempts.id, parsed.data.attemptId), eq(lessonAttempts.userId, session.user.id))
    )
    .limit(1);
  if (!attempt) return { ok: false as const, error: "Attempt không tồn tại" };

  await db
    .update(lessonAttempts)
    .set({ rating: parsed.data.rating })
    .where(eq(lessonAttempts.id, parsed.data.attemptId));

  // Recompute denormalized lesson.rating average across all rated attempts.
  const [agg] = await db
    .select({ avg: avg(lessonAttempts.rating) })
    .from(lessonAttempts)
    .where(eq(lessonAttempts.lessonId, attempt.lessonId));
  if (agg?.avg != null) {
    await db
      .update(lessons)
      .set({ rating: Number(agg.avg) })
      .where(eq(lessons.id, attempt.lessonId));
  }

  revalidatePath(`/lessons/${attempt.lessonId}`);
  revalidatePath(`/lessons/${attempt.lessonId}/result`);
  return { ok: true as const };
}
