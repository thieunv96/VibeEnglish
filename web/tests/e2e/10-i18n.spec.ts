import { test, expect } from "@playwright/test";

test.describe("i18n EN/VI switching", () => {
  test("Auth page renders VI by default", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: /Chào mừng trở lại/ })).toBeVisible();
    await expect(page.locator("h1").filter({ hasText: /Tự do học/ })).toBeVisible();
  });

  test("Setting NEXT_LOCALE=en cookie renders English", async ({ page, context }) => {
    await context.addCookies([
      { name: "NEXT_LOCALE", value: "en", url: "http://localhost:3001" },
    ]);
    await page.goto("/auth");
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
    await expect(page.locator("h1").filter({ hasText: /Learn freely/ })).toBeVisible();
    // Sign-in button text
    await expect(page.locator('form button[type="submit"]')).toContainText(/Sign in/);
  });
});
