import { test, expect } from "@playwright/test";
import { ADMIN, DEMO_USER, loginViaApi } from "./_helpers";

test.describe("Role-based routing", () => {
  test("Admin trying to access /, /lessons, /profile etc → redirects to /admin", async ({ page }) => {
    await loginViaApi(page, ADMIN);
    for (const path of ["/", "/profile", "/settings", "/feedback", "/help", "/onboarding"]) {
      const res = await page.goto(path);
      // After middleware redirect, URL must end up on /admin
      await expect(page).toHaveURL(/\/admin/, { timeout: 5_000 });
      expect(res?.status()).toBeLessThan(500);
    }
  });

  test("Non-admin user accessing /admin → bounced to /", async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/admin");
    await expect(page).toHaveURL("/", { timeout: 5_000 });
  });

  test("User logo click → /", async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/profile");
    // Logo is the first link in TopNav header
    await page.locator("header").getByRole("link", { name: /Vibe/ }).first().click();
    await page.waitForURL("/");
  });
});
