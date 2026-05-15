"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const avatarSchema = z.object({
  dataUri: z
    .string()
    .max(20_000) // ~64x64 PNG fits well under 20KB
    .regex(/^data:image\/(png|jpeg|webp);base64,/, "Invalid image data URI"),
});

export async function updateAvatarAction(input: z.infer<typeof avatarSchema>) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  const parsed = avatarSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  await db.update(users).set({ avatarData: parsed.data.dataUri }).where(eq(users.id, session.user.id));
  revalidatePath("/", "layout");
  return { ok: true as const };
}

const localeSchema = z.enum(["vi", "en"]);

export async function setLocaleAction(locale: "vi" | "en") {
  const parsed = localeSchema.parse(locale);
  // Persist to cookie (read by next-intl/middleware)
  const jar = await cookies();
  jar.set("NEXT_LOCALE", parsed, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  // Also persist to DB if logged in
  const session = await auth();
  if (session?.user?.id) {
    await db.update(users).set({ locale: parsed }).where(eq(users.id, session.user.id));
  }
  revalidatePath("/", "layout");
  return { ok: true as const };
}
