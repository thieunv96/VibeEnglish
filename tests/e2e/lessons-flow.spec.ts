import { test, expect } from "@playwright/test";

test("/lessons → short-stories → A1 filter → click a lesson", async ({ page }) => {
  await page.goto("/lessons");
  await expect(page.getByTestId("page-title")).toBeVisible();

  const categories = page.getByTestId("category-list").locator("a");
  await expect(categories).toHaveCount(9);

  await page.getByTestId("category-list").getByRole("link", { name: /Short Stories/ }).first().click({ force: true });
  await expect(page).toHaveURL(/\/lessons\/short-stories/);
  await expect(page.getByTestId("page-title")).toContainText(/Short Stories/i);

  const totalRows = await page.getByTestId("lesson-row").count();
  expect(totalRows).toBeGreaterThan(0);

  // Filter by A1
  await page.getByTestId("filter-A1").click({ force: true });
  await page.waitForURL(/level=A1/);
  const a1Rows = page.getByTestId("lesson-row");
  const a1Count = await a1Rows.count();
  expect(a1Count).toBeGreaterThan(0);
  for (let i = 0; i < a1Count; i++) {
    await expect(a1Rows.nth(i)).toHaveAttribute("data-level", "A1");
  }

  // Reset filter
  await page.getByTestId("filter-All").click({ force: true });
  await expect(page.getByTestId("lesson-row").first()).toBeVisible();

  // Click into the first lesson
  await page.getByRole("link", { name: /^Start$/i }).first().click({ force: true });
  await expect(page).toHaveURL(/\/lessons\/short-stories\//);
  await expect(page.getByTestId("lesson-title")).toBeVisible();
  await expect(page.getByTestId("dictation-player")).toBeVisible();

  try {
    await page.screenshot({ path: "tests/screenshots/lesson.png", fullPage: false, timeout: 5000 });
  } catch { /* ignore */ }
});
