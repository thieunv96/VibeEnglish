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

  test("Plain hero: greeting + big stat cards (no gradient bg)", async ({ page }) => {
    await expect(page.getByText(/Chào buổi/)).toBeVisible();
    // Greeting heading (firstname + 👋)
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    // 3 BigStat cards (Đã học / Streak / Tuần này)
    await expect(page.getByText("Đã học", { exact: true })).toBeVisible();
    await expect(page.getByText("Streak", { exact: true })).toBeVisible();
    await expect(page.getByText("Tuần này", { exact: true })).toBeVisible();
    // Level → target mention in subtitle
    await expect(page.getByText(/Level/).first()).toBeVisible();
  });

  test('"Khám phá theo chủ đề" categories chips visible', async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Khám phá theo chủ đề/ })).toBeVisible();
    const catSection = page.locator("section").filter({ hasText: /Khám phá theo chủ đề/ });
    // Seed has 8 categories
    await expect(catSection.getByRole("button", { name: /Kinh doanh/ })).toBeVisible();
    await expect(catSection.getByRole("button", { name: /Ẩm thực/ })).toBeVisible();
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
    const allSection = page.locator("section").filter({ hasText: /Tất cả bài học/ });
    await expect(allSection.getByRole("button", { name: "Tất cả", exact: true })).toBeVisible();
    await expect(allSection.getByRole("button", { name: /Video → Quiz/ })).toBeVisible();
    await expect(allSection.getByRole("button", { name: /Speaking/ }).first()).toBeVisible();
    await expect(allSection.getByRole("button", { name: /Writing/ }).first()).toBeVisible();
  });

  test("Filter chip narrows lessons in realtime", async ({ page }) => {
    const allSection = page.locator("section").filter({ hasText: /Tất cả bài học/ });
    const beforeCount = await allSection.locator('a[href^="/lessons/"]').count();
    expect(beforeCount).toBeGreaterThan(0);

    await allSection.getByRole("button", { name: /Video → Quiz/ }).click();
    await page.waitForTimeout(200);
    const afterCount = await allSection.locator('a[href^="/lessons/"]').count();
    expect(afterCount).toBeLessThanOrEqual(beforeCount);

    await allSection.getByRole("button", { name: "Tất cả", exact: true }).click();
    await page.waitForTimeout(200);
    expect(await allSection.locator('a[href^="/lessons/"]').count()).toEqual(beforeCount);
  });

  test("Category filter narrows lessons", async ({ page }) => {
    const allSection = page.locator("section").filter({ hasText: /Tất cả bài học/ });
    const beforeCount = await allSection.locator('a[href^="/lessons/"]').count();
    // Filter by "Kinh doanh" (3 published lessons in seed are business)
    await page
      .locator("section")
      .filter({ hasText: /Khám phá theo chủ đề/ })
      .getByRole("button", { name: /Kinh doanh/ })
      .click();
    await page.waitForTimeout(200);
    const afterCount = await allSection.locator('a[href^="/lessons/"]').count();
    expect(afterCount).toBeLessThanOrEqual(beforeCount);
    expect(afterCount).toBeGreaterThan(0);
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

  test("Click lesson card navigates to preview /lessons/[id] (not /study)", async ({ page }) => {
    const firstCard = page.locator('a[href^="/lessons/"]').first();
    const href = await firstCard.getAttribute("href");
    expect(href).toMatch(/^\/lessons\/[^/]+$/);
    await firstCard.click();
    await page.waitForURL(/\/lessons\/[^/]+$/);
  });

  test("Topbar has global search + level→target chip", async ({ page }) => {
    const header = page.locator("header");
    await expect(header.getByPlaceholder(/Tìm bài học/)).toBeVisible();
    // Level chip B1 → B2 (demo user from seed)
    await expect(header.getByText(/B1/)).toBeVisible();
    await expect(header.getByText("→").first()).toBeVisible();
    await expect(header.getByText(/B2/)).toBeVisible();
  });
});

test.describe("Lesson preview (Coursera-style)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/");
  });

  test("Preview shows lesson info + Bắt đầu học CTA → /study", async ({ page }) => {
    const firstCard = page.locator('a[href^="/lessons/"]').first();
    const href = (await firstCard.getAttribute("href"))!;
    await page.goto(href);

    // Preview elements
    await expect(page.getByRole("heading", { name: /Stand-up meeting|Daily English|Email opener|Pronunciation|Conditional|Listening|Reading/ }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Về bài học này/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Bạn sẽ luyện/ })).toBeVisible();

    // CTA link to /study
    const cta = page.getByRole("link", { name: /Bắt đầu học|Tiếp tục học|Học lại/ }).first();
    await expect(cta).toBeVisible();
    await cta.click();
    await page.waitForURL(/\/lessons\/[^/]+\/study/);
  });
});
