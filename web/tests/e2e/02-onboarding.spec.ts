import { test, expect } from "@playwright/test";

const uniqEmail = () => `onb-${Date.now()}-${Math.floor(Math.random() * 9999)}@vibe.test`;

test.describe("Màn 2 — Onboarding (CONTEXT.md §5)", () => {
  test("Full flow: register → welcome → goals → industries → quiz → result → /", async ({ page }) => {
    // Register new user (each test gets fresh state)
    await page.goto("/auth?mode=register");
    await page.getByLabel("Họ").fill("Onboard");
    await page.getByLabel("Tên").fill("Tester");
    await page.getByLabel("Email").fill(uniqEmail());
    await page.getByLabel("Mật khẩu").fill("password123");
    await page.getByRole("button", { name: "Tạo tài khoản" }).click();
    await page.waitForURL("/onboarding", { timeout: 15_000 });

    // Step 1: Welcome
    await expect(page.getByRole("heading", { name: /Xin chào/ })).toBeVisible();
    await page.getByRole("button", { name: /Bắt đầu nào/ }).click();

    // Step 2: Goals — Tiếp tục disabled until ≥1 chosen
    await expect(page.getByRole("heading", { name: /Mục tiêu học/ })).toBeVisible();
    const continueBtn = page.getByRole("button", { name: /Tiếp tục/ });
    await expect(continueBtn).toBeDisabled();
    await page.getByText("Viết email công việc").click();
    await page.getByText("Họp & thuyết trình").click();
    await expect(page.getByText("Đã chọn:")).toContainText("2 mục tiêu");
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // Step 3: Industries + time
    await expect(page.getByRole("heading", { name: /Ngành nghề/ })).toBeVisible();
    await page.getByText("Kỹ sư / Lập trình viên").click();
    // Default time = 15 phút should be pre-selected
    const fifteen = page.getByRole("button").filter({ hasText: /15 phút/ });
    await expect(fifteen).toHaveClass(/border-brand-500/);
    // Switch to 30
    await page.getByText("30 phút").click();
    await page.getByRole("button", { name: /Tiếp tục/ }).click();

    // Step 4: Quiz
    await expect(page.getByText(/Adaptive AI/)).toBeVisible();
    await expect(page.getByText(/Câu 1 ·/)).toBeVisible();
    // First question is A1 vocabulary "opposite of happy" — answer is "Sad" (option A, index 0)
    await page.getByRole("button", { name: /^A.*Sad/ }).click();
    // Correct → auto next to câu 2 in 700ms
    await expect(page.getByText(/Câu 2 ·/)).toBeVisible({ timeout: 3000 });
    // Question 2: "She ___ to school" — answer "goes" (B)
    await page.getByRole("button", { name: /^B.*goes/ }).click();
    await expect(page.getByText(/Câu 3 ·/)).toBeVisible({ timeout: 3000 });

    // Pick wrong answer at q3 to verify red state + "Câu tiếp" button
    // Q3 reading: correct is index 2 ("In the morning"). Click A "At night" (wrong)
    await page.getByRole("button", { name: /^A.*At night/ }).click();
    // Verify it stays red (no auto next), no answer revealed
    await expect(page.getByText(/Câu 3 ·/)).toBeVisible();
    // "Câu tiếp" button appears
    await page.getByRole("button", { name: /Câu tiếp/ }).click();
    await expect(page.getByText(/Câu 4 ·/)).toBeVisible();

    // Speed through remaining questions (mix correct/wrong)
    for (let i = 4; i <= 20; i++) {
      // Click first available option then optionally Câu tiếp
      const aBtn = page.getByRole("button", { name: /^A./ }).first();
      await aBtn.click();
      // Either auto-next (correct) or wrong + Câu tiếp button
      const next = page.getByRole("button", { name: /Câu tiếp/ });
      if (await next.isVisible({ timeout: 1000 }).catch(() => false)) {
        await next.click();
      } else {
        // Auto next will happen, wait
        await page.waitForTimeout(900);
      }
      // After q20, should hit processing
      if (i === 20) break;
    }

    // Processing screen
    await expect(page.getByText(/AI đang phân tích/)).toBeVisible({ timeout: 10_000 });

    // Result screen — CEFR level pop, skill bars, "Bắt đầu học"
    await expect(page.getByRole("heading", { name: /Trình độ của bạn/ })).toBeVisible({ timeout: 10_000 });
    // Big level letter visible (in span inside the level circle)
    await expect(page.locator("span.text-5xl").filter({ hasText: /^(A1|A2|B1|B2|C1)$/ })).toBeVisible();
    // 4 skill cards
    await expect(page.getByText("Vocabulary").first()).toBeVisible();
    await expect(page.getByText("Grammar").first()).toBeVisible();
    await expect(page.getByText("Reading").first()).toBeVisible();
    await expect(page.getByText("Listening").first()).toBeVisible();

    await page.getByRole("button", { name: /Bắt đầu học/ }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/onboarding"), { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /Tất cả bài học/ })).toBeVisible({ timeout: 15_000 });
  });

  test('"Bỏ qua quiz" available at quiz step', async ({ page }) => {
    // Quick register
    await page.goto("/auth?mode=register");
    await page.getByLabel("Họ").fill("Skip");
    await page.getByLabel("Tên").fill("Quiz");
    await page.getByLabel("Email").fill(uniqEmail());
    await page.getByLabel("Mật khẩu").fill("password123");
    await page.getByRole("button", { name: "Tạo tài khoản" }).click();
    await page.waitForURL("/onboarding");

    await page.getByRole("button", { name: /Bắt đầu nào/ }).click();
    await page.getByText("Viết email công việc").click();
    await page.getByRole("button", { name: /Tiếp tục/ }).click();
    await page.getByText("Sinh viên").click();
    await page.getByRole("button", { name: /Tiếp tục/ }).click();

    // At quiz step — "Bỏ qua quiz" visible in header
    const skipBtn = page.getByRole("button", { name: "Bỏ qua quiz" });
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();

    // Goes directly to processing → result
    await expect(page.getByText(/AI đang phân tích/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /Trình độ của bạn/ })).toBeVisible({ timeout: 10_000 });
  });
});
