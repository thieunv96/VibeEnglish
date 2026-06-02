/**
 * POST /api/sample-test/recommendations
 *
 * Fetches recommended exercises for the weakest skill(s).
 * Called client-side from the results page after auth is confirmed.
 *
 * 4-step pattern:
 *   1. No auth gate — reading public exercise data.
 *   2. rateLimit(IP, 20/60s) — prevents DoS via serial DB fan-out (up to 10 skills).
 *   3. Zod-validate body: { skillCandidates: string[] }
 *   4. prisma.exercise.findMany → return exercises or empty
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import type { RecommendedExercise } from "@/lib/recommendation";

const bodySchema = z.object({
  skillCandidates: z.array(z.string().min(1)).min(1).max(10),
});

export async function POST(req: Request) {
  // Step 2 — Rate limit (IP, 20/60s).
  const rl = rateLimit(
    clientKey(req, "sample-test:recs"),
    { limit: 20, windowMs: 60_000 },
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  // Step 3 — Validate body.
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // Cascade through skill candidates until we find one with content (AC-E8).
  for (const skill of parsed.data.skillCandidates) {
    const exercises: RecommendedExercise[] = await prisma.exercise.findMany({
      where: { skill },
      take: 3,
      orderBy: { title: "asc" },
      select: { id: true, slug: true, title: true, skill: true, level: true },
    });

    if (exercises.length > 0) {
      return NextResponse.json({ exercises, skill });
    }
  }

  // No content found for any skill — AC-E8 fallback handled client-side.
  return NextResponse.json({ exercises: [] });
}
