import { test, expect } from "@playwright/test";

test("topbar search navigates to /search and shows lesson results", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("searchbar")).toBeVisible();
  await page.getByTestId("searchbar-input").fill("fox");
  await page.getByTestId("searchbar-input").press("Enter");
  await page.waitForURL(/\/search\?q=fox/);
  await expect(page.getByTestId("page-title")).toContainText(/Search/i);
  await expect(page.getByTestId("search-results")).toBeVisible();
  await expect(page.getByTestId("search-lesson-the-fox-and-the-grapes")).toBeVisible();
});

test("/search without q shows hint", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByTestId("page-title")).toContainText(/Search/i);
  await expect(page.getByTestId("search-results")).toHaveCount(0);
});

test("admin still sees the topbar search", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByTestId("login-email").fill("thieunv96@gmail.com");
  await page.getByTestId("login-password").fill("123");
  await page.getByTestId("login-submit").click({ force: true });
  await page.waitForURL(/\/admin(\?|$|\/)/);
  await expect(page.getByTestId("searchbar")).toBeVisible();
});
