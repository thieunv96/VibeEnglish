"use server";

import { z } from "zod";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { auth } from "@/auth";

const schema = z.object({
  type: z.enum(["feature_request", "ui_bug", "content_feedback", "experience_rating", "other"]),
  content: z.string().min(5).max(2000),
  rating: z.number().int().min(1).max(5).nullable(),
  wantsReply: z.boolean(),
  contactEmail: z.string().email().optional().nullable(),
});

export async function submitFeedback(input: z.infer<typeof schema>) {
  const session = await auth();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Dữ liệu không hợp lệ" };

  await db.insert(feedback).values({
    id: crypto.randomUUID(),
    userId: session?.user?.id ?? null,
    type: parsed.data.type,
    content: parsed.data.content,
    rating: parsed.data.rating,
    contactEmail: parsed.data.wantsReply ? parsed.data.contactEmail ?? session?.user?.email ?? null : null,
    wantsReply: parsed.data.wantsReply,
  });
  return { ok: true as const };
}
