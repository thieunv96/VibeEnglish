import { test, expect } from "@playwright/test";
import { DEMO_USER, loginViaApi } from "./_helpers";

test.describe("Màn 3 — Content Library (CONTEXT.md §5)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/");
  });

  test("TopNav: logo (+slogan) + streak chip + avatar; no Thư viện/Hồ sơ links", async ({ page }) => {
    await expect(page.locator("header").getByText("Vibe English").first()).toBeVisible();
    await expect(page.locator("header").getByText(/Learn freely, speak confidently/)).toBeVisible();
    // Library/Profile nav links removed (logo serves as library home, profile in dropdown)
    await expect(page.locator("header").getByRole("link", { name: "Thư viện" })).toHaveCount(0);
    await expect(page.locator("header").getByRole("link", { name: "Hồ sơ" })).toHaveCount(0);
    // Streak chip (demo user has 4 day streak from seed)
    await expect(page.locator("header").getByText("4").first()).toBeVisible();
    // Avatar trigger
    await expect(page.locator("header").getByTitle("Tài khoản")).toBeVisible();
  });

  test("Compact hero: greeting + name + level pill + 3 inline stat chips", async ({ page }) => {
    await expect(page.getByText(/Chào buổi/)).toBeVisible();
    const heroSection = page.locator("section").first();
    await expect(heroSection.getByText(/^B1/)).toBeVisible();
    await expect(heroSection.getByText(/Đã học:/)).toBeVisible();
    await expect(heroSection.getByText(/Streak:/)).toBeVisible();
    await expect(heroSection.getByText(/Tuần:/)).toBeVisible();
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
