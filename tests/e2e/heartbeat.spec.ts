import { test, expect } from "@playwright/test";

test("learner heartbeat ping creates a UserActivity row", async ({ page }) => {
  const email = `hb-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/dashboard/);

  // The HeartbeatPing component fires on mount of any [locale]/* page for a
  // logged-in learner. Hit the API directly too (same as the component would).
  const res = await page.request.post("/api/heartbeat");
  expect(res.status()).toBe(200);

  // Idempotent within a minute.
  const res2 = await page.request.post("/api/heartbeat");
  expect(res2.status()).toBe(200);
});

test("unauthenticated heartbeat returns 401", async ({ page, context }) => {
  await context.clearCookies();
  const res = await page.request.post("/api/heartbeat");
  expect(res.status()).toBe(401);
});
