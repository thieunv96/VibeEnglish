import { test, expect } from "@playwright/test";

// 1x1 red JPEG (binary) — used to bypass the cropper entirely by POSTing
// directly to /api/profile/avatar with an already-tiny image, then verifying
// the hero + navbar both render the resulting <img>.
function tinyRedJpegBytes(): Uint8Array {
  // base64 of an 1x1 red JPEG
  const b64 =
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AAAB//9k=";
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

test("hero avatar menu: upload, then both hero + navbar show the avatar; remove reverts to initials", async ({ page }) => {
  const email = `av-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret1");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/profile/);

  // Menu opens, shows Upload (no Remove yet since no avatar)
  await page.getByTestId("hero-avatar-trigger").click({ force: true });
  await expect(page.getByTestId("hero-avatar-panel")).toBeVisible();
  await expect(page.getByTestId("hero-avatar-upload")).toBeVisible();
  await expect(page.getByTestId("hero-avatar-remove")).toHaveCount(0);

  // Skip the cropper UI (the canvas crop is hard to script) — POST directly.
  const bytes = tinyRedJpegBytes();
  const upload = await page.request.post("/api/profile/avatar", {
    multipart: {
      avatar: { name: "a.jpg", mimeType: "image/jpeg", buffer: Buffer.from(bytes) },
    },
  });
  expect(upload.ok()).toBeTruthy();

  await page.reload();

  // The hero avatar <img> renders
  const heroImg = page.getByTestId("hero-avatar-menu").locator("img");
  await expect(heroImg).toBeVisible();
  const heroSrc = await heroImg.getAttribute("src");
  expect(heroSrc).toMatch(/\/api\/avatars\//);

  // The navbar avatar trigger <img> also renders
  const navImg = page.getByTestId("avatar-menu-trigger").locator("img");
  await expect(navImg).toBeVisible();

  // The image actually streams (200 OK with jpeg content-type)
  const fetched = await page.request.get(heroSrc!);
  expect(fetched.status()).toBe(200);
  expect(fetched.headers()["content-type"]).toMatch(/image\/jpe?g/);

  // Remove via the hero menu
  await page.getByTestId("hero-avatar-trigger").click({ force: true });
  await expect(page.getByTestId("hero-avatar-remove")).toBeVisible();
  await page.getByTestId("hero-avatar-remove").click({ force: true });
  await page.waitForTimeout(500); // toast + refresh

  await page.reload();
  // After remove: hero shows initials (no <img>)
  await expect(page.getByTestId("hero-avatar-menu").locator("img")).toHaveCount(0);
  // Navbar trigger also reverts (no <img>)
  await expect(page.getByTestId("avatar-menu-trigger").locator("img")).toHaveCount(0);
});
