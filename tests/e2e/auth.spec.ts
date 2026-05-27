import { test, expect } from "@playwright/test";

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

test("register → auto-login → dashboard", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/auth/register");
  await expect(page.getByTestId("register-form")).toBeVisible();
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret1");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/, { timeout: 15_000 });
  await expect(page.getByTestId("page-title")).toBeVisible();
});

test("logout → /dashboard redirects to /auth/login", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/dashboard");
  await page.waitForURL(/\/auth\/login/);
  await expect(page.getByTestId("login-form")).toBeVisible();
});

test("login form rejects bad credentials", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByTestId("login-email").fill("nope@example.com");
  await page.getByTestId("login-password").fill("wrongpass");
  await page.getByTestId("login-submit").click({ force: true });
  // Sonner toast: error text shows in the live region.
  await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
});
