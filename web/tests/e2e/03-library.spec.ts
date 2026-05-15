import { test, expect } from "@playwright/test";
import { DEMO_USER, loginViaApi } from "./_helpers";

test.describe("Màn 3 — Content Library (CONTEXT.md §5)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/");
  });

  test("TopNav: logo, streak chip, bell, avatar, nav links", async ({ page }) => {
    // Logo + tagline
    await expect(page.locator("header").getByText(/Vibe/).first()).toBeVisible();
    await expect(page.getByText(/Tự do học/)).toBeVisible();

    // Nav links Thư viện active, Hồ sơ
    await expect(page.getByRole("link", { name: "Thư viện" })).toHaveClass(/text-brand-700/);
    await expect(page.getByRole("link", { name: "Hồ sơ" })).toBeVisible();

    // Streak chip (demo user has 4 day streak from seed)
    await expect(page.locator("header").getByText(/4/)).toBeVisible();
  });

  test("Hero: greeting + name + 3 stat cards + level badge", async ({ page }) => {
    // Greeting (one of the time-of-day variations)
    await expect(page.getByText(/Chào buổi/)).toBeVisible();
    // 3 stat cards
    await expect(page.getByText(/Bài hoàn thành/)).toBeVisible();
    await expect(page.getByText(/Cần luyện|Kỹ năng/)).toBeVisible();
    await expect(page.getByText(/Tiến độ tuần/)).toBeVisible();
    // Level badge (demo user is B1)
    await expect(page.locator("header").locator("..").getByText("B1").first()).toBeVisible();
  });

  test('Section "Gợi ý cho bạn" with up to 3 recommended cards', async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Gợi ý cho bạn/ })).toBeVisible();
    const recSection = page.locator("section").filter({ hasText: /Gợi ý cho bạn/ });
    const recCards = recSection.locator('a[href^="/lessons/"]');
    const count = await recCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(3);
  });

  test('Section "Tất cả bài học" with filter chips + grid/list toggle', async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Tất cả bài học/ })).toBeVisible();
    // Filter chips ("Tất cả" exact distinguishes from "Xem tất cả" links above)
    await expect(page.getByRole("button", { name: "Tất cả", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Video → Quiz/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Quiz$/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Speaking/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Writing/ }).first()).toBeVisible();
  });

  test("Filter chip narrows lessons in realtime", async ({ page }) => {
    const allSection = page.locator("section").filter({ hasText: /Tất cả bài học/ });
    const beforeCount = await allSection.locator('a[href^="/lessons/"]').count();
    expect(beforeCount).toBeGreaterThan(0);

    // Apply a filter; count should drop or stay equal — never grow
    await page.getByRole("button", { name: /Video → Quiz/ }).first().click();
    await page.waitForTimeout(200);
    const afterCount = await allSection.locator('a[href^="/lessons/"]').count();
    expect(afterCount).toBeLessThanOrEqual(beforeCount);

    // Reset to "Tất cả" should restore count
    await page.getByRole("button", { name: "Tất cả", exact: true }).click();
    await page.waitForTimeout(200);
    expect(await allSection.locator('a[href^="/lessons/"]').count()).toEqual(beforeCount);
  });

  test("Search input filters realtime by title", async ({ page }) => {
    const searchBox = page.getByPlaceholder(/Tìm theo tên/);
    await searchBox.fill("Stand-up");
    await expect(page.getByText("Stand-up meeting: introduction & blockers").first()).toBeVisible();
    // Type something that doesn't match — empty state
    await searchBox.fill("xyz-nothing-matches");
    await expect(page.getByText(/Không có bài học phù hợp/)).toBeVisible();
  });

  test("Grid → List toggle changes layout", async ({ page }) => {
    // List toggle button (icon-only)
    const toggles = page.locator("button[title='Lưới'], button[title='Danh sách']");
    await expect(toggles).toHaveCount(2);
    await page.locator("button[title='Danh sách']").click();
    // After switching to list, items should be in flex-col layout
    // Verify by checking the first list-style row has the icon + title + badge structure (no aspect-video)
    const firstRow = page.locator("section").filter({ hasText: /Tất cả bài học/ }).locator('a[href^="/lessons/"]').first();
    await expect(firstRow.locator(".aspect-video")).toHaveCount(0);
  });

  test('Section "Đã hoàn thành" shows when user has completed lessons', async ({ page }) => {
    // Demo user has 3 completed attempts from seed
    await expect(page.getByRole("heading", { name: /Đã hoàn thành/ })).toBeVisible();
  });

  test("Click lesson card navigates to /lessons/[id]", async ({ page }) => {
    const firstCard = page.locator('a[href^="/lessons/"]').first();
    const href = await firstCard.getAttribute("href");
    expect(href).toMatch(/^\/lessons\//);
    await firstCard.click();
    await page.waitForURL(/\/lessons\//);
  });
});
