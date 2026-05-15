"use server";

import { z } from "zod";
import { db } from "@/db";
import { lessons, exercises, quizQuestions } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const schema = z.object({
  title: z.string().min(2),
  type: z.enum(["quiz", "writing", "speaking", "audio_quiz"]),
  level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  tags: z.array(z.string()),
  publishImmediately: z.boolean(),
  // Quiz only
  quiz: z
    .array(
      z.object({
        question: z.string().min(2),
        options: z.array(z.string()).length(4),
        correctIndex: z.number().int().min(0).max(3),
        skill: z.enum(["vocabulary", "grammar", "reading", "listening"]),
      })
    )
    .optional(),
  writing: z
    .object({
      prompt: z.string(),
      sampleAnswer: z.string().optional(),
      minWords: z.number().int().optional(),
    })
    .optional(),
  speaking: z
    .object({
      targetText: z.string(),
    })
    .optional(),
});

export async function createLessonAction(input: z.infer<typeof schema>) {
  const session = await auth();
  if (session?.user?.role !== "admin") return { ok: false as const, error: "Forbidden" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.message };

  const lessonId = crypto.randomUUID();
  await db.insert(lessons).values({
    id: lessonId,
    title: parsed.data.title,
    type: parsed.data.type,
    level: parsed.data.level,
    tags: parsed.data.tags,
    status: parsed.data.publishImmediately ? "published" : "queued",
    publishedAt: parsed.data.publishImmediately ? new Date() : null,
    createdBy: session.user.id,
    durationSec: 300,
  });

  if (parsed.data.type === "quiz" && parsed.data.quiz?.length) {
    const exId = crypto.randomUUID();
    await db.insert(exercises).values({ id: exId, lessonId, kind: "quiz", order: 0, payload: { kind: "quiz" } });
    for (let i = 0; i < parsed.data.quiz.length; i++) {
      const q = parsed.data.quiz[i];
      await db.insert(quizQuestions).values({
        id: crypto.randomUUID(),
        exerciseId: exId,
        order: i,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        skill: q.skill,
      });
    }
  } else if (parsed.data.type === "writing" && parsed.data.writing) {
    await db.insert(exercises).values({
      id: crypto.randomUUID(),
      lessonId,
      kind: "writing",
      order: 0,
      payload: { kind: "writing", ...parsed.data.writing },
    });
  } else if (parsed.data.type === "speaking" && parsed.data.speaking) {
    await db.insert(exercises).values({
      id: crypto.randomUUID(),
      lessonId,
      kind: "speaking",
      order: 0,
      payload: { kind: "speaking", ...parsed.data.speaking },
    });
  }

  revalidatePath("/admin/queue");
  revalidatePath("/");
  return { ok: true as const, lessonId };
}
