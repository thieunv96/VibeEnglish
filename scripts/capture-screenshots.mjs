#!/usr/bin/env node
// Captures a few key-page screenshots from the running dev/prod server on 1998.
// Usage: node scripts/capture-screenshots.mjs
//
// KNOWN ISSUE (CONCERNS MED-4): headless Chromium in this environment can hang
// indefinitely after "fonts loaded" (a system font/Chromium config problem, not
// app code). To avoid a zombie process, the whole capture run is wrapped in a
// hard timeout (SCREENSHOT_TIMEOUT_MS, default 60s); on timeout we print a
// diagnostic and exit non-zero. If you hit the hang, try launching Chromium with
// --no-sandbox or fixing the system font setup. See README and CONCERNS.md.
import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "tests", "screenshots");
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  { name: "01-home", url: "http://localhost:1998/" },
  { name: "02-lessons", url: "http://localhost:1998/lessons" },
  { name: "03-category", url: "http://localhost:1998/lessons/short-stories" },
  { name: "04-lesson", url: "http://localhost:1998/lessons/short-stories/the-fox-and-the-grapes" },
  { name: "05-practice", url: "http://localhost:1998/practice" },
  { name: "06-exercise", url: "http://localhost:1998/practice/grammar/articles-a-an-the" },
  { name: "07-faq", url: "http://localhost:1998/faq" },
  { name: "08-spanish", url: "http://localhost:1998/es" },
  { name: "09-vietnamese", url: "http://localhost:1998/vi" },
  { name: "10-test-prep-toeic", url: "http://localhost:1998/test-prep/toeic" },
];

const TIMEOUT_MS = Number(process.env.SCREENSHOT_TIMEOUT_MS) || 60_000;

const browser = await chromium.launch();

async function capture() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  for (const p of PAGES) {
    try {
      await page.goto(p.url, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(800); // give CSS a moment
      const file = path.join(OUT, `${p.name}.png`);
      // Use Chromium devtools protocol directly to bypass Playwright's font-wait stall.
      const cdp = await context.newCDPSession(page);
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(file, Buffer.from(data, "base64"));
      await cdp.detach();
      console.log("✓", p.name, "→", file);
    } catch (err) {
      console.log("✗", p.name, err.message);
    }
  }
}

let timer;
const timeout = new Promise((_, reject) => {
  timer = setTimeout(
    () =>
      reject(
        new Error(
          `timed out after ${TIMEOUT_MS}ms`,
        ),
      ),
    TIMEOUT_MS,
  );
});

let timedOut = false;
try {
  await Promise.race([capture(), timeout]);
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
