#!/usr/bin/env node
import { chromium } from "@playwright/test";
import fs from "node:fs";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);

await page.goto("http://localhost:1998/vi", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
// Scroll the CTA strip into view (it's near the bottom, before footer)
await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a'));
  const cta = links.find((a) => a.textContent?.includes('Bắt đầu bài đầu tiên'));
  if (cta) cta.scrollIntoView({ behavior: 'instant', block: 'center' });
});
await page.waitForTimeout(400);
const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync("tests/screenshots/cta-strip-vi.png", Buffer.from(data, "base64"));
console.log("✓ saved tests/screenshots/cta-strip-vi.png");

await browser.close();
