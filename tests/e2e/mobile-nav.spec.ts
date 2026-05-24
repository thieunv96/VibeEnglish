import { test, expect, devices } from "@playwright/test";

// Pixel 7 is a Chromium-based device descriptor, no extra browser engine needed.
test.use({ ...devices["Pixel 7"] });

test("hamburger reveals primary nav links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("mobile-nav-open")).toBeVisible();
  await page.getByTestId("mobile-nav-open").click({ force: true });
  await expect(page.getByTestId("mobile-nav-panel")).toBeVisible();
  await expect(page.getByTestId("mobile-nav-link--lessons")).toBeVisible();
  await expect(page.getByTestId("mobile-nav-link--practice")).toBeVisible();
  await expect(page.getByTestId("mobile-nav-link--learn-from-youtube")).toBeVisible();

  await page.getByTestId("mobile-nav-link--lessons").click({ force: true });
  await page.waitForURL(/\/lessons$/);
});

test("mobile search opens fullscreen modal and navigates", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("searchbar-mobile-trigger")).toBeVisible();
  await page.getByTestId("searchbar-mobile-trigger").click({ force: true });
  await expect(page.getByTestId("searchbar-mobile-modal")).toBeVisible();
  await page.getByTestId("searchbar-mobile-input").fill("fox");
  await page.getByTestId("searchbar-mobile-input").press("Enter");
  await page.waitForURL(/\/search\?q=fox/);
});
