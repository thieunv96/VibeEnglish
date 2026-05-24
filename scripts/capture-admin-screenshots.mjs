#!/usr/bin/env node
// Capture admin + profile screenshots after logging in as the seeded admin
// (or a fresh learner for the profile shot). Uses raw CDP screenshots to
// bypass Playwright's "wait for fonts" stall.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);

async function shoot(name) {
  await page.waitForTimeout(800);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(`tests/screenshots/${name}.png`, Buffer.from(data, "base64"));
  console.log("✓", name);
}

// --- Admin shots ---
await page.goto("http://localhost:1998/auth/login", { waitUntil: "domcontentloaded" });
await page.getByTestId("login-email").fill("thieunv96@gmail.com");
await page.getByTestId("login-password").fill("123");
await page.getByTestId("login-submit").click({ force: true });
await page.waitForURL(/\/admin(\?|$|\/)/);

const adminPages = [
  ["13-admin-dashboard", "/admin"],
  ["14-admin-lessons", "/admin/lessons"],
  ["15-admin-lesson-new", "/admin/lessons/new"],
  ["16-admin-exercises", "/admin/exercises"],
  ["17-admin-analytics", "/admin/analytics"],
  ["18-admin-analytics-lessons", "/admin/analytics/lessons"],
  ["19-admin-analytics-users", "/admin/analytics/users"],
  ["20-admin-analytics-engagement", "/admin/analytics/engagement"],
];

for (const [name, path] of adminPages) {
  await page.goto(`http://localhost:1998${path}`, { waitUntil: "domcontentloaded" });
  await shoot(name);
}

// --- Profile shot (needs a fresh learner) ---
await ctx.clearCookies();
const email = `screenshot-${Date.now()}@example.com`;
await page.goto("http://localhost:1998/auth/register", { waitUntil: "domcontentloaded" });
await page.getByTestId("register-email").fill(email);
await page.getByTestId("register-password").fill("supersecret");
await page.getByTestId("register-birth-year").fill("1996");
await page.getByTestId("register-submit").click({ force: true });
await page.waitForURL(/\/dashboard/);
await page.goto("http://localhost:1998/profile", { waitUntil: "domcontentloaded" });
await shoot("21-profile");

await browser.close();
