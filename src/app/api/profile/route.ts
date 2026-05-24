import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireLearner } from "@/lib/api-auth";

const patchSchema = z.object({
  name: z.string().max(120).nullish(),
  birthYear: z
    .union([z.coerce.number().int().min(1900).max(2030), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  country: z.string().max(80).nullish(),
});

export async function PATCH(req: Request) {
  const gate = await requireLearner();
  if ("error" in gate) return gate.error;
  const userId = gate.userId;

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name ?? null,
      birthYear: parsed.data.birthYear ?? null,
      country: parsed.data.country ?? null,
    },
    select: { id: true, email: true, name: true, birthYear: true, country: true },
  });

  return NextResponse.json({ ok: true, user });
}
