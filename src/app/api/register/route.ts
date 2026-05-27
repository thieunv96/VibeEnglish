import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isStrongPassword, PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN_LENGTH),
  name: z.string().optional(),
  birthYear: z.coerce.number().int().min(1900).max(2030).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // SEC-02: enforce the stronger password policy (8+ chars, a letter and a digit).
  if (!isStrongPassword(parsed.data.password)) {
    return NextResponse.json({ error: "weak" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: parsed.data.name ?? null,
      birthYear: parsed.data.birthYear ?? null,
    },
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
