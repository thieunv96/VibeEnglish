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
  await expect(page.getByTestId("hero-avatar-menu")).toBeVisible();
  await expect(page.getByTestId("profile-occupation")).toBeVisible();
  await expect(page.getByTestId("profile-daily-goal")).toBeVisible();
  await expect(page.getByTestId("profile-country")).toBeVisible();
  await expect(page.getByTestId("language-picker")).toBeVisible();
  await expect(page.getByTestId("profile-goals")).toBeVisible();
});

test("country dropdown + language multi-picker + new goal persist across reload", async ({ page }) => {
  const email = `pr2-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/);

  // Country (native select)
  await page.getByTestId("profile-country").selectOption("VN");

  // Language picker — open + select two
  await page.getByTestId("language-picker-trigger").click({ force: true });
  await expect(page.getByTestId("language-picker-popover")).toBeVisible();
  await page.getByTestId("lang-option-vi").click({ force: true });
  await page.getByTestId("lang-option-en").click({ force: true });
  // Close popover by clicking the trigger again
  await page.getByTestId("language-picker-trigger").click({ force: true });

  // New goals (previously not in the list)
  await page.getByTestId("goal-listening").click({ force: true });
  await page.getByTestId("goal-vocabulary-building").click({ force: true });

  await page.getByTestId("profile-submit").click({ force: true });
  await expect(page.getByText(/saved/i).first()).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("profile-country")).toHaveValue("VN");
  await expect(page.getByTestId("lang-chip-vi")).toBeVisible();
  await expect(page.getByTestId("lang-chip-en")).toBeVisible();
  await expect(page.getByTestId("goal-listening")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("goal-vocabulary-building")).toHaveAttribute("aria-pressed", "true");
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
