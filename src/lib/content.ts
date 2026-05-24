import fs from "node:fs";
import path from "node:path";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface LessonSegment {
  text: string;
  hint?: string;
}

export interface Lesson {
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
  slug: string;
  title: string;
  level: CefrLevel;
  skill: string;
  type: ExerciseType;
  description?: string;
  questions: ExerciseQuestion[];
}

const ROOT = path.join(process.cwd(), "src", "content");

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

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

export function getLessons(category: LessonCategory): Lesson[] {
  const dir = path.join(ROOT, "lessons", category);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const data = readJson<Lesson>(path.join(dir, f));
      return { ...data, category };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getLesson(category: LessonCategory, slug: string): Lesson | null {
  const file = path.join(ROOT, "lessons", category, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return { ...readJson<Lesson>(file), category };
}

export function getExercises(skill: Skill): Exercise[] {
  const dir = path.join(ROOT, "exercises", skill);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const data = readJson<Exercise>(path.join(dir, f));
      return { ...data, skill };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getExercise(skill: Skill, slug: string): Exercise | null {
  const file = path.join(ROOT, "exercises", skill, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return { ...readJson<Exercise>(file), skill };
}

export function isCategory(value: string): value is LessonCategory {
  return (LESSON_CATEGORIES as readonly string[]).includes(value);
}

export function isSkill(value: string): value is Skill {
  return (SKILLS as readonly string[]).includes(value);
}

export function categoryStats() {
  return lessonCategories.map((cat) => ({
    slug: cat,
    count: getLessons(cat).length,
  }));
}

export function skillStats() {
  return skills.map((sk) => ({
    slug: sk,
    count: getExercises(sk).length,
  }));
}
