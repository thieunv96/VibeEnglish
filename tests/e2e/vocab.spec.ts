import { test, expect } from "@playwright/test";
import { SHORT_STORY } from "./_fixtures";

test("save a word from lesson → appears on dashboard → delete works", async ({ page }) => {
  const email = `vocab-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/);

  await page.goto(`/lessons/${SHORT_STORY.category}/${SHORT_STORY.slug}`);
  const firstSave = page.getByTestId("save-word").first();
  await expect(firstSave).toBeVisible();
  const wordLabel = await firstSave.textContent();
  const match = wordLabel?.match(/"([^"]+)"|“([^”]+)”/);
  const word = (match?.[1] ?? match?.[2] ?? "").toLowerCase();
  expect(word).not.toBe("");
  // Wait for the session to resolve so the save control is enabled before
  // clicking — otherwise we race the /api/auth/session fetch (BUG-01/BUG-02).
  await expect(firstSave).toBeEnabled();
  await firstSave.click({ force: true });
  await expect(firstSave).toContainText("Saved");

  await page.goto("/vocab");
  await page.waitForURL(/\/vocab/, { timeout: 10_000 });
  await expect(page.getByTestId(`vocab-${word}`)).toBeVisible();

  await page.getByTestId(`delete-vocab-${word}`).click({ force: true });
  await expect(page.getByTestId(`vocab-${word}`)).toHaveCount(0);
});
