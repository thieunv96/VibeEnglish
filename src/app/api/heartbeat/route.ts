import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireLearner } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const gate = await requireLearner();
  if ("error" in gate) return gate.error;
  const userId = gate.userId;

  // SEC-01: throttle write path per user.
  const rl = rateLimit(clientKey(req, "heartbeat", userId), { limit: 90, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  // Truncate now to the start of the current minute (UTC).
  const now = new Date();
  now.setUTCSeconds(0, 0);

  try {
    await prisma.userActivity.upsert({
      where: { userId_minuteTs: { userId, minuteTs: now } },
      update: {}, // no-op on duplicate ping in the same minute
      create: { userId, minuteTs: now },
    });
  } catch {
    // ignore racing duplicate-insert
  }
  return NextResponse.json({ ok: true });
}
