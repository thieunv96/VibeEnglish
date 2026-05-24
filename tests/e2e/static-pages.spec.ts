import { test, expect } from "@playwright/test";

const PATHS = [
  "/about",
  "/faq",
  "/privacy",
  "/terms",
  "/test-prep/toeic",
  "/test-prep/toefl",
  "/test-prep/ielts",
  "/test-prep/oet",
  "/learn-from-youtube",
  "/practice",
];

for (const path of PATHS) {
  test(`page ${path} renders an h1`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByTestId("page-title")).toBeVisible();
  });
}

test("unknown route returns 404", async ({ page }) => {
  const res = await page.goto("/some-random-thing-that-does-not-exist");
  expect(res?.status()).toBeGreaterThanOrEqual(400);
});
