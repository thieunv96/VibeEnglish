import { test, expect } from "@playwright/test";
import { DEMO_USER } from "./_helpers";

test.describe("Màn 1 — Auth (CONTEXT.md §5)", () => {
  test("Split layout desktop: branding panel left, form right", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/auth");

    // Branding panel
    await expect(page.getByRole("heading", { name: /Tự do học/ })).toBeVisible();
    await expect(page.getByText("Cá nhân hoá sâu theo mục tiêu")).toBeVisible();
    await expect(page.getByText("AI chấm & feedback tức thì")).toBeVisible();

    // Form panel
    await expect(page.getByRole("heading", { name: /Chào mừng trở lại/ })).toBeVisible();
  });

  test("Mobile: branding panel hidden, form visible with logo", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto("/auth");

    // Branding panel hidden via lg:flex
    const tagline = page.getByRole("heading", { name: /Tự do học/ });
    await expect(tagline).toBeHidden();
    // Small logo at top of form panel (text "Vibe English" exact)
    await expect(page.locator("main").getByText("Vibe English", { exact: true })).toBeVisible();
  });

  test("Tab switcher: Đăng nhập ↔ Đăng ký", async ({ page }) => {
    await page.goto("/auth");
    // Default: login
    await expect(page.getByRole("heading", { name: /Chào mừng/ })).toBeVisible();

    await page.getByRole("button", { name: "Đăng ký", exact: true }).click();
    await expect(page.getByRole("heading", { name: /Bắt đầu hành trình/ })).toBeVisible();
    // Register tab shows Họ + Tên fields
    await expect(page.getByLabel("Họ")).toBeVisible();
    await expect(page.getByLabel("Tên")).toBeVisible();

    // Switch back: click the tab switcher (button[type=button]), not the form submit
    await page.locator('button[type="button"]', { hasText: "Đăng nhập" }).click();
    await expect(page.getByRole("heading", { name: /Chào mừng/ })).toBeVisible();
    await expect(page.getByLabel("Họ")).not.toBeVisible();
  });

  test("Social login (Google/GitHub) removed at phase 1", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("button", { name: "Google" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "GitHub" })).toHaveCount(0);
    await expect(page.getByText(/hoặc đăng nhập bằng email/)).toHaveCount(0);
  });

  test('"Quên mật khẩu?" link visible on login, hidden on register', async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("button", { name: "Quên mật khẩu?" })).toBeVisible();
    await page.getByRole("button", { name: "Đăng ký", exact: true }).click();
    await expect(page.getByRole("button", { name: "Quên mật khẩu?" })).not.toBeVisible();
  });

  test("Login with valid credentials redirects to /", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email").fill(DEMO_USER.email);
    await page.getByLabel("Mật khẩu").fill(DEMO_USER.password);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL("/", { timeout: 15_000 });
    await expect(page.getByText(/Demo|Chào buổi/).first()).toBeVisible();
  });

  test("Login with wrong password shows error, stays on /auth", async ({ page }) => {
    await page.goto("/auth");
    await page.getByLabel("Email").fill(DEMO_USER.email);
    await page.getByLabel("Mật khẩu").fill("wrong-password-xxx");
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText(/Email hoặc mật khẩu không đúng/)).toBeVisible();
    await expect(page).toHaveURL(/\/auth/);
  });

  test("Register validates email format (browser HTML5)", async ({ page }) => {
    await page.goto("/auth?mode=register");
    await page.getByLabel("Email", { exact: true }).fill("not-an-email");
    await page.getByLabel("Họ").fill("Test");
    await page.getByLabel("Tên").fill("User");
    await page.getByLabel("Năm sinh").selectOption({ index: 1 });
    await page.getByLabel("Giới tính").selectOption("male");
    await page.getByLabel("Mật khẩu", { exact: true }).fill("password123");
    await page.getByLabel("Nhập lại mật khẩu").fill("password123");
    await page.getByLabel("Mã xác thực").fill("1");
    await page.locator('form button[type="submit"]').click();
    // Browser-native email validation will block submit; URL stays on /auth
    await expect(page).toHaveURL(/\/auth/);
  });

  test("Register has all required new fields + captcha", async ({ page }) => {
    await page.goto("/auth?mode=register");
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Họ")).toBeVisible();
    await expect(page.getByLabel("Tên")).toBeVisible();
    await expect(page.getByLabel("Năm sinh")).toBeVisible();
    await expect(page.getByLabel("Giới tính")).toBeVisible();
    await expect(page.getByLabel("Mật khẩu", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Nhập lại mật khẩu")).toBeVisible();
    await expect(page.getByLabel("Mã xác thực")).toBeVisible();
    // Captcha question display
    await expect(page.getByText(/\d+ \+ \d+ = \?/)).toBeVisible();
  });

  test("Locale switcher visible on auth page (VI / EN)", async ({ page }) => {
    await page.goto("/auth");
    // CSS uppercases display only; accessible name is lowercase
    await expect(page.getByRole("button", { name: /^vi$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^en$/i })).toBeVisible();
  });
});
