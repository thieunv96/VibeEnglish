import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/auth/login");
  await page.getByTestId("login-email").fill("thieunv96@gmail.com");
  await page.getByTestId("login-password").fill("123");
  await page.getByTestId("login-submit").click({ force: true });
  await page.waitForURL(/\/dashboard/);
}

test("admin can create, edit, delete a lesson", async ({ page }) => {
  const ts = Date.now();
  const slug = `e2e-test-lesson-${ts}`;
  const title = `E2E Test Lesson ${ts}`;
  const editedTitle = `${title} EDITED`;

  await loginAsAdmin(page);

  // Create
  await page.goto("/admin/lessons/new");
  await page.getByTestId("lesson-title").fill(title);
  // Slug auto-filled from title; force exact for predictability:
  await page.getByTestId("lesson-slug").fill(slug);
  await page.getByTestId("lesson-category").selectOption("short-stories");
  await page.getByTestId("lesson-level").selectOption("A1");
  await page.getByTestId("lesson-description").fill("A Playwright-created lesson.");
  await page.getByTestId("lesson-transcript").fill("This is sentence one. This is sentence two. This is sentence three.");
  await page.getByTestId("lesson-autosplit").click({ force: true });
  await expect(page.getByTestId("lesson-segment-2")).toBeVisible();
  await page.getByTestId("lesson-submit").click({ force: true });

  // Redirected to /admin/lessons; new row visible
  await page.waitForURL(/\/admin\/lessons(\?|$)/);
  await expect(page.getByTestId(`admin-lesson-row-${slug}`)).toBeVisible();

  // Visible on public listing too
  await page.goto("/lessons/short-stories");
  await expect(page.getByRole("cell", { name: title })).toBeVisible();

  // Edit
  await page.goto("/admin/lessons");
  await page.getByTestId(`admin-edit-${slug}`).click({ force: true });
  await page.getByTestId("lesson-title").fill(editedTitle);
  await page.getByTestId("lesson-submit").click({ force: true });
  await page.waitForURL(/\/admin\/lessons(\?|$)/);
  await expect(page.getByRole("cell", { name: editedTitle })).toBeVisible();

  // Delete (auto-confirm the browser confirm dialog)
  page.once("dialog", (d) => d.accept());
  await page.getByTestId(`admin-delete-${slug}`).click({ force: true });
  await expect(page.getByTestId(`admin-lesson-row-${slug}`)).toHaveCount(0);

  // Public detail now 404
  const res = await page.goto(`/lessons/short-stories/${slug}`);
  expect(res?.status()).toBe(404);
});
