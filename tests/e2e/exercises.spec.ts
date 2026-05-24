import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

test("MCQ exercise: answer all then submit shows score", async ({ page }) => {
  const dir = path.join(process.cwd(), "src", "content", "exercises", "grammar");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const data = JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf8"));

  await page.goto(`/practice/grammar/${data.slug}`);
  await expect(page.getByTestId("exercise-runner")).toBeVisible();

  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    if (q.type === "mcq" && q.options) {
      const ans = Array.isArray(q.answer) ? q.answer[0] : q.answer;
      await page.getByTestId(`q${i}-opt-${ans}`).check({ force: true });
    } else if (q.type === "fill") {
      const ans = Array.isArray(q.answer) ? q.answer[0] : q.answer;
      await page.getByTestId(`q${i}-fill`).fill(String(ans));
    }
  }

  await page.getByTestId("exercise-submit").click({ force: true });
  await expect(page.getByTestId("exercise-score")).toBeVisible();
  await expect(page.getByTestId("exercise-score")).toContainText("100%");
});

test("logged-in attempt appears on dashboard", async ({ page }) => {
  const email = `att-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/dashboard/);

  const dir = path.join(process.cwd(), "src", "content", "exercises", "grammar");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const data = JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf8"));

  await page.goto(`/practice/grammar/${data.slug}`);
  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    if (q.type === "mcq" && q.options) {
      const ans = Array.isArray(q.answer) ? q.answer[0] : q.answer;
      await page.getByTestId(`q${i}-opt-${ans}`).check({ force: true });
    } else if (q.type === "fill") {
      const ans = Array.isArray(q.answer) ? q.answer[0] : q.answer;
      await page.getByTestId(`q${i}-fill`).fill(String(ans));
    }
  }
  await page.getByTestId("exercise-submit").click({ force: true });
  await expect(page.getByTestId("exercise-score")).toBeVisible();
  await page.waitForTimeout(500);

  await page.goto("/dashboard");
  await expect(page.getByTestId(`attempt-${data.slug}`)).toBeVisible();
});
