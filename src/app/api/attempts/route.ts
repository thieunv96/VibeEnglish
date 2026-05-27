import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireLearner } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";

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

  // SEC-01: throttle write path per user.
  const rl = rateLimit(clientKey(req, "attempts", userId), { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const data = parsed.data;

  // SEC-03: don't record an attempt against an exercise that doesn't exist.
  // Exercise @@unique([skill, slug]) — the client sends the exercise's own slug + skill.
  const exercise = await prisma.exercise.findFirst({
    where: { slug: data.exerciseSlug, skill: data.skill },
    select: { id: true },
  });
  if (!exercise) return NextResponse.json({ error: "exercise not found" }, { status: 404 });

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
