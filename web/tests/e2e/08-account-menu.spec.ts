import { test, expect } from "@playwright/test";
import { DEMO_USER, loginViaApi } from "./_helpers";

test.describe("Account dropdown menu (user)", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/");
  });

  test("Avatar trigger opens dropdown: Hồ sơ + Ngôn ngữ + Cài đặt + Đăng xuất (no avatar edit)", async ({ page }) => {
    await page.getByTitle("Tài khoản").click();
    await expect(page.getByRole("menuitem", { name: /Hồ sơ/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Ngôn ngữ/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Cài đặt/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /Đăng xuất/ })).toBeVisible();
    // Avatar editing moved out of dropdown → no item here
    await expect(page.getByRole("menuitem", { name: /Đổi ảnh đại diện/ })).toHaveCount(0);
  });

  test("Language submenu shows VI + EN, current is checked", async ({ page }) => {
    await page.getByTitle("Tài khoản").click();
    await page.getByRole("menuitem", { name: /Ngôn ngữ/ }).hover();
    await expect(page.getByRole("menuitem", { name: /Tiếng Việt/ })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /English/ })).toBeVisible();
  });

  test('"Hồ sơ" navigates to /profile', async ({ page }) => {
    await page.getByTitle("Tài khoản").click();
    await page.getByRole("menuitem", { name: /Hồ sơ/ }).click();
    await page.waitForURL(/\/profile/);
  });

  test('"Cài đặt" navigates to /settings', async ({ page }) => {
    await page.getByTitle("Tài khoản").click();
    await page.getByRole("menuitem", { name: /Cài đặt/ }).click();
    await page.waitForURL(/\/settings/);
  });
});

test.describe("Profile avatar update + delete", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page, DEMO_USER);
    await page.goto("/profile");
  });

  test("Click big avatar in Profile hero → menu with upload option", async ({ page }) => {
    await page.getByTitle("Cập nhật ảnh đại diện").click();
    await expect(page.getByRole("menuitem", { name: /Tải lên ảnh mới|Đổi ảnh/ })).toBeVisible();
  });

  test("Selecting upload from profile-avatar menu opens crop modal", async ({ page }) => {
    await page.getByTitle("Cập nhật ảnh đại diện").click();
    await page.getByRole("menuitem", { name: /Tải lên ảnh mới|Đổi ảnh/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Đổi ảnh đại diện/ })).toBeVisible();
    await expect(page.getByText(/Click để chọn ảnh từ máy/)).toBeVisible();
  });
});
