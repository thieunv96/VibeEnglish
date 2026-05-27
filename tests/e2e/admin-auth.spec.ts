import { test, expect } from "@playwright/test";

test("unauthenticated /admin redirects to login", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/admin");
  await page.waitForURL(/\/auth\/login/);
  await expect(page.getByTestId("login-form")).toBeVisible();
});

test("non-admin user sees 403 on /admin", async ({ page }) => {
  const email = `nonadmin-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret1");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/);

  await page.goto("/admin");
  await expect(page.getByTestId("page-title")).toContainText(/403|Admins only/);
});

test("admin user can open /admin dashboard", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByTestId("login-email").fill("thieunv96@gmail.com");
  await page.getByTestId("login-password").fill("123");
  await page.getByTestId("login-submit").click({ force: true });
  // Admin: form pushes to /profile, which then server-redirects to /admin.
  await page.waitForURL(/\/admin(\?|$|\/)/, { timeout: 20_000 });
  await expect(page.getByTestId("page-title")).toContainText(/Dashboard/);
});
