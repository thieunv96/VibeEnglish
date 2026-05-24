import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireLearner } from "@/lib/api-auth";

const bodySchema = z.object({
  exerciseSlug: z.string(),
  skill: z.string(),
  title: z.string(),
  score: z.number().min(0).max(1),
});

export async function POST(req: Request) {
  const gate = await requireLearner();
  if ("error" in gate) return gate.error;
  const userId = gate.userId;

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
