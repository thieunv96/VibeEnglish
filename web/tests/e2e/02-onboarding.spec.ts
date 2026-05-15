import { test, expect, type Page } from "@playwright/test";

const uniqEmail = () => `onb-${Date.now()}-${Math.floor(Math.random() * 9999)}@vibe.test`;

async function registerNewUser(page: Page, firstName: string, lastName: string) {
  await page.goto("/auth?mode=register");
  await page.getByLabel("Email", { exact: true }).fill(uniqEmail());
  await page.getByLabel("Họ").fill(firstName);
  await page.getByLabel("Tên").fill(lastName);
  await page.getByLabel("Năm sinh").selectOption({ index: 5 });
  await page.getByLabel("Giới tính").selectOption("male");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("password123");
  await page.getByLabel("Nhập lại mật khẩu").fill("password123");
  // Solve captcha: read the question + compute sum
  const captchaQ = await page.locator("span.font-mono").innerText();
  const m = captchaQ.match(/(\d+)\s*\+\s*(\d+)/);
  if (!m) throw new Error("Captcha format not recognized: " + captchaQ);
  const sum = parseInt(m[1], 10) + parseInt(m[2], 10);
  await page.getByLabel("Mã xác thực").fill(String(sum));
  // Accept ToS (required for submit button to enable)
  await page.getByLabel("terms-agreement").click();
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await page.waitForURL("/onboarding", { timeout: 15_000 });
}

test.describe("Màn 2 — Onboarding (CONTEXT.md §5)", () => {
  test('"Bỏ qua hoàn toàn" from welcome → goes straight to / with A1', async ({ page }) => {
    await registerNewUser(page, "Skip", "Total");
    await expect(page.getByRole("heading", { name: /Xin chào/ })).toBeVisible();
    await page.getByRole("button", { name: /Bỏ qua hoàn toàn/ }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/onboarding"), { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Tất cả bài học/ })).toBeVisible({ timeout: 15_000 });
  });

  test("Quiz: wrong answer auto-advances showing correct one in green", async ({ page }) => {
    await registerNewUser(page, "Wrong", "Reveal");
    await page.getByRole("button", { name: /Bắt đầu nào/ }).click();
    await page.getByText("Viết email công việc").click();
    await page.getByRole("button", { name: /Tiếp tục/ }).click();
    await page.getByText("Sinh viên").click();
    await page.getByRole("button", { name: /Tiếp tục/ }).click();

    await expect(page.getByText(/Câu 1 ·/)).toBeVisible();
    // Q1: "opposite of happy" — correct is A "Sad". Click B "Tall" (wrong)
    await page.getByRole("button", { name: /^B.*Tall/ }).click();
    // Wrong banner appears showing correct = A
    await expect(page.getByText(/đáp án đúng là\s+A/i)).toBeVisible();
    // Selected option B turns red
    const optionB = page.getByRole("button", { name: /^B.*Tall/ });
    await expect(optionB).toHaveClass(/border-red-400/);
    // Correct option A turns green
    const optionA = page.getByRole("button", { name: /^A.*Sad/ });
    await expect(optionA).toHaveClass(/border-emerald-500/);
    // Auto-advance within ~2.5s
    await expect(page.getByText(/Câu 2 ·/)).toBeVisible({ timeout: 3500 });
  });

  test("Quiz: back button restores prior question with feedback shown", async ({ page }) => {
    await registerNewUser(page, "Back", "Review");
    await page.getByRole("button", { name: /Bắt đầu nào/ }).click();
    await page.getByText("Viết email công việc").click();
    await page.getByRole("button", { name: /Tiếp tục/ }).click();
    await page.getByText("Sinh viên").click();
    await page.getByRole("button", { name: /Tiếp tục/ }).click();

    // Answer Q1 correctly → auto-advance
    await page.getByRole("button", { name: /^A.*Sad/ }).click();
    await expect(page.getByText(/Câu 2 ·/)).toBeVisible({ timeout: 3000 });
    // Back button should now be visible
    const backBtn = page.getByRole("button", { name: /Quay lại câu trước/ });
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    // Q1 shown again with feedback (option A green, prompt shows ✓ Chính xác)
    await expect(page.getByText(/Câu 1 ·/)).toBeVisible();
    await expect(page.getByText(/Chính xác/)).toBeVisible();
  });

  test("Quiz: skip-quiz still works from header", async ({ page }) => {
    await registerNewUser(page, "Skip", "Quiz");
    await page.getByRole("button", { name: /Bắt đầu nào/ }).click();
    await page.getByText("Viết email công việc").click();
    await page.getByRole("button", { name: /Tiếp tục/ }).click();
    await page.getByText("Sinh viên").click();
    await page.getByRole("button", { name: /Tiếp tục/ }).click();

    const skipBtn = page.getByRole("button", { name: "Bỏ qua quiz" });
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();
    await expect(page.getByText(/AI đang phân tích/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /Trình độ của bạn/ })).toBeVisible({ timeout: 10_000 });
  });
});
