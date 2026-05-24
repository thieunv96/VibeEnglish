import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/auth/login");
  await page.getByTestId("login-email").fill("thieunv96@gmail.com");
  await page.getByTestId("login-password").fill("123");
  await page.getByTestId("login-submit").click({ force: true });
  // Admin's first sign-in redirects to /dashboard via the form, which then
  // server-redirects to /admin. Wait for the eventual URL.
  await page.waitForURL(/\/admin(\?|$|\/)/, { timeout: 15_000 });
}

test("admin /dashboard redirects to /admin", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/dashboard");
  await page.waitForURL(/\/admin(\?|$|\/)/);
  await expect(page.getByTestId("page-title")).toContainText(/Dashboard|Lessons|Admin/);
});

test("admin POST /api/vocab returns 403", async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.post("/api/vocab", { data: { word: "test" } });
  expect(res.status()).toBe(403);
});

test("admin POST /api/progress returns 403", async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.post("/api/progress", {
    data: {
      lessonSlug: "any",
      category: "short-stories",
      title: "x",
      segmentsCompleted: 0,
      totalSegments: 1,
      accuracy: 0.5,
    },
  });
  expect(res.status()).toBe(403);
});

test("admin POST /api/attempts returns 403", async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.post("/api/attempts", {
    data: { exerciseSlug: "x", skill: "grammar", title: "x", score: 0.5 },
  });
  expect(res.status()).toBe(403);
});

test("admin POST /api/heartbeat returns 403", async ({ page }) => {
  await loginAsAdmin(page);
  const res = await page.request.post("/api/heartbeat");
  expect(res.status()).toBe(403);
});

test("admin Header shows admin nav, not learner nav", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Admin", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Analytics", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Learn from YouTube" })).toHaveCount(0);
});
