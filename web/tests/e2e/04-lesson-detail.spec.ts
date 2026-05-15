import { test, expect } from "@playwright/test";
import { DEMO_USER, loginViaApi } from "./_helpers";

async function gotoStandupLesson(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByText("Stand-up meeting: introduction & blockers").first().click();
  await page.waitForURL(/\/lessons\//);
}

test.describe("Màn 4 — Lesson Detail (CONTEXT.md §5)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
  });

  test("Header nav: ← Thư viện, title, series progress", async ({ page }) => {
    await gotoStandupLesson(page);
    await expect(page.getByRole("link", { name: /Thư viện/ })).toBeVisible();
    // Title appears in both h1 (header) and h2 (lesson info) — both is fine
    await expect(page.locator("h1").filter({ hasText: /Stand-up meeting/ })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: /Stand-up meeting/ })).toBeVisible();
  });

  test("Split layout desktop: video panel left, exercises right", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoStandupLesson(page);

    // YouTube player container exists
    await expect(page.locator("#yt-player")).toBeVisible();
    // Tab bar on right panel
    await expect(page.getByRole("tab", { name: "Quiz" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Writing" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Speaking" })).toBeVisible();
  });

  test("Lesson info: type badge, level badge, duration, exercise count", async ({ page }) => {
    await gotoStandupLesson(page);
    await expect(page.getByText("Video → Quiz").first()).toBeVisible();
    await expect(page.getByText(/^B1$/).first()).toBeVisible();
    await expect(page.getByText(/phút/).first()).toBeVisible();
    await expect(page.getByText(/bài tập/).first()).toBeVisible();
  });

  test("Transcript panel: header, EN/Song ngữ/VI toggle, auto-scroll switch, segments", async ({ page }) => {
    await gotoStandupLesson(page);
    await expect(page.getByRole("heading", { name: "Transcript" })).toBeVisible();
    // 3-way toggle (exact distinguishes from segment buttons containing "EN..." in timestamps)
    await expect(page.getByRole("button", { name: "EN", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Song ngữ", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "VI", exact: true })).toBeVisible();
    // Auto-scroll switch
    await expect(page.getByText("Auto-scroll")).toBeVisible();
    // Bilingual mode (default) shows EN + VI columns
    await expect(page.getByText("🇬🇧 English")).toBeVisible();
    await expect(page.getByText("🇻🇳 Tiếng Việt")).toBeVisible();
    // Seed transcript content (first segment) — both versions visible side-by-side
    await expect(page.getByText("Good morning everyone, welcome to today's stand-up.").first()).toBeVisible();
    await expect(page.getByText("Chào mọi người, chào mừng đến với stand-up hôm nay.").first()).toBeVisible();
  });

  test('Switch transcript mode to "VI" hides EN column', async ({ page }) => {
    await gotoStandupLesson(page);
    await page.getByRole("button", { name: "VI", exact: true }).click();
    // Bilingual headers should disappear
    await expect(page.getByText("🇬🇧 English")).not.toBeVisible();
    // VI text still present
    await expect(page.getByText("Chào mọi người, chào mừng đến với stand-up hôm nay.").first()).toBeVisible();
  });

  test("Quiz tab: option correct → green auto-advance; wrong → red + Câu tiếp", async ({ page }) => {
    await gotoStandupLesson(page);
    await page.getByRole("tab", { name: "Quiz" }).click();

    // Q1 from seed: "What does 'stand-up' refer to" — correct = "A short daily team meeting"
    await expect(page.getByText(/Câu 1\/5/)).toBeVisible();
    // Click WRONG first to verify wrong-state behaviour
    await page.getByRole("button", { name: /A type of comedy show/ }).click();
    // Should stay on Q1, "Câu tiếp" appears, no auto-advance
    await page.waitForTimeout(1200);
    await expect(page.getByText(/Câu 1\/5/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Câu tiếp/ })).toBeVisible();
    await page.getByRole("button", { name: /Câu tiếp/ }).click();
    await expect(page.getByText(/Câu 2\/5/)).toBeVisible();
    // Q2 correct: "Yesterday/today/blockers"
    await page.getByRole("button", { name: /Yesterday\/today\/blockers/ }).click();
    // Auto-advance after correct
    await expect(page.getByText(/Câu 3\/5/)).toBeVisible({ timeout: 3000 });
  });

  test("Writing tab: prompt + textarea + word counter + submit gating", async ({ page }) => {
    await gotoStandupLesson(page);
    await page.getByRole("tab", { name: "Writing" }).click();

    await expect(page.getByText("Prompt", { exact: true })).toBeVisible();
    await expect(page.getByText(/leading tomorrow's stand-up/)).toBeVisible();

    const textarea = page.getByPlaceholder(/Viết câu trả lời/);
    await textarea.fill("Short");
    await expect(page.locator("div").filter({ hasText: /^1 từ/ }).first()).toBeVisible();
    // Submit disabled with too few words (min 40)
    await expect(page.getByRole("button", { name: /Nộp & nhận feedback/ })).toBeDisabled();

    // Fill enough words
    const longText = "Yesterday I shipped the API integration and wrote unit tests for the authentication module. Today I am focusing on the onboarding screens and will pair with the design team. One blocker: I need the latest design specs to finish the layout.";
    await textarea.fill(longText);
    await expect(page.getByRole("button", { name: /Nộp & nhận feedback/ })).toBeEnabled();
  });

  test("Speaking tab: target quote + record button visible", async ({ page }) => {
    await gotoStandupLesson(page);
    await page.getByRole("tab", { name: "Speaking" }).click();

    await expect(page.getByText(/Đọc to câu sau/)).toBeVisible();
    // Target quote in the speaking quote box (.text-lg) — not the transcript segment
    await expect(page.locator("p.text-lg").filter({ hasText: /unit tests for the new endpoints/ })).toBeVisible();
    // Big record button visible — find by aria/class
    const recordBtn = page.locator("button.size-20").first();
    await expect(recordBtn).toBeVisible();
  });

  test('Next bar: "Cần làm xong bài tập" gated disabled until all exercises done', async ({ page }) => {
    await gotoStandupLesson(page);
    const finishBtn = page.getByRole("button", { name: /Cần làm xong bài tập/ });
    await expect(finishBtn).toBeVisible();
    await expect(finishBtn).toBeDisabled();
  });
});
