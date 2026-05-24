import { prisma } from "@/lib/db";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LessonSegment {
  text: string;
  hint?: string;
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  level: CefrLevel;
  category: string;
  description?: string;
  segments: LessonSegment[];
  transcript: string;
}

export type ExerciseType = "mcq" | "fill" | "match";

export interface ExerciseQuestion {
  id: string;
  type: ExerciseType;
  prompt: string;
  options?: string[];
  answer: string | string[];
  pairs?: { left: string; right: string }[];
  explanation?: string;
}

export interface Exercise {
  id: string;
  slug: string;
  title: string;
  level: CefrLevel;
  skill: string;
  type: ExerciseType;
  description?: string;
  questions: ExerciseQuestion[];
}

const LESSON_CATEGORIES = [
  "short-stories",
  "conversations",
  "ted-ed",
  "youtube-random",
  "toeic-listening",
  "toefl-listening",
  "ielts-listening",
  "medical-english-oet",
  "stories-for-kids",
] as const;

const SKILLS = [
  "grammar",
  "vocabulary",
  "listening",
  "reading",
  "speaking",
  "writing",
  "word-skills",
  "business",
] as const;

export type LessonCategory = (typeof LESSON_CATEGORIES)[number];
export type Skill = (typeof SKILLS)[number];

export const lessonCategories = LESSON_CATEGORIES;
export const skills = SKILLS;

interface DbLessonRow {
  id: string;
  slug: string;
  category: string;
  title: string;
  level: string;
  description: string | null;
  transcript: string;
  segments: unknown;
}

interface DbExerciseRow {
  id: string;
  slug: string;
  skill: string;
  title: string;
  level: string;
  type: string;
  description: string | null;
  questions: unknown;
}

function rowToLesson(row: DbLessonRow): Lesson {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    title: row.title,
    level: row.level as CefrLevel,
    description: row.description ?? undefined,
    transcript: row.transcript,
    segments: (row.segments ?? []) as LessonSegment[],
  };
}

function rowToExercise(row: DbExerciseRow): Exercise {
  return {
    id: row.id,
    slug: row.slug,
    skill: row.skill,
    title: row.title,
    level: row.level as CefrLevel,
    type: row.type as ExerciseType,
    description: row.description ?? undefined,
    questions: (row.questions ?? []) as ExerciseQuestion[],
  };
}

export async function getLessons(category: LessonCategory): Promise<Lesson[]> {
  const rows = await prisma.lesson.findMany({
    where: { category },
    orderBy: { title: "asc" },
  });
  return rows.map(rowToLesson);
}

export async function getLesson(
  category: LessonCategory,
  slug: string,
): Promise<Lesson | null> {
  const row = await prisma.lesson.findUnique({
    where: { category_slug: { category, slug } },
  });
  return row ? rowToLesson(row) : null;
}

export async function getExercises(skill: Skill): Promise<Exercise[]> {
  const rows = await prisma.exercise.findMany({
    where: { skill },
    orderBy: { title: "asc" },
  });
  return rows.map(rowToExercise);
}

export async function getExercise(
  skill: Skill,
  slug: string,
): Promise<Exercise | null> {
  const row = await prisma.exercise.findUnique({
    where: { skill_slug: { skill, slug } },
  });
  return row ? rowToExercise(row) : null;
}

export function isCategory(value: string): value is LessonCategory {
  return (LESSON_CATEGORIES as readonly string[]).includes(value);
}

export function isSkill(value: string): value is Skill {
  return (SKILLS as readonly string[]).includes(value);
}

export async function categoryStats(): Promise<Array<{ slug: LessonCategory; count: number }>> {
  const grouped = await prisma.lesson.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  const map = new Map<string, number>(
    grouped.map((g) => [g.category, g._count._all]),
  );
  return lessonCategories.map((cat) => ({ slug: cat, count: map.get(cat) ?? 0 }));
}

export async function skillStats(): Promise<Array<{ slug: Skill; count: number }>> {
  const grouped = await prisma.exercise.groupBy({
    by: ["skill"],
    _count: { _all: true },
  });
  const map = new Map<string, number>(
    grouped.map((g) => [g.skill, g._count._all]),
  );
  return skills.map((sk) => ({ slug: sk, count: map.get(sk) ?? 0 }));
}
