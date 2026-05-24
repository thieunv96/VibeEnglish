import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireLearner } from "@/lib/api-auth";

export async function POST() {
  const gate = await requireLearner();
  if ("error" in gate) return gate.error;
  const userId = gate.userId;

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
