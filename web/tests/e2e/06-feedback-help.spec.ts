import { test, expect } from "@playwright/test";
import { DEMO_USER, loginViaApi } from "./_helpers";

test.describe("Màn 8 — Feedback (CONTEXT.md §5)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/feedback");
  });

  test("Renders 5 type chips + textarea + submit", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Góp ý cho Vibe English/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Đề xuất tính năng/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Báo lỗi giao diện/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Góp ý nội dung học/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Đánh giá trải nghiệm/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Khác/ })).toBeVisible();
    await expect(page.getByPlaceholder(/Chia sẻ chi tiết/)).toBeVisible();
  });

  test("Star rating only shows for experience_rating type", async ({ page }) => {
    // Default = feature_request, no stars
    await expect(page.getByText(/Đánh giá tổng thể/)).not.toBeVisible();
    await page.getByRole("button", { name: /Đánh giá trải nghiệm/ }).click();
    await expect(page.getByText(/Đánh giá tổng thể/)).toBeVisible();
    // 5 star buttons visible
    const stars = page.locator('button:has(svg.lucide-star)');
    expect(await stars.count()).toBeGreaterThanOrEqual(5);
  });

  test('"Muốn nhận phản hồi" toggle reveals email input', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).not.toBeVisible();
    await page.getByText(/Muốn nhận phản hồi/).click();
    await expect(emailInput).toBeVisible();
    // Pre-filled with logged-in email
    await expect(emailInput).toHaveValue("demo@vibeenglish.local");
  });

  test("Submit valid feedback → success state", async ({ page }) => {
    await page.getByPlaceholder(/Chia sẻ chi tiết/).fill("Test feedback from Playwright — please ignore.");
    await page.getByRole("button", { name: "Gửi góp ý" }).click();
    await expect(page.getByRole("heading", { name: /Cảm ơn bạn/ })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Vibe English tốt hơn mỗi ngày/)).toBeVisible();
  });

  test("Short content shows error", async ({ page }) => {
    await page.getByPlaceholder(/Chia sẻ chi tiết/).fill("hi");
    await page.getByRole("button", { name: "Gửi góp ý" }).click();
    await expect(page.getByText(/ít nhất vài câu/)).toBeVisible();
  });
});

test.describe("Màn 9 — Help / FAQ (CONTEXT.md §5)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/help");
  });

  test("Search bar + 7 categories", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Trung tâm hỗ trợ/ })).toBeVisible();
    await expect(page.getByPlaceholder(/Tìm câu hỏi/)).toBeVisible();
    // 7 categories from seed
    for (const cat of ["Bắt đầu & Onboarding", "Học bài & Bài tập", "Luyện Speaking", "Luyện Writing", "Điểm số & Trình độ", "Tài khoản & Cài đặt", "Gói Pro & Thanh toán"]) {
      await expect(page.getByRole("button", { name: new RegExp(cat) })).toBeVisible();
    }
  });

  test("Realtime search filters articles", async ({ page }) => {
    await page.getByPlaceholder(/Tìm câu hỏi/).fill("speaking");
    await expect(page.getByText(/kết quả cho/)).toBeVisible();
    // At least one match from seed
    const accordionItems = page.locator('button[data-state]');
    expect(await accordionItems.count()).toBeGreaterThan(0);
  });

  test("Click category → FAQ accordion expand on click", async ({ page }) => {
    await page.getByRole("button", { name: /Bắt đầu & Onboarding/ }).click();
    // Click the first article trigger by its heading text
    await page.getByRole("button", { name: /Làm sao bắt đầu nhanh/ }).click();
    // Helpful / unhelpful chips appear in expanded body
    await expect(page.getByText(/hữu ích/)).toBeVisible();
  });

  test('"Vẫn cần hỗ trợ?" banner links to /feedback', async ({ page }) => {
    const link = page.getByRole("link", { name: /Gửi góp ý cho chúng tôi/ });
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL(/\/feedback/);
  });
});
