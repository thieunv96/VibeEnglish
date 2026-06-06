/**
 * E2E specs for the 25-Q CEFR placement test (auth-gated single-page flow).
 *
 * Anonymous visitors are redirected to /auth/login.
 * The disclaimer renders server-side on the landing page before the test starts.
 * Logged-in users take the test and see inline results with the CEFR estimate.
 */

import { test, expect } from "@playwright/test";
import { completeTest, registerAndLogin } from "./_sample-test-helpers";

const DISCLAIMER_EN =
  "Please note: this is not an official exam. Your score is only a guide and not proof of language ability.";

test.describe("25-Q CEFR Placement Test", () => {
  test("anonymous visitor to /sample-test/cefr is redirected to /auth/login", async ({ page }) => {
    await page.goto("/sample-test/cefr");
    await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("POST /api/sample-test/cefr/start without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/sample-test/cefr/start");
    expect(res.status()).toBe(401);
  });

  test("POST /api/sample-test/cefr/submit without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/sample-test/cefr/submit", {
      data: { sessionId: "x", answers: {} },
    });
    expect(res.status()).toBe(401);
  });

  test("disclaimer is server-rendered on the landing (raw HTML before hydration)", async ({
    page,
    request,
  }) => {
    await registerAndLogin(page);
    // Reuse the authenticated session cookies so the SSR landing renders.
    const cookies = await page.context().cookies();
    const headers: Record<string, string> = {
      cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; "),
    };
    const res = await request.get("/sample-test/cefr", { headers });
    const html = await res.text();
    expect(html).toContain(DISCLAIMER_EN);
  });

  test("start response carries exactly 25 questions stratified across CEFR levels", async ({ page }) => {
    await registerAndLogin(page);
    const res = await page.request.post("/api/sample-test/cefr/start");
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data.questions).toHaveLength(25);
    // At least three distinct source levels should be represented under realistic content.
    const levels = new Set(data.questions.map((q: { sourceExerciseLevel?: string }) => q.sourceExerciseLevel));
    expect(levels.size).toBeGreaterThanOrEqual(3);
    for (const q of data.questions) {
      expect((q as Record<string, unknown>).answer).toBeUndefined();
      if (q.pairs) for (const p of q.pairs) expect(p.right).toBeUndefined();
    }
  });

  test("forged session JWT on CEFR submit returns 400", async ({ page }) => {
    await registerAndLogin(page);
    const res = await page.request.post("/api/sample-test/cefr/submit", {
      data: { sessionId: "not-a-real-jwt", answers: {} },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("invalid_session");
  });

  test("logged-in user completes CEFR test and sees inline results with estimate", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/sample-test/cefr");
    await page.getByTestId("cefr-start-btn").click();
    await completeTest(page);

    await expect(page.getByTestId("cefr-results")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("cefr-results-score")).toContainText(/\d+\s*\/\s*25/);
    await expect(page.getByTestId("question-review")).toBeVisible();
  });

  test("retake button resets CEFR test back to the landing", async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/sample-test/cefr");
    await page.getByTestId("cefr-start-btn").click();
    await completeTest(page);
    await expect(page.getByTestId("cefr-results")).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("cefr-retake-btn").click();
    await expect(page.getByTestId("cefr-start-btn")).toBeVisible({ timeout: 10_000 });
  });
});
