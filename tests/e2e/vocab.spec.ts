import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

test("save a word from lesson → appears on dashboard → delete works", async ({ page }) => {
  const email = `vocab-${Date.now()}@example.com`;
  await page.goto("/auth/register");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("supersecret");
  await page.getByTestId("register-submit").click({ force: true });
  await page.waitForURL(/\/dashboard/);

  const dir = path.join(process.cwd(), "src", "content", "lessons", "short-stories");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const data = JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf8"));

  await page.goto(`/lessons/short-stories/${data.slug}`);
  const firstSave = page.getByTestId("save-word").first();
  await expect(firstSave).toBeVisible();
  const wordLabel = await firstSave.textContent();
  const match = wordLabel?.match(/"([^"]+)"|“([^”]+)”/);
  const word = (match?.[1] ?? match?.[2] ?? "").toLowerCase();
  expect(word).not.toBe("");
  await firstSave.click({ force: true });
  await expect(firstSave).toContainText("Saved");

  await page.goto("/dashboard");
  await expect(page.getByTestId(`vocab-${word}`)).toBeVisible();

  await page.getByTestId(`delete-vocab-${word}`).click({ force: true });
  await expect(page.getByTestId(`vocab-${word}`)).toHaveCount(0);
});
