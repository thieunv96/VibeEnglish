import { test, expect } from "@playwright/test";
import { DEMO_USER, loginViaApi } from "./_helpers";

const TOTAL_CATEGORIES = 178;

test.describe("Categories i18n + master modal (per requirement)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
  });

  test("Default VI: slogan + category tiles render in Vietnamese", async ({ page }) => {
    await page.goto("/");
    // Slogan in TopNav (VI)
    await expect(page.locator("header").getByText("Tự do học, tự tin nói")).toBeVisible();
    // Category section heading (VI)
    await expect(page.getByRole("heading", { name: /Khám phá theo chủ đề/ })).toBeVisible();
    // Visible tiles use VI translations
    const catSection = page.locator("section").filter({ hasText: /Khám phá theo chủ đề/ });
    await expect(catSection.getByRole("link", { name: /Kinh doanh/ })).toBeVisible();
    await expect(catSection.getByRole("link", { name: /Du lịch/ })).toBeVisible();
  });

  test("EN locale via cookie: slogan + tiles render in English", async ({ page, context }) => {
    await context.addCookies([
      { name: "NEXT_LOCALE", value: "en", domain: "localhost", path: "/" },
    ]);
    await page.goto("/");
    await expect(page.locator("header").getByText("Learn freely, speak confidently")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Discover by topic/ })).toBeVisible();
    const catSection = page.locator("section").filter({ hasText: /Discover by topic/ });
    await expect(catSection.getByRole("link", { name: /Business/ })).toBeVisible();
    await expect(catSection.getByRole("link", { name: /Travel/ })).toBeVisible();
  });

  test("Home only shows categories that have at least 1 lesson", async ({ page }) => {
    await page.goto("/");
    const catSection = page.locator("section").filter({ hasText: /Khám phá theo chủ đề/ });
    // "Fitness" exists in master list but has 0 lessons → must not appear as a top tile
    await expect(catSection.getByRole("link", { name: /^Fitness$|^Thể hình$/ })).toHaveCount(0);
    // "Cryptocurrency" / "Tiền điện tử" also 0 lessons
    await expect(catSection.getByRole("link", { name: /Cryptocurrency|Tiền điện tử/ })).toHaveCount(0);
  });

  test('"Xem tất cả (178)" opens modal with all 178 entries + search filter', async ({ page }) => {
    await page.goto("/");
    const catSection = page.locator("section").filter({ hasText: /Khám phá theo chủ đề/ });
    await catSection.getByRole("button", { name: new RegExp(`Xem tất cả \\(${TOTAL_CATEGORIES}\\)`) }).click();
    // Modal title + total mentioned
    await expect(page.getByRole("heading", { name: /Tất cả chủ đề/ })).toBeVisible();
    await expect(page.getByText(new RegExp(`${TOTAL_CATEGORIES} chủ đề`))).toBeVisible();
    // Search "fitness" → should match the Vietnamese name "Thể hình" via slug filter
    const searchBox = page.getByPlaceholder(/Tìm chủ đề/);
    await searchBox.fill("fitness");
    // Modal entries are now <Link>s with data-slug, scoped by dialog
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator('a[data-slug="fitness"]')).toBeVisible();
    // Clear → all 178 visible again
    await searchBox.fill("");
    await expect(dialog.locator('a[data-slug="business"]')).toBeVisible();
    await expect(dialog.locator('a[data-slug="psychology"]')).toBeVisible();
    await expect(dialog.locator('a[data-slug="robotics"]')).toBeVisible();
  });

  test("Category-with-no-lessons in modal is non-clickable (pointer-events: none)", async ({ page }) => {
    await page.goto("/");
    const catSection = page.locator("section").filter({ hasText: /Khám phá theo chủ đề/ });
    await catSection.getByRole("button", { name: new RegExp(`Xem tất cả \\(${TOTAL_CATEGORIES}\\)`) }).click();
    // Find a category that has no lessons (e.g. Fitness) via stable data-slug
    const fitnessLink = page.locator('a[data-slug="fitness"]');
    await expect(fitnessLink).toBeVisible();
    // No-lesson entries get cursor-not-allowed + pointer-events-none + href "#"
    await expect(fitnessLink).toHaveAttribute("href", "#");
    await expect(fitnessLink).toHaveClass(/pointer-events-none/);
  });

  test("Clicking a lesson-bearing category from modal navigates to ?cat= + closes modal", async ({ page }) => {
    await page.goto("/");
    const catSection = page.locator("section").filter({ hasText: /Khám phá theo chủ đề/ });
    await catSection.getByRole("button", { name: new RegExp(`Xem tất cả \\(${TOTAL_CATEGORIES}\\)`) }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Click "Giao tiếp" (communication, has 1 lesson) inside the dialog via stable data-slug
    await dialog.locator('a[data-slug="communication"]').click();
    await page.waitForURL(/\?cat=/);
    // Modal closes
    await expect(dialog).toBeHidden();
    // All-lessons section narrows (communication has 1 lesson)
    const allSection = page.locator("section").filter({ hasText: /Tất cả bài học/ });
    const afterCount = await allSection.locator('a[href^="/lessons/"]:not([href$="/study"])').count();
    expect(afterCount).toBeGreaterThan(0);
  });
});

test.describe("Admin /admin/categories is now read-only (tag-style list)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, { email: "thieunv96@gmail.com", password: "123" });
  });

  test("Read-only table: 178 rows, no Add/Edit/Delete controls", async ({ page }) => {
    await page.goto("/admin/categories");
    await expect(page.getByRole("heading", { name: /Categories \(tag\)/ })).toBeVisible();
    // Total counter shows 178
    await expect(page.getByText(/Tổng:/).locator("strong")).toHaveText(String(TOTAL_CATEGORIES));
    // No "Thêm category" button exists anywhere
    await expect(page.getByRole("button", { name: /Thêm category|Add category/ })).toHaveCount(0);
    // No delete trash icons
    await expect(page.locator("button[title='Xoá']")).toHaveCount(0);
    // Sample row content (first row should be the master-list first entry: daily-life / Đời sống hàng ngày)
    await expect(page.getByText("daily-life").first()).toBeVisible();
    await expect(page.getByText("Đời sống hàng ngày").first()).toBeVisible();
  });
});
