#!/usr/bin/env node
// One-shot purge: removes any LessonProgress / VocabItem / ExerciseAttempt
// rows owned by users with isAdmin = true. Run after the admin-lockout change.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const admins = await prisma.user.findMany({
  where: { isAdmin: true },
  select: { id: true, email: true },
});

if (admins.length === 0) {
  console.log("No admin users found.");
  await prisma.$disconnect();
  process.exit(0);
}

const ids = admins.map((a) => a.id);
const [{ count: prog }, { count: vocab }, { count: att }] = await Promise.all([
  prisma.lessonProgress.deleteMany({ where: { userId: { in: ids } } }),
  prisma.vocabItem.deleteMany({ where: { userId: { in: ids } } }),
  prisma.exerciseAttempt.deleteMany({ where: { userId: { in: ids } } }),
]);

console.log(`✓ purged admin-owned learner data:`);
console.log(`  admins:    ${admins.map((a) => a.email).join(", ")}`);
console.log(`  progress:  ${prog}`);
console.log(`  vocab:     ${vocab}`);
console.log(`  attempts:  ${att}`);
await prisma.$disconnect();
