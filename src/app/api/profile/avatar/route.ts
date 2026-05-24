import fs from "node:fs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireLearner } from "@/lib/api-auth";
import { AVATAR_DIR, avatarPath, avatarUrl } from "@/lib/avatar-server";

const MAX_BYTES = 500 * 1024; // 500 KB
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  const gate = await requireLearner();
  if ("error" in gate) return gate.error;
  const userId = gate.userId;

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "invalid form" }, { status: 400 });
  const file = formData.get("avatar");
  if (!(file instanceof File)) return NextResponse.json({ error: "missing avatar" }, { status: 400 });
  if (!ACCEPTED.has(file.type)) return NextResponse.json({ error: "unsupported type" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too large" }, { status: 413 });

  fs.mkdirSync(AVATAR_DIR, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(avatarPath(userId), bytes);

  const url = avatarUrl(userId, Date.now());
  await prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } });
  return NextResponse.json({ ok: true, url });
}

export async function DELETE() {
  const gate = await requireLearner();
  if ("error" in gate) return gate.error;
  const userId = gate.userId;

  const p = avatarPath(userId);
  if (fs.existsSync(p)) {
    try {
      fs.unlinkSync(p);
    } catch {
      // ignore
    }
  }
  await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } });
  return NextResponse.json({ ok: true });
}
