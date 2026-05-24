import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { requireLearner } from "@/lib/api-auth";

const bodySchema = z.object({
  lessonSlug: z.string(),
  category: z.string(),
  title: z.string(),
  segmentsCompleted: z.number().int().min(0),
  totalSegments: z.number().int().positive(),
  accuracy: z.number().min(0).max(1),
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

  const data = parsed.data;
  const row = await prisma.lessonProgress.upsert({
    where: { userId_lessonSlug: { userId, lessonSlug: data.lessonSlug } },
    update: {
      segmentsCompleted: data.segmentsCompleted,
      totalSegments: data.totalSegments,
      accuracy: data.accuracy,
      title: data.title,
      category: data.category,
    },
    create: {
      userId,
      lessonSlug: data.lessonSlug,
      category: data.category,
      title: data.title,
      segmentsCompleted: data.segmentsCompleted,
      totalSegments: data.totalSegments,
      accuracy: data.accuracy,
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}

export async function GET() {
  // GET is allowed for any signed-in user (admins will simply see empty).
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await prisma.lessonProgress.findMany({
    where: { userId },
    orderBy: { lastOpenedAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ progress: rows });
}
