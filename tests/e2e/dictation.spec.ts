import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function loadFirstLesson(category: string): { slug: string; firstSegmentText: string } {
  const dir = path.join(process.cwd(), "src", "content", "lessons", category);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const data = JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf8"));
  return { slug: data.slug, firstSegmentText: data.segments[0].text };
}

test("dictation marks correct input as all-ok", async ({ page }) => {
  const { slug, firstSegmentText } = loadFirstLesson("short-stories");
  await page.goto(`/lessons/short-stories/${slug}`);

  await expect(page.getByTestId("dictation-player")).toBeVisible();
  await page.getByTestId("dictation-input").fill(firstSegmentText);
  await page.getByTestId("dictation-submit").click({ force: true });

  const diff = page.getByTestId("dictation-diff");
  await expect(diff).toBeVisible();
  const okWords = diff.locator(".dict-ok");
  const total = diff.locator(":scope > p > span");
  await expect(okWords).toHaveCount(await total.count());
});

test("dictation flags wrong input as miss", async ({ page }) => {
  const { slug } = loadFirstLesson("short-stories");
  await page.goto(`/lessons/short-stories/${slug}`);

  await page.getByTestId("dictation-input").fill("complete garbage absolutely wrong text");
  await page.getByTestId("dictation-submit").click({ force: true });

  const missWords = page.getByTestId("dictation-diff").locator(".dict-miss");
  expect(await missWords.count()).toBeGreaterThan(0);
});

test("show-answer reveals correct text", async ({ page }) => {
  const { slug, firstSegmentText } = loadFirstLesson("short-stories");
  await page.goto(`/lessons/short-stories/${slug}`);
  await page.getByTestId("dictation-show-answer").click({ force: true });
  await expect(page.getByTestId("dictation-answer")).toContainText(firstSegmentText);
});
