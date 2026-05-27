import { test, expect } from "@playwright/test";
import { SHORT_STORY } from "./_fixtures";

test("anonymous user sees rating widget but clicking shows toast prompt", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto(`/lessons/${SHORT_STORY.category}/${SHORT_STORY.slug}`);
  await expect(page.getByTestId("lesson-rating")).toBeVisible();
  await page.getByTestId("star-4").click({ force: true });
  await expect(page.getByText(/sign in to rate/i)).toBeVisible();
});

test("logged-in learner can rate, aggregate updates", async ({ page }) => {
  const email = `rate-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret1");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/);

  await page.goto(`/lessons/${SHORT_STORY.category}/${SHORT_STORY.slug}`);
  await expect(page.getByTestId("lesson-rating")).toBeVisible();
  // Wait for the session to resolve so the rating control is enabled before
  // clicking — otherwise we race the /api/auth/session fetch (BUG-01/BUG-02).
  await expect(page.getByTestId("star-5")).toBeEnabled();
  await page.getByTestId("star-5").click({ force: true });
  await expect(page.getByText(/thanks/i).first()).toBeVisible();

  // Reload — rating persists.
  await page.reload();
  await expect(page.getByText(/you rated 5/i)).toBeVisible();
});
