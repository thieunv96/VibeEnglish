import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireLearner } from "@/lib/api-auth";

const GOAL_OPTIONS = [
  "toeic",
  "toefl",
  "ielts",
  "oet",
  "conversation",
  "business",
  "travel",
  "movies-tv",
  "academic",
] as const;

const nullableInt = (min: number, max: number) =>
  z
    .union([z.coerce.number().int().min(min).max(max), z.literal(""), z.null()])
    .nullish()
    .transform((v) => (v === "" || v == null ? null : v));

const patchSchema = z.object({
  name: z.string().max(120).nullish(),
  birthYear: nullableInt(1900, 2030),
  country: z.string().max(80).nullish(),
  occupation: z.string().max(120).nullish(),
  nativeLanguage: z.string().max(40).nullish(),
  dailyTimeGoalMin: nullableInt(1, 600),
  learningGoals: z
    .array(z.enum(GOAL_OPTIONS))
    .max(GOAL_OPTIONS.length)
    .nullish()
    .transform((v) => (v && v.length > 0 ? JSON.stringify(Array.from(new Set(v))) : null)),
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

  const data = parsed.data;
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name ?? null,
      birthYear: data.birthYear ?? null,
      country: data.country ?? null,
      occupation: data.occupation ?? null,
      nativeLanguage: data.nativeLanguage ?? null,
      dailyTimeGoalMin: data.dailyTimeGoalMin ?? null,
      learningGoals: data.learningGoals ?? null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      birthYear: true,
      country: true,
      occupation: true,
      nativeLanguage: true,
      dailyTimeGoalMin: true,
      learningGoals: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
