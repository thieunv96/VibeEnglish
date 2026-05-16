import { test, expect } from "@playwright/test";
import { DEMO_USER, loginViaApi } from "./_helpers";

test.describe("Coursera-style redesign (per startup/*.html reference)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
  });

  test("Home: 2-col hero with greeting + value-prop h1 + bare section headings", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 }).first();
    await expect(h1).toContainText(/Hôm nay bạn muốn học/);
    // Hero CTA exists (links to in-progress /study or first lesson)
    await expect(page.getByRole("link", { name: /Tiếp tục lộ trình/ }).first()).toBeVisible();
    // Greeting chip above the h1
    await expect(page.getByText(/Chào buổi.*/).first()).toBeVisible();
    // Section h2s (bare, no subtitles)
    await expect(page.getByRole("heading", { name: /^Khám phá theo chủ đề$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Gợi ý cho bạn$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Tất cả bài học$/ })).toBeVisible();
  });

  test("Lesson card anatomy (Coursera): partner row + title + rating + meta line", async ({ page }) => {
    await page.goto("/");
    // Pick the first card inside the "Gợi ý cho bạn" carousel (it has the topRecommended badge)
    const recSection = page.locator("section").filter({ hasText: /Gợi ý cho bạn/ });
    const firstCard = recSection.locator('a[href^="/lessons/"]:not([href$="/study"])').first();
    await expect(firstCard).toBeVisible();
    // Partner row: small icon + category name
    await expect(firstCard.getByText(/Kinh doanh|Giao tiếp|Du lịch|Công nghệ|Giáo dục/).first()).toBeVisible();
    // Bold title (h3)
    await expect(firstCard.locator("h3")).toBeVisible();
    // Rating row contains the star value (number with comma or dot)
    await expect(firstCard.getByText(/\d[\.,]\d/)).toBeVisible();
    // Meta line: Level · Type · Duration (contains "phút")
    await expect(firstCard.getByText(/phút/)).toBeVisible();
    // "Đề xuất hàng đầu" status badge on recommended carousel cards
    await expect(firstCard.getByText(/Đề xuất hàng đầu/)).toBeVisible();
  });

  test("Brand color #0056D2 applied (lesson preview CTA)", async ({ page }) => {
    // The home page no longer has a hero CTA. The lesson preview "Bắt đầu học"
    // button still uses bg-brand-700 = #0056d2.
    await page.goto("/");
    const firstCard = page.locator('a[href^="/lessons/"]:not([href$="/study"])').first();
    const href = (await firstCard.getAttribute("href"))!;
    await page.goto(href);
    const cta = page.getByRole("link", { name: /Bắt đầu học|Tiếp tục học|Học lại/ }).first();
    await expect(cta).toBeVisible();
    const bgColor = await cta.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe("rgb(0, 86, 210)");
  });

  test("Source Sans Pro is loaded as primary font", async ({ page }) => {
    await page.goto("/");
    const fontFamily = await page
      .getByRole("heading", { level: 1 })
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    // next/font/google emits a hashed variable name + falls back to local Source Sans 3
    expect(fontFamily.toLowerCase()).toMatch(/source[\s_-]*sans/);
  });

  test("Lesson preview: hero header (title + meta + CTA) + cover on right", async ({ page }) => {
    await page.goto("/");
    const firstCard = page.locator('a[href^="/lessons/"]:not([href$="/study"])').first();
    const href = (await firstCard.getAttribute("href"))!;
    await page.goto(href);

    // Big h1 title
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Primary CTA in hero
    await expect(page.getByRole("link", { name: /Bắt đầu học|Tiếp tục học|Học lại/ }).first()).toBeVisible();
    // Meta row: duration + level
    await expect(page.getByText(/\d+ phút/).first()).toBeVisible();
  });

  test("Lesson preview: sticky tabs with Overview / Modules / Reviews", async ({ page }) => {
    await page.goto("/");
    const firstCard = page.locator('a[href^="/lessons/"]:not([href$="/study"])').first();
    const href = (await firstCard.getAttribute("href"))!;
    await page.goto(href);

    // Tabs are anchor links pointing at section ids
    const tabsNav = page.locator('nav:has(a[href="#overview"])');
    await expect(tabsNav.getByRole("link", { name: /Tổng quan/ })).toBeVisible();
    await expect(tabsNav.getByRole("link", { name: /Nội dung bài/ })).toBeVisible();
    await expect(tabsNav.getByRole("link", { name: /Đánh giá/ })).toBeVisible();
  });

  test('Lesson preview: "Bạn sẽ học được" card with skill bullets', async ({ page }) => {
    await page.goto("/");
    const firstCard = page.locator('a[href^="/lessons/"]:not([href$="/study"])').first();
    const href = (await firstCard.getAttribute("href"))!;
    await page.goto(href);

    const skillsHeading = page.getByRole("heading", { name: /Bạn sẽ học được/ });
    await expect(skillsHeading).toBeVisible();
    // The 4 default skill bullets from i18n skillsDefault
    const skillsCard = page.locator("section").filter({ has: skillsHeading });
    const bullets = skillsCard.locator("ul li");
    expect(await bullets.count()).toBeGreaterThanOrEqual(4);
  });

  test("Lesson preview: modules accordion + FAQ accordion render", async ({ page }) => {
    await page.goto("/");
    const firstCard = page.locator('a[href^="/lessons/"]:not([href$="/study"])').first();
    const href = (await firstCard.getAttribute("href"))!;
    await page.goto(href);

    // Modules section
    await expect(page.getByRole("heading", { name: /Cấu trúc bài học/ })).toBeVisible();
    // FAQ section
    await expect(page.getByRole("heading", { name: /Câu hỏi thường gặp/ })).toBeVisible();
    // FAQ has 3 trigger buttons
    const faqSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: /Câu hỏi thường gặp/ }),
    });
    const faqTriggers = faqSection.locator('button[data-slot="accordion-trigger"], button[aria-expanded]');
    expect(await faqTriggers.count()).toBeGreaterThanOrEqual(3);
  });

  test("Lesson preview: footer CTA banner with Ready / Bắt đầu học", async ({ page }) => {
    await page.goto("/");
    const firstCard = page.locator('a[href^="/lessons/"]:not([href$="/study"])').first();
    const href = (await firstCard.getAttribute("href"))!;
    await page.goto(href);

    // Sẵn sàng bắt đầu — footer CTA
    await expect(page.getByRole("heading", { name: /Sẵn sàng bắt đầu/ })).toBeVisible();
    // Multiple "Bắt đầu học" CTAs (top hero + footer banner)
    const ctas = page.getByRole("link", { name: /Bắt đầu học|Tiếp tục học|Học lại/ });
    expect(await ctas.count()).toBeGreaterThanOrEqual(2);
  });

  test("EN locale: lesson preview heading translates", async ({ page, context }) => {
    await context.addCookies([
      { name: "NEXT_LOCALE", value: "en", domain: "localhost", path: "/" },
    ]);
    await page.goto("/");
    const firstCard = page.locator('a[href^="/lessons/"]:not([href$="/study"])').first();
    const href = (await firstCard.getAttribute("href"))!;
    await page.goto(href);

    // EN tab labels
    await expect(page.getByRole("link", { name: /^Overview$/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Modules$/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Reviews$/ })).toBeVisible();
    // EN "What you'll learn"
    await expect(page.getByRole("heading", { name: /What you'll learn/ })).toBeVisible();
    // EN footer CTA
    await expect(page.getByRole("heading", { name: /Ready to start/ })).toBeVisible();
  });
});
