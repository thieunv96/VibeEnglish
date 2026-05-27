#!/usr/bin/env node
// Capture admin + profile screenshots after logging in as the seeded admin
// (or a fresh learner for the profile shot). Uses raw CDP screenshots to
// bypass Playwright's "wait for fonts" stall.
//
// KNOWN ISSUE (CONCERNS MED-4): headless Chromium in this environment can hang
// indefinitely after "fonts loaded" (a system font/Chromium config problem, not
// app code). To avoid a zombie process, the whole capture run is wrapped in a
// hard timeout (SCREENSHOT_TIMEOUT_MS, default 60s); on timeout we print a
// diagnostic and exit non-zero. If you hit the hang, try launching Chromium with
// --no-sandbox or fixing the system font setup. See README and CONCERNS.md.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const TIMEOUT_MS = Number(process.env.SCREENSHOT_TIMEOUT_MS) || 60_000;

const browser = await chromium.launch();

async function run() {
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
}

let timer;
const timeout = new Promise((_, reject) => {
  timer = setTimeout(
    () => reject(new Error(`timed out after ${TIMEOUT_MS}ms`)),
    TIMEOUT_MS,
  );
});

let timedOut = false;
try {
  await Promise.race([run(), timeout]);
} catch (err) {
  timedOut = true;
  console.error(
    `[screenshots] TIMED OUT after ${TIMEOUT_MS}ms — headless Chromium hangs after "fonts loaded" in this environment. ` +
      `See README / CONCERNS MED-4. Try CHROMIUM flags --no-sandbox or a different font setup. (${err.message})`,
  );
} finally {
  clearTimeout(timer);
  // Always close the browser so a timeout never leaves a zombie Chromium.
  await browser.close().catch(() => {});
}

if (timedOut) process.exit(1);
