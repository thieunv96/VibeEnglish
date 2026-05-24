import { test, expect } from "@playwright/test";
import { SHORT_STORY } from "./_fixtures";

test("logged-in user dictation progress appears on dashboard", async ({ page }) => {
  const email = `prog-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/);

  await page.goto(`/lessons/${SHORT_STORY.category}/${SHORT_STORY.slug}`);
  await page.getByTestId("dictation-input").fill(SHORT_STORY.firstSegmentText);
  await page.getByTestId("dictation-submit").click({ force: true });
  await page.getByTestId("dictation-next").click({ force: true });
  await page.getByTestId("dictation-show-answer").click({ force: true });

  await page.waitForTimeout(700);

  await page.goto("/history");
  await page.waitForURL(/\/history/, { timeout: 10_000 });
  await expect(page.getByTestId(`history-progress-${SHORT_STORY.slug}`)).toBeVisible();
});
