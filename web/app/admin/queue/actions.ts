"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { lessons } from "@/db/schema";
import { revalidatePath } from "next/cache";

async function ensureAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

export async function approveLessonAction(id: string) {
  await ensureAdmin();
  await db
    .update(lessons)
    .set({ status: "published", publishedAt: new Date() })
    .where(eq(lessons.id, id));
  revalidatePath("/admin/queue");
  revalidatePath("/");
  return { ok: true as const };
}

export async function rejectLessonAction(id: string, reason: string) {
  await ensureAdmin();
  await db.update(lessons).set({ status: "rejected", rejectReason: reason }).where(eq(lessons.id, id));
  revalidatePath("/admin/queue");
  return { ok: true as const };
}

const editSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  level: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  tags: z.array(z.string()),
});

export async function editLessonMetadataAction(input: z.infer<typeof editSchema>) {
  await ensureAdmin();
  const parsed = editSchema.parse(input);
  await db
    .update(lessons)
    .set({ title: parsed.title, level: parsed.level, tags: parsed.tags })
    .where(eq(lessons.id, parsed.id));
  revalidatePath("/admin/queue");
  return { ok: true as const };
}
