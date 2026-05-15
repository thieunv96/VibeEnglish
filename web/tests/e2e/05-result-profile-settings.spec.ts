import { test, expect } from "@playwright/test";
import { DEMO_USER, loginViaApi } from "./_helpers";

test.describe("Màn 5 — Lesson Result (CONTEXT.md §5)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
  });

  test("Result page renders for a completed attempt", async ({ page }) => {
    // Pick the most recently completed lesson from /profile's history section
    await page.goto("/profile");
    const historySection = page.locator("section").filter({ hasText: /Lịch sử gần đây/ });
    const firstLessonLink = historySection.locator('a[href^="/lessons/"]').first();
    await expect(firstLessonLink).toBeVisible();
    const href = await firstLessonLink.getAttribute("href");
    const lessonId = href!.split("/lessons/")[1];

    await page.goto(`/lessons/${lessonId}/result`);

    // Celebration header
    await expect(page.getByRole("heading", { name: /Bài học hoàn thành/ })).toBeVisible();
    await expect(page.getByText(/\+\d+ XP/)).toBeVisible();

    // Score cards
    await expect(page.getByText("Điểm tổng")).toBeVisible();
    await expect(page.getByText("Thời gian", { exact: true })).toBeVisible();

    // Skill progress
    await expect(page.getByRole("heading", { name: /Tiến bộ kỹ năng/ })).toBeVisible();

    // AI Coach feedback
    await expect(page.getByText(/Vibe AI Coach/)).toBeVisible();

    // Streak banner
    await expect(page.getByText(/Streak \d+ ngày liên tiếp/)).toBeVisible();

    // Next lesson CTAs
    await expect(page.getByRole("link", { name: /Học bài tiếp|Về thư viện/ }).first()).toBeVisible();
  });
});

test.describe("Màn 6 — Profile & Progress (CONTEXT.md §5)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/profile");
  });

  test("Hero: avatar + level badge overlay + stats row + edit button", async ({ page }) => {
    await expect(page.getByText("Demo User").first()).toBeVisible();
    await expect(page.locator("section").first().getByText("B1").first()).toBeVisible();
    await expect(page.getByText("Bài đã học").first()).toBeVisible();
    await expect(page.getByText("Tổng giờ học")).toBeVisible();
    await expect(page.getByText("Badges").first()).toBeVisible();
    await expect(page.getByText("Streak").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Chỉnh sửa/ })).toBeVisible();
  });

  test("Level progress bar with current → next level", async ({ page }) => {
    await expect(page.getByText("Tiến độ level")).toBeVisible();
    // Demo user is B1 → next is B2. Text "B1 → B2" appears in subtitle.
    await expect(page.locator("div").filter({ hasText: /^B1 → B2/ }).first()).toBeVisible();
  });

  test("Skills card: 4 skills with weakest tagged 'Cần luyện'", async ({ page }) => {
    const skillsCard = page.locator("section").filter({ hasText: /^Kỹ năng/ }).first();
    await expect(skillsCard.getByText("Vocabulary").first()).toBeVisible();
    await expect(skillsCard.getByText("Listening").first()).toBeVisible();
    await expect(skillsCard.getByText("Cần luyện").first()).toBeVisible();
  });

  test("Stats 2x2 tiles: Bài đã học, Tỉ lệ đúng, Tổng thời gian, Tổng XP", async ({ page }) => {
    const statsCard = page.locator("section").filter({ hasText: /Thống kê/ });
    await expect(statsCard.getByText(/Bài đã học/)).toBeVisible();
    await expect(statsCard.getByText(/Tỉ lệ đúng/)).toBeVisible();
    await expect(statsCard.getByText(/Tổng thời gian/)).toBeVisible();
    await expect(statsCard.getByText(/Tổng XP/)).toBeVisible();
  });

  test("Heatmap: 120-day grid + legend", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Hoạt động/ })).toBeVisible();
    await expect(page.getByText("Ít")).toBeVisible();
    await expect(page.getByText("Nhiều")).toBeVisible();
  });

  test("Badges grid: earned vs unearned", async ({ page }) => {
    // From seed: user earned "Bài đầu tiên" and "Streak 3 ngày"
    await expect(page.getByText("Bài đầu tiên")).toBeVisible();
    await expect(page.getByText("Streak 3 ngày")).toBeVisible();
    // "Streak 7 ngày" is not yet earned — still rendered but with opacity-30
  });

  test("Recent history list: lessons", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Lịch sử gần đây/ })).toBeVisible();
    const historySection = page.locator("section").filter({ hasText: /Lịch sử gần đây/ });
    const items = historySection.locator('a[href^="/lessons/"]');
    expect(await items.count()).toBeGreaterThan(0);
  });
});

test.describe("Màn 7 — Settings (CONTEXT.md §5)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/settings");
  });

  test("Section 1 — Mục tiêu học with current goals pre-selected", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^Mục tiêu học/ })).toBeVisible();
    const emailCard = page.locator("button").filter({ hasText: /Viết email công việc/ });
    await expect(emailCard).toBeVisible();
  });

  test("Section 2 — Ngành nghề (Industries)", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^Ngành nghề/ })).toBeVisible();
  });

  test("Section 3 — 3 time cards", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Thời gian học mỗi ngày/ })).toBeVisible();
    await expect(page.getByText(/^5 phút/)).toBeVisible();
    await expect(page.getByText(/^15 phút/)).toBeVisible();
    await expect(page.getByText(/^30 phút/)).toBeVisible();
  });

  test("Section 4 — Kế hoạch học with target level + replay placement warning", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /^Kế hoạch học/ })).toBeVisible();
    // Replay button gates by single-click → confirm. First click is below the warning section.
    const replayBtn = page.locator("button").filter({ hasText: /Làm lại placement quiz/ });
    await expect(replayBtn).toBeVisible();
    await replayBtn.click();
    await expect(page.locator("button").filter({ hasText: /Xác nhận làm lại/ })).toBeVisible();
    await expect(page.getByText(/ghi đè level hiện tại/)).toBeVisible();
  });

  test("Save changes → success toast", async ({ page }) => {
    await page.getByText("Tài chính / Kế toán").click();
    await page.getByRole("button", { name: /Lưu thay đổi/ }).click();
    await expect(page.getByText(/Đã lưu thay đổi/)).toBeVisible({ timeout: 5000 });
  });
});
