import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  exerciseSlug: z.string(),
  skill: z.string(),
  title: z.string(),
  score: z.number().min(0).max(1),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const data = parsed.data;
  const row = await prisma.exerciseAttempt.create({
    data: {
      userId,
      exerciseSlug: data.exerciseSlug,
      skill: data.skill,
      title: data.title,
      score: data.score,
    },
  });
  return NextResponse.json({ ok: true, id: row.id });
}
