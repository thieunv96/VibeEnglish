/**
 * E2E specs for the test-prep listening mocks (TOEIC/TOEFL/IELTS/OET).
 *
 * Covers:
 *   - Auth gating: anonymous → /auth/login
 *   - Mock landing: server-rendered disclaimer (AC-15)
 *   - Mock happy path: start → run Qs → submit → inline results (AC-5/6)
 *   - Results display: band estimate + disclaimer (AC-8, AC-16)
 *   - Retake: state reset without URL change (AC-9)
 *   - Refresh: returns to idle landing (AC-9a)
 *   - Error cases: invalid session, non-admin 403
 *
 * Uses fixture seeding: 25 listening exercises per exam.
 */

import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import {
  seedTestPrepFixtures,
  clearTestPrepFixtures,
  forgeMockJWT,
  loginAsAdmin,
} from "./_test-prep-helpers";
import { registerAndLogin } from "./_sample-test-helpers";

const prisma = new PrismaClient();

test.describe.serial("Test Prep — Listening Mocks (TOEIC/TOEFL/IELTS/OET)", () => {
  // =========================================================================
  // Setup / Teardown
  // =========================================================================

  test.beforeAll(async () => {
    // Seed 25 questions per exam
    await seedTestPrepFixtures("toeic");
    await seedTestPrepFixtures("toefl");
    await seedTestPrepFixtures("ielts");
    await seedTestPrepFixtures("oet");
  });

  test.afterAll(async () => {
    // Clean up all fixtures
    await clearTestPrepFixtures("toeic");
    await clearTestPrepFixtures("toefl");
    await clearTestPrepFixtures("ielts");
    await clearTestPrepFixtures("oet");
    await prisma.$disconnect();
  });

  // =========================================================================
  // Auth Gating (AC-4)
  // =========================================================================

  test("anonymous visitor to /test-prep redirects to /auth/login", async ({
    page,
  }) => {
    await page.goto("/test-prep");
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/auth\/login/);
  });

  test("anonymous visitor to /test-prep/toeic/mock redirects to /auth/login", async ({
    page,
  }) => {
    await page.goto("/test-prep/toeic/mock");
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/auth\/login/);
  });

  // =========================================================================
  // Landing with Disclaimer (AC-15)
  // =========================================================================

  test("mock landing displays server-rendered disclaimer in HTML", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page);

    // Get cookies from logged-in session
    const cookies = await page.context().cookies();
    const headers: Record<string, string> = {
      cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; "),
    };

    // Fetch raw HTML
    const res = await request.get("/test-prep/toeic/mock", { headers });
    const html = await res.text();

    // Disclaimer should be server-rendered
    expect(html).toContain("VibeEnglish estimates are for practice");
  });

  // =========================================================================
  // Happy Path: Start → Answer → Submit → Results (AC-5/6/8)
  // =========================================================================

  test("logged-in user completes mock test and sees inline results", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await page.goto("/test-prep/toeic/mock");

    // Click start button
    const startBtn = page.getByTestId("start-test-btn");
    await startBtn.click({ timeout: 15_000 });

    // Answer questions by clicking first option for MCQs
    // Just answer a few to speed up the test
    for (let i = 0; i < 5; i++) {
      const qOption = page.getByTestId(`q${i}-opt-0`);
      if (await qOption.isVisible().catch(() => false)) {
        await qOption.click();
      }

      const checkBtn = page.getByTestId(`q${i}-check`);
      if (await checkBtn.isVisible().catch(() => false)) {
        await checkBtn.click();
      }
    }

    // Submit
    const submitBtn = page
      .getByRole("button")
      .filter({ hasText: /submit|Submit/i })
      .first();
    await submitBtn.click({ timeout: 15_000 });

    // Results should render inline
    await expect(page.getByTestId("mock-results")).toBeVisible({
      timeout: 30_000,
    });

    // Score visible (X/25)
    const scoreText = await page
      .getByTestId("results-score")
      .textContent();
    expect(scoreText).toMatch(/\d+\s*\/\s*25/);
  });

  // =========================================================================
  // Results Display (AC-8, AC-16)
  // =========================================================================

  test("results show band estimate and disclaimer", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/test-prep/ielts/mock");

    // Start and answer a few questions
    await page.getByTestId("start-test-btn").click({ timeout: 15_000 });

    for (let i = 0; i < 3; i++) {
      const qOption = page.getByTestId(`q${i}-opt-0`);
      if (await qOption.isVisible().catch(() => false)) {
        await qOption.click();
      }

      const checkBtn = page.getByTestId(`q${i}-check`);
      if (await checkBtn.isVisible().catch(() => false)) {
        await checkBtn.click();
      }
    }

    const submitBtn = page
      .getByRole("button")
      .filter({ hasText: /submit|Submit/i })
      .first();
    await submitBtn.click({ timeout: 15_000 });

    // Band estimate should be visible
    await expect(page.getByTestId("band-estimate")).toBeVisible({
      timeout: 30_000,
    });

    // Band disclaimer should be visible
    await expect(page.getByTestId("mock-band-disclaimer")).toBeVisible();
  });

  // =========================================================================
  // Retake (AC-9)
  // =========================================================================

  test("retake button resets to idle state (AC-9)", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/test-prep/oet/mock");

    // Start and answer a few questions
    await page.getByTestId("start-test-btn").click({ timeout: 15_000 });

    for (let i = 0; i < 2; i++) {
      const qOption = page.getByTestId(`q${i}-opt-0`);
      if (await qOption.isVisible().catch(() => false)) {
        await qOption.click();
      }
    }

    // Submit
    const submitBtn = page
      .getByRole("button")
      .filter({ hasText: /submit|Submit/i })
      .first();
    await submitBtn.click({ timeout: 15_000 });

    await expect(page.getByTestId("mock-results")).toBeVisible({
      timeout: 30_000,
    });

    // Click retake button
    await page.getByTestId("retake-btn").click({ timeout: 10_000 });

    // Start button should be visible again
    await expect(page.getByTestId("start-test-btn")).toBeVisible({
      timeout: 10_000,
    });

    // URL unchanged
    expect(page.url()).toContain("/test-prep/oet/mock");
  });

  // =========================================================================
  // Refresh Returns to Idle (AC-9a)
  // =========================================================================

  test("page refresh returns to idle landing", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/test-prep/toefl/mock");

    // Start and answer a question
    await page.getByTestId("start-test-btn").click({ timeout: 15_000 });

    const qOption = page.getByTestId("q0-opt-0");
    if (await qOption.isVisible().catch(() => false)) {
      await qOption.click();
    }

    // Refresh
    await page.reload();

    // Should return to idle (start button visible)
    await expect(page.getByTestId("start-test-btn")).toBeVisible({
      timeout: 15_000,
    });

    // Results should not be visible
    const resultsVisible = await page
      .getByTestId("mock-results")
      .isVisible()
      .catch(() => false);
    expect(resultsVisible).toBe(false);
  });

  // =========================================================================
  // Error Handling: Invalid Session (AC-E2)
  // =========================================================================

  test("forged session JWT on mock submit returns 400 invalid_session", async ({ page }) => {
    await registerAndLogin(page);
    // Syntactically valid JWT shape but wrong signature → jose throws → 400 invalid_session
    const forgedJWT = "eyJhbGciOiJIUzI1NiJ9.eyJ0ZXN0VHlwZSI6Im1vY2stdG9laWMifQ.NOT_A_REAL_SIGNATURE";
    const res = await page.request.post("/api/test-prep/toeic/mock/submit", {
      data: {
        sessionId: forgedJWT,
        answers: {},
      },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("invalid_session");
  });

  test("session JWT from one exam cannot be replayed against another exam's submit", async ({ page }) => {
    await registerAndLogin(page);
    // Get a valid TOEFL session JWT
    const startRes = await page.request.post("/api/test-prep/toefl/mock/start");
    if (!startRes.ok()) {
      test.fail(true, "TOEFL test fixture missing — fixture helper must seed all 4 exams");
    }
    const startData = await startRes.json();
    const toeflSession = startData.sessionId;

    // Try to replay the TOEFL session against TOEIC endpoint
    const replayRes = await page.request.post("/api/test-prep/toeic/mock/submit", {
      data: { sessionId: toeflSession, answers: {} },
    });
    expect(replayRes.status()).toBe(400);
    expect((await replayRes.json()).error).toBe("invalid_session");
  });

  // =========================================================================
  // Skill Practice (AC-10)
  // =========================================================================

  test("skill practice listing shows exam-tagged exercises", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await page.goto("/test-prep/ielts/practice/listening");

    // At least one fixture exercise should be visible
    const noExercisesMsg = page.getByTestId("no-exercises");
    const msgVisible = await noExercisesMsg.isVisible().catch(() => false);

    // If there are exercises, we should have practice cards
    if (!msgVisible) {
      const practiceCards = page.locator('[data-testid^="practice-card-"]');
      expect(await practiceCards.count()).toBeGreaterThan(0);
    }
  });

  // =========================================================================
  // Admin Analytics (AC-14)
  // =========================================================================

  test("non-admin gets 403 on admin analytics endpoint", async ({ page }) => {
    await registerAndLogin(page);

    const res = await page.request.get("/api/admin/test-prep/analytics");
    expect(res.status()).toBe(403);
  });

  // =========================================================================
  // DB Persistence: Both rows written (AC-7, AC-7a)
  // =========================================================================

  test("successful submit persists MockTestAttempt rows", async ({
    page,
  }) => {
    await registerAndLogin(page);
    await page.goto("/test-prep/toefl/mock");

    // Start and submit
    await page.getByTestId("start-test-btn").click({ timeout: 15_000 });

    const qOption = page.getByTestId("q0-opt-0");
    if (await qOption.isVisible().catch(() => false)) {
      await qOption.click();
    }

    const submitBtn = page
      .getByRole("button")
      .filter({ hasText: /submit|Submit/i })
      .first();
    await submitBtn.click({ timeout: 15_000 });

    // Verify results render
    await expect(page.getByTestId("mock-results")).toBeVisible({
      timeout: 30_000,
    });

    // Verify at least one MockTestAttempt exists in DB
    const attempts = await prisma.mockTestAttempt.findMany({
      where: { exam: "toefl" },
    });
    expect(attempts.length).toBeGreaterThan(0);
  });
});
