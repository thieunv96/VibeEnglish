import { test, expect } from "@playwright/test";

test("learner can set birth year on /profile and it persists", async ({ page }) => {
  const email = `profile-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret1");
  await page.getByTestId("register-birth-year").fill("1995");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/);

  await page.goto("/profile");
  // The hero h1 (page-title) is the display name; ensure profile form rendered.
  await expect(page.getByTestId("page-title")).toBeVisible();
  await expect(page.getByTestId("profile-form")).toBeVisible();
  await expect(page.getByTestId("profile-birth-year")).toHaveValue("1995");

  await page.getByTestId("profile-birth-year").fill("1990");
  await page.getByTestId("profile-name").fill("Test Learner");
  await page.getByTestId("profile-country").selectOption("VN");
  await page.getByTestId("profile-submit").click({ force: true });
  // Sonner toast: live region announces success.
  await expect(page.getByText("Saved", { exact: false })).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("profile-birth-year")).toHaveValue("1990");
  await expect(page.getByTestId("profile-name")).toHaveValue("Test Learner");
  await expect(page.getByTestId("profile-country")).toHaveValue("VN");
});

test("admin redirected away from /profile", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByTestId("login-email").fill("thieunv96@gmail.com");
  await page.getByTestId("login-password").fill("123");
  await page.getByTestId("login-submit").click({ force: true });
  await page.waitForURL(/\/admin(\?|$|\/)/);

  await page.goto("/profile");
  await page.waitForURL(/\/admin(\?|$|\/)/);
});
