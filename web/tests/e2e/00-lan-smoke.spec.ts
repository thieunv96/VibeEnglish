import { test, expect } from "@playwright/test";

test("Admin login from LAN IP works with password '123'", async ({ page }) => {
  // Use LAN IP explicitly to mimic accessing from another machine
  await page.goto("http://192.168.2.211:3001/auth");
  await page.getByLabel("Email").fill("thieunv96@gmail.com");
  await page.getByLabel("Mật khẩu").fill("123");
  await page.locator('form button[type="submit"]').click();

  // Should land on / or /admin, not stay on /auth
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 15_000 });
  // The URL host should remain the LAN IP, not jump to localhost
  expect(page.url()).toContain("192.168.2.211");
});
