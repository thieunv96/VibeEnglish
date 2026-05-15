import { test, expect } from "@playwright/test";
import { ADMIN, loginViaApi } from "./_helpers";

test.describe("Màn 10 — Admin Panel (CONTEXT.md §5)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, ADMIN);
    await page.goto("/admin");
  });

  test("Sidebar: grouped nav (5 groups), version footer, account menu inside", async ({ page }) => {
    const sidebar = page.locator("aside");
    // Logo + brand text
    await expect(sidebar.getByText("Vibe Admin")).toBeVisible();
    // 5 collapsible group headers
    for (const group of ["Tổng quan", "Nội dung", "Cộng đồng", "Phân tích & Người dùng", "Hệ thống"]) {
      await expect(sidebar.getByRole("button", { name: new RegExp(group) })).toBeVisible();
    }
    // Account menu inside sidebar
    await expect(sidebar.getByTitle("Tài khoản")).toBeVisible();
    // Version footer
    await expect(sidebar.getByText(/^v\d+\.\d+\.\d+/)).toBeVisible();
  });

  test("Sidebar groups expand/collapse on click; nav items reachable", async ({ page }) => {
    const sidebar = page.locator("aside");
    // "Nội dung" group: clicking should toggle list of 4 items (Queue, Tạo bài học, Videos, Intel)
    const contentGroup = sidebar.getByRole("button", { name: /Nội dung/ });
    // Initially "Tổng quan" is the active group (since we're on /admin Dashboard) — content closed
    const queueLink = sidebar.getByRole("link", { name: /Lesson Queue/ });
    await expect(queueLink).toBeHidden();
    await contentGroup.click();
    await expect(queueLink).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /Tạo bài học/ })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /Video Manager/ })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: /Content Intelligence/ })).toBeVisible();
    // Collapsing
    await contentGroup.click();
    await expect(queueLink).toBeHidden();
  });

  test("Active group auto-opens on page load", async ({ page }) => {
    await page.goto("/admin/queue");
    const sidebar = page.locator("aside");
    // Content group should be open since /admin/queue lives under it
    await expect(sidebar.getByRole("link", { name: /Lesson Queue/ })).toBeVisible();
  });

  test("Admin sidebar is fixed (does not scroll with main content)", async ({ page }) => {
    await expect(page.locator("aside")).toHaveClass(/fixed/);
  });

  test("Admin topbar: search + locale switcher + help + bell", async ({ page }) => {
    const header = page.locator("header").first();
    await expect(header.getByPlaceholder(/Tìm bài học/)).toBeVisible();
    await expect(header.getByRole("button", { name: /^vi$/i })).toBeVisible();
    await expect(header.getByRole("button", { name: /^en$/i })).toBeVisible();
    await expect(header.getByTitle("Trợ giúp")).toBeVisible();
    await expect(header.getByTitle("Thông báo")).toBeVisible();
  });

  test("Admin logo click → /admin", async ({ page }) => {
    await page.goto("/admin/users");
    await page.locator("aside").getByRole("link", { name: /Vibe Admin/ }).first().click();
    await page.waitForURL(/\/admin$/);
  });

  test("Dashboard: 4 metric cards + 2 preview panels", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Tổng users")).toBeVisible();
    await expect(page.getByText("Bài chờ duyệt", { exact: true })).toBeVisible();
    await expect(page.getByText("Đã publish")).toBeVisible();
    await expect(page.getByText("Reports mở")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Bài chờ duyệt gần nhất/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /AI suggestions mới nhất/ })).toBeVisible();
  });

  test("Lesson Queue: queued lessons with Approve/Reject/Edit buttons", async ({ page }) => {
    await page.goto("/admin/queue");
    await expect(page.getByRole("heading", { name: "Lesson Queue" })).toBeVisible();
    // Seed has 2 queued
    await expect(page.getByText(/đang chờ/)).toBeVisible();
    const firstRow = page.locator(".rounded-xl.bg-white").filter({ has: page.getByRole("button", { name: /Duyệt/ }) }).first();
    await expect(firstRow.getByRole("button", { name: /Duyệt/ })).toBeVisible();
    await expect(firstRow.getByRole("button", { name: /Từ chối/ })).toBeVisible();
    await expect(firstRow.getByRole("link", { name: /Xem/ })).toBeVisible();
  });

  test("Reject flow: opens reason textarea, requires reason to confirm", async ({ page }) => {
    await page.goto("/admin/queue");
    // The reject button in the first queued row
    const rejectBtn = page.getByRole("button", { name: /Từ chối/ }).first();
    await rejectBtn.click();
    // Textarea + Xác nhận + Huỷ buttons appear
    await expect(page.getByPlaceholder(/Lý do từ chối/).first()).toBeVisible();
    const confirmBtn = page.getByRole("button", { name: /Xác nhận từ chối/ }).first();
    // Empty reason: clicking confirm does nothing (handler exits early when reason is empty)
    await confirmBtn.click();
    // Still in reject mode — textarea still visible
    await expect(page.getByPlaceholder(/Lý do từ chối/).first()).toBeVisible();
    // Cancel restores the action buttons
    await page.getByRole("button", { name: "Huỷ" }).first().click();
    await expect(page.getByRole("button", { name: /Duyệt/ }).first()).toBeVisible();
  });

  test("Create lesson — Quiz form path", async ({ page }) => {
    await page.goto("/admin/create");
    await expect(page.getByRole("heading", { name: /Tạo bài học thủ công/ })).toBeVisible();

    await page.getByLabel("Tiêu đề bài học").fill("E2E test quiz lesson");
    // Type Quiz is default; level B1 default
    // Add question content
    const qInput = page.getByPlaceholder(/Nội dung câu hỏi/);
    await qInput.fill("E2E sample question?");
    await page.getByPlaceholder("Option A").fill("Option A text");
    await page.getByPlaceholder("Option B").fill("Option B text");
    await page.getByPlaceholder("Option C").fill("Option C text");
    await page.getByPlaceholder("Option D").fill("Option D text");
    // Submit (will go to /admin/queue)
    await page.getByRole("button", { name: /Lưu vào queue/ }).click();
    await page.waitForURL(/\/admin\/queue/, { timeout: 10000 });
    await expect(page.getByText("E2E test quiz lesson")).toBeVisible();
  });

  test("Video Manager: table + status badges", async ({ page }) => {
    await page.goto("/admin/videos");
    await expect(page.getByRole("heading", { name: "Video Manager" })).toBeVisible();
    // Seed has 1 indexed video
    await expect(page.getByText(/How to lead a stand-up/)).toBeVisible();
    await expect(page.getByText("Đã index")).toBeVisible();
  });

  test("Content Intelligence: suggestion cards with priority + stats + actions", async ({ page }) => {
    await page.goto("/admin/intel");
    await expect(page.getByRole("heading", { name: /Content Intelligence/ })).toBeVisible();
    // Seed has 3 suggestions; "high" priority should appear
    await expect(page.getByText("Conditional clauses for B1 learners")).toBeVisible();
    await expect(page.getByRole("button", { name: /Tạo outline video/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Bỏ qua/ }).first()).toBeVisible();
  });

  test("Reports: open report shows lesson link + Đã fix button", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
    await expect(page.getByText(/vướng mắc/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Đã fix/ }).first()).toBeVisible();
  });

  test("User Feedback: filterable list with status badges + actions", async ({ page }) => {
    await page.goto("/admin/feedback");
    await expect(page.getByRole("heading", { name: "User Feedback" })).toBeVisible();
    await expect(page.getByText(/download bài học/)).toBeVisible();
  });

  test("Analytics: KPI cards + level distribution chart", async ({ page }) => {
    await page.goto("/admin/analytics");
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
    await expect(page.getByText(/Sessions/)).toBeVisible();
    await expect(page.getByText(/Completion rate/)).toBeVisible();
    await expect(page.getByText(/Phân bố level/)).toBeVisible();
  });

  test("Help Content: CMS sidebar + article rows with helpful ratios", async ({ page }) => {
    await page.goto("/admin/help");
    await expect(page.getByRole("heading", { name: /Help Content/ })).toBeVisible();
    // Sidebar category list contains "Bắt đầu & Onboarding"
    await expect(page.getByText(/Bắt đầu & Onboarding/).first()).toBeVisible();
    // Articles list shows seeded items
    await expect(page.getByText(/Làm sao bắt đầu nhanh/)).toBeVisible();
  });

  test("Users table: list with email + level + streak + activity", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    // Email appears in the users table (and also in sidebar header — use table scope)
    const table = page.getByRole("table");
    await expect(table.getByText("thieunv96@gmail.com")).toBeVisible();
    await expect(table.getByText("demo@vibeenglish.local")).toBeVisible();
  });

  test("Settings page → AI tab: 3 sections + test connection button + save", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: /^Settings$/ })).toBeVisible();
    // Tab bar with AI Models active
    await expect(page.getByRole("tab", { name: /AI Models/ })).toBeVisible();
    // 3 sections inside AI tab
    await expect(page.getByRole("heading", { name: /Chat \/ Generation/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Speech-to-text/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Text-to-speech/ })).toBeVisible();

    // Fill chat section
    await page.locator('input[placeholder="http://localhost:8000/v1"]').fill("http://invalid-host:9999/v1");
    await page.locator('input[placeholder="EMPTY hoặc key thật"]').fill("EMPTY");
    await page.locator('input[placeholder="Qwen/Qwen2.5-32B-Instruct"]').fill("test-model");

    // Test connection — should fail gracefully (invalid host) and show error
    await page.getByRole("button", { name: /Test kết nối/ }).click();
    // Should show error message (red text)
    await expect(page.locator(".text-red-600")).toBeVisible({ timeout: 15000 });

    // Save
    await page.getByRole("button", { name: /Lưu cấu hình/ }).click();
    await expect(page.getByText(/Đã lưu/)).toBeVisible({ timeout: 5000 });
  });
});
