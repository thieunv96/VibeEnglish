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

const exerciseUpdateSchema = z.object({
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

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: RouteContext) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = exerciseUpdateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid", issues: parsed.error.issues }, { status: 400 });
  try {
    const ex = await prisma.exercise.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ ok: true, id: ex.id });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === "P2002") return NextResponse.json({ error: "slug already exists" }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  try {
    await prisma.exercise.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === "P2025") return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }
}
