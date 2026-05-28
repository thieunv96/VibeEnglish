import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const lessonSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, "lowercase alphanumeric and dashes only"),
  category: z.string().min(1),
  title: z.string().min(1),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  description: z.string().nullish(),
  transcript: z.string().min(1),
  segments: z
    .array(z.object({ text: z.string().min(1), hint: z.string().optional() }))
    .min(1),
});

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

const bodySchema = z.object({
  mode: z.enum(["preview", "commit"]),
  lessons: z.array(z.unknown()).optional(),
  exercises: z.array(z.unknown()).optional(),
});

type LessonInput = z.infer<typeof lessonSchema>;
type ExerciseInput = z.infer<typeof exerciseSchema>;

type Status =
  | "new"
  | "update"
  | "invalid"
  | "created"
  | "updated"
  | "failed";

interface RecordResult {
  index: number;
  slug: string;
  title: string;
  group: string;
  level?: string;
  status: Status;
  error?: string;
}

async function requireAdmin() {
  const session = await auth();
  const u = session?.user as { id?: string; isAdmin?: boolean } | undefined;
  if (!u?.id) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  if (!u.isAdmin) return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { userId: u.id };
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { mode, lessons = [], exercises = [] } = parsed.data;

  const lessonResults: RecordResult[] = [];
  const exerciseResults: RecordResult[] = [];

  const validLessons: Array<{ index: number; data: LessonInput }> = [];
  const validExercises: Array<{ index: number; data: ExerciseInput }> = [];

  lessons.forEach((raw, i) => {
    const r = asRecord(raw);
    const check = lessonSchema.safeParse(raw);
    if (!check.success) {
      lessonResults.push({
        index: i,
        slug: String(r.slug ?? "?"),
        title: String(r.title ?? "?"),
        group: String(r.category ?? "?"),
        level: r.level ? String(r.level) : undefined,
        status: "invalid",
        error: check.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; "),
      });
      return;
    }
    validLessons.push({ index: i, data: check.data });
  });

  exercises.forEach((raw, i) => {
    const r = asRecord(raw);
    const check = exerciseSchema.safeParse(raw);
    if (!check.success) {
      exerciseResults.push({
        index: i,
        slug: String(r.slug ?? "?"),
        title: String(r.title ?? "?"),
        group: String(r.skill ?? "?"),
        level: r.level ? String(r.level) : undefined,
        status: "invalid",
        error: check.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; "),
      });
      return;
    }
    validExercises.push({ index: i, data: check.data });
  });

  if (mode === "preview") {
    if (validLessons.length > 0) {
      const existing = await prisma.lesson.findMany({
        where: {
          OR: validLessons.map((l) => ({
            category: l.data.category,
            slug: l.data.slug,
          })),
        },
        select: { category: true, slug: true },
      });
      const existsKey = new Set(existing.map((e) => `${e.category}::${e.slug}`));
      for (const { index, data } of validLessons) {
        lessonResults.push({
          index,
          slug: data.slug,
          title: data.title,
          group: data.category,
          level: data.level,
          status: existsKey.has(`${data.category}::${data.slug}`) ? "update" : "new",
        });
      }
    }
    if (validExercises.length > 0) {
      const existing = await prisma.exercise.findMany({
        where: {
          OR: validExercises.map((e) => ({ skill: e.data.skill, slug: e.data.slug })),
        },
        select: { skill: true, slug: true },
      });
      const existsKey = new Set(existing.map((e) => `${e.skill}::${e.slug}`));
      for (const { index, data } of validExercises) {
        exerciseResults.push({
          index,
          slug: data.slug,
          title: data.title,
          group: data.skill,
          level: data.level,
          status: existsKey.has(`${data.skill}::${data.slug}`) ? "update" : "new",
        });
      }
    }
    return NextResponse.json({ mode, lessons: lessonResults, exercises: exerciseResults });
  }

  // commit
  for (const { index, data } of validLessons) {
    try {
      const before = await prisma.lesson.findUnique({
        where: { category_slug: { category: data.category, slug: data.slug } },
        select: { id: true },
      });
      await prisma.lesson.upsert({
        where: { category_slug: { category: data.category, slug: data.slug } },
        update: {
          title: data.title,
          level: data.level,
          description: data.description ?? null,
          transcript: data.transcript,
          segments: data.segments,
        },
        create: data,
      });
      lessonResults.push({
        index,
        slug: data.slug,
        title: data.title,
        group: data.category,
        level: data.level,
        status: before ? "updated" : "created",
      });
    } catch (e: unknown) {
      lessonResults.push({
        index,
        slug: data.slug,
        title: data.title,
        group: data.category,
        level: data.level,
        status: "failed",
        error: e instanceof Error ? e.message : "unknown error",
      });
    }
  }

  for (const { index, data } of validExercises) {
    try {
      const before = await prisma.exercise.findUnique({
        where: { skill_slug: { skill: data.skill, slug: data.slug } },
        select: { id: true },
      });
      await prisma.exercise.upsert({
        where: { skill_slug: { skill: data.skill, slug: data.slug } },
        update: {
          title: data.title,
          level: data.level,
          type: data.type,
          description: data.description ?? null,
          questions: data.questions,
        },
        create: data,
      });
      exerciseResults.push({
        index,
        slug: data.slug,
        title: data.title,
        group: data.skill,
        level: data.level,
        status: before ? "updated" : "created",
      });
    } catch (e: unknown) {
      exerciseResults.push({
        index,
        slug: data.slug,
        title: data.title,
        group: data.skill,
        level: data.level,
        status: "failed",
        error: e instanceof Error ? e.message : "unknown error",
      });
    }
  }

  return NextResponse.json({ mode, lessons: lessonResults, exercises: exerciseResults });
}
