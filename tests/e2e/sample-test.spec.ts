/**
 * E2E specs for the 10-Q sample test (auth-gated single-page flow).
 *
 * Anonymous visitors are redirected to /auth/login.
 * Logged-in users take the test and see inline results (no separate /results route).
 */

import { test, expect } from "@playwright/test";
import { completeTest, registerAndLogin } from "./_sample-test-helpers";

test.describe("10-Q Sample Test", () => {
  test("anonymous visitor to /sample-test is redirected to /auth/login", async ({ page }) => {
    await page.goto("/sample-test");
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("POST /api/sample-test/start without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/sample-test/start");
    expect(res.status()).toBe(401);
  });

  test("POST /api/sample-test/submit without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/sample-test/submit", {
      data: { sessionId: "x", answers: {} },
    });
    expect(res.status()).toBe(401);
  });

  test("start response carries exactly 10 questions and strips answers", async ({ page }) => {
    await registerAndLogin(page);
    const res = await page.request.post("/api/sample-test/start");
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.questions).toHaveLength(10);
    for (const q of data.questions) {
      expect(q.sourceExerciseSlug).toBeTruthy();
      expect(q.sourceExerciseSkill).toBeTruthy();
      expect((q as Record<string, unknown>).answer).toBeUndefined();
      if (q.pairs) {
        for (const p of q.pairs) expect(p.right).toBeUndefined();
      }
    }
  });

  test("forged session JWT on submit returns 400", async ({ page }) => {
    await registerAndLogin(page);
    const res = await page.request.post("/api/sample-test/submit", {
      data: { sessionId: "not-a-real-jwt", answers: {} },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("invalid_session");
  });

  test("logged-in user completes the test and sees inline results", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/sample-test");
    await page.getByTestId("start-test-btn").click();
    await completeTest(page);

    const results = page.getByTestId("sample-results");
    await expect(results).toBeVisible({ timeout: 15_000 });

    const score = page.getByTestId("results-score");
    await expect(score).toBeVisible();
    await expect(score).toContainText(/\d+\s*\/\s*10/);

    await expect(page.getByTestId("recommendations")).toBeVisible();
    await expect(page.getByTestId("question-review")).toBeVisible();
  });

  test("retake button resets the test back to the landing", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/sample-test");
    await page.getByTestId("start-test-btn").click();
    await completeTest(page);
    await expect(page.getByTestId("sample-results")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("retake-btn").click();
    await expect(page.getByTestId("start-test-btn")).toBeVisible({ timeout: 10_000 });
  });
});
