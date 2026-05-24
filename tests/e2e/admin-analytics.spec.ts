import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/auth/login");
  await page.getByTestId("login-email").fill("thieunv96@gmail.com");
  await page.getByTestId("login-password").fill("123");
  await page.getByTestId("login-submit").click({ force: true });
  await page.waitForURL(/\/admin(\?|$|\/)/);
}

test("/admin/analytics renders overview tiles + activity feed", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/analytics");
  await expect(page.getByTestId("page-title")).toContainText(/Analytics/);
  await expect(page.getByTestId("overview-tiles")).toBeVisible();
  await expect(page.getByTestId("sparkline")).toBeVisible();
});

test("/admin/analytics/lessons renders sortable table", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/analytics/lessons");
  await expect(page.getByTestId("page-title")).toContainText(/Lessons performance/);
  await expect(page.getByTestId("analytics-lesson-list").locator("tr")).not.toHaveCount(0);
  // Sort link works (URL changes).
  await page.getByRole("link", { name: /Attempts/i }).click({ force: true });
  await page.waitForURL(/sort=attempts/);
});

test("/admin/analytics/users renders age + locale + top-time tables", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/analytics/users");
  await expect(page.getByTestId("age-brackets")).toBeVisible();
  await expect(page.getByTestId("locale-breakdown")).toBeVisible();
  await expect(page.getByTestId("top-time")).toBeVisible();
});

test("/admin/analytics/engagement renders DAU/WAU/MAU + staleness", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/analytics/engagement");
  await expect(page.getByTestId("page-title")).toContainText(/Engagement/);
  await expect(page.getByTestId("staleness")).toBeVisible();
});

test("non-admin cannot see /admin/analytics", async ({ page }) => {
  const email = `na-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/);

  await page.goto("/admin/analytics");
  await expect(page.getByTestId("page-title")).toContainText(/403|Admins only/);
});
