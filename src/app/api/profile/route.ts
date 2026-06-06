import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/api-auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { GOAL_OPTIONS } from "@/lib/learning-goals";
import { LANGUAGE_CODES } from "@/lib/languages";
import { COUNTRY_CODES } from "@/lib/countries";

const nullableInt = (min: number, max: number) =>
  z
    .union([z.coerce.number().int().min(min).max(max), z.literal(""), z.null()])
    .nullish()
    .transform((v) => (v === "" || v == null ? null : v));

const COUNTRY_SET = new Set(COUNTRY_CODES);
const LANG_SET = new Set(LANGUAGE_CODES);

const patchSchema = z.object({
  name: z.string().max(120).nullish(),
  birthYear: nullableInt(1900, 2030),
  country: z
    .string()
    .max(8)
    .nullish()
    .transform((v) => (v ? v.toUpperCase() : null))
    .refine((v) => v === null || COUNTRY_SET.has(v), { message: "unknown country" }),
  occupation: z.string().max(120).nullish(),
  // DATA-01 (CONCERNS LOW-10): nativeLanguages + learningGoals are JSON-in-Text columns,
  // validated on write so only canonical codes can persist. Unknown codes are REJECTED
  // (400) rather than silently dropped; a proper relational restructure is deferred to v2.
  nativeLanguages: z
    .array(
      z
        .string()
        .min(2)
        .max(8)
        .transform((c) => c.toLowerCase())
        .refine((c) => LANG_SET.has(c), { message: "unknown language" }),
    )
    .max(LANGUAGE_CODES.length)
    .nullish()
    .transform((v) => {
      if (!v || v.length === 0) return null;
      const clean = Array.from(new Set(v));
      return clean.length > 0 ? JSON.stringify(clean) : null;
    }),
  dailyTimeGoalMin: nullableInt(1, 600),
  learningGoals: z
    .array(z.enum(GOAL_OPTIONS))
    .max(GOAL_OPTIONS.length)
    .nullish()
    .transform((v) => (v && v.length > 0 ? JSON.stringify(Array.from(new Set(v))) : null)),
});

export async function PATCH(req: Request) {
  const gate = await requireUser();
  if ("error" in gate) return gate.error;
  const userId = gate.userId;

  // SEC-01: throttle write path per user.
  const rl = rateLimit(clientKey(req, "profile", userId), { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

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
      nativeLanguages: data.nativeLanguages ?? null,
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
      nativeLanguages: true,
      dailyTimeGoalMin: true,
      learningGoals: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
