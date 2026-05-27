import { test, expect } from "@playwright/test";

test("learner sees avatar dropdown with Profile/Vocab/History/Sign out", async ({ page }) => {
  const email = `am-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret1");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/);

  await page.getByTestId("avatar-menu-trigger").click({ force: true });
  await expect(page.getByTestId("avatar-menu-panel")).toBeVisible();
  await expect(page.getByTestId("avatar-menu-profile")).toBeVisible();
  await expect(page.getByTestId("avatar-menu-vocab")).toBeVisible();
  await expect(page.getByTestId("avatar-menu-history")).toBeVisible();
  await expect(page.getByTestId("avatar-menu-signout")).toBeVisible();

  await page.getByTestId("avatar-menu-vocab").click({ force: true });
  await page.waitForURL(/\/vocab/);
  await expect(page.getByTestId("page-title")).toContainText(/My vocabulary/i);
});

test("unauthenticated user sees Sign In link, no avatar", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await expect(page.getByTestId("avatar-menu")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
});
