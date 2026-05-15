import { type Page, expect } from "@playwright/test";

export const ADMIN = { email: "thieunv96@gmail.com", password: "123" };
export const DEMO_USER = { email: "demo@vibeenglish.local", password: "vibevibe" };

export async function loginViaUI(page: Page, creds: { email: string; password: string }) {
  await page.goto("/auth");
  await page.getByLabel("Email").fill(creds.email);
  await page.getByLabel("Mật khẩu").fill(creds.password);
  await page.locator('form button[type="submit"]').click();
  // Wait for redirect away from /auth
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 15_000 });
}

/** Login via API to skip UI form (faster for tests that aren't testing auth UI). */
export async function loginViaApi(page: Page, creds: { email: string; password: string }) {
  const csrfRes = await page.request.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  const res = await page.request.post("/api/auth/callback/credentials", {
    form: {
      email: creds.email,
      password: creds.password,
      csrfToken,
    },
    failOnStatusCode: false,
  });
  // 302 redirect on success or 200 — both acceptable
  expect([200, 302]).toContain(res.status());
}
