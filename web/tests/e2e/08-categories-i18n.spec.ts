import { test, expect } from "@playwright/test";
import { DEMO_USER, loginViaApi } from "./_helpers";

const TOTAL_CATEGORIES = 178;

test.describe("Categories i18n + master modal (per requirement)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
  });

  test("Default VI: slogan + category chips render in Vietnamese", async ({ page }) => {
    await page.goto("/");
    // Slogan in TopNav (VI)
    await expect(page.locator("header").getByText("Tự do học, tự tin nói")).toBeVisible();
    // Category section heading (VI)
    await expect(page.getByRole("heading", { name: /Khám phá theo chủ đề/ })).toBeVisible();
    // Visible chips use VI translations
    const catSection = page.locator("section").filter({ hasText: /Khám phá theo chủ đề/ });
    await expect(catSection.getByRole("button", { name: /Kinh doanh/ })).toBeVisible();
    await expect(catSection.getByRole("button", { name: /Du lịch/ })).toBeVisible();
  });

  test("EN locale via cookie: slogan + chips render in English", async ({ page, context }) => {
    await context.addCookies([
      { name: "NEXT_LOCALE", value: "en", domain: "localhost", path: "/" },
    ]);
    await page.goto("/");
    await expect(page.locator("header").getByText("Learn freely, speak confidently")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Discover by topic/ })).toBeVisible();
    const catSection = page.locator("section").filter({ hasText: /Discover by topic/ });
    await expect(catSection.getByRole("button", { name: /Business/ })).toBeVisible();
    await expect(catSection.getByRole("button", { name: /Travel/ })).toBeVisible();
  });

  test("Home only shows categories that have at least 1 lesson", async ({ page }) => {
    await page.goto("/");
    const catSection = page.locator("section").filter({ hasText: /Khám phá theo chủ đề/ });
    // "Fitness" exists in master list but has 0 lessons → must not appear as a top chip
    await expect(catSection.getByRole("button", { name: /^Fitness$|^Thể hình$/ })).toHaveCount(0);
    // "Cryptocurrency" / "Tiền điện tử" also 0 lessons
    await expect(catSection.getByRole("button", { name: /Cryptocurrency|Tiền điện tử/ })).toHaveCount(0);
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
    await expect(page.getByRole("button", { name: /Thể hình/ })).toBeVisible();
    // Clear → all 178 visible again (we sample a few far-apart entries)
    await searchBox.fill("");
    await expect(page.getByRole("button", { name: /Kinh doanh/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Tâm lý học/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Robot học/ })).toBeVisible();
  });

  test("Category-with-no-lessons in modal is disabled (no click filter)", async ({ page }) => {
    await page.goto("/");
    const catSection = page.locator("section").filter({ hasText: /Khám phá theo chủ đề/ });
    await catSection.getByRole("button", { name: new RegExp(`Xem tất cả \\(${TOTAL_CATEGORIES}\\)`) }).click();
    // Find a category that has no lessons (e.g. Fitness) via stable data-slug
    const fitnessBtn = page.locator('button[data-slug="fitness"]');
    await expect(fitnessBtn).toBeVisible();
    await expect(fitnessBtn).toBeDisabled();
  });

  test("Clicking a lesson-bearing category from modal applies filter + closes modal", async ({ page }) => {
    await page.goto("/");
    const catSection = page.locator("section").filter({ hasText: /Khám phá theo chủ đề/ });
    const allSection = page.locator("section").filter({ hasText: /Tất cả bài học/ });
    const beforeCount = await allSection.locator('a[href^="/lessons/"]').count();
    expect(beforeCount).toBeGreaterThan(0);

    await catSection.getByRole("button", { name: new RegExp(`Xem tất cả \\(${TOTAL_CATEGORIES}\\)`) }).click();
    // Scope to dialog so we don't accidentally hit the home-page chip with the same label
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Click "Giao tiếp" (communication, has 1 lesson) inside the dialog via stable data-slug
    await dialog.locator('button[data-slug="communication"]').click();
    // Modal closes
    await expect(dialog).toBeHidden();
    // Lesson list narrows
    const afterCount = await allSection.locator('a[href^="/lessons/"]').count();
    expect(afterCount).toBeLessThanOrEqual(beforeCount);
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
