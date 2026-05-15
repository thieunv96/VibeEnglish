import { test, expect } from "@playwright/test";
import { DEMO_USER, loginViaApi } from "./_helpers";

test.describe("Account dropdown menu (user)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/");
  });

  test("Avatar trigger opens dropdown with all expected items", async ({ page }) => {
    await page.getByTitle("Tài khoản").click();
    await expect(page.getByRole("menuitem", { name: /Đổi ảnh đại diện/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Ngôn ngữ/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Cài đặt/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Đăng xuất/ })).toBeVisible();
  });

  test("Language submenu shows VI + EN, current is checked", async ({ page }) => {
    await page.getByTitle("Tài khoản").click();
    await page.getByRole("menuitem", { name: /Ngôn ngữ/ }).hover();
    await expect(page.getByRole("menuitem", { name: /Tiếng Việt/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /English/ })).toBeVisible();
  });

  test('"Đổi ảnh đại diện" opens crop modal with file picker', async ({ page }) => {
    await page.getByTitle("Tài khoản").click();
    await page.getByRole("menuitem", { name: /Đổi ảnh đại diện/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Đổi ảnh đại diện/ })).toBeVisible();
    await expect(page.getByText(/Click để chọn ảnh từ máy/)).toBeVisible();
  });

  test('"Cài đặt" navigates to /settings', async ({ page }) => {
    await page.getByTitle("Tài khoản").click();
    await page.getByRole("menuitem", { name: /Cài đặt/ }).click();
    await page.waitForURL(/\/settings/);
  });
});
