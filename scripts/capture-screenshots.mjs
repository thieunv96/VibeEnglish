#!/usr/bin/env node
// Captures a few key-page screenshots from the running dev/prod server on 1998.
// Usage: node scripts/capture-screenshots.mjs
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

const browser = await chromium.launch();
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

await browser.close();
