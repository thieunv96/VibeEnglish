#!/usr/bin/env node
// One-shot import: walks src/content/{lessons,exercises}/*/*.json and upserts
// into Prisma `lesson` / `exercise` tables. Idempotent.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "src", "content");
const prisma = new PrismaClient();

async function importLessons() {
  const dir = path.join(ROOT, "lessons");
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const category of fs.readdirSync(dir)) {
    const catDir = path.join(dir, category);
    if (!fs.statSync(catDir).isDirectory()) continue;
    for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith(".json"))) {
      const data = JSON.parse(fs.readFileSync(path.join(catDir, file), "utf8"));
      await prisma.lesson.upsert({
        where: { category_slug: { category, slug: data.slug } },
        update: {
          title: data.title,
          level: data.level,
          description: data.description ?? null,
          transcript: data.transcript,
          segments: data.segments,
        },
        create: {
          slug: data.slug,
          category,
          title: data.title,
          level: data.level,
          description: data.description ?? null,
          transcript: data.transcript,
          segments: data.segments,
        },
      });
      n++;
    }
  }
  return n;
}

async function importExercises() {
  const dir = path.join(ROOT, "exercises");
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const skill of fs.readdirSync(dir)) {
    const skillDir = path.join(dir, skill);
    if (!fs.statSync(skillDir).isDirectory()) continue;
    for (const file of fs.readdirSync(skillDir).filter((f) => f.endsWith(".json"))) {
      const data = JSON.parse(fs.readFileSync(path.join(skillDir, file), "utf8"));
      await prisma.exercise.upsert({
        where: { skill_slug: { skill, slug: data.slug } },
        update: {
          title: data.title,
          level: data.level,
          type: data.type,
          description: data.description ?? null,
          questions: data.questions,
        },
        create: {
          slug: data.slug,
          skill,
          title: data.title,
          level: data.level,
          type: data.type,
          description: data.description ?? null,
          questions: data.questions,
        },
      });
      n++;
    }
  }
  return n;
}

const lessons = await importLessons();
const exercises = await importExercises();
console.log(`✓ imported ${lessons} lessons, ${exercises} exercises.`);
await prisma.$disconnect();
