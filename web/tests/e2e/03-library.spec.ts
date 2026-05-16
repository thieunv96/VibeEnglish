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

  test("Hero (2-col): greeting chip + value-prop h1 + CTA + stat chips + illustration", async ({ page }) => {
    // Greeting in a small Sparkles chip above the h1
    await expect(page.getByText(/Chào buổi.*/).first()).toBeVisible();
    // h1 is the value proposition
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(/Hôm nay bạn muốn học/);
    // Primary CTA "Tiếp tục lộ trình" links to /lessons/.../study
    await expect(page.getByRole("link", { name: /Tiếp tục lộ trình/ }).first()).toBeVisible();
    // Level → target meta next to the CTA
    await expect(page.getByText(/B1.*mục tiêu B2/)).toBeVisible();
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

  test('Section "Tất cả bài học" — compact 4-card teaser (no filter toolbar)', async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Tất cả bài học/ })).toBeVisible();
    const allSection = page.locator("section").filter({ hasText: /Tất cả bài học/ });
    // Filter toolbar (type chips + grid/list toggle) is hidden on the home compact mode.
    // Filter chips like "Video → Quiz", "Writing", "Speaking" should not appear inside this section.
    await expect(allSection.getByRole("button", { name: /Video → Quiz/ })).toHaveCount(0);
    await expect(allSection.getByRole("button", { name: /^Writing$/ })).toHaveCount(0);
    // At most 4 cards rendered
    const cards = allSection.locator('a[href^="/lessons/"]:not([href$="/study"])');
    expect(await cards.count()).toBeLessThanOrEqual(4);
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
    const searchBox = page.locator("header").getByPlaceholder(/Bạn muốn học gì|Tìm bài học/);
    await searchBox.fill("Stand-up");
    await searchBox.press("Enter");
    await page.waitForURL(/q=Stand-up/);
    await expect(page.getByText("Stand-up meeting: introduction & blockers").first()).toBeVisible();
  });


  test('"Tất cả bài học" renders compact 4-card grid (carousel sizing, no toolbar)', async ({ page }) => {
    const allSection = page.locator("section").filter({ hasText: /Tất cả bài học/ });
    // Carousel sizing means no Grid/List toggle buttons are rendered for this section
    await expect(allSection.locator("button[title='Grid'], button[title='List']")).toHaveCount(0);
    // Section is capped at 4 lessons
    const cards = allSection.locator('a[href^="/lessons/"]:not([href$="/study"])');
    expect(await cards.count()).toBeLessThanOrEqual(4);
    // Cards still use the cover-image-on-top grid look (aspect-video present)
    await expect(cards.first().locator(".aspect-video")).toHaveCount(1);
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
    await expect(header.getByPlaceholder(/Bạn muốn học gì|Tìm bài học/)).toBeVisible();
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
