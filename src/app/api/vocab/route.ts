import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requireLearner } from "@/lib/api-auth";

const postSchema = z.object({
  word: z.string().min(1),
  definition: z.string().optional(),
  sourceLessonSlug: z.string().optional(),
});

export async function POST(req: Request) {
  const gate = await requireLearner();
  if ("error" in gate) return gate.error;
  const userId = gate.userId;

  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const word = parsed.data.word.toLowerCase().trim();
  const item = await prisma.vocabItem.upsert({
    where: { userId_word: { userId, word } },
    update: {
      definition: parsed.data.definition ?? undefined,
      sourceLessonSlug: parsed.data.sourceLessonSlug ?? undefined,
    },
    create: {
      userId,
      word,
      definition: parsed.data.definition ?? null,
      sourceLessonSlug: parsed.data.sourceLessonSlug ?? null,
    },
  });
  return NextResponse.json({ ok: true, id: item.id });
}

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = await prisma.vocabItem.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function DELETE(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  await prisma.vocabItem.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}
