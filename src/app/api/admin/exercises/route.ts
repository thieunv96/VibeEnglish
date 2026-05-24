import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const questionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["mcq", "fill", "match"]),
  prompt: z.string().min(1),
  options: z.array(z.string()).optional(),
  answer: z.union([z.string(), z.array(z.string())]),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
  explanation: z.string().optional(),
});

const exerciseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  skill: z.string().min(1),
  title: z.string().min(1),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  type: z.enum(["mcq", "fill", "match"]),
  description: z.string().nullish(),
  questions: z.array(questionSchema).min(1),
});

async function requireAdmin() {
  const session = await auth();
  const u = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  if (!u?.id) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (!u.isAdmin) return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { userId: u.id };
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const json = await req.json().catch(() => null);
  const parsed = exerciseSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const ex = await prisma.exercise.create({ data: parsed.data });
    return NextResponse.json({ ok: true, id: ex.id }, { status: 201 });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === "P2002") return NextResponse.json({ error: "slug already exists in this skill" }, { status: 409 });
    return NextResponse.json({ error: "create failed" }, { status: 500 });
  }
}
