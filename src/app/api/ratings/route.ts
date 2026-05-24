import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireLearner } from "@/lib/api-auth";

const bodySchema = z.object({
  lessonId: z.string().min(1),
  stars: z.number().int().min(1).max(5),
});

export async function POST(req: Request) {
  const gate = await requireLearner();
  if ("error" in gate) return gate.error;
  const userId = gate.userId;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { lessonId, stars } = parsed.data;

  // Ensure lesson exists (avoid orphan rows).
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
  if (!lesson) return NextResponse.json({ error: "lesson not found" }, { status: 404 });

  const rating = await prisma.lessonRating.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { stars },
    create: { userId, lessonId, stars },
  });

  const agg = await prisma.lessonRating.aggregate({
    where: { lessonId },
    _avg: { stars: true },
    _count: { _all: true },
  });

  return NextResponse.json({
    ok: true,
    you: rating.stars,
    avg: agg._avg.stars ?? 0,
    count: agg._count._all,
  });
}
