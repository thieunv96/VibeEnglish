/**
 * Shared helpers for test-prep E2E tests.
 *
 * Includes:
 *   - Test fixture seeding (exam-tagged exercises, MockTestAttempt rows)
 *   - Test fixture cleanup (restore DB to clean state)
 *   - JWT forging utilities (cross-exam replay attack testing)
 *   - Admin user credentials
 */

import { Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { signSessionJWT } from "../../src/lib/sample-test-jwt";
import { estimateBand } from "../../src/lib/test-prep-bands";
import { MOCK_SESSION_TTL_SEC } from "../../src/lib/test-prep-constants";
import type { ExamSlug } from "../../src/lib/test-prep-constants";

const prisma = new PrismaClient();

/**
 * Create seed test exercises tagged with a specific exam.
 * Each call creates 5 exercises × 5 questions = 25 questions for the exam.
 *
 * Must be paired with `clearTestPrepFixtures` in test cleanup.
 *
 * @param exam - Exam slug ("toeic", "toefl", "ielts", "oet")
 */
export async function seedTestPrepFixtures(exam: ExamSlug): Promise<void> {
  const fixtures = Array.from({ length: 5 }, (_, i) => ({
    slug: `${exam}-listening-fixture-${i + 1}`,
    skill: "listening" as const,
    title: `${exam.toUpperCase()} Listening Fixture ${i + 1}`,
    level: "B1" as const,
    type: "mcq" as const,
    exam,
    questions: Array.from({ length: 5 }, (_, j) => ({
      id: `q${j + 1}`,
      type: "mcq" as const,
      prompt: `Fixture question ${i + 1}.${j + 1}`,
      options: ["A", "B", "C", "D"],
      answer: "A",
    })),
  }));

  for (const fixture of fixtures) {
    await prisma.exercise.upsert({
      where: { skill_slug: { skill: fixture.skill, slug: fixture.slug } },
      update: {
        title: fixture.title,
        level: fixture.level,
        type: fixture.type,
        exam: fixture.exam,
        questions: fixture.questions,
      },
      create: {
        slug: fixture.slug,
        skill: fixture.skill,
        title: fixture.title,
        level: fixture.level,
        type: fixture.type,
        exam: fixture.exam,
        questions: fixture.questions,
      },
    });
  }
}

/**
 * Clean up test-prep fixtures by exam.
 * Deletes exercises tagged with the fixture pattern and all associated attempts.
 *
 * @param exam - Exam slug ("toeic", "toefl", "ielts", "oet")
 */
export async function clearTestPrepFixtures(exam: ExamSlug): Promise<void> {
  // Delete fixture exercises (Exercise has composite key: skill + slug)
  const exercises = await prisma.exercise.findMany({
    where: {
      exam,
      slug: { contains: "fixture" },
    },
    select: { slug: true, skill: true },
  });

  for (const ex of exercises) {
    await prisma.exercise.delete({
      where: { skill_slug: { skill: ex.skill, slug: ex.slug } },
    });
  }

  // Delete all MockTestAttempt rows for this exam
  await prisma.mockTestAttempt.deleteMany({ where: { exam } });
}

/**
 * Seed mock attempt history for a user.
 * Creates N MockTestAttempt rows + N×5 ExerciseAttempt rows (one per question).
 *
 * Used for testing progress display and admin analytics.
 *
 * @param userId - The user's ID
 * @param exam - Exam slug
 * @param attemptCount - Number of past attempts to create
 */
export async function seedMockAttempts(
  userId: string,
  exam: ExamSlug,
  attemptCount: number,
): Promise<void> {
  for (let i = 0; i < attemptCount; i++) {
    const correctAnswers = 12 + i * 2; // Vary scores: 12, 14, 16, ...
    const totalQuestions = 25;
    const score = correctAnswers / totalQuestions;
    const bandEstimate = estimateBand(correctAnswers, totalQuestions, exam).band;
    const completedAt = new Date(Date.now() - (attemptCount - i) * 86400000); // Each day apart

    const mockAttempt = await prisma.mockTestAttempt.create({
      data: {
        userId,
        exam,
        totalQuestions,
        correctAnswers,
        score,
        bandEstimate,
        completedAt,
      },
    });

    // Create exercise attempts for each question in the mock
    const exercises = await prisma.exercise.findMany({
      where: { exam, slug: { contains: "fixture" } },
      select: { slug: true, skill: true, title: true },
      take: 5,
    });

    let questionIndex = 0;
    for (const ex of exercises) {
      for (let j = 0; j < 5; j++) {
        if (questionIndex < totalQuestions) {
          const isCorrect = questionIndex < correctAnswers;
          await prisma.exerciseAttempt.create({
            data: {
              userId,
              exerciseSlug: ex.slug,
              skill: ex.skill,
              title: ex.title,
              score: isCorrect ? 1.0 : 0.0,
              completedAt,
              attemptType: "mock",
            },
          });
          questionIndex++;
        }
      }
    }
  }
}

/**
 * Sign a forged JWT for testing invalid session handling.
 *
 * @param payload - Custom payload (e.g., { testType: "mock-ielts", ... })
 */
export async function forgeMockJWT(payload: Record<string, unknown>): Promise<string> {
  return signSessionJWT(payload, MOCK_SESSION_TTL_SEC);
}

/**
 * Get seeded admin user credentials.
 * The seed script creates thieunv96@gmail.com:123 by default.
 */
export function getAdminCredentials(): { email: string; password: string } {
  return {
    email: "thieunv96@gmail.com",
    password: "123",
  };
}

/**
 * Log in as the seeded admin (thieunv96@gmail.com / 123). The seed user has
 * isAdmin=true on first sign-in, so no DB promotion + session-refresh dance
 * is needed. JWT carries the correct isAdmin claim from the start.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/auth/login");
  await page.getByTestId("login-email").fill("thieunv96@gmail.com");
  await page.getByTestId("login-password").fill("123");
  await page.getByTestId("login-submit").click();
  // Login server action calls auth() right after signIn(), which sometimes
  // returns an empty session (JWT not yet propagated) → redirects to "/"
  // instead of "/admin". Either landing URL means the auth cookie IS set;
  // the admin layout gates re-check isAdmin server-side, so we can navigate
  // to /admin from anywhere.
  await page.waitForURL(/\/(admin|$)/, { timeout: 15_000 });
}
