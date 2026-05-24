import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function loadFirstLesson(category: string): { slug: string; firstSegmentText: string } {
  const dir = path.join(process.cwd(), "src", "content", "lessons", category);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const data = JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf8"));
  return { slug: data.slug, firstSegmentText: data.segments[0].text };
}

test("logged-in user dictation progress appears on dashboard", async ({ page }) => {
  const email = `prog-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/dashboard/);

  const { slug, firstSegmentText } = loadFirstLesson("short-stories");
  await page.goto(`/lessons/short-stories/${slug}`);
  await page.getByTestId("dictation-input").fill(firstSegmentText);
  await page.getByTestId("dictation-submit").click({ force: true });
  await page.getByTestId("dictation-next").click({ force: true });
  await page.getByTestId("dictation-show-answer").click({ force: true });

  await page.waitForTimeout(700);

  await page.goto("/dashboard");
  await expect(page.getByTestId(`progress-${slug}`)).toBeVisible();
});
