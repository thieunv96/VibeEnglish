"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { revalidatePath } from "next/cache";

async function ensureAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
}

const schema = z.object({
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, "Slug chỉ dùng chữ thường, số, gạch ngang"),
  title: z.string().min(1).max(128),
  icon: z.string().max(32).optional(),
  description: z.string().max(500).optional(),
  order: z.coerce.number().int().default(0),
});

export async function createCategoryAction(input: z.infer<typeof schema>) {
  await ensureAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0].message };
  try {
    await db.insert(categories).values({
      id: crypto.randomUUID(),
      slug: parsed.data.slug,
      title: parsed.data.title,
      icon: parsed.data.icon || null,
      description: parsed.data.description || null,
      order: parsed.data.order,
    });
    revalidatePath("/admin/categories");
    revalidatePath("/");
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "DB error" };
  }
}

export async function deleteCategoryAction(id: string) {
  await ensureAdmin();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { ok: true as const };
}
