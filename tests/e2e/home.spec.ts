import { test, expect } from "@playwright/test";

test("homepage renders every section", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/VibeEnglish/i);

  await expect(page.getByTestId("hero-title")).toBeVisible();
  await expect(page.getByTestId("hero-ctas").getByRole("link", { name: /start lessons/i })).toBeVisible();

  // Stats banner has 5 cells
  const statsCells = page.getByTestId("stats").locator("> div");
  await expect(statsCells).toHaveCount(5);

  // 4-step process
  const steps = page.getByTestId("steps").locator("> li");
  await expect(steps).toHaveCount(4);

  // 9 category cards
  const categories = page.getByTestId("categories").locator("a");
  await expect(categories).toHaveCount(9);

  // 8 skill cards
  const skills = page.getByTestId("skills").locator("a");
  await expect(skills).toHaveCount(8);

  // CEFR table has 6 levels
  const cefrRows = page.getByTestId("cefr-table").locator("tbody tr");
  await expect(cefrRows).toHaveCount(6);

  // 6 feature blocks
  const features = page.getByTestId("features").locator("> article, > div");
  await expect(features).toHaveCount(6);

  // 4 exam cards
  const exams = page.getByTestId("exams").locator("> div");
  await expect(exams).toHaveCount(4);

  // FAQ accordion: 9 items, the first one is open
  const faqs = page.getByTestId("faq-item");
  await expect(faqs).toHaveCount(9);

  // Footer copyright
  await expect(page.getByText(/Free English learning for everyone/i)).toBeVisible();

  // Best-effort screenshot — viewport only, ignore failure.
  try {
    await page.screenshot({ path: "tests/screenshots/home.png", fullPage: false, timeout: 5000 });
  } catch { /* ignore */ }
});

test("homepage hero CTA navigates to /lessons", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("hero-ctas").getByRole("link", { name: "Start Lessons Free", exact: true }).click({ force: true });
  await expect(page).toHaveURL(/\/lessons$/);
  await expect(page.getByTestId("page-title")).toBeVisible();
});
