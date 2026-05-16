import { test, expect } from "@playwright/test";
import { DEMO_USER, loginViaApi } from "./_helpers";

test.describe("Màn 3 — Content Library (CONTEXT.md §5)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/");
  });

  test("TopNav (Coursera-style): logo + slogan + search center + help/bell/avatar; no nav links + no inline chips", async ({ page }) => {
    await expect(page.locator("header").getByText("Vibe English").first()).toBeVisible();
    // Default locale is VI ("Tự do học, tự tin nói"); EN renders "Learn freely, speak confidently"
    await expect(page.locator("header").getByText(/Tự do học, tự tin nói|Learn freely, speak confidently/)).toBeVisible();
    // Library/Profile nav links removed (logo serves as library home, profile in dropdown)
    await expect(page.locator("header").getByRole("link", { name: "Thư viện" })).toHaveCount(0);
    await expect(page.locator("header").getByRole("link", { name: "Hồ sơ" })).toHaveCount(0);
    // Stats moved out of TopNav into hero — TopNav now has only help + bell + account
    await expect(page.locator("header").getByTitle("Trợ giúp")).toBeVisible();
    await expect(page.locator("header").getByTitle("Thông báo")).toBeVisible();
    await expect(page.locator("header").getByTitle("Tài khoản")).toBeVisible();
  });

  test("Header (Coursera-style): personalized h1 + thin meta line, no hero CTA", async ({ page }) => {
    // h1 is the Coursera-style personalized greeting
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(/Rất vui được gặp bạn/);
    // Meta line below — level + target + today goal
    await expect(page.getByText(/B1.*mục tiêu B2/)).toBeVisible();
    // No hero CTA button (Coursera homepage dives straight into content)
    await expect(page.getByRole("link", { name: /Tiếp tục lộ trình/ })).toHaveCount(0);
  });

  test('"Khám phá theo chủ đề" category tiles visible', async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Khám phá theo chủ đề/ })).toBeVisible();
    const catSection = page.locator("section").filter({ hasText: /Khám phá theo chủ đề/ });
    // Master list has 178 fixed categories; home only shows those with lessons as tile links
    // (seed: business=4, communication=1, technology=1, travel=1, education=1).
    await expect(catSection.getByRole("link", { name: /Kinh doanh/ })).toBeVisible();
    await expect(catSection.getByRole("link", { name: /Du lịch/ })).toBeVisible();
    // "View all (178)" trigger opens modal with the full master list
    await expect(catSection.getByRole("button", { name: /Xem tất cả \(178\)/ })).toBeVisible();
  });

  test('Section "Gợi ý cho bạn" carousel with recommended cards', async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Gợi ý cho bạn/ })).toBeVisible();
    const recSection = page.locator("section").filter({ hasText: /Gợi ý cho bạn/ });
    const recCards = recSection.locator('a[href^="/lessons/"]:not([href$="/study"])');
    const count = await recCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(6);
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

  test("Category tile click narrows lessons via ?cat= URL", async ({ page }) => {
    const allSection = page.locator("section").filter({ hasText: /Tất cả bài học/ });
    const beforeCount = await allSection.locator('a[href^="/lessons/"]:not([href$="/study"])').count();
    // Clicking a category tile navigates to /?cat=ID#all
    await page
      .locator("section")
      .filter({ hasText: /Khám phá theo chủ đề/ })
      .getByRole("link", { name: /Kinh doanh/ })
      .click();
    await page.waitForURL(/\?cat=/);
    const afterCount = await allSection.locator('a[href^="/lessons/"]:not([href$="/study"])').count();
    expect(afterCount).toBeLessThanOrEqual(beforeCount);
    expect(afterCount).toBeGreaterThan(0);
  });

  test("Topbar global search filters via ?q= param", async ({ page }) => {
    const searchBox = page.locator("header").getByPlaceholder(/Tìm bài học/);
    await searchBox.fill("Stand-up");
    await searchBox.press("Enter");
    await page.waitForURL(/q=Stand-up/);
    await expect(page.getByText("Stand-up meeting: introduction & blockers").first()).toBeVisible();
  });


  test("Grid → List toggle changes layout", async ({ page }) => {
    // List toggle button (icon-only)
    const toggles = page.locator("button[title='Grid'], button[title='List']");
    await expect(toggles).toHaveCount(2);
    await page.locator("button[title='List']").click();
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
    const firstCard = page.locator('a[href^="/lessons/"]:not([href$="/study"])').first();
    const href = await firstCard.getAttribute("href");
    expect(href).toMatch(/^\/lessons\/[^/]+$/);
    await firstCard.click();
    await page.waitForURL(/\/lessons\/[^/]+$/);
  });

  test("Topbar has global search", async ({ page }) => {
    const header = page.locator("header");
    await expect(header.getByPlaceholder(/Tìm bài học/)).toBeVisible();
  });
});

test.describe("Lesson preview (Coursera-style)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/");
  });

  test("Preview shows lesson info + Bắt đầu học CTA → /study", async ({ page }) => {
    const firstCard = page.locator('a[href^="/lessons/"]:not([href$="/study"])').first();
    const href = (await firstCard.getAttribute("href"))!;
    await page.goto(href);

    // Preview elements (Coursera-style header + Overview/Modules/Reviews tabs + What you'll learn)
    await expect(page.getByRole("heading", { name: /Stand-up meeting|Daily English|Email opener|Pronunciation|Conditional|Listening|Reading/ }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /Về bài học này/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Bạn sẽ học được/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Tổng quan/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Nội dung bài/ })).toBeVisible();

    // CTA link to /study
    const cta = page.getByRole("link", { name: /Bắt đầu học|Tiếp tục học|Học lại/ }).first();
    await expect(cta).toBeVisible();
    await cta.click();
    await page.waitForURL(/\/lessons\/[^/]+\/study/);
  });
});
