import { test, expect } from "@playwright/test";

test("/profile shows hero + stats + extended form", async ({ page }) => {
  const email = `pr-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/);

  await expect(page.getByTestId("page-title")).toBeVisible();
  await expect(page.getByTestId("hero-stats")).toBeVisible();
  await expect(page.getByTestId("profile-stats")).toBeVisible();
  await expect(page.getByTestId("profile-activity")).toBeVisible();
  await expect(page.getByTestId("avatar-uploader")).toBeVisible();
  await expect(page.getByTestId("profile-occupation")).toBeVisible();
  await expect(page.getByTestId("profile-daily-goal")).toBeVisible();
  await expect(page.getByTestId("profile-native-lang")).toBeVisible();
  await expect(page.getByTestId("profile-goals")).toBeVisible();
});

test("toggling learning goals persists across reload", async ({ page }) => {
  const email = `goals-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/);

  await page.getByTestId("goal-toeic").click({ force: true });
  await page.getByTestId("goal-business").click({ force: true });
  await page.getByTestId("profile-submit").click({ force: true });
  await expect(page.getByText(/saved/i).first()).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("goal-toeic")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("goal-business")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("goal-ielts")).toHaveAttribute("aria-pressed", "false");
});
