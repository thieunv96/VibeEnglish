import { test, expect } from "@playwright/test";
import { SHORT_STORY } from "./_fixtures";

test("dictation marks correct input as all-ok", async ({ page }) => {
  await page.goto(`/lessons/${SHORT_STORY.category}/${SHORT_STORY.slug}`);
  await expect(page.getByTestId("dictation-player")).toBeVisible();
  await page.getByTestId("dictation-input").fill(SHORT_STORY.firstSegmentText);
  await page.getByTestId("dictation-submit").click({ force: true });

  const diff = page.getByTestId("dictation-diff");
  await expect(diff).toBeVisible();
  const okWords = diff.locator(".dict-ok");
  const total = diff.locator(":scope > p > span");
  await expect(okWords).toHaveCount(await total.count());
});

test("dictation flags wrong input as miss", async ({ page }) => {
  await page.goto(`/lessons/${SHORT_STORY.category}/${SHORT_STORY.slug}`);
  await page.getByTestId("dictation-input").fill("complete garbage absolutely wrong text");
  await page.getByTestId("dictation-submit").click({ force: true });
  const missWords = page.getByTestId("dictation-diff").locator(".dict-miss");
  expect(await missWords.count()).toBeGreaterThan(0);
});

test("show-answer reveals correct text", async ({ page }) => {
  await page.goto(`/lessons/${SHORT_STORY.category}/${SHORT_STORY.slug}`);
  await page.getByTestId("dictation-show-answer").click({ force: true });
  await expect(page.getByTestId("dictation-answer")).toContainText(SHORT_STORY.firstSegmentText);
});
