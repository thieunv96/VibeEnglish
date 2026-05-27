import { test, expect } from "@playwright/test";
import { GRAMMAR_MCQ } from "./_fixtures";

async function answerAll(page: import("@playwright/test").Page) {
  for (let i = 0; i < GRAMMAR_MCQ.questionsAnswers.length; i++) {
    await page.getByTestId(`q${i}-opt-${GRAMMAR_MCQ.questionsAnswers[i]}`).check({ force: true });
  }
  await page.getByTestId("exercise-submit").click({ force: true });
}

test("MCQ exercise: answer all then submit shows score", async ({ page }) => {
  await page.goto(`/practice/${GRAMMAR_MCQ.skill}/${GRAMMAR_MCQ.slug}`);
  await expect(page.getByTestId("exercise-runner")).toBeVisible();
  await answerAll(page);
  await expect(page.getByTestId("exercise-score")).toBeVisible();
  await expect(page.getByTestId("exercise-score")).toContainText("100%");
});

test("logged-in attempt appears on dashboard", async ({ page }) => {
  const email = `att-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/);

  await page.goto(`/practice/${GRAMMAR_MCQ.skill}/${GRAMMAR_MCQ.slug}`);
  // Wait for the session to resolve so exercise-submit is enabled before
  // submitting — otherwise submitAll() races the session and skips the
  // /api/attempts POST (BUG-01/BUG-02).
  await expect(page.getByTestId("exercise-submit")).toBeEnabled();
  await answerAll(page);
  await expect(page.getByTestId("exercise-score")).toBeVisible();
  await page.waitForTimeout(500);

  await page.goto("/history");
  await expect(page.getByTestId(`history-attempt-${GRAMMAR_MCQ.slug}`)).toBeVisible();
});
