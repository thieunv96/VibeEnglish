import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const lessonSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "lowercase alphanumeric and dashes only"),
  category: z.string().min(1),
  title: z.string().min(1),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  description: z.string().nullish(),
  transcript: z.string().min(1),
  segments: z
    .array(z.object({ text: z.string().min(1), hint: z.string().optional() }))
    .min(1),
});

async function requireAdmin() {
  const session = await auth();
  const u = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  if (!u?.id) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (!u.isAdmin) return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { userId: u.id };
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const json = await req.json().catch(() => null);
  const parsed = lessonSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const lesson = await prisma.lesson.create({ data: parsed.data });
    return NextResponse.json({ ok: true, id: lesson.id }, { status: 201 });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === "P2002") {
      return NextResponse.json({ error: "slug already exists in this category" }, { status: 409 });
    }
    return NextResponse.json({ error: "create failed" }, { status: 500 });
  }
}
